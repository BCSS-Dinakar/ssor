/**
 * Fill in Media.fileType / Media.fileSize for rows created by earlier backfills
 * (which only had the object key). Reads each object's stat from MinIO.
 * Idempotent — skips rows already populated and rows whose object is missing.
 *
 *   node scripts/backfill-media-metadata.js
 */
import '../src/config/env.js';
import prisma from '../src/config/db.js';
import { getMinio, MINIO_BUCKET } from '../src/config/minio.js';

const EXT_TYPE = {
  '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
};

async function main() {
  const minio = getMinio();
  const rows = await prisma.media.findMany({
    where: { OR: [{ fileType: null }, { fileSize: null }] },
    select: { id: true, objectKey: true },
  });
  console.log(`${rows.length} Media row(s) need metadata`);

  let filled = 0, missing = 0;
  for (const m of rows) {
    let stat;
    try {
      stat = await minio.statObject(MINIO_BUCKET, m.objectKey);
    } catch {
      missing += 1;
      continue; // object gone (orphaned) — leave nulls
    }
    const ext = m.objectKey.slice(m.objectKey.lastIndexOf('.')).toLowerCase();
    const fileType = stat.metaData?.['content-type'] || EXT_TYPE[ext] || 'application/octet-stream';
    await prisma.media.update({ where: { id: m.id }, data: { fileType, fileSize: stat.size } });
    filled += 1;
  }
  console.log(`✅ Filled ${filled}; skipped ${missing} with missing objects.`);
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(async (err) => { console.error('❌ Failed:', err); await prisma.$disconnect(); process.exit(1); });
