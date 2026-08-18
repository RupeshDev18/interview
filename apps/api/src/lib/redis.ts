import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) {
          logger.error('Redis: max retries reached');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      reconnectOnError: (err) => {
        logger.error('Redis connection error', { error: err.message });
        return true;
      },
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}

// Typed helpers
export const redis = {
  get: async (key: string): Promise<string | null> => getRedisClient().get(key),

  set: async (key: string, value: string, ttlSeconds?: number): Promise<void> => {
    const client = getRedisClient();
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  },

  del: async (...keys: string[]): Promise<void> => {
    await getRedisClient().del(...keys);
  },

  exists: async (key: string): Promise<boolean> => {
    const result = await getRedisClient().exists(key);
    return result === 1;
  },

  incr: async (key: string): Promise<number> => getRedisClient().incr(key),

  expire: async (key: string, ttlSeconds: number): Promise<void> => {
    await getRedisClient().expire(key, ttlSeconds);
  },

  // Distributed lock: returns true if lock acquired
  acquireLock: async (key: string, ttlSeconds: number): Promise<boolean> => {
    const result = await getRedisClient().set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  },

  releaseLock: async (key: string): Promise<void> => {
    await getRedisClient().del(key);
  },
};
