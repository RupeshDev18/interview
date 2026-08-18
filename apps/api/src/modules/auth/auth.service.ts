import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@prisma/client';
import { env } from '../../config/env';
import { authRepository } from './auth.repository';
import {
  AuthenticationError,
  ConflictError,
  AuthorizationError,
  NotFoundError,
} from '../../utils/errors';
import { REFRESH_TOKEN_EXPIRY_MS } from '@intvwplt/shared';
import type { RegisterInput, LoginInput, ChangePasswordInput } from './auth.validator';
import { auditService } from '../audit/audit.service';
import { AuditAction } from '@intvwplt/shared';

// ─── Token helpers ────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  companyId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

function generateAccessToken(user: User): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    ...(user.companyId && { companyId: user.companyId }),
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'intvwplt',
    audience: 'intvwplt-client',
  });
}

function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'intvwplt',
    audience: 'intvwplt-client',
  }) as AccessTokenPayload;
}

function generateRefreshToken(): string {
  // Cryptographically secure random token
  return crypto.randomBytes(64).toString('hex');
}

async function hashToken(token: string): Promise<string> {
  // SHA-256 for refresh tokens — argon2 is overkill and too slow for refresh ops
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function sanitizeUser(user: User) {
  // Never return passwordHash or other sensitive fields
  const { passwordHash: _pw, ...safe } = user;
  return safe;
}

// ─── Auth service ─────────────────────────────────────────────────────────────

export const authService = {
  async register(
    input: RegisterInput,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role as 'COMPANY_ADMIN' | 'RECRUITER' | 'INTERVIEWER',
      companyId: input.companyId,
    });

    await auditService.log({
      actorId: user.id,
      companyId: user.companyId ?? undefined,
      action: AuditAction.USER_CREATED,
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return sanitizeUser(user);
  },

  async login(
    input: LoginInput,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ user: ReturnType<typeof sanitizeUser>; tokens: AuthTokens }> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      // Prevent email enumeration — always run hash comparison
      await argon2.hash('dummy_prevent_timing_attack');
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive || user.deletedAt) {
      throw new AuthorizationError('Account is inactive. Please contact support.');
    }

    const passwordValid = await argon2.verify(user.passwordHash, input.password);
    if (!passwordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const tokens = await authService.issueTokens(user, meta);

    await authRepository.updateLastLogin(user.id);

    await auditService.log({
      actorId: user.id,
      companyId: user.companyId ?? undefined,
      action: AuditAction.USER_LOGIN,
      entityType: 'User',
      entityId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { user: sanitizeUser(user), tokens };
  },

  async issueTokens(
    user: User,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = await hashToken(rawRefreshToken);
    const familyId = uuidv4();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresAt,
    };
  },

  async refresh(
    rawRefreshToken: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const tokenHash = await hashToken(rawRefreshToken);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Token reuse detection — potential theft
    if (storedToken.revokedAt !== null) {
      // Revoke the entire family (all sessions that derived from this chain)
      await authRepository.revokeFamilyTokens(storedToken.familyId);
      throw new AuthenticationError(
        'Refresh token reuse detected. All sessions have been invalidated for security.',
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token expired. Please log in again.');
    }

    const user = await authRepository.findUserById(storedToken.userId);
    if (!user || !user.isActive || user.deletedAt) {
      await authRepository.revokeRefreshToken(storedToken.id);
      throw new AuthenticationError('Account not found or inactive');
    }

    // Issue new tokens
    const newAccessToken = generateAccessToken(user);
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = await hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    // Create new token FIRST, then revoke old one (atomically linked)
    const newToken = await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: storedToken.familyId, // same family — preserves the rotation chain
      expiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await authRepository.revokeRefreshToken(storedToken.id, newToken.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      expiresAt,
    };
  },

  async logout(rawRefreshToken: string, actorId: string, meta: { ipAddress?: string; userAgent?: string }): Promise<void> {
    const tokenHash = await hashToken(rawRefreshToken);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (storedToken && storedToken.userId === actorId) {
      await authRepository.revokeRefreshToken(storedToken.id);
    }

    await auditService.log({
      actorId,
      action: AuditAction.USER_LOGOUT,
      entityType: 'User',
      entityId: actorId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  },

  async logoutAll(userId: string, meta: { ipAddress?: string; userAgent?: string }): Promise<void> {
    await authRepository.revokeAllUserTokens(userId);
    await auditService.log({
      actorId: userId,
      action: AuditAction.USER_LOGOUT,
      entityType: 'User',
      entityId: userId,
      metadata: { allSessions: true },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  },

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new NotFoundError('User');

    const valid = await argon2.verify(user.passwordHash, input.currentPassword);
    if (!valid) throw new AuthenticationError('Current password is incorrect');

    const newHash = await argon2.hash(input.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await authRepository.updatePassword(userId, newHash);
    // Revoke all existing sessions so re-login is required on other devices
    await authRepository.revokeAllUserTokens(userId);

    await auditService.log({
      actorId: userId,
      action: AuditAction.PASSWORD_CHANGED,
      entityType: 'User',
      entityId: userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  },

  verifyAccessToken,
};
