import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { initAppSchema } from './appSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client, Pool } = pg;

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
 * Ensures FDW schemas, foreign tables, ssor_kb seed, and materialized views exist.
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

    // 2. Run ssor_kb_seed.sql to ensure ssor_kb has the latest tiers and sections
    console.log('⚙️  Seeding ssor_kb...');
    const seedPath = path.join(__dirname, '../../prisma/ssor_kb_seed.sql');
    if (fs.existsSync(seedPath)) {
      const sql = fs.readFileSync(seedPath, 'utf-8');
      await client.query(sql);
    }

    // Release the single client before running parallel builds
    client.release();

    // 3. Ensure materialized views exist (IN PARALLEL)
    const views = [
      { name: 'mv_offenders_list', file: 'offenders_list_views.sql' },
      { name: 'mv_offender_details', file: 'offender_details_views.sql' },
      { name: 'mv_e_cases_list', file: 'e_cases_list_views.sql' },
      { name: 'mv_e_cases_details', file: 'e_cases_details_views.sql' }
    ];

    console.log('⚙️  Checking for missing materialized views...');
    const buildPromises = views.map(async (v) => {
      const buildClient = await pool.connect();
      try {
        const res = await buildClient.query(`SELECT 1 FROM pg_matviews WHERE matviewname = $1`, [v.name]);
        if (res.rowCount === 0) {
          console.log(`🔨 [PARALLEL] Building missing view: ${v.name}... (This may take a few minutes)`);
          const sqlPath = path.join(__dirname, '../../../db/', v.file);
          if (fs.existsSync(sqlPath)) {
            const sql = fs.readFileSync(sqlPath, 'utf-8');
            await buildClient.query(sql);
            console.log(`✅ Successfully built ${v.name}`);
          } else {
            console.warn(`⚠️ Warning: SQL file not found for ${v.name} at ${sqlPath}`);
          }
        }
      } finally {
        buildClient.release();
      }
    });

    await Promise.all(buildPromises);

  } catch (error) {
    console.error('❌ Error during FDW and Views setup:', error);
  } finally {
    await pool.end();
  }
};

/**
 * Main auto-setup function.
 * Call this before starting the HTTP server.
 */
export const autoSetup = async () => {
  await ensureDatabaseExists();

  if (env.AUTO_DB_PUSH) {
    console.log('⚙️  Ensuring SSOR app-owned tables exist...');
    await initAppSchema();
  } else {
    console.log('⏭️  Skipping app table initialization. Set AUTO_DB_PUSH=true to create missing SSOR app tables.');
  }

  console.log('⚙️  Ensuring Data Views & Schemas exist...');
  await ensureFdwAndViews();
};
