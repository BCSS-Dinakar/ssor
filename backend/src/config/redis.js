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

export default getRedis;
