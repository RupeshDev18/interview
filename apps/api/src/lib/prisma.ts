import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

  // Log slow queries in development
  if (process.env.NODE_ENV !== 'production') {
    client.$on('query' as never, (e: { query: string; duration: number }) => {
      if (e.duration > 500) {
        logger.warn('Slow query detected', {
          query: e.query,
          duration: `${e.duration}ms`,
        });
      }
    });
  }

  client.$on('error' as never, (e: { message: string }) => {
    logger.error('Prisma error', { error: e.message });
  });

  return client;
}

// Reuse client in development to avoid too many connections
export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
