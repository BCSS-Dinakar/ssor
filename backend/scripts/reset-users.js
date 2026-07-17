import '../src/config/env.js';
import prisma from '../src/config/db.js';

async function main() {
  const { count } = await prisma.user.deleteMany();
  console.log(`Deleted ${count} user(s) from the database.`);
}

main()
  .catch((e) => {
    console.error('Error resetting users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
