import Redis from 'ioredis';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';

let redis;
let downLogged = false; // avoid flooding logs while Redis stays down
const FALLBACK_FILE = path.join(process.cwd(), '.fallback-cache.json');

function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
      // Fail commands fast (so callers fall back to the file cache immediately)
      // instead of hanging or retrying endlessly.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      // Reconnect with capped exponential backoff (200ms -> max 10s) instead of
      // hammering every ~2s.
      retryStrategy: (times) => Math.min(times * 200, 10000),
    });

    redis.on('connect', () => {
      logger.info(downLogged ? 'Redis reconnected' : 'Redis connected');
      downLogged = false;
    });

    redis.on('error', (err) => {
      // Non-fatal: cache/OTP features fall back to the local file store.
      // Log only the first error of each outage so the log isn't flooded.
      if (!downLogged) {
        logger.warn('Redis unavailable — falling back to local file cache', err.message);
        downLogged = true;
      }
    });
  }
  return redis;
}

// --- Local file fallback (used transparently whenever Redis is unavailable) ---
async function readFallback() {
  try {
    const data = await fs.readFile(FALLBACK_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {}; // If file doesn't exist or is invalid, return empty object
  }
}

async function writeFallback(data) {
  try {
    await fs.writeFile(FALLBACK_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    logger.error('Failed to write fallback cache', e.message);
  }
}

export const setCache = async (key, value, ttlInSeconds = null) => {
  const r = getRedis();
  const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
  try {
    if (ttlInSeconds) {
      await r.set(key, val, 'EX', ttlInSeconds);
    } else {
      await r.set(key, val);
    }
  } catch (err) {
    // Redis failed, use file fallback
    const data = await readFallback();
    data[key] = {
      value: val,
      expiresAt: ttlInSeconds ? Date.now() + (ttlInSeconds * 1000) : null
    };
    await writeFallback(data);
  }
};

export const getCache = async (key, parseJson = false) => {
  const r = getRedis();
  let val = null;

  try {
    val = await r.get(key);
  } catch (err) {
    // Redis failed, use file fallback
    const data = await readFallback();
    const entry = data[key];

    if (entry) {
      // Check TTL
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        // Expired
        delete data[key];
        await writeFallback(data);
        val = null;
      } else {
        val = entry.value;
      }
    }
  }

  if (val && parseJson) {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
  return val;
};

export const deleteCache = async (key) => {
  const r = getRedis();
  try {
    return await r.del(key);
  } catch (err) {
    // Redis failed, use file fallback
    const data = await readFallback();
    if (data[key]) {
      delete data[key];
      await writeFallback(data);
    }
    return 1;
  }
};

export const editCache = async (key, value, ttlInSeconds = null) => {
  // In Redis, editing is the same as overwriting with SET
  return await setCache(key, value, ttlInSeconds);
};

export default getRedis;
