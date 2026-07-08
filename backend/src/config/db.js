import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';

/**
 * Prisma Client Singleton using PrismaPg adapter.
 * In Prisma 7, driver adapters are required for direct DB connections.
 * We avoid creating multiple instances during dev hot-reloads.
 */
const createPrismaClient = () => {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });

  return new PrismaClient({ adapter });
};

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  // Prevent multiple instances during dev hot reloads
  if (!global._prisma) {
    global._prisma = createPrismaClient();
  }
  prisma = global._prisma;
}

export const connectDB = async () => {
  try {
    // Test the connection to PostgreSQL
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('\n❌ Database Connection Failed');
    console.error(error.message || error);
    process.exit(1);
  }
};

export default prisma;
