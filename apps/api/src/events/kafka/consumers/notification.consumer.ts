import { getKafkaClient } from '../../../lib/kafka';
import { KAFKA_TOPICS } from '../topics';
import { notificationsService } from '../../../modules/notifications/notifications.service';
import { logger } from '../../../lib/logger';
import { env } from '../../../config/env';

export async function initNotificationConsumer(): Promise<void> {
  try {
    const kafka = getKafkaClient();
    const consumer = kafka.consumer({ groupId: env.KAFKA_GROUP_ID });
    await consumer.connect();

    await consumer.subscribe({
      topics: [
        KAFKA_TOPICS.INTERVIEW_SCHEDULED,
        KAFKA_TOPICS.CANDIDATE_LINK_CREATED,
      ],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        try {
          const payload = JSON.parse(message.value.toString());
          logger.info(`Notification consumer received event from ${topic}`, { payload });

          if (topic === KAFKA_TOPICS.CANDIDATE_LINK_CREATED && payload.candidateEmail) {
            await notificationsService.sendCandidateInvite({
              candidateEmail: payload.candidateEmail,
              candidateName: payload.candidateName,
              companyName: payload.companyName,
              interviewTypeName: payload.interviewTypeName,
              scheduledStart: payload.scheduledStart,
              timezone: payload.timezone || 'UTC',
              joinUrl: payload.joinUrl,
            });
          }
        } catch (parseErr) {
          logger.error('Failed to process Kafka notification message', { error: parseErr });
        }
      },
    });

    logger.info('Notification Kafka consumer initialized');
  } catch (err: any) {
    logger.warn('Notification Kafka consumer skipped (broker offline/not reachable)', {
      error: err?.message,
    });
  }
}
