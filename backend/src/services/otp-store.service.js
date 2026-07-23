import getRedis from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * OTP store with automatic fallback — mirrors the MinIO→disk pattern used in
 * storage.service, but the fallback is IN-MEMORY (not a disk file) because OTPs
 * are 60-second ephemeral secrets: persisting them to disk would leak secrets
 * and buy nothing (they expire long before a restart matters).
 *
 * Primary: Redis. Fallback: a per-process Map with TTL, used transparently
 * whenever Redis is unavailable, so OTP send/verify keeps working during an
 * outage. Limitation: the memory fallback is per-instance, so behind multiple
 * app instances a code set on one node isn't visible on another until Redis is
 * back — an acceptable degradation for a transient outage.
 */
const memory = new Map(); // key -> { value, expiresAt (ms) }
let fallbackLogged = false;

const memSet = (key, value, ttlSeconds) => memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
const memGet = (key) => {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memory.delete(key); return null; }
  return entry.value;
};

const noteFallback = (op) => {
  if (!fallbackLogged) {
    logger.warn('Redis unavailable — using in-memory OTP fallback');
    fallbackLogged = true;
  }
  logger.debug(`OTP ${op} served from in-memory fallback`);
};

/** Store an OTP with a TTL (seconds). Returns 'redis' | 'memory'. */
export async function setOtp(key, value, ttlSeconds) {
  try {
    await getRedis().set(key, value, 'EX', ttlSeconds);
    return 'redis';
  } catch (_) {
    memSet(key, value, ttlSeconds);
    noteFallback('set');
    return 'memory';
  }
}

/** Read an OTP, checking Redis then the in-memory fallback. */
export async function getOtp(key) {
  try {
    const value = await getRedis().get(key);
    if (value != null) return value;
    // Redis reachable but empty — a code set during an outage may be in memory.
    return memGet(key);
  } catch (_) {
    noteFallback('get');
    return memGet(key);
  }
}

/** Delete an OTP from both Redis and memory (one-time use). */
export async function delOtp(key) {
  try {
    await getRedis().del(key);
  } catch (_) { /* fall through */ }
  memory.delete(key);
}

// Periodically drop expired memory entries so the fallback map can't grow
// unbounded during a long outage. unref() so it never keeps the process alive.
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memory) if (now > entry.expiresAt) memory.delete(key);
}, 60_000);
sweep.unref?.();
