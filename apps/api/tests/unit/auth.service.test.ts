/**
 * Unit tests for auth service.
 * Prisma and Audit are mocked — no DB connection required.
 */

jest.mock('../../src/lib/prisma', () => ({
  prisma: { $on: jest.fn() },
}));

jest.mock('../../src/lib/redis', () => ({
  getRedisClient: jest.fn().mockReturnValue({ on: jest.fn() }),
  redis: {},
  disconnectRedis: jest.fn(),
}));

jest.mock('../../src/modules/auth/auth.repository');
jest.mock('../../src/modules/audit/audit.service', () => ({
  auditService: { log: jest.fn().mockResolvedValue(undefined) },
}));

import { authService } from '../../src/modules/auth/auth.service';
import { authRepository } from '../../src/modules/auth/auth.repository';
import argon2 from 'argon2';

const mockUser = {
  id: 'user-id-1',
  email: 'test@example.com',
  passwordHash: '',
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  role: 'RECRUITER' as const,
  isActive: true,
  companyId: 'company-id-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  deletedAt: null,
};

const mockRefreshToken = {
  id: 'token-id-1',
  userId: 'user-id-1',
  tokenHash: 'hashed-token',
  familyId: 'family-id-1',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  revokedAt: null,
  replacedById: null,
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  createdAt: new Date(),
};

describe('AuthService', () => {
  const meta = { ipAddress: '127.0.0.1', userAgent: 'test' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('creates a new user when email is not taken', async () => {
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (authRepository.createUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.register(
        {
          email: 'new@example.com',
          password: 'Password1',
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'RECRUITER',
        },
        meta,
      );

      expect(authRepository.createUser).toHaveBeenCalledTimes(1);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(mockUser.email);
    });

    it('throws ConflictError when email is already taken', async () => {
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.register(
          {
            email: 'existing@example.com',
            password: 'Password1',
            firstName: 'Jane',
            lastName: 'Doe',
            role: 'RECRUITER',
          },
          meta,
        ),
      ).rejects.toThrow('An account with this email already exists');
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const hash = await argon2.hash('Password1');
      const userWithHash = { ...mockUser, passwordHash: hash };
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(userWithHash);
      (authRepository.createRefreshToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (authRepository.updateLastLogin as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.login(
        { email: 'test@example.com', password: 'Password1' },
        meta,
      );

      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('throws AuthenticationError for wrong password', async () => {
      const hash = await argon2.hash('CorrectPassword1');
      const userWithHash = { ...mockUser, passwordHash: hash };
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(userWithHash);

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'WrongPassword1' },
          meta,
        ),
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws AuthenticationError for non-existent user (no email enumeration)', async () => {
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login(
          { email: 'ghost@example.com', password: 'Password1' },
          meta,
        ),
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws AuthorizationError for inactive user', async () => {
      const hash = await argon2.hash('Password1');
      const inactiveUser = { ...mockUser, passwordHash: hash, isActive: false };
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(inactiveUser);

      await expect(
        authService.login({ email: 'test@example.com', password: 'Password1' }, meta),
      ).rejects.toThrow('Account is inactive');
    });
  });

  describe('refresh', () => {
    it('issues new tokens for a valid non-revoked refresh token', async () => {
      (authRepository.findRefreshTokenByHash as jest.Mock).mockResolvedValue(mockRefreshToken);
      (authRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.createRefreshToken as jest.Mock).mockResolvedValue({
        ...mockRefreshToken,
        id: 'token-id-2',
      });
      (authRepository.revokeRefreshToken as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.refresh('raw-refresh-token', meta);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith(
        mockRefreshToken.id,
        'token-id-2',
      );
    });

    it('revokes family and throws on reused (revoked) token — theft detection', async () => {
      const revokedToken = { ...mockRefreshToken, revokedAt: new Date(Date.now() - 1000) };
      (authRepository.findRefreshTokenByHash as jest.Mock).mockResolvedValue(revokedToken);
      (authRepository.revokeFamilyTokens as jest.Mock).mockResolvedValue(undefined);

      await expect(authService.refresh('raw-refresh-token', meta)).rejects.toThrow(
        'Refresh token reuse detected',
      );

      expect(authRepository.revokeFamilyTokens).toHaveBeenCalledWith(revokedToken.familyId);
    });

    it('throws on expired refresh token', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      };
      (authRepository.findRefreshTokenByHash as jest.Mock).mockResolvedValue(expiredToken);

      await expect(authService.refresh('raw-refresh-token', meta)).rejects.toThrow(
        'Refresh token expired',
      );
    });
  });
});
