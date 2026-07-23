/**
 * Isolated end-to-end test of the document upload path.
 * Mounts the REAL upload + persistUploads middleware on a throwaway Express app,
 * POSTs a multipart file over HTTP, then verifies it landed in storage and reads back.
 *
 *   node scripts/test-upload-flow.js
 *
 * Does NOT touch the database. Cleans up after itself.
 */
import '../src/config/env.js';
import express from 'express';
import { upload, persistUploads } from '../src/middleware/upload.middleware.js';
import { getStream, statObject, removeObject } from '../src/services/storage.service.js';
import { ensureBucket } from '../src/config/minio.js';

const log = (...a) => console.log('  ', ...a);

async function main() {
  const minioUp = await ensureBucket();
  console.log(`\nMinIO reachable: ${minioUp ? 'YES (expect store=minio)' : 'NO (expect store=disk fallback)'}\n`);

  // Throwaway app using the real middleware chain
  const app = express();
  app.post('/upload',
    upload.fields([{ name: 'authLetter', maxCount: 1 }]),
    persistUploads,
    (req, res) => {
      const f = req.files.authLetter[0];
      res.json({ filename: f.filename, store: f.store, size: f.size });
    }
  );

  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const port = server.address().port;

  // Build a multipart body with a fake PDF
  const content = Buffer.from('%PDF-1.4\nSSOR upload test ' + '20260723' + '\n%%EOF');
  const boundary = '----ssortest' + '1234567890';
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="authLetter"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    content,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  console.log('1) POST /upload  (multipart, 1 file)');
  const resp = await fetch(`http://127.0.0.1:${port}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  const json = await resp.json();
  log(`HTTP ${resp.status} ->`, JSON.stringify(json));
  if (!resp.ok || !json.filename) throw new Error('Upload failed');
  const key = json.filename;

  console.log('\n2) statObject (where did it land?)');
  const stat = await statObject(key);
  log(stat ? `source=${stat.source} size=${stat.size}` : 'NOT FOUND');

  console.log('\n3) getStream (read the bytes back)');
  const stream = await getStream(key);
  let read = Buffer.alloc(0);
  for await (const c of stream) read = Buffer.concat([read, c]);
  const match = read.equals(content);
  log(`read ${read.length} bytes, content matches original: ${match ? 'YES ✅' : 'NO ❌'}`);

  console.log('\n4) cleanup (removeObject)');
  await removeObject(key);
  const gone = await getStream(key);
  log(gone === null ? 'removed ✅' : 'STILL PRESENT ❌');

  server.close();
  console.log(`\n${match && gone === null ? '✅ UPLOAD FLOW OK' : '❌ TEST FAILED'}\n`);
  process.exit(match && gone === null ? 0 : 1);
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
