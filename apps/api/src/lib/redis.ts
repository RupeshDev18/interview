import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 2,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis: max retries reached, skipping redis operations');
            return null;
          }
          return Math.min(times * 200, 1000);
        },
        reconnectOnError: () => false,
      });

      redisClient.on('connect', () => logger.info('Redis connected'));
      redisClient.on('error', (err) => logger.warn('Redis connection not available (running in memory/no-cache mode)', { error: err.message }));
      redisClient.on('close', () => logger.warn('Redis connection closed'));
    } catch (err: any) {
      logger.warn('Failed to initialize Redis client', { error: err.message });
      return null;
    }
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // ignore
    }
    redisClient = null;
  }
}

// Safe typed helpers
export const redis = {
  get: async (key: string): Promise<string | null> => {
    const client = getRedisClient();
    return client ? client.get(key) : null;
  },

  set: async (key: string, value: string, ttlSeconds?: number): Promise<void> => {
    const client = getRedisClient();
    if (!client) return;
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  },

  del: async (...keys: string[]): Promise<void> => {
    const client = getRedisClient();
    if (!client || keys.length === 0) return;
    await client.del(...keys);
  },

  exists: async (key: string): Promise<boolean> => {
    const client = getRedisClient();
    if (!client) return false;
    const result = await client.exists(key);
    return result === 1;
  },

  incr: async (key: string): Promise<number> => {
    const client = getRedisClient();
    return client ? client.incr(key) : 1;
  },

  expire: async (key: string, ttlSeconds: number): Promise<void> => {
    const client = getRedisClient();
    if (!client) return;
    await client.expire(key, ttlSeconds);
  },

  acquireLock: async (key: string, ttlSeconds: number): Promise<boolean> => {
    const client = getRedisClient();
    if (!client) return true; // optimistic pass-through if no redis
    const result = await client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  },

  releaseLock: async (key: string): Promise<void> => {
    const client = getRedisClient();
    if (!client) return;
    await client.del(key);
  },
};
