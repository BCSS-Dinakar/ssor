/**
 * One-shot migration: upload existing backend/storage/documents/* files into MinIO.
 *
 * Safe to run multiple times (idempotent — re-uploads overwrite the same keys).
 * The read path already falls back to disk, so running this is optional; it just
 * makes MinIO the source of truth for legacy files.
 *
 *   node scripts/migrate-storage-to-minio.js
 */
import '../src/config/env.js';
import fs from 'fs';
import path from 'path';
import { ensureBucket } from '../src/config/minio.js';
import { putBuffer } from '../src/services/storage.service.js';

const DIR = path.join(process.cwd(), 'storage/documents');

const CONTENT_TYPES = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

async function main() {
  const ok = await ensureBucket();
  if (!ok) {
    console.error('❌ Aborting: MinIO bucket is not available.');
    process.exit(1);
  }

  if (!fs.existsSync(DIR)) {
    console.log('No storage/documents directory found — nothing to migrate.');
    return;
  }

  const files = fs.readdirSync(DIR).filter((f) => !f.startsWith('.'));
  if (files.length === 0) {
    console.log('storage/documents is empty — nothing to migrate.');
    return;
  }

  let migrated = 0;
  for (const name of files) {
    const full = path.join(DIR, name);
    if (!fs.statSync(full).isFile()) continue;
    const buffer = fs.readFileSync(full);
    const ext = path.extname(name).toLowerCase();
    await putBuffer(name, buffer, CONTENT_TYPES[ext] || 'application/octet-stream');
    migrated += 1;
    console.log(`  ↑ ${name}`);
  }

  console.log(`✅ Migrated ${migrated} file(s) to MinIO.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
