import './src/config/env.js';
import prisma from './src/config/db.js';

async function main() {
  const users = await prisma.user.findMany({
    include: { policeProfile: true }
  });

  const target = users.find(u => 
    u.loginId.toLowerCase().includes('dinakar') || 
    (u.policeProfile && u.policeProfile.name && u.policeProfile.name.toLowerCase().includes('dinakar'))
  );

  if (!target) {
    console.log('No user found with name or login containing "dinakar"');
    process.exit(1);
  }

  console.log('Found user:', target.loginId, target.policeProfile?.name);

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role: 'STATE_ADMIN', status: 'approved' }
  });

  console.log('Successfully updated role to STATE_ADMIN for:', updated.loginId);
}

main().catch(console.error).finally(() => prisma.$disconnect());
