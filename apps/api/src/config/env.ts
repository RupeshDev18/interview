import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from apps/api/.env first, and fall back to root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // default cwd

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  API_PREFIX: z.string().default('/api/v1'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('10m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Kafka
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().default('intvwplt-api'),
  KAFKA_GROUP_ID: z.string().default('intvwplt-consumers'),

  // S3 / MinIO
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().default('intvwplt-resumes'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),

  // SMTP
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().default('1025').transform(Number),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@intvwplt.com'),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Cookies
  COOKIE_SECRET: z.string().default('change-me-in-production-please'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),

  // File upload
  MAX_FILE_SIZE_MB: z.string().default('10').transform(Number),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();

export type Env = typeof env;
