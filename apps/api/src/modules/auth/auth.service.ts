import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
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

    let companyId = input.companyId;
    let role = input.role || 'COMPANY_ADMIN';

    if (input.companyName && !companyId) {
      const newCompany = await prisma.company.create({
        data: {
          name: input.companyName.trim(),
          email: input.email,
        },
      });
      companyId = newCompany.id;
      role = 'COMPANY_ADMIN';
    }

    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: role as 'COMPANY_ADMIN' | 'RECRUITER' | 'INTERVIEWER',
      companyId,
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
      // Constant-time dummy verification to mitigate timing attacks
      await argon2.verify(
        '$argon2id$v=19$m=65536,t=3,p=4$dummyhashdummyhashdummyhash$dummyhashdummyhashdummyhash',
        input.password,
      );
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthorizationError('Your account has been deactivated. Please contact support.');
    }

    const passwordValid = await argon2.verify(user.passwordHash, input.password);
    if (!passwordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const familyId = uuidv4();
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = await hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    await authRepository.updateLastLogin(user.id);

    const accessToken = generateAccessToken(user);

    await auditService.log({
      actorId: user.id,
      companyId: user.companyId ?? undefined,
      action: AuditAction.USER_LOGIN,
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      user: sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresAt,
      },
    };
  },

  async refresh(
    rawRefreshToken: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const tokenHash = await hashToken(rawRefreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored) {
      throw new AuthenticationError('Invalid refresh token');
    }

    if (stored.revokedAt) {
      // Reuse of a revoked token — potential token theft!
      await authRepository.revokeFamilyTokens(stored.familyId);
      await auditService.log({
        actorId: stored.userId,
        action: AuditAction.USER_LOGOUT,
        entityType: 'RefreshToken',
        entityId: stored.id,
        metadata: { familyId: stored.familyId, tokenHash },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new AuthenticationError('Refresh token has been revoked. All sessions invalidated for security.');
    }

    if (stored.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token has expired');
    }

    const user = await authRepository.findUserById(stored.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Rotate: create new token in same family and revoke old one
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = await hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    const newStored = await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: stored.familyId,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    await authRepository.revokeRefreshToken(stored.id, newStored.id);

    const accessToken = generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresAt,
    };
  },

  async logout(
    rawRefreshToken: string,
    actorId: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const tokenHash = await hashToken(rawRefreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);
    if (stored && !stored.revokedAt) {
      await authRepository.revokeRefreshToken(stored.id);
      await auditService.log({
        actorId,
        action: AuditAction.USER_LOGOUT,
        entityType: 'RefreshToken',
        entityId: stored.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }
  },

  async logoutAll(
    userId: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    await authRepository.revokeAllUserTokens(userId);
    await auditService.log({
      actorId: userId,
      action: AuditAction.USER_LOGOUT,
      entityType: 'User',
      entityId: userId,
      metadata: { scope: 'ALL_SESSIONS' },
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
    if (!user) {
      throw new NotFoundError('User');
    }

    const currentValid = await argon2.verify(user.passwordHash, input.currentPassword);
    if (!currentValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const isSamePassword = await argon2.verify(user.passwordHash, input.newPassword);
    if (isSamePassword) {
      throw new ConflictError('New password must be different from current password');
    }

    const newPasswordHash = await argon2.hash(input.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await authRepository.updatePassword(userId, newPasswordHash);

    // Invalidate all existing sessions on password change
    await authRepository.revokeAllUserTokens(userId);

    await auditService.log({
      actorId: userId,
      companyId: user.companyId ?? undefined,
      action: AuditAction.PASSWORD_CHANGED,
      entityType: 'User',
      entityId: userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  },

  verifyAccessToken,
};
