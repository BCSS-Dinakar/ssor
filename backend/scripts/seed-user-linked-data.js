import '../src/config/env.js';
import prisma from '../src/config/db.js';

const VERIFICATIONS = [
  {
    candidateName: 'Vikram Rathore',
    phone: '9848011111',
    role: 'Security Guard',
    orgType: 'School',
    fatherName: 'Ramesh Rathore',
    dob: '1990-04-12',
    status: 'pending',
    aadharNumber: null,
  },
  {
    candidateName: 'Imran Shaikh',
    phone: '9811122233',
    role: 'Transport Staff',
    orgType: 'School',
    fatherName: 'Ahmed Shaikh',
    dob: '1988-09-03',
    status: 'pending',
    aadharNumber: null,
  },
  {
    candidateName: 'Ashok Reddy Goud',
    phone: '9999911111',
    role: 'Teaching Assistant',
    orgType: 'School',
    fatherName: 'Venkat Reddy',
    dob: '1985-11-21',
    status: 'verifying',
    aadharNumber: null,
  },
  {
    candidateName: 'Karthik Reddy',
    phone: '9848022319',
    role: 'Caretaker',
    orgType: 'School',
    fatherName: 'Srinivas Reddy',
    dob: '1992-01-15',
    status: 'rejected',
    policeFeedback: 'Low-priority phone match requires manual review. Clearance denied pending identity verification.',
    aadharNumber: null,
  },
  {
    candidateName: 'Priya Sharma',
    phone: '9876501234',
    role: 'Nurse',
    orgType: 'School',
    fatherName: 'Anil Sharma',
    dob: '1994-07-08',
    status: 'approved',
    policeFeedback: 'No matching records in CCTNS or ePetty. Clearance granted.',
    aadharNumber: null,
  },
];

const AUDIT_ACTIONS = [
  { role: 'police', action: 'Accessed Register Console dashboard' },
  { role: 'police', action: 'Viewed pending clearance queue' },
  { role: 'police', action: 'Reviewed offender registry metrics for Telangana' },
  { role: 'organization', action: 'Accessed organization portal dashboard' },
  { role: 'organization', action: 'Submitted candidate verification for Vikram Rathore' },
  { role: 'organization', action: 'Submitted candidate verification for Imran Shaikh' },
];

async function main() {
  const police = await prisma.user.findUnique({
    where: { loginId: 'admin@ssor' },
    include: { policeProfile: true },
  });
  const org = await prisma.user.findUnique({
    where: { loginId: 'org@ssor' },
    include: { organizationProfile: true },
  });

  if (!police) throw new Error('Police user admin@ssor not found. Run create-bcss-officer.js first.');
  if (!org?.organizationProfile) {
    throw new Error('Organization user org@ssor not found. Run create-bcss-org.js first.');
  }

  const orgProfile = org.organizationProfile;

  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.systemAuditLog.deleteMany();
  await prisma.candidateVerification.deleteMany();

  const verifications = [];
  for (const item of VERIFICATIONS) {
    const verification = await prisma.candidateVerification.create({
      data: {
        organizationId: org.id,
        orgName: orgProfile.orgName,
        orgType: item.orgType,
        role: item.role,
        candidateName: item.candidateName,
        fatherName: item.fatherName,
        dob: new Date(item.dob),
        phone: item.phone,
        consent: true,
        aadharNumber: item.aadharNumber,
        status: item.status,
        policeFeedback: item.policeFeedback || null,
      },
    });
    verifications.push(verification);
  }

  const now = Date.now();
  for (let i = 0; i < AUDIT_ACTIONS.length; i += 1) {
    const entry = AUDIT_ACTIONS[i];
    const userId = entry.role === 'police' ? police.id : org.id;
    await prisma.systemAuditLog.create({
      data: {
        userId,
        action: entry.action,
        ipAddress: '127.0.0.1',
        createdAt: new Date(now - (AUDIT_ACTIONS.length - i) * 60_000),
      },
    });
  }

  for (const verification of verifications.filter((v) => v.status === 'pending' || v.status === 'verifying')) {
    await prisma.systemAuditLog.create({
      data: {
        userId: police.id,
        action: `Queued clearance review for ${verification.candidateName} (${verification.id.slice(0, 8)})`,
        ipAddress: '127.0.0.1',
      },
    });
  }

  const appealCandidate = verifications.find((v) => v.candidateName === 'Karthik Reddy');
  const ticket = await prisma.supportTicket.create({
    data: {
      organizationId: org.id,
      subject: `Rejected Candidate Appeal (${appealCandidate.candidateName})`,
      category: 'Clearance Appeal',
      priority: 'High',
      reference: `${appealCandidate.candidateName} (${appealCandidate.id.slice(0, 8)})`,
      status: 'Open',
      assignee: police.policeProfile?.name || 'Registry Administrator',
      messages: {
        create: [
          {
            senderName: orgProfile.adminName,
            senderRole: 'organization',
            text: `We are requesting further clarification regarding the rejected status for candidate ${appealCandidate.candidateName}.`,
          },
          {
            senderName: police.policeProfile?.name || 'Registry Administrator',
            senderRole: 'police',
            text: 'Appeal received. A reviewing officer will inspect the phone-match dossier and respond within 48 hours.',
          },
        ],
      },
    },
    include: { messages: true },
  });

  console.log('User-linked data mapped successfully:');
  console.log(`  Organization: ${org.loginId} (${orgProfile.orgName})`);
  console.log(`  Police: ${police.loginId}`);
  console.log(`  Candidate verifications: ${verifications.length}`);
  console.log(`  Audit log entries: ${AUDIT_ACTIONS.length + verifications.filter((v) => v.status === 'pending' || v.status === 'verifying').length}`);
  console.log(`  Support tickets: 1 (${ticket.ticketNumber})`);
}

main()
  .catch((e) => {
    console.error('Error seeding user-linked data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
