import { Client } from 'minio';
import logger from '../utils/logger.js';

let client;
let publicClient;

/**
 * Lazily construct the MinIO client from environment configuration.
 * Mirrors the Redis pattern: a single shared instance, created on first use.
 * Used for all server-side operations (put/stat/get) over the INTERNAL endpoint.
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

/**
 * Client used ONLY to sign presigned URLs, configured with the PUBLIC endpoint
 * that browsers can reach (MINIO_PUBLIC_ENDPOINT). The SigV4 signature covers the
 * host, so the presigning client must use the exact host the browser will hit.
 * Falls back to the internal endpoint when no public endpoint is set (dev).
 */
export function getMinioForSigning() {
  if (process.env.MINIO_PUBLIC_ENDPOINT) {
    if (!publicClient) {
      publicClient = new Client({
        endPoint: process.env.MINIO_PUBLIC_ENDPOINT,
        port: parseInt(process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT || '9000'),
        useSSL: (process.env.MINIO_PUBLIC_USE_SSL ?? process.env.MINIO_USE_SSL) === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      });
    }
    return publicClient;
  }
  return getMinio();
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
      logger.info(`✅ MinIO bucket created: ${bucket}`);
    } else {
      logger.info(`✅ MinIO bucket ready: ${bucket}`);
    }
    return true;
  } catch (err) {
    logger.warn(`⚠️  MinIO not reachable at startup (bucket: ${bucket}):`, err.message);
    logger.warn('    File uploads/downloads will fail until MinIO is available.');
    return false;
  }
}
