import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authenticateFull } from '../../middleware/authenticate';
import { authRateLimiter, strictRateLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from './auth.validator';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Public — create a new user account.
 */
router.post(
  '/register',
  strictRateLimiter,
  validate(registerSchema),
  authController.register,
);

/**
 * POST /api/v1/auth/login
 * Public — authenticate and receive access + refresh tokens.
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login,
);

/**
 * POST /api/v1/auth/refresh
 * Public (uses httpOnly cookie) — rotate refresh token, issue new access token.
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/v1/auth/logout
 * Protected — revoke the current refresh token session.
 */
router.post('/logout', authenticate, authController.logout);

/**
 * POST /api/v1/auth/logout-all
 * Protected — revoke ALL refresh token sessions for the user.
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * GET /api/v1/auth/me
 * Protected — return the currently authenticated user (full DB fetch).
 */
router.get('/me', authenticateFull, authController.me);

/**
 * POST /api/v1/auth/change-password
 * Protected — change password; revokes all other sessions.
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

export { router as authRoutes };
