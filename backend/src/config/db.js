import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton.
 * We avoid creating multiple instances during dev hot-reloads.
 */
const createPrismaClient = () => {
  return new PrismaClient();
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
