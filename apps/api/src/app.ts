import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';

import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';

// Route imports
import { authRoutes } from './modules/auth/auth.routes';
import { companiesRoutes } from './modules/companies/companies.routes';
import { usersRoutes } from './modules/users/users.routes';
import { candidatesRoutes } from './modules/candidates/candidates.routes';
import { resumesRoutes } from './modules/resumes/resumes.routes';

export function createApp(): express.Application {
  const app = express();

  // ─── Security middleware ─────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn('CORS blocked request', { origin });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // ─── Body parsing ────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // ─── Logging ─────────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ─── Rate limiting ───────────────────────────────────────────────────────
  app.use(env.API_PREFIX, apiRateLimiter);

  // ─── Trust proxy (needed behind load balancer / Docker) ──────────────────
  app.set('trust proxy', 1);

  // ─── Health check ────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      environment: env.NODE_ENV,
    });
  });

  // ─── API Routes ──────────────────────────────────────────────────────────
  app.use(`${env.API_PREFIX}/auth`, authRoutes);
  app.use(`${env.API_PREFIX}/companies`, companiesRoutes);
  app.use(`${env.API_PREFIX}/users`, usersRoutes);
  app.use(`${env.API_PREFIX}/candidates`, candidatesRoutes);
  app.use(`${env.API_PREFIX}/resumes`, resumesRoutes);

  // ─── 404 handler ─────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ─── Global error handler ────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
