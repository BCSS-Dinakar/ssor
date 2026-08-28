import prisma from '../config/db.js';
import { getMinio, MINIO_BUCKET } from '../config/minio.js';

const checkDatabase = async () => {
  await prisma.$queryRaw`SELECT 1`;
  return 'Connected';
};

const checkMinio = async () => {
  const exists = await getMinio().bucketExists(MINIO_BUCKET);
  return exists ? `Connected (bucket: ${MINIO_BUCKET})` : `Connected (bucket "${MINIO_BUCKET}" missing)`;
};

const settle = async (fn) => {
  try {
    return { status: await fn(), ok: true };
  } catch (error) {
    return { status: 'Disconnected', ok: false, error: process.env.NODE_ENV === 'development' ? error.message : undefined };
  }
};

export const checkHealth = async (req, res) => {
  const [database, minio] = await Promise.all([
    settle(checkDatabase),
    settle(checkMinio),
  ]);

  const allOk = database.ok && minio.ok;

  return res.status(allOk ? 200 : 503).json({
    success: allOk,
    message: allOk
      ? 'SSOR Backend is running successfully'
      : 'SSOR Backend running, but one or more dependencies are unavailable',
    services: {
      database: database.status,
      minio: minio.status,
    },
    timestamp: new Date().toISOString(),
  });
};
