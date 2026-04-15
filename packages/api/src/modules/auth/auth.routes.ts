import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema } from '../../utils/validators';
import * as authService from './auth.service';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user, set httpOnly cookie with JWT.
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const tenantId = req.resolvedTenant?.id ?? null;
    const result = await authService.login(email, password, tenantId);

    // Set access token as httpOnly cookie
    res.cookie('token', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({ user: result.user });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh the access token using the refresh token cookie.
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const refreshTokenValue = req.cookies?.refreshToken;
    if (!refreshTokenValue) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    const tokens = await authService.refreshToken(refreshTokenValue);

    res.cookie('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Tokens refreshed' });
  })
);

/**
 * POST /api/auth/logout
 * Clear auth cookies.
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ message: 'Logged out' });
});

/**
 * GET /api/auth/me
 * Get the current authenticated user's profile.
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const profile = await authService.getMe(user.id);
    res.json(profile);
  })
);

export default router;
