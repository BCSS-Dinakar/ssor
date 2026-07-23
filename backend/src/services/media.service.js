import prisma from '../config/db.js';
import { MINIO_BUCKET } from '../config/minio.js';
import { getPresignedUrl, statObject, SIGNED_URL_EXPIRY_SECONDS } from './storage.service.js';

// A reference is a Media id: an integer (or its numeric string form in a URL).
const isMediaId = (v) => v != null && /^\d+$/.test(String(v));

/** Basename of an object key / legacy path (strips any /api/v1/... prefix). */
const basename = (v) => String(v).split('/').pop();

/**
 * Register a MinIO object in the central Media table and return its reference id.
 * Idempotent on objectKey — re-registering the same object returns the existing id.
 * @returns {Promise<string>} Media.id to store on the owning row.
 */
export async function createMedia({ objectKey, originalName, fileType, fileSize, category, uploadedBy }) {
  const media = await prisma.media.upsert({
    where: { objectKey },
    update: {},
    create: {
      bucketName: MINIO_BUCKET,
      objectKey,
      originalName: originalName || basename(objectKey),
      fileType: fileType || null,
      fileSize: fileSize ?? null,
      category: category || null,
      uploadedBy: uploadedBy || null,
    },
  });
  return media.id;
}

/** Convenience: build a Media row from a multer file processed by persistUploads. */
export function mediaFromFile(file, category, uploadedBy) {
  return createMedia({
    objectKey: file.filename, // object key set by persistUploads
    originalName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    category,
    uploadedBy,
  });
}

/**
 * Resolve a stored reference to its MinIO object key. Accepts a Media id
 * (preferred) or a legacy object key / path. Returns null if a Media id
 * doesn't resolve.
 */
export async function resolveObjectKey(ref) {
  if (!ref) return null;
  if (isMediaId(ref)) {
    const media = await prisma.media.findUnique({ where: { id: Number(ref) } });
    return media ? media.objectKey : null;
  }
  return basename(ref); // legacy raw key / path fallback
}

/**
 * Resolve a stored reference to a fresh, time-limited signed URL — or null.
 * Accepts either a Media id (preferred) or, for backward compatibility, a raw
 * object key / legacy path. Returns null if the reference or object is missing.
 */
export async function resolveMediaUrl(ref) {
  if (!ref) return null;
  try {
    let objectKey;
    let downloadName;

    if (isMediaId(ref)) {
      const media = await prisma.media.findUnique({ where: { id: Number(ref) } });
      if (!media) return null;
      objectKey = media.objectKey;
      downloadName = media.originalName;
    } else {
      // Legacy value: a raw key or "/api/v1/.../<key>" path.
      objectKey = basename(ref);
      downloadName = objectKey;
    }

    const exists = await statObject(objectKey);
    if (!exists) return null;

    return await getPresignedUrl(objectKey, SIGNED_URL_EXPIRY_SECONDS, downloadName);
  } catch (err) {
    console.error('[resolveMediaUrl Error]', err.message);
    return null;
  }
}

/** Resolve an array of references to signed URLs (nulls dropped). */
export async function resolveMediaUrls(refs = []) {
  const urls = await Promise.all(refs.map((r) => resolveMediaUrl(r)));
  return urls.filter(Boolean);
}

/**
 * Return a verification with its candidateImage/consentFile reference ids
 * replaced by fresh signed URLs (or null). The client gets ready-to-use URLs
 * inline — no separate id or lookup call.
 */
export async function withVerificationUrls(v) {
  if (!v) return v;
  const [candidateImage, consentFile] = await Promise.all([
    resolveMediaUrl(v.candidateMediaId),
    resolveMediaUrl(v.consentMediaId),
  ]);
  // Expose the ids too, plus ready-to-use signed URLs under the classic field names.
  return { ...v, candidateImage, consentFile };
}

/** Same as withVerificationUrls for a list, resolved in parallel. */
export function withVerificationUrlsList(list = []) {
  return Promise.all(list.map(withVerificationUrls));
}
