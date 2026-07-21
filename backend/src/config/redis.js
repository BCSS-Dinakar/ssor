import Redis from 'ioredis';

let redis;

function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
    });

    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => {
      // Non-fatal: OTP features will fail gracefully but server keeps running
      console.warn('⚠️  Redis connection error:', err.message);
    });
  }
  return redis;
}

export const setCache = async (key, value, ttlInSeconds = null) => {
  const r = getRedis();
  const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (ttlInSeconds) {
    return await r.set(key, val, 'EX', ttlInSeconds);
  }
  return await r.set(key, val);
};

export const getCache = async (key, parseJson = false) => {
  const r = getRedis();
  const val = await r.get(key);
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
  return await r.del(key);
};

export const editCache = async (key, value, ttlInSeconds = null) => {
  // In Redis, editing is the same as overwriting with SET
  return await setCache(key, value, ttlInSeconds);
};

export default getRedis;
