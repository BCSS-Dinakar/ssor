import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { initAppSchema } from './appSchema.js';
import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client, Pool } = pg;

/** Split view SQL files into standard-view vs materialized-view sections. */
const MV_SECTION_SPLIT = /-- \d+\. MATERIALIZED VIEW/i;

async function matviewReferencesLegacyKb(client, matviewName) {
  const res = await client.query(
    `SELECT pg_get_viewdef(c.oid, true) AS def
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relname = $1 AND n.nspname = 'public' AND c.relkind = 'm'`,
    [matviewName]
  );
  const def = res.rows[0]?.def || '';
  return def.includes('ssor_kb');
}

/**
 * Parses the DATABASE_URL to extract connection components.
 * e.g. postgresql://sadhudinakar@localhost:5432/ssor
 */
const parseDbUrl = (url) => {
  const parsed = new URL(url);
  return {
    user: parsed.username || undefined,
    password: parsed.password || undefined,
    host: parsed.hostname,
    port: Number(parsed.port) || 5432,
    database: parsed.pathname.replace('/', ''), // 'ssor'
  };
};

/**
 * Ensures the PostgreSQL database exists.
 * Connects to the 'postgres' default DB and creates the target DB if missing.
 */
const ensureDatabaseExists = async () => {
  const { user, password, host, port, database } = parseDbUrl(env.DATABASE_URL);

  // Connect to the default 'postgres' maintenance database
  const client = new Client({
    user,
    password: password || undefined,
    host,
    port,
    database: 'postgres',
  });

  try {
    await client.connect();

    // Check if our target database already exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [database]
    );

    if (result.rowCount === 0) {
      // Database doesn't exist — create it
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`📦 Database "${database}" created successfully.`);
    } else {
      console.log(`✅ Database "${database}" already exists.`);
    }
  } finally {
    await client.end();
  }
};

/**
 * Ensures FDW schemas, foreign tables, RiskTierSection seed, and materialized views exist.
 */
