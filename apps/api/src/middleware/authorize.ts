import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import { AuthorizationError, AuthenticationError } from '../utils/errors';

/**
 * Verifies the authenticated user has one of the required roles.
 * Must be used after the authenticate middleware.
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError();
    }
    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError(
        `Access denied. Required role(s): ${roles.join(', ')}`,
      );
    }
    next();
  };
}

/**
 * Verifies the authenticated user belongs to the company specified
 * in req.params.companyId or req.body.companyId.
 * ADMIN role bypasses this check.
 */
export function authorizeCompany(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new AuthenticationError();
  }

  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  const targetCompanyId =
    (req.params.companyId as string | undefined) ??
    (req.body?.companyId as string | undefined) ??
    (req.query.companyId as string | undefined);

  if (!targetCompanyId) {
    // No company context required — allow through
    next();
    return;
  }

  if (req.user.companyId !== targetCompanyId) {
    throw new AuthorizationError('Access denied to this company\'s resources');
  }

  next();
}

/**
 * Verifies the user is either ADMIN or owns the resource by userId.
 */
export function authorizeOwnerOrAdmin(userIdParam = 'userId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AuthenticationError();

    const targetUserId = req.params[userIdParam];

    if (req.user.role === 'ADMIN' || req.user.id === targetUserId) {
      next();
      return;
    }

    throw new AuthorizationError('Access denied. You can only access your own resources.');
  };
}
