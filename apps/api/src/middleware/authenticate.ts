import type { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service';
import { authRepository } from '../modules/auth/auth.repository';
import { AuthenticationError } from '../utils/errors';
import type { UserRole } from '@prisma/client';

// Augment Express Request to carry authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        companyId?: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

/**
 * Validates the Bearer access token and populates req.user.
 * Does NOT query the database — token is self-contained.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Authorization header missing or malformed');
  }

  const token = authHeader.slice(7);
  try {
    const payload = authService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
      companyId: payload.companyId,
      firstName: '',
      lastName: '',
    };
    next();
  } catch {
    throw new AuthenticationError('Invalid or expired access token');
  }
}

/**
 * Like authenticate, but fetches full user from DB to get fresh data.
 * Use on sensitive endpoints (e.g., /me, change password).
 */
export function authenticateFull(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Authorization header missing or malformed');
  }

  const token = authHeader.slice(7);
  try {
    const payload = authService.verifyAccessToken(token);

    // Fetch full user record to ensure account is still active
    authRepository.findUserById(payload.sub).then((user) => {
      if (!user || !user.isActive || user.deletedAt) {
        next(new AuthenticationError('Account not found or inactive'));
        return;
      }
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId ?? undefined,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      next();
    }).catch(next);
  } catch {
    throw new AuthenticationError('Invalid or expired access token');
  }
}
