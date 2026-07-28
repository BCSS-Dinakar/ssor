import '../src/config/env.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ssor@123', 10);

  // Create Organization User
  const orgUser = await prisma.user.upsert({
    where: { loginId: 'dinakar@org' },
    update: { passwordHash },
    create: {
      loginId: 'dinakar@org',
      passwordHash,
      role: 'organization',
      status: 'approved',
      organizationProfile: {
        create: {
          orgName: 'Dinakar Corp',
          orgType: 'Private Sector',
          country: 'India',
          state: 'Telangana',
          district: 'Hyderabad',
          city: 'Hyderabad',
          address: 'Test Address',
          pinCode: '500001',
          officialEmail: 'info@dinakarcorp.com',
          officialPhone: '1234567890',
          adminName: 'Dinakar',
          designation: 'CEO',
          empId: 'EMP001',
          adminEmail: 'dinakar@org',
          mobile: '9391989153', // Using owner number from whatsapp .env
        }
      }
    }
  });
  console.log('Created org user:', orgUser.loginId);

  // Create Police User
  const policeUser = await prisma.user.upsert({
    where: { loginId: 'dinakar@police' },
    update: { passwordHash },
    create: {
      loginId: 'dinakar@police',
      passwordHash,
      role: 'police',
      status: 'approved',
      policeProfile: {
        create: {
          name: 'Dinakar Officer',
          empId: 'POL001',
          mobile: '9391989153',
        }
      }
    }
  });
  console.log('Created police user:', policeUser.loginId);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
