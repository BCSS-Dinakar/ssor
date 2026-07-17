import '../src/config/env.js';
import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';

async function main() {
  const loginId = 'org@ssor';
  const password = 'ssor@123';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const orgProfileData = {
    orgName: 'BCSS Test School',
    orgType: 'School',
    parentOrg: 'BCSS Education Trust',
    department: 'Primary Section',
    jurisdiction: 'South Zone',
    country: 'India',
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Hyderabad',
    address: '123 Test Avenue, HITEC City',
    pinCode: '500081',
    officialEmail: 'admin@bcsstest.org',
    officialPhone: '04012345678',
    altPhone: '9876543210',
    website: 'https://www.bcsstest.org',
    adminName: 'Ashish Kumar',
    designation: 'System Administrator',
    empId: 'BCSS-EMP-0001',
    adminEmail: 'admin@bcsstest.org',
    mobile: '9876543210'
  };

  const org = await prisma.user.upsert({
    where: { loginId },
    update: {
      passwordHash,
      status: 'approved',
      organizationProfile: {
        update: orgProfileData
      }
    },
    create: {
      loginId,
      passwordHash,
      role: 'organization',
      status: 'approved',
      organizationProfile: {
        create: orgProfileData
      }
    }
  });

  console.log('SSOR Organization successfully created or updated:');
  console.log('Username (loginId):', org.loginId);
  console.log('Role:', org.role);
  console.log('Status:', org.status);
}

main()
  .catch((e) => {
    console.error('Error creating organization:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
