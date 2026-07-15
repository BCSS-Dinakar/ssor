import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';

async function main() {
  const loginId = 'bcss.officer';
  const password = 'bcss@123';
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const officer = await prisma.user.upsert({
    where: { loginId },
    update: {
      passwordHash,
      status: 'approved',
      policeProfile: {
        update: {
          name: 'Officer',
          badgeId: 'TEST-ISP-0001',
          rank: 'Inspector of Police (Test)',
          empId: 'TEST-POL-0001',
          department: 'Testing Department',
          wing: 'QA & Development',
          jurisdiction: 'Test Commissionerate',
          station: 'Test Police Station',
          district: 'Test Commissionerate',
          state: 'Telangana',
          country: 'India',
          joiningDate: '2025-01-01',
          email: 'bcss.test01@example.com',
          mobile: '9876543210',
          altPhone: '04012345678',
          clearanceLevel: 'Level 3 Registry Administrator (Test)'
        }
      }
    },
    create: {
      loginId,
      passwordHash,
      role: 'police',
      status: 'approved',
      policeProfile: {
        create: {
          name: 'BCSS Test Officer',
          badgeId: 'TEST-ISP-0001',
          rank: 'Inspector of Police (Test)',
          empId: 'TEST-POL-0001',
          department: 'Testing Department',
          wing: 'QA & Development',
          jurisdiction: 'Test Commissionerate',
          station: 'Test Police Station',
          district: 'Test Commissionerate',
          state: 'Telangana',
          country: 'India',
          joiningDate: '2025-01-01',
          email: 'bcss.test01@example.com',
          mobile: '9876543210',
          altPhone: '04012345678',
          clearanceLevel: 'Level 3 Registry Administrator (Test)'
        }
      }
    }
  });

  console.log('BCSS Test Officer successfully created or updated:');
  console.log('Username (loginId):', officer.loginId);
  console.log('Role:', officer.role);
  console.log('Status:', officer.status);
}

main()
  .catch((e) => {
    console.error('Error creating officer:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
