import { env } from './config/env.js';
import app from './app.js';
import { connectDB } from './config/db.js';
import { autoSetup } from './utils/autoSetup.js';

const startServer = async () => {
  // 1. Auto-create DB and sync tables if missing
  await autoSetup();

  // 2. Connect Prisma
  await connectDB();

  // 3. Start Express Server
  const port = env.PORT || 8000;

  app.listen(port, () => {
    console.log(`
────────────────────────────────────
🚀 SSOR Backend Started
🌍 Environment : ${env.NODE_ENV}
📡 Server      : http://localhost:${port}
🗄️ Database    : Connected
⚡ Prisma Client Ready
────────────────────────────────────
    `);
  });
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

startServer();
