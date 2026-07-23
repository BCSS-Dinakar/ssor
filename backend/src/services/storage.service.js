import { getMinio, getMinioForSigning, MINIO_BUCKET } from '../config/minio.js';
import logger from '../utils/logger.js';

// Signed URLs are minted on demand and expire; they are never stored.
export const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

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
 * Store a buffer under `key` in MinIO. Throws if MinIO is unavailable so the
 * caller can surface a 503 (see persistUploads).
 * @returns {Promise<{ key: string, store: 'minio' }>}
 */
export async function putBuffer(key, buffer, contentType) {
  const minio = getMinio();
  await minio.putObject(MINIO_BUCKET, key, buffer, buffer.length, {
    'Content-Type': contentType || 'application/octet-stream',
  });
  return { key, store: 'minio' };
}

/**
 * Stat an object. Returns { size, lastModified, source: 'minio' } or null if absent.
 */
export async function statObject(key) {
  try {
    const stat = await getMinio().statObject(MINIO_BUCKET, key);
    return { size: stat.size, lastModified: stat.lastModified, source: 'minio' };
  } catch (_) {
    return null;
  }
}

/**
 * Get a readable stream for an object from MinIO.
 * @returns {Promise<import('stream').Readable|null>}
 */
export async function getStream(key) {
  try {
    return await getMinio().getObject(MINIO_BUCKET, key);
  } catch (_) {
    return null;
  }
}

/** Remove an object from MinIO. Never throws. */
export async function removeObject(key) {
  try {
    await getMinio().removeObject(MINIO_BUCKET, key);
  } catch (err) {
    logger.warn(`⚠️  Failed to remove MinIO object ${key}:`, err.message);
  }
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
