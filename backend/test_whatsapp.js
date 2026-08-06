import './src/config/env.js';
import prisma from './src/config/db.js';
import { sendReleaseAlert } from './src/services/release-alert.service.js';

async function main() {
  console.log("Checking for districts with WhatsApp alerts enabled...");
  
  const settings = await prisma.districtNotificationSettings.findMany({
    where: { alertsEnabled: true }
  });

  if (settings.length === 0) {
    console.log("No districts have WhatsApp alerts enabled currently.");
    process.exit(0);
  }

  console.log(`Found ${settings.length} district(s) configured for alerts.`);

  for (const s of settings) {
    const dist = await prisma.district.findUnique({ where: { distCode: s.distCode } });
    if (!dist) continue;

    let psName = 'Headquarters';
    try {
      // Fetch a valid PS name for this district from CCTNS hierarchy
      const rows = await prisma.$queryRawUnsafe(`SELECT ps_name FROM cctns_etl.hierarchy WHERE dist_code = $1 LIMIT 1`, s.distCode);
      if (rows && rows.length > 0 && rows[0].ps_name) {
        psName = rows[0].ps_name;
      }
    } catch (e) {
      console.log(`Could not fetch PS for ${s.distCode}`);
    }

    const mockRecord = {
      id: `TEST-REL-${Math.floor(Math.random()*10000)}`,
      distCode: s.distCode,
      district: dist.distName,
      prisonerName: 'Test Offender (Mock)',
      fatherName: 'Unknown',
      jailName: 'Central Prison',
      releaseDate: new Date().toLocaleDateString('en-IN'),
      caseDetails: `Cr.No. ${Math.floor(Math.random()*500)}/2026, ${psName} PS`,
      sectionsOfLaw: 'BNS 111, BNS 70',
      surveillanceOfficer: `SHO ${psName}`,
      status: 'Released'
    };

    console.log(`\n========================================`);
    console.log(`Sending mock alert for ${dist.distName} (${psName} PS)...`);
    const result = await sendReleaseAlert(mockRecord, true);
    console.log(`Result:`, JSON.stringify(result, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
