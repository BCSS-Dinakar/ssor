import { execSync } from 'child_process';
import pg from 'pg';
import { env } from '../config/env.js';

const { Client } = pg;

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
 * Pushes the Prisma schema to the database.
 * Uses `prisma db push` which creates/syncs tables without migration files.
 * Safe to run on every startup — it's idempotent.
 */
const pushSchema = () => {
  console.log('⚙️  Syncing database schema with Prisma...');
  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Schema sync complete. All tables are ready.');
  } catch (err) {
    console.error('❌ Schema push failed:', err.message);
    throw err;
  }
};

/**
 * Main auto-setup function.
 * Call this before starting the HTTP server.
 */
export const autoSetup = async () => {
  await ensureDatabaseExists();
  pushSchema();
};
