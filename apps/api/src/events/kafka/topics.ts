export const KAFKA_TOPICS = {
  INTERVIEW_SCHEDULED: 'interview.scheduled',
  INTERVIEW_CANCELLED: 'interview.cancelled',
  INTERVIEW_COMPLETED: 'interview.completed',
  FEEDBACK_SUBMITTED: 'interview.feedback_submitted',
  CANDIDATE_LINK_CREATED: 'candidate.link_created',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];
