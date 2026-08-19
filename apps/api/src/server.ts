import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { connectDatabase, disconnectDatabase } from './lib/prisma';
import { disconnectRedis } from './lib/redis';
import { initSocketServer } from './lib/socket';
import { initNotificationConsumer } from './events/kafka/consumers/notification.consumer';
import { disconnectKafka } from './lib/kafka';

async function bootstrap(): Promise<void> {
  // Connect to infrastructure
  await connectDatabase();

  const app = createApp();
  const httpServer = createServer(app);

  initSocketServer(httpServer);

  // Initialize event consumers (non-blocking)
  initNotificationConsumer().catch((err) => {
    logger.warn('Kafka consumer initialization skipped:', { error: err });
  });

  const server = httpServer.listen(env.PORT, () => {
    logger.info(`🚀 API server running`, {
      port: env.PORT,
      environment: env.NODE_ENV,
      prefix: env.API_PREFIX,
    });
  });

  // ─── Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Graceful shutdown initiated.`);

    server.close(async () => {
      try {
        await disconnectDatabase();
        await disconnectRedis();
        await disconnectKafka();
        logger.info('Graceful shutdown complete.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown', { error: err });
        process.exit(1);
      }
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 30_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', { reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
