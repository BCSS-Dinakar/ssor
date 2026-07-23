import prisma from '../config/db.js';
import { verifyMediaToken } from '../services/media.service.js';
import { streamDocument } from '../services/storage.service.js';
import logger from '../utils/logger.js';

/**
 * GET /api/media/:id/raw?expires=&token=&name=
 *
 * Token-guarded streaming endpoint — the read path for objects that live on the
 * local disk fallback (which a MinIO presigned URL cannot serve). A valid,
 * unexpired HMAC token IS the authorization (a self-hosted presigned URL), so
 * no cookie/session is required and it works in a cross-origin <img src>.
 */
export const streamMediaRaw = async (req, res) => {
  try {
    const { id } = req.params;
    const { expires, token } = req.query;

    if (!verifyMediaToken(id, expires, token)) {
      return res.status(403).json({ success: false, message: 'Invalid or expired media link.' });
    }

    const media = await prisma.media.findUnique({ where: { id: Number(id) } });
    if (!media) return res.status(404).json({ success: false, message: 'Media not found.' });

    // Short private cache — the token already bounds the lifetime.
    res.setHeader('Cache-Control', 'private, max-age=300');
    await streamDocument(res, media.objectKey, { notFoundMessage: 'Media not found' });
  } catch (err) {
    logger.error('[streamMediaRaw]', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Server error serving media.' });
  }
};
