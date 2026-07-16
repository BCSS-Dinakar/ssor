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
};
