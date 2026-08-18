/**
 * Integration tests for auth HTTP endpoints.
 * authService is mocked — no real DB connection.
 */

jest.mock('../../src/lib/prisma', () => ({
  prisma: { $on: jest.fn() },
}));
jest.mock('../../src/lib/redis', () => ({
  getRedisClient: jest.fn().mockReturnValue({ on: jest.fn() }),
  redis: {},
  disconnectRedis: jest.fn(),
}));
jest.mock('../../src/modules/auth/auth.service');
jest.mock('../../src/modules/auth/auth.repository');
jest.mock('../../src/modules/audit/audit.service', () => ({
  auditService: { log: jest.fn().mockResolvedValue(undefined) },
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { authService } from '../../src/modules/auth/auth.service';

const app = createApp();

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'RECRUITER' as const,
  companyId: 'company-1',
  isActive: true,
  phone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  deletedAt: null,
};

const mockTokens = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

describe('POST /api/v1/auth/register', () => {
  it('returns 201 with user data on success', async () => {
    (authService.register as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'new@example.com',
      password: 'Password1',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(mockUser.email);
  });

  it('returns 400 for invalid payload (missing required fields)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 when email already exists', async () => {
    const { ConflictError } = await import('../../src/utils/errors');
    (authService.register as jest.Mock).mockRejectedValue(
      new ConflictError('An account with this email already exists', 'EMAIL_ALREADY_EXISTS'),
    );

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'existing@example.com',
      password: 'Password1',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with accessToken and sets refresh cookie', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      user: mockUser,
      tokens: mockTokens,
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBe(mockTokens.accessToken);
    expect(res.body.data.user.email).toBe(mockUser.email);

    // Refresh token must be in httpOnly cookie, NOT in body
    expect(res.body.data).not.toHaveProperty('refreshToken');
    expect(res.headers['set-cookie']).toBeDefined();
    const cookieHeader = res.headers['set-cookie'];
    const cookie = Array.isArray(cookieHeader)
      ? cookieHeader.join('')
      : (cookieHeader as unknown as string) ?? '';
    expect(cookie).toContain('refresh_token=');
    expect(cookie).toContain('HttpOnly');
  });

  it('returns 401 for invalid credentials', async () => {
    const { AuthenticationError } = await import('../../src/utils/errors');
    (authService.login as jest.Mock).mockRejectedValue(
      new AuthenticationError('Invalid email or password'),
    );

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'WrongPass1',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns 400 for missing password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns 200 with new accessToken when cookie is valid', async () => {
    (authService.refresh as jest.Mock).mockResolvedValue({
      accessToken: 'new.access.token',
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refresh_token=valid-refresh-token');

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBe('new.access.token');
  });

  it('returns 401 when no cookie is provided', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });
});
