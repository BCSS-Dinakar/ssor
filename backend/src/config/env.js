import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (two levels up from src/config/)
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key',
  EPETTY_API_URL: process.env.EPETTY_API_URL || 'http://10.121.9.146:8083/api/epettyCase/personDetails',
  EPETTY_BASIC_AUTH: process.env.EPETTY_BASIC_AUTH || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};


