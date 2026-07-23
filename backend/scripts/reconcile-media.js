/**
 * Reconcile disk-stored media back into MinIO once it's reachable again.
 * For every Media row with store='disk' whose file is on disk, re-upload it to
 * MinIO and flip store back to 'minio'. Idempotent and safe to re-run.
 *
 *   node scripts/reconcile-media.js
 */
import fs from 'fs';
import path from 'path';
import '../src/config/env.js';
import prisma from '../src/config/db.js';
import { putBuffer } from '../src/services/storage.service.js';

const DISK_DIR = process.env.MEDIA_DISK_DIR || path.join(process.cwd(), 'storage/media');

async function main() {
  const pending = await prisma.media.findMany({ where: { store: 'disk' } });
  if (pending.length === 0) {
    console.log('No disk-stored media to reconcile.');
    return;
  }
  console.log(`${pending.length} disk-stored media row(s) to reconcile`);

  let healed = 0, missing = 0, failed = 0;
  for (const m of pending) {
    const p = path.join(DISK_DIR, path.basename(m.objectKey));
    if (!fs.existsSync(p)) { missing += 1; continue; }
    const buffer = fs.readFileSync(p);
    const { store } = await putBuffer(m.objectKey, buffer, m.fileType || 'application/octet-stream');
    if (store !== 'minio') { failed += 1; continue; } // MinIO still down
    await prisma.media.update({ where: { id: m.id }, data: { store: 'minio', fileSize: m.fileSize ?? buffer.length } });
    fs.unlinkSync(p);
    healed += 1;
    console.log(`  ↑ ${m.objectKey}`);
  }
  console.log(`✅ Reconciled ${healed}; ${missing} missing on disk; ${failed} still failing (MinIO down?).`);
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(async (err) => { console.error('❌ Reconcile failed:', err); await prisma.$disconnect(); process.exit(1); });
