import { Client } from 'minio';

let client;

/**
 * Lazily construct the MinIO client from environment configuration.
 * Mirrors the Redis pattern: a single shared instance, created on first use.
 */
export function getMinio() {
  if (!client) {
    client = new Client({
      endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }
  return client;
}

// Single private bucket for all document storage — both the legacy flat-key
// flow and the structured document-management system (organizations/…,
// offenders/…, reports/…).
export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'ssor-documents';

/**
 * Ensure a bucket exists. Called once per bucket at startup.
 * Non-fatal: if MinIO is unreachable the server still boots (uploads will
 * error at request time), matching the graceful-degradation style used for Redis.
 * @param {string} [bucket=MINIO_BUCKET] bucket to provision.
 */
export async function ensureBucket(bucket = MINIO_BUCKET) {
  try {
    const minio = getMinio();
    const region = process.env.MINIO_REGION || 'us-east-1';
    const exists = await minio.bucketExists(bucket);
    if (!exists) {
      await minio.makeBucket(bucket, region);
      console.log(`✅ MinIO bucket created: ${bucket}`);
    } else {
      console.log(`✅ MinIO bucket ready: ${bucket}`);
    }
    return true;
  } catch (err) {
    console.warn(`⚠️  MinIO not reachable at startup (bucket: ${bucket}):`, err.message);
    console.warn('    File uploads/downloads will fail until MinIO is available.');
    return false;
  }
}
