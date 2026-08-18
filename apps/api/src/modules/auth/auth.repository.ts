import { prisma } from '../../lib/prisma';
import type { User, RefreshToken } from '@prisma/client';

export const authRepository = {
  // ── User lookups ──────────────────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  },

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  },

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'ADMIN' | 'COMPANY_ADMIN' | 'RECRUITER' | 'INTERVIEWER';
    companyId?: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  },

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  },

  // ── Refresh tokens ────────────────────────────────────────────────────────

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  },

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  },

  async revokeRefreshToken(id: string, replacedById?: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        ...(replacedById && { replacedById }),
      },
    });
  },

  /** Revoke ALL tokens in a family (token theft detection) */
  async revokeFamilyTokens(familyId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  /** Revoke ALL tokens for a user (logout-all) */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  /** Clean up expired tokens (called by a background job) */
  async deleteExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  },
};