const ensureFdwAndViews = async () => {
  const { user, password, host, port, database } = parseDbUrl(env.DATABASE_URL);

  const pool = new Pool({
    user,
    password: password || undefined,
    host,
    port,
    database,
    max: 10 // Allow up to 10 concurrent connections
  });

  try {
    const client = await pool.connect();
    console.log('🔗 Connected to DB for FDW and Views setup...');

    // 1. Create schemas and FDW servers
    const fdwHost = env.FDW_HOST;
    const fdwPort = env.FDW_PORT;
    const fdwUser = env.FDW_USER;
    const fdwPassword = env.FDW_PASSWORD;

    await client.query(`
      CREATE EXTENSION IF NOT EXISTS postgres_fdw;
      
      CREATE SCHEMA IF NOT EXISTS cctns_etl;
      CREATE SCHEMA IF NOT EXISTS epetty;

      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'cctns_server') THEN 
        CREATE SERVER cctns_server FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host '${fdwHost}', dbname 'cctns_etl', port '${fdwPort}'); 
      END IF; END $$;

      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_user_mappings WHERE srvname = 'cctns_server' AND usename = current_user) THEN 
        CREATE USER MAPPING FOR current_user SERVER cctns_server OPTIONS (user '${fdwUser}', password '${fdwPassword}'); 
      END IF; END $$;

      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'persons' AND c.relkind = 'f' AND n.nspname = 'cctns_etl') THEN 
        EXECUTE 'IMPORT FOREIGN SCHEMA public LIMIT TO (accused, persons, crimes, hierarchy, arrests, chargesheets, chargesheet_accused, fpb_accused, interrogation_reports, ir_child_rows, person_identity_details, person_media, disposals, properties, case_properties, stolen_automobiles, mo_seizures, mo_seizure_media, charge_sheet_updates, chargesheet_acts_sections, fpb_additional_crimes) FROM SERVER cctns_server INTO cctns_etl'; 
      END IF; END $$;

      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'epetty_server') THEN 
        CREATE SERVER epetty_server FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host '${fdwHost}', dbname 'epetty', port '${fdwPort}'); 
      END IF; END $$;

      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_user_mappings WHERE srvname = 'epetty_server' AND usename = current_user) THEN 
        CREATE USER MAPPING FOR current_user SERVER epetty_server OPTIONS (user '${fdwUser}', password '${fdwPassword}'); 
      END IF; END $$;

      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'e_cases' AND c.relkind = 'f' AND n.nspname = 'epetty') THEN 
        EXECUTE 'IMPORT FOREIGN SCHEMA public LIMIT TO (e_cases) FROM SERVER epetty_server INTO epetty'; 
      END IF; END $$;
    `);

    // 2. Run risk_tier_section_seed.sql to ensure RiskTierSection has the latest tiers and sections
    console.log('⚙️  Seeding RiskTierSection...');
    const seedPath = path.join(__dirname, '../../prisma/risk_tier_section_seed.sql');
    if (fs.existsSync(seedPath)) {
      const sql = fs.readFileSync(seedPath, 'utf-8');
      await client.query(sql);
    }

    // 3. Ensure STANDARD views exist synchronously FIRST
    const standardViews = [
      { v_name: 'v_offenders_list', file: 'offenders_list_views.sql' },
      { v_name: 'v_offender_details', file: 'offender_details_views.sql' },
      { v_name: 'v_e_cases_list', file: 'e_cases_list_views.sql' },
      { v_name: 'v_e_cases_details', file: 'e_cases_details_views.sql' },
      { v_name: 'v_clearance_accused_search', file: 'clearance_accused_search_view.sql' },
    ];

    const materializedViews = [
      { mv_name: 'mv_offenders_list', file: 'offenders_list_views.sql' },
      { mv_name: 'mv_offender_details', file: 'offender_details_views.sql' },
      { mv_name: 'mv_e_cases_list', file: 'e_cases_list_views.sql' },
      { mv_name: 'mv_e_cases_details', file: 'e_cases_details_views.sql' },
      { mv_name: 'mv_clearance_accused_search', file: 'clearance_accused_search_view.sql' },
      { mv_name: 'mv_districts', file: 'districts_view.sql', fullFile: true },
    ];

    console.log('⚙️  Creating standard views synchronously...');
    for (const v of standardViews) {
      const sqlPath = path.join(__dirname, '../../../db/', v.file);
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        const parts = sql.split(MV_SECTION_SPLIT);
        if (parts.length > 0 && parts[0].trim().length > 0) {
          await client.query(parts[0]);
          console.log(`✅ Ensured standard view: ${v.v_name}`);
        }
      } else {
        console.warn(`⚠️ Warning: SQL file not found for ${v.v_name} at ${sqlPath}`);
      }
    }

    // Release the single client before running background builds
    client.release();

    // 4. Ensure materialized views exist and use RiskTierSection (rebuild stale ssor_kb refs)
    console.log('⚙️  Checking materialized views in the background...');

    const buildMaterializedViews = async () => {
      const buildPool = new Pool({
        user,
        password: password || undefined,
        host,
        port,
        database,
        max: 10
      });

      try {
        const buildPromises = materializedViews.map(async (v) => {
          const buildClient = await buildPool.connect();
          try {
            const exists = await buildClient.query(
              `SELECT 1 FROM pg_matviews WHERE matviewname = $1`,
              [v.mv_name]
            );
            const needsRebuild = exists.rowCount === 0
              || await matviewReferencesLegacyKb(buildClient, v.mv_name);

            if (!needsRebuild) return;

            const reason = exists.rowCount === 0 ? 'missing' : 'legacy ssor_kb reference';
            console.log(`🔨 [BACKGROUND] Rebuilding ${v.mv_name} (${reason})... (This may take a few minutes)`);
            const sqlPath = path.join(__dirname, '../../../db/', v.file);
            if (fs.existsSync(sqlPath)) {
              const sql = fs.readFileSync(sqlPath, 'utf-8');
              const mvSql = v.fullFile
                ? sql
                : sql.split(MV_SECTION_SPLIT)[1]?.trim();
              if (mvSql) {
                await buildClient.query(mvSql);
                console.log(`✅ Successfully rebuilt ${v.mv_name}`);
              }
            }
          } catch (err) {
            console.error(`❌ Error building view ${v.mv_name}:`, err);
          } finally {
            buildClient.release();
          }
        });

        await Promise.all(buildPromises);
      } catch (err) {
        console.error('❌ Error during background views setup:', err);
      } finally {
        await buildPool.end();
      }
    };

    buildMaterializedViews().catch(err => console.error('Background view build failed:', err));

  } catch (error) {
    console.error('❌ Error during FDW and Views setup:', error);
  } finally {
    await pool.end();
  }
};

/**
 * Renames legacy risk-tier tables before Prisma db push on existing databases.
 */
const ensureRiskTierTableRenames = async () => {
  const { user, password, host, port, database } = parseDbUrl(env.DATABASE_URL);
  const client = new Client({
    user,
    password: password || undefined,
    host,
    port,
    database,
  });

  try {
    await client.connect();
    const sqlPath = path.join(__dirname, '../../prisma/rename_risk_tier_tables.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      await client.query(sql);
      console.log('✅ Risk tier table renames applied (if needed).');
    }
  } catch (err) {
    console.error('❌ Error renaming risk tier tables:', err);
    throw err;
  } finally {
    await client.end();
  }
};

/**
 * Main auto-setup function.
 * Call this before starting the HTTP server.
 */
export const autoSetup = async () => {
  await ensureDatabaseExists();

  if (env.AUTO_DB_PUSH) {
    await ensureRiskTierTableRenames();
    console.log('⚙️  Ensuring SSOR app-owned tables exist...');
    await initAppSchema();
  } else {
    console.log('⏭️  Skipping app table initialization. Set AUTO_DB_PUSH=true to create missing SSOR app tables.');
  }

  console.log('⚙️  Ensuring Data Views & Schemas exist...');
  await ensureFdwAndViews();

  await ensureRiskTiers();

  if (env.NODE_ENV !== 'production') {
    await ensureDefaultUsers();
  }
};

