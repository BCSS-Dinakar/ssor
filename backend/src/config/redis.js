import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redis;
let downLogged = false; // avoid flooding logs while Redis stays down

function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
      // Fail commands fast instead of hanging when Redis is unavailable.
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      // Reconnect with capped exponential backoff (200ms → max 10s) instead of
      // hammering every ~2s.
      retryStrategy: (times) => Math.min(times * 200, 10000),
    });

    redis.on('connect', () => {
      if (downLogged) logger.info('✅ Redis reconnected');
      else logger.info('✅ Redis connected');
      downLogged = false;
    });

    redis.on('error', (err) => {
      // Non-fatal: OTP/cache features fail gracefully; the server keeps running.
      // Log only the first error of each outage so the log isn't flooded.
      if (!downLogged) {
        logger.warn('Redis unavailable — OTP/cache features will degrade until it recovers', err.message);
        downLogged = true;
      }
    });
  }
  return redis;
}

export default getRedis;
