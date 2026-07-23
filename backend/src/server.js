import { env, validateEnv } from './config/env.js';
import app from './app.js';
import logger from './utils/logger.js';
import { connectDB } from './config/db.js';
import { autoSetup } from './utils/autoSetup.js';
import { ensureBucket, MINIO_BUCKET } from './config/minio.js';
import getRedis from './config/redis.js';

const pingRedis = async () => {
  try {
    const pong = await getRedis().ping();
    return pong === 'PONG' ? 'Connected' : `Reachable (${pong})`;
  } catch (err) {
    return 'Disconnected — OTP/cache features degraded (non-fatal)';
  }
};

const listenWithPortFallback = (preferredPort, retryLimit) => new Promise((resolve, reject) => {
  let port = preferredPort;
  const maxPort = preferredPort + retryLimit;

  const tryListen = () => {
    const server = app.listen(port);

    server.once('listening', () => {
      resolve({ server, port });
    });

    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE' && port < maxPort) {
        console.warn(`⚠️  Port ${port} is in use. Trying ${port + 1}...`);
        port += 1;
        tryListen();
        return;
      }

      reject(error);
    });
  };

  tryListen();
});

const startServer = async () => {
  // 0. Fail fast on unsafe/missing production configuration.
  validateEnv();

  // 1. Ensure DB exists. Schema push is opt-in via AUTO_DB_PUSH.
  await autoSetup();

  // 2. Connect Prisma
  await connectDB();

  // 3. Ensure the MinIO bucket for document storage exists (non-fatal).
  //    When down, uploads fall back to local disk (reconciled later).
  const minioReady = await ensureBucket(MINIO_BUCKET);
  const minioStatus = minioReady
    ? `Connected (bucket: ${MINIO_BUCKET})`
    : 'Disconnected — disk fallback active (run `npm run media:reconcile` once MinIO is back)';

  // 4. Check Redis (non-fatal)
  const redisStatus = await pingRedis();

  // 5. Start Express Server
  const { server, port } = await listenWithPortFallback(env.PORT, env.PORT_RETRY_LIMIT);

  console.log(`
────────────────────────────────────
🚀 SSOR Backend Started
🌍 Environment : ${env.NODE_ENV}
📡 Server      : http://localhost:${port}
🗄️ Database    : Connected
🧠 Redis       : ${redisStatus}
🪣 MinIO       : ${minioStatus}
⚡ Prisma Client Ready
────────────────────────────────────
    `);

  server.on('error', (error) => {
    console.error('\n❌ HTTP Server Failed');
    console.error(error.message || error);
    process.exit(1);
  });

  global._ssorServer = server;
};

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('\n❌ Uncaught Exception');
  console.error(err);
  process.exit(1);
});

// Handle Unhandled Rejections
process.on('unhandledRejection', (err) => {
  console.error('\n❌ Unhandled Rejection');
  console.error(err);
  process.exit(1);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  if (global._ssorServer) {
    global._ssorServer.close();
  }
  
  const prisma = (await import('./config/db.js')).default;
  if (prisma) {
    await prisma.$disconnect();
    console.log('⚡ Prisma Client Disconnected');
  }
  
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restarts

startServer();