const DEFAULT_RISK_TIERS = [
  { code: 'RED', name: 'Red', category: 'Dangerous / gang', description: 'Dangerous predator or gang offender. Applied to the most severe cases involving aggravated assault or gang involvement.', nature: 'Rape, aggravated rape, gang rape, rape causing death or persistent vegetative state.', retention: 'Lifetime', colorClass: 'bg-red-600', defaultRank: 100, sortOrder: 1 },
  { code: 'ORANGE', name: 'Orange', category: 'Repeat offender', description: 'Repeat or habitual offender. Applied when any sexual offence is committed by a person with a prior conviction.', nature: 'Any sexual offence with a prior conviction history.', retention: '25 years', colorClass: 'bg-orange-500', defaultRank: 80, sortOrder: 2 },
  { code: 'BLACK', name: 'Black', category: 'Trafficking', description: 'Organised crime or trafficking. Applied to rings, trafficking networks, and organized exploitation.', nature: 'Human trafficking, organized commercial exploitation, kidnapping for exploitation.', retention: 'Lifetime', colorClass: 'bg-neutral-800', defaultRank: 90, sortOrder: 3 },
  { code: 'BLUE', name: 'Blue', category: 'Cyber sexual', description: 'Cyber sexual offender. Covers online offenses, non-consensual transmission, and digital exploitation.', nature: 'Online sexual abuse, CSAM, non-consensual capture/transmission, online stalking.', retention: '25 years', colorClass: 'bg-sky-600', defaultRank: 60, sortOrder: 4 },
  { code: 'PINK', name: 'Pink', category: 'Harassment', description: 'Harassment and outraging modesty. Covers physical harassment and stalking offenses.', nature: 'Sexual harassment, outraging modesty, physical stalking, voyeurism.', retention: '15 years', colorClass: 'bg-pink-500', defaultRank: 40, sortOrder: 5 },
  { code: 'GREEN', name: 'Green', category: 'Isolated / low', description: 'Isolated or low-severity offenders. Lower risk and shorter retention rather than a distinct offence category.', nature: 'Single, non-aggravated incident by a person with no earlier record.', retention: '15 years', colorClass: 'bg-green-600', defaultRank: 20, sortOrder: 6 },
];

async function ensureRiskTiers() {
  try {
    const count = await prisma.riskTier.count();
    if (count > 0) return;

    console.log('⚙️  Seeding default risk tiers...');
    await prisma.riskTier.createMany({ data: DEFAULT_RISK_TIERS });
    console.log('✅ Risk tiers seeded.');
  } catch (err) {
    console.error('❌ Error seeding risk tiers:', err);
  }
}

/**
 * Ensures default users exist in the database for ease of testing.
 */
async function ensureDefaultUsers() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('⚙️  User table is empty. Seeding default test credentials...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('ssor@123', salt);

      await prisma.user.create({
        data: {
          loginId: 'police@ssor',
          passwordHash,
          role: 'police',
          status: 'approved',
          policeProfile: {
            create: {
              name: 'BCSS Test Officer',
              badgeId: 'TEST-ISP-0001',
              rank: 'Inspector of Police (Test)',
              empId: 'TEST-POL-0001',
              department: 'Testing Department',
              wing: 'QA & Development',
              jurisdiction: 'Test Commissionerate',
              station: 'Test Police Station',
              district: 'Test Commissionerate',
              state: 'Telangana',
              country: 'India',
              joiningDate: '2025-01-01',
              email: 'police@ssor.com',
              mobile: '9876543210',
              clearanceLevel: 'Level 3 Registry Administrator (Test)'
            }
          }
        }
      });

      await prisma.user.create({
        data: {
          loginId: 'org@ssor',
          passwordHash,
          role: 'organization',
          status: 'approved',
          organizationProfile: {
            create: {
              orgName: 'BCSS Test School',
              orgType: 'School',
              country: 'India',
              state: 'Telangana',
              district: 'Hyderabad',
              city: 'Hyderabad',
              address: '123 Test Street, IT Park',
              pinCode: '500081',
              officialEmail: 'info@testschool.ssor',
              officialPhone: '040-12345678',
              adminName: 'Sunitha Reddy',
              designation: 'Principal',
              empId: 'EMP-001',
              adminEmail: 'admin@testschool.ssor',
              mobile: '9876543210'
            }
          }
        }
      });

      console.log('\n=============================================');
      console.log('✅ Default users seeded successfully!');
      console.log('   [Role: police]       police@ssor / ssor@123');
      console.log('   [Role: organization] org@ssor / ssor@123');
      console.log('=============================================\n');
    }
  } catch (err) {
    console.error('❌ Error checking/seeding default users:', err);
  }
}
