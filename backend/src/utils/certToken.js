import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Certificate verification token.
 *
 * The token is a compact, tamper-evident string: `<verificationId>.<signature>`
 * where the signature is an HMAC-SHA256 of the verification id keyed with the
 * server secret. Nobody can forge a valid token without the secret, so a fake
 * or edited QR code will fail verification. We keep it short (vs a full JWT) so
 * the QR code stays low-density and reliably scannable.
 */

const SIG_LENGTH = 24; // truncated HMAC, plenty against brute force for this use case

const sign = (verificationId) =>
  crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(String(verificationId))
    .digest('base64url')
    .slice(0, SIG_LENGTH);

export const generateCertToken = (verificationId) => `${verificationId}.${sign(verificationId)}`;

export const verifyCertToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  const sep = token.lastIndexOf('.');
  if (sep <= 0) return null;

  const verificationId = token.slice(0, sep);
  const signature = token.slice(sep + 1);
  const expected = sign(verificationId);

  if (signature.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch {
    return null;
  }

  return { verificationId };
};
