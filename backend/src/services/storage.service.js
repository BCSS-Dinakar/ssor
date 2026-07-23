import fs from 'fs';
import path from 'path';
import { getMinio, getMinioForSigning, MINIO_BUCKET } from '../config/minio.js';
import logger from '../utils/logger.js';

// Signed URLs are minted on demand and expire; they are never stored.
export const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

// Local fallback directory used when MinIO is unreachable at write time, and as
// a read fallback. Reconciled back into MinIO by `npm run storage:migrate`.
const DISK_DIR = process.env.MEDIA_DISK_DIR || path.join(process.cwd(), 'storage/media');
const diskPath = (key) => path.join(DISK_DIR, path.basename(key));

/**
 * Generate a temporary presigned GET URL for a stored object. The DB keeps only
 * the permanent object key; this short-lived signed URL is generated per request
 * and never persisted.
 * @param {string} key permanent object key stored in the DB.
 * @param {number} [expirySeconds=3600]
 * @param {string} [downloadFileName] sets Content-Disposition for a friendly name.
 */
export async function getPresignedUrl(key, expirySeconds = SIGNED_URL_EXPIRY_SECONDS, downloadFileName) {
  const reqParams = downloadFileName
    ? { 'response-content-disposition': `inline; filename="${String(downloadFileName).replace(/"/g, '')}"` }
    : undefined;
  // Sign with the PUBLIC-endpoint client so the URL is reachable by browsers.
  return getMinioForSigning().presignedGetObject(MINIO_BUCKET, key, expirySeconds, reqParams);
}

/**
 * Store a buffer. Tries MinIO first; if MinIO is unavailable, falls back to the
 * local disk directory so uploads never hard-fail during an outage. The read
 * path also falls back to disk, and `npm run storage:migrate` reconciles disk
 * files back into MinIO.
 * @returns {Promise<{ key: string, store: 'minio' | 'disk' }>}
 */
export async function putBuffer(key, buffer, contentType) {
  try {
    const minio = getMinio();
    await minio.putObject(MINIO_BUCKET, key, buffer, buffer.length, {
      'Content-Type': contentType || 'application/octet-stream',
    });
    return { key, store: 'minio' };
  } catch (err) {
    logger.warn(`MinIO unavailable for ${key}; falling back to disk`, err.message);
    fs.mkdirSync(DISK_DIR, { recursive: true });
    fs.writeFileSync(diskPath(key), buffer);
    return { key, store: 'disk' };
  }
}

/**
 * Stat an object. Returns { size, lastModified, source: 'minio' | 'disk' } or
 * null if absent. Falls back to the local disk directory.
 */
export async function statObject(key) {
  try {
    const stat = await getMinio().statObject(MINIO_BUCKET, key);
    return { size: stat.size, lastModified: stat.lastModified, source: 'minio' };
  } catch (_) { /* fall through to disk */ }
  try {
    const s = fs.statSync(diskPath(key));
    return { size: s.size, lastModified: s.mtime, source: 'disk' };
  } catch (_) {
    return null;
  }
}

/**
 * Get a readable stream for an object, trying MinIO first then local disk.
 * @returns {Promise<import('stream').Readable|null>}
 */
export async function getStream(key) {
  try {
    return await getMinio().getObject(MINIO_BUCKET, key);
  } catch (_) { /* fall through to disk */ }
  const p = diskPath(key);
  if (fs.existsSync(p)) return fs.createReadStream(p);
  return null;
}

/** Remove an object from MinIO and the local disk copy if present. Never throws. */
export async function removeObject(key) {
  try {
    await getMinio().removeObject(MINIO_BUCKET, key);
  } catch (err) {
    logger.warn(`Failed to remove MinIO object ${key}`, err.message);
  }
  try {
    const p = diskPath(key);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (_) { /* ignore */ }
}

const CONTENT_TYPES = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * Stream a stored document to an Express response with sensible headers.
 * Handles the 404 case. Reusable across the auth/organization/police getDocument handlers.
 */
export async function streamDocument(res, filename, { notFoundMessage = 'File not found' } = {}) {
  const stream = await getStream(filename);
  if (!stream) {
    return res.status(404).json({ success: false, message: notFoundMessage });
  }
  const ext = filename.split('.').pop().toLowerCase();
  if (CONTENT_TYPES[ext]) res.setHeader('Content-Type', CONTENT_TYPES[ext]);
  stream.on('error', (err) => {
    logger.error('[streamDocument Error]', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error serving document' });
    } else {
      res.end();
    }
  });
  stream.pipe(res);
}
