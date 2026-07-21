import Redis from 'ioredis';
import fs from 'fs/promises';
import path from 'path';

let redis;
const FALLBACK_FILE = path.join(process.cwd(), '.fallback-cache.json');

function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
      maxRetriesPerRequest: 1, // Don't retry endlessly so we can fallback fast
    });

    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => {
      // Non-fatal: OTP features will fail gracefully but server keeps running
      console.warn('⚠️  Redis connection error. Falling back to local file store.');
    });
  }
  return redis;
}

// Fallback Helper Functions
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
    console.error('⚠️  Failed to write fallback cache:', e.message);
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
