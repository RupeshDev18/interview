export const ACCESS_TOKEN_EXPIRY = '10m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const MAX_RESUME_SIZE_MB = 10;
export const MAX_RESUME_SIZE_BYTES = MAX_RESUME_SIZE_MB * 1024 * 1024;
export const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const INTERVIEW_ROOM_PREFIX = 'room:';
export const AVAILABILITY_CACHE_TTL_SECONDS = 300; // 5 minutes
export const BOOKING_LOCK_TTL_SECONDS = 10;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100;

export const KAFKA_TOPICS = {
  INTERVIEW_CREATED: 'interview.created',
  INTERVIEW_RESCHEDULED: 'interview.rescheduled',
  INTERVIEW_CANCELLED: 'interview.cancelled',
  INTERVIEW_COMPLETED: 'interview.completed',
  CANDIDATE_STATUS_CHANGED: 'candidate.status_changed',
  RESUME_UPLOADED: 'resume.uploaded',
  NOTIFICATION_REQUESTED: 'notification.requested',
  AUDIT_EVENT: 'audit.event',
} as const;
