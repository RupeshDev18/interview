/**
 * Phase 1 smoke test — verifies the Express app initializes without errors.
 * Database connection is NOT tested here (requires live PostgreSQL).
 */

// Mock Prisma before any imports so no real DB connection is attempted
jest.mock('../../src/lib/prisma', () => ({
  prisma: { $on: jest.fn(), $connect: jest.fn(), $disconnect: jest.fn() },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Mock Redis so no real connection is attempted
jest.mock('../../src/lib/redis', () => ({
  getRedisClient: jest.fn().mockReturnValue({
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  }),
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    acquireLock: jest.fn().mockResolvedValue(true),
    releaseLock: jest.fn().mockResolvedValue(undefined),
  },
  disconnectRedis: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { createApp } from '../../src/app';

describe('Health check', () => {
  const app = createApp();

  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.environment).toBeDefined();
  });

  it('GET /api/v1/unknown returns 404 with structured error', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
