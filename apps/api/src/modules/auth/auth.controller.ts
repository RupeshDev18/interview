import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated } from '../../utils/response';
import type { RegisterInput, LoginInput, ChangePasswordInput } from './auth.validator';
import { AuthenticationError } from '../../utils/errors';
import { env } from '../../config/env';

const REFRESH_COOKIE_NAME = 'refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

function getMeta(req: Request) {
  return {
    ipAddress: (req.ip ?? req.socket.remoteAddress)?.replace('::ffff:', ''),
    userAgent: req.headers['user-agent'],
  };
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const input = req.body as RegisterInput;
    const user = await authService.register(input, getMeta(req));
    sendCreated(res, { user }, 'Account created successfully');
  },

  async login(req: Request, res: Response): Promise<void> {
    const input = req.body as LoginInput;
    const { user, tokens } = await authService.login(input, getMeta(req));

    // Set refresh token as httpOnly cookie — never expose in JSON body
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);

    sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        user,
      },
      'Logged in successfully',
    );
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const rawRefreshToken: string | undefined = req.cookies[REFRESH_COOKIE_NAME];
    if (!rawRefreshToken) {
      throw new AuthenticationError('No refresh token provided');
    }

    const { accessToken, refreshToken, expiresAt } = await authService.refresh(
      rawRefreshToken,
      getMeta(req),
    );

    // Rotate: set new refresh token cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...refreshCookieOptions,
      maxAge: expiresAt.getTime() - Date.now(),
    });

    sendSuccess(res, { accessToken }, 'Token refreshed');
  },

  async logout(req: Request, res: Response): Promise<void> {
    const rawRefreshToken: string | undefined = req.cookies[REFRESH_COOKIE_NAME];
    const actorId = req.user!.id;

    if (rawRefreshToken) {
      await authService.logout(rawRefreshToken, actorId, getMeta(req));
    }

    res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: 0 });
    sendSuccess(res, null, 'Logged out successfully');
  },

  async logoutAll(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    await authService.logoutAll(userId, getMeta(req));
    res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: 0 });
    sendSuccess(res, null, 'All sessions have been invalidated');
  },

  async me(req: Request, res: Response): Promise<void> {
    sendSuccess(res, { user: req.user });
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    const input = req.body as ChangePasswordInput;
    const userId = req.user!.id;
    await authService.changePassword(userId, input, getMeta(req));
    // Clear all cookies since all sessions are revoked
    res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: 0 });
    sendSuccess(res, null, 'Password changed. Please log in again.');
  },
};
