/**
 * One-shot backfill: move existing document paths in the app tables into the
 * central Media table, and replace each column with the new Media reference id.
 *
 * Idempotent — values that are already Media ids (uuid) are skipped.
 *
 *   node scripts/backfill-media.js
 */
import '../src/config/env.js';
import prisma from '../src/config/db.js';
import { MINIO_BUCKET } from '../src/config/minio.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const basename = (v) => String(v).split('/').pop();

let created = 0;

/** Turn a legacy path/key into a Media id (creating the row if needed). */
async function toMediaId(value, category, uploadedBy) {
  if (!value) return null;
  if (UUID_RE.test(value)) return value; // already migrated
  const objectKey = basename(value);
  const existing = await prisma.media.findUnique({ where: { objectKey } });
  if (existing) return existing.id;
  const media = await prisma.media.create({
    data: { bucketName: MINIO_BUCKET, objectKey, originalName: objectKey, category, uploadedBy: uploadedBy || null },
  });
  created += 1;
  console.log(`  + Media ${media.id}  ${objectKey}`);
  return media.id;
}

async function main() {
  // --- CandidateVerification.candidateImage / consentFile ---
  const vers = await prisma.candidateVerification.findMany({
    select: { id: true, candidateImage: true, consentFile: true, organizationId: true },
  });
  for (const v of vers) {
    const candidateImage = await toMediaId(v.candidateImage, 'candidate_image', v.organizationId);
    const consentFile = await toMediaId(v.consentFile, 'consent', v.organizationId);
    if (candidateImage !== v.candidateImage || consentFile !== v.consentFile) {
      await prisma.candidateVerification.update({ where: { id: v.id }, data: { candidateImage, consentFile } });
    }
  }
  console.log(`CandidateVerification: ${vers.length} rows processed`);

  // --- OrganizationProfile.authLetterPath / govCertPath / supportingDocsPaths[] ---
  const orgs = await prisma.organizationProfile.findMany({
    select: { id: true, userId: true, authLetterPath: true, govCertPath: true, supportingDocsPaths: true },
  });
  for (const o of orgs) {
    const authLetterPath = await toMediaId(o.authLetterPath, 'auth_letter', o.userId);
    const govCertPath = await toMediaId(o.govCertPath, 'gov_cert', o.userId);
    const supportingDocsPaths = [];
    for (const p of o.supportingDocsPaths || []) supportingDocsPaths.push(await toMediaId(p, 'supporting_doc', o.userId));
    await prisma.organizationProfile.update({ where: { id: o.id }, data: { authLetterPath, govCertPath, supportingDocsPaths } });
  }
  console.log(`OrganizationProfile: ${orgs.length} rows processed`);

  // --- PoliceProfile.docsPaths[] ---
  const pols = await prisma.policeProfile.findMany({ select: { id: true, userId: true, docsPaths: true } });
  for (const p of pols) {
    const docsPaths = [];
    for (const d of p.docsPaths || []) docsPaths.push(await toMediaId(d, 'police_doc', p.userId));
    await prisma.policeProfile.update({ where: { id: p.id }, data: { docsPaths } });
  }
  console.log(`PoliceProfile: ${pols.length} rows processed`);

  console.log(`\n✅ Backfill complete. ${created} new Media row(s) created.`);
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(async (err) => { console.error('❌ Backfill failed:', err); await prisma.$disconnect(); process.exit(1); });
