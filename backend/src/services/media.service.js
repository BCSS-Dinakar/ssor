import crypto from 'crypto';
import prisma from '../config/db.js';
import { MINIO_BUCKET } from '../config/minio.js';
import { env } from '../config/env.js';
import { getPresignedUrl, statObject, SIGNED_URL_EXPIRY_SECONDS } from './storage.service.js';
import logger from '../utils/logger.js';

// A reference is a Media id: an integer (or its numeric string form in a URL).
const isMediaId = (v) => v != null && /^\d+$/.test(String(v));

const IMAGE_CATEGORIES = new Set(['candidate_image', 'profile_image']);

// --- Media stream tokens ---------------------------------------------------
// Disk-stored objects can't be served by a MinIO presigned URL, so they're
// served by a backend endpoint guarded with a short-lived HMAC token (a
// self-hosted "presigned URL"): possession of a valid, unexpired token grants
// read access, exactly like a presigned URL. Tokens are only ever embedded in
// already-authorized responses.
const signMediaToken = (id, expires) =>
  crypto.createHmac('sha256', env.MEDIA_URL_SECRET).update(`${id}.${expires}`).digest('base64url');

export function verifyMediaToken(id, expires, token) {
  if (!id || !expires || !token) return false;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = signMediaToken(id, expires);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const buildStreamUrl = (id, downloadName) => {
  const expires = Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY_SECONDS;
  const token = signMediaToken(id, expires);
  const name = downloadName ? `&name=${encodeURIComponent(downloadName)}` : '';
  return `${env.API_PUBLIC_URL}/media/${id}/raw?expires=${expires}&token=${token}${name}`;
};

/** Basename of an object key / legacy path (strips any /api/v1/... prefix). */
const basename = (v) => String(v).split('/').pop();

/**
 * Register a MinIO object in the central Media table and return its reference id.
 * Idempotent on objectKey — re-registering the same object returns the existing id.
 * @returns {Promise<string>} Media.id to store on the owning row.
 */
export async function createMedia({ objectKey, originalName, fileType, fileSize, category, uploadedBy, store }) {
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
      store: store || 'minio',
      uploadedBy: uploadedBy || null,
    },
  });
  return media.id;
}

/** Remove the Media row for an object key (used to roll back a failed request). Never throws. */
export async function deleteMediaByObjectKey(objectKey) {
  try {
    await prisma.media.deleteMany({ where: { objectKey } });
  } catch (err) {
    logger.error('[deleteMediaByObjectKey]', err);
  }
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
    store: file.store || 'minio', // where persistUploads landed it (minio|disk)
  });
}

/**
 * Authorization: can `user` access the Media with this id?
 *  - police (reviewers) → any document
 *  - organization       → only documents referenced by their OWN records
 *                         (their candidate verifications + their org profile)
 *
 * Media ids are sequential integers, so this check is REQUIRED to prevent
 * enumeration/IDOR — never serve a document without it.
 */
export async function userCanAccessMedia(user, ref) {
  if (!user) return false;
  if (user.role === 'police') return true;
  if (user.role !== 'organization') return false;

  const id = Number(ref);
  if (!Number.isInteger(id)) return false;

  const ownedByVerification = await prisma.candidateVerification.count({
    where: { organizationId: user.id, OR: [{ candidateMediaId: id }, { consentMediaId: id }] },
  });
  if (ownedByVerification > 0) return true;

  const org = await prisma.organizationProfile.findUnique({
    where: { userId: user.id },
    select: { authLetterMediaId: true, govCertMediaId: true, supportingDocsMediaIds: true },
  });
  if (org && (org.authLetterMediaId === id || org.govCertMediaId === id || (org.supportingDocsMediaIds || []).includes(id))) {
    return true;
  }
  return false;
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
 * Resolve a stored reference to a ready-to-use, time-limited URL — with fallback:
 *   - object in MinIO  → presigned MinIO URL (browser fetches MinIO directly)
 *   - object on disk   → token-signed backend stream URL (served by /api/media/:id/raw)
 *   - object missing   → placeholder image URL for image categories, else null
 * Accepts a Media id (preferred) or a legacy object key / path.
 */
export async function resolveMediaUrl(ref) {
  if (!ref) return null;
  try {
    let media = null;
    let objectKey;
    let downloadName;

    if (isMediaId(ref)) {
      media = await prisma.media.findUnique({ where: { id: Number(ref) } });
      if (!media) return null;
      objectKey = media.objectKey;
      downloadName = media.originalName;
    } else {
      objectKey = basename(ref); // legacy raw key / path
      downloadName = objectKey;
    }

    const stat = await statObject(objectKey); // { source: 'minio' | 'disk' } | null

    if (stat?.source === 'minio') {
      return await getPresignedUrl(objectKey, SIGNED_URL_EXPIRY_SECONDS, downloadName);
    }
    if (stat?.source === 'disk' && media) {
      // Disk-stored (written during a MinIO outage): serve via the token endpoint.
      return buildStreamUrl(media.id, downloadName);
    }
    // Object exists nowhere → placeholder for images, null otherwise.
    if (media && IMAGE_CATEGORIES.has(media.category)) return env.MEDIA_PLACEHOLDER_URL;
    return null;
  } catch (err) {
    logger.error('[resolveMediaUrl]', err);
    return null;
  }
}

/**
 * Shared guard for the document endpoints: reject traversal, authorize the
 * user against the Media, and resolve to an object key that exists.
 * @returns {Promise<{ objectKey: string } | { error: { status: number, message: string } }>}
 */
export async function guardDocumentAccess(user, ref) {
  if (typeof ref !== 'string' || ref.includes('/') || ref.includes('\\') || ref.includes('..')) {
    return { error: { status: 403, message: 'Forbidden access' } };
  }
  if (!(await userCanAccessMedia(user, ref))) {
    return { error: { status: 403, message: 'You are not permitted to access this document.' } };
  }
  const objectKey = await resolveObjectKey(ref);
  if (!objectKey || !(await statObject(objectKey))) {
    return { error: { status: 404, message: 'Document not found' } };
  }
  return { objectKey };
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
