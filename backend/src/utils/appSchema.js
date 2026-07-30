import { execSync } from 'child_process';
import { env } from '../config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const initAppSchema = async () => {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL or POSTGRES_* database settings are required.');
  }

  console.log('🚀 Running Prisma db push to sync schema...');
  try {
    const backendDir = path.join(__dirname, '../../');
    // We run db push to ensure the database matches schema.prisma exactly
    execSync('npx prisma db push --skip-generate', {
      cwd: backendDir,
      stdio: 'inherit'
    });
    console.log('✅ SSOR app tables are perfectly in sync with schema.prisma!');
  } catch (error) {
    console.error('❌ Failed to push Prisma schema:', error);
    throw error;
  }
};
