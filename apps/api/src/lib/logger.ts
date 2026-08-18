import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
  defaultMeta: { service: 'intvwplt-api' },
  transports: [
    new winston.transports.Console({
      format:
        env.NODE_ENV === 'production'
          ? combine(timestamp(), json())
          : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), simple()),
    }),
  ],
});

// In production you'd add file/CloudWatch transports here
if (env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  );
}

export { logger };
