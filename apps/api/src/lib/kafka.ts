import { Kafka, type Producer, type Consumer, logLevel } from 'kafkajs';
import { env } from '../config/env';
import { logger } from './logger';

let kafka: Kafka | null = null;
let producer: Producer | null = null;

export function getKafkaClient(): Kafka {
  if (!kafka) {
    const brokers = env.KAFKA_BROKERS.split(',').map((b) => b.trim());
    kafka = new Kafka({
      clientId: env.KAFKA_CLIENT_ID,
      brokers,
      logLevel: logLevel.NOTHING,
      retry: {
        initialRetryTime: 300,
        retries: 3,
      },
    });
  }
  return kafka;
}

export async function getKafkaProducer(): Promise<Producer | null> {
  if (!producer) {
    try {
      const client = getKafkaClient();
      const prod = client.producer();
      await prod.connect();
      producer = prod;
      logger.info('Kafka producer connected');
    } catch (err) {
      logger.warn('Kafka producer connection skipped/failed (offline mode active)', {
        error: (err as any)?.message,
      });
      return null;
    }
  }
  return producer;
}

export async function publishKafkaEvent(topic: string, message: Record<string, any>): Promise<void> {
  try {
    const prod = await getKafkaProducer();
    if (!prod) {
      logger.debug(`[Kafka Offline Fallback] Event dispatched locally to: ${topic}`, { message });
      return;
    }
    await prod.send({
      topic,
      messages: [
        {
          key: message.id || message.interviewId || message.candidateId || undefined,
          value: JSON.stringify({
            ...message,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
    logger.info(`Kafka event published to ${topic}`, { topic });
  } catch (err) {
    logger.warn(`Failed to publish Kafka event to ${topic}`, { error: err });
  }
}

export async function disconnectKafka(): Promise<void> {
  if (producer) {
    try {
      await producer.disconnect();
      producer = null;
      logger.info('Kafka producer disconnected');
    } catch (err) {
      logger.error('Error disconnecting Kafka producer', { error: err });
    }
  }
}
