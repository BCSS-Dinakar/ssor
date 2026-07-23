/**
 * One-shot, transactional migration:
 *   1. Rebuild Media with an auto-increment integer `id` (was uuid).
 *   2. Add explicit reference columns on the app tables:
 *        CandidateVerification: candidateMediaId, consentMediaId          (Int?)
 *        OrganizationProfile  : authLetterMediaId, govCertMediaId (Int?), supportingDocsMediaIds (Int[])
 *        PoliceProfile        : docsMediaIds (Int[])
 *   3. Remap every existing uuid reference to the new integer Media id.
 *   4. Drop the old string columns.
 *
 * All-or-nothing (single transaction). Idempotent: exits early if already run.
 *
 *   node scripts/migrate-media-int-id.js
 */
import '../src/config/env.js';
import prisma from '../src/config/db.js';

async function alreadyMigrated() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT data_type FROM information_schema.columns
    WHERE table_name = 'Media' AND column_name = 'id'`);
  return rows[0]?.data_type === 'integer';
}

async function main() {
  if (await alreadyMigrated()) {
    console.log('Media.id is already integer — migration already applied. Nothing to do.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Snapshot existing Media (uuid ids)
    const media = await tx.$queryRawUnsafe(`
      SELECT id, "bucketName","objectKey","originalName","fileType","fileSize",category,"uploadedBy","createdAt" FROM "Media"`);
    console.log(`Snapshotted ${media.length} Media rows`);

    // 2. New Media table with SERIAL id
    await tx.$executeRawUnsafe(`
      CREATE TABLE "Media_new" (
        "id" SERIAL PRIMARY KEY,
        "bucketName" TEXT NOT NULL,
        "objectKey" TEXT NOT NULL,
        "originalName" TEXT NOT NULL,
        "fileType" TEXT,
        "fileSize" INTEGER,
        "category" TEXT,
        "uploadedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Media_new_objectKey_key" UNIQUE ("objectKey")
      )`);

    // 3. Re-insert, building uuid -> int map
    const map = {};
    for (const m of media) {
      const [row] = await tx.$queryRawUnsafe(
        `INSERT INTO "Media_new" ("bucketName","objectKey","originalName","fileType","fileSize","category","uploadedBy","createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        m.bucketName, m.objectKey, m.originalName, m.fileType, m.fileSize, m.category, m.uploadedBy, m.createdAt);
      map[m.id] = row.id;
    }

    // 4. Add new reference columns
    await tx.$executeRawUnsafe(`ALTER TABLE "CandidateVerification" ADD COLUMN "candidateMediaId" INTEGER, ADD COLUMN "consentMediaId" INTEGER`);
    await tx.$executeRawUnsafe(`ALTER TABLE "OrganizationProfile" ADD COLUMN "authLetterMediaId" INTEGER, ADD COLUMN "govCertMediaId" INTEGER, ADD COLUMN "supportingDocsMediaIds" INTEGER[] NOT NULL DEFAULT '{}'`);
    await tx.$executeRawUnsafe(`ALTER TABLE "PoliceProfile" ADD COLUMN "docsMediaIds" INTEGER[] NOT NULL DEFAULT '{}'`);

    const toInt = (uuid) => (uuid && map[uuid] != null ? map[uuid] : null);
    const toIntArr = (arr) => (arr || []).map((u) => map[u]).filter((x) => x != null);

    // 5. Backfill CandidateVerification
    const vers = await tx.$queryRawUnsafe(`SELECT id,"candidateImage","consentFile" FROM "CandidateVerification"`);
    for (const v of vers) {
      await tx.$executeRawUnsafe(`UPDATE "CandidateVerification" SET "candidateMediaId"=$1, "consentMediaId"=$2 WHERE id=$3`,
        toInt(v.candidateImage), toInt(v.consentFile), v.id);
    }
    console.log(`Remapped ${vers.length} CandidateVerification rows`);

    // 5b. OrganizationProfile
    const orgs = await tx.$queryRawUnsafe(`SELECT id,"authLetterPath","govCertPath","supportingDocsPaths" FROM "OrganizationProfile"`);
    for (const o of orgs) {
      await tx.$executeRawUnsafe(`UPDATE "OrganizationProfile" SET "authLetterMediaId"=$1, "govCertMediaId"=$2, "supportingDocsMediaIds"=$3 WHERE id=$4`,
        toInt(o.authLetterPath), toInt(o.govCertPath), toIntArr(o.supportingDocsPaths), o.id);
    }
    console.log(`Remapped ${orgs.length} OrganizationProfile rows`);

    // 5c. PoliceProfile
    const pols = await tx.$queryRawUnsafe(`SELECT id,"docsPaths" FROM "PoliceProfile"`);
    for (const p of pols) {
      await tx.$executeRawUnsafe(`UPDATE "PoliceProfile" SET "docsMediaIds"=$1 WHERE id=$2`, toIntArr(p.docsPaths), p.id);
    }
    console.log(`Remapped ${pols.length} PoliceProfile rows`);

    // 6. Drop old string columns
    await tx.$executeRawUnsafe(`ALTER TABLE "CandidateVerification" DROP COLUMN "candidateImage", DROP COLUMN "consentFile"`);
    await tx.$executeRawUnsafe(`ALTER TABLE "OrganizationProfile" DROP COLUMN "authLetterPath", DROP COLUMN "govCertPath", DROP COLUMN "supportingDocsPaths"`);
    await tx.$executeRawUnsafe(`ALTER TABLE "PoliceProfile" DROP COLUMN "docsPaths"`);

    // 7. Swap Media tables
    await tx.$executeRawUnsafe(`DROP TABLE "Media"`);
    await tx.$executeRawUnsafe(`ALTER TABLE "Media_new" RENAME TO "Media"`);
    await tx.$executeRawUnsafe(`CREATE INDEX "Media_category_idx" ON "Media"("category")`);

    console.log('✅ Migration committed.');
  }, { timeout: 60000 });
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(async (err) => { console.error('❌ Migration failed (rolled back):', err); await prisma.$disconnect(); process.exit(1); });
