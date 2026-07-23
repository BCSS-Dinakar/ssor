import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (two levels up from src/config/)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const buildDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const {
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_DB,
    POSTGRES_USER,
    POSTGRES_PASSWORD
  } = process.env;

  if (!POSTGRES_HOST || !POSTGRES_DB || !POSTGRES_USER) return undefined;

  const user = encodeURIComponent(POSTGRES_USER);
  const password = POSTGRES_PASSWORD ? `:${encodeURIComponent(POSTGRES_PASSWORD)}` : '';
  const port = POSTGRES_PORT ? `:${POSTGRES_PORT}` : '';

  return `postgresql://${user}${password}@${POSTGRES_HOST}${port}/${POSTGRES_DB}`;
};

const databaseUrl = buildDatabaseUrl();
if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

export const env = {
  PORT: Number(process.env.PORT || 5000),
  PORT_RETRY_LIMIT: Number(process.env.PORT_RETRY_LIMIT || 20),
  NODE_ENV: process.env.NODE_ENV || 'development',
  AUTO_DB_PUSH: process.env.AUTO_DB_PUSH === 'true',
  DATABASE_URL: databaseUrl,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key',
  EPETTY_API_URL: process.env.EPETTY_API_URL || '',
  EPETTY_BASIC_AUTH: process.env.EPETTY_BASIC_AUTH || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || 'lax',
  PRIVATE_KEY: process.env.PRIVATE_KEY || '',
  EPRISONS_TOKEN_URL: process.env.EPRISONS_TOKEN_URL || '',
  EPRISONS_RELEASES_URL: process.env.EPRISONS_RELEASES_URL || '',
  EPRISONS_USER_ID: process.env.EPRISONS_USER_ID || '',
  EPRISONS_PASSWORD: process.env.EPRISONS_PASSWORD || '',
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || '127.0.0.1',
  MINIO_PORT: Number(process.env.MINIO_PORT || 9000),
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'minioadmin',
  MINIO_BUCKET: process.env.MINIO_BUCKET || 'ssor-documents',
  // Public (browser-reachable) endpoint used only to sign presigned URLs.
  MINIO_PUBLIC_ENDPOINT: process.env.MINIO_PUBLIC_ENDPOINT || '',
  MINIO_PUBLIC_PORT: process.env.MINIO_PUBLIC_PORT ? Number(process.env.MINIO_PUBLIC_PORT) : undefined,
  MINIO_PUBLIC_USE_SSL: (process.env.MINIO_PUBLIC_USE_SSL ?? process.env.MINIO_USE_SSL) === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

/**
 * Fail fast on unsafe/missing configuration in production. Called at startup.
 * Prevents booting prod with dev fallbacks (default JWT secret, default MinIO
 * creds, missing DB) that would be silent security holes.
 */
export function validateEnv() {
  if (env.NODE_ENV !== 'production') return;
  const problems = [];

  if (!process.env.JWT_SECRET || env.JWT_SECRET === 'fallback_secret_key') {
    problems.push('JWT_SECRET must be set to a strong secret (the dev fallback is insecure).');
  }
  if (!env.DATABASE_URL) problems.push('DATABASE_URL (or POSTGRES_* settings) must be configured.');
  if (env.MINIO_ACCESS_KEY === 'minioadmin' || env.MINIO_SECRET_KEY === 'minioadmin') {
    problems.push('MINIO_ACCESS_KEY / MINIO_SECRET_KEY must not use the default minioadmin credentials.');
  }
  if (!env.MINIO_PUBLIC_ENDPOINT) {
    problems.push('MINIO_PUBLIC_ENDPOINT must be set so presigned URLs are reachable by browsers.');
  }
  if (!process.env.FRONTEND_URL) {
    problems.push('FRONTEND_URL must be set (CORS is locked to it in production).');
  }

  if (problems.length) {
    const message = 'Invalid production configuration:\n  - ' + problems.join('\n  - ');
    throw new Error(message);
  }
}
