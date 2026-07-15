import pg from 'pg';
import { env } from '../config/env.js';
import { initAppSchema } from './appSchema.js';

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
};
