import '../src/config/env.js';
import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';

async function main() {
  const password = 'ssor@123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const phone = '9391989153';

  console.log('Upserting dinakar@org ...');
  // Create Organization User
  const orgUser = await prisma.user.upsert({
    where: { loginId: 'dinakar@org' },
    update: {
      passwordHash,
      status: 'approved',
      organizationProfile: {
        update: {
          orgName: 'Dinakar Organization',
          orgType: 'Private',
          parentOrg: 'None',
          department: 'IT',
          jurisdiction: 'Hyderabad',
          country: 'India',
          state: 'Telangana',
          district: 'Hyderabad',
          city: 'Hyderabad',
          address: 'Tech Park, Madhapur',
          pinCode: '500081',
          officialEmail: 'dinakar@org.com',
          officialPhone: phone,
          adminName: 'Dinakar Org Admin',
          designation: 'Director',
          empId: 'DIN-ORG-01',
          adminEmail: 'admin@dinakar.org',
          mobile: phone,
        }
      }
    },
    create: {
      loginId: 'dinakar@org',
      passwordHash,
      role: 'organization',
      status: 'approved',
      organizationProfile: {
        create: {
          orgName: 'Dinakar Organization',
          orgType: 'Private',
          parentOrg: 'None',
          department: 'IT',
          jurisdiction: 'Hyderabad',
          country: 'India',
          state: 'Telangana',
          district: 'Hyderabad',
          city: 'Hyderabad',
          address: 'Tech Park, Madhapur',
          pinCode: '500081',
          officialEmail: 'dinakar@org.com',
          officialPhone: phone,
          adminName: 'Dinakar Org Admin',
          designation: 'Director',
          empId: 'DIN-ORG-01',
          adminEmail: 'admin@dinakar.org',
          mobile: phone,
        }
      }
    }
  });
  console.log(`User created: ${orgUser.loginId}`);

  console.log('Upserting dinakar@police ...');
  // Create Police User
  const policeUser = await prisma.user.upsert({
    where: { loginId: 'dinakar@police' },
    update: {
      passwordHash,
      status: 'approved',
      policeProfile: {
        update: {
          name: 'Dinakar Police Officer',
          badgeId: 'DIN-POL-100',
          rank: 'Inspector',
          empId: 'POL-001',
          department: 'Cyber Crime',
          wing: 'IT Cell',
          jurisdiction: 'Cyberabad',
          joiningDate: '2020-01-01',
          email: 'dinakar@police.gov.in',
          mobile: phone,
          altPhone: phone,
          station: 'Cyberabad Police Station',
          district: 'Rangareddy',
          state: 'Telangana',
          country: 'India',
          clearanceLevel: 'Level 1'
        }
      }
    },
    create: {
      loginId: 'dinakar@police',
      passwordHash,
      role: 'police',
      status: 'approved',
      policeProfile: {
        create: {
          name: 'Dinakar Police Officer',
          badgeId: 'DIN-POL-100',
          rank: 'Inspector',
          empId: 'POL-001',
          department: 'Cyber Crime',
          wing: 'IT Cell',
          jurisdiction: 'Cyberabad',
          joiningDate: '2020-01-01',
          email: 'dinakar@police.gov.in',
          mobile: phone,
          altPhone: phone,
          station: 'Cyberabad Police Station',
          district: 'Rangareddy',
          state: 'Telangana',
          country: 'India',
          clearanceLevel: 'Level 1'
        }
      }
    }
  });
  console.log(`User created: ${policeUser.loginId}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
