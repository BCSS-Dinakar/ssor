const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('ssor@123', salt);

  const existing = await prisma.user.findUnique({ where: { loginId: 'police@ssor' } });
  if (existing) {
    console.log('User already exists. Updating password...');
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash }
    });
    console.log('Password updated successfully.');
    return;
  }

  const user = await prisma.user.create({
    data: {
      loginId: 'police@ssor',
      passwordHash,
      role: 'police',
      status: 'approved',
      policeProfile: {
        create: {
          name: 'BCSS Test Officer',
          badgeId: 'BCSS-12345',
          rank: 'Inspector',
          empId: 'EMP-98765',
          department: 'Law and Order',
          wing: 'Patrol',
          jurisdiction: 'Hyderabad',
          joiningDate: '2026-08-26',
          email: 'police@ssor.com',
          mobile: '9999999999',
          station: 'Central Hub',
          district: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          clearanceLevel: 'High'
        }
      }
    }
  });

  console.log('Created user:', user);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
