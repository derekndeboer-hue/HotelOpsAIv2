import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { PERMISSIONS } from '@hotel-ops/shared/constants';
import { StaffRole } from '@hotel-ops/shared/types';

export interface UserPayload {
  id: string;
  tenantId: string;
  hotelId: string;
  role: string;
  name: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

/**
 * Authenticate middleware: extract JWT from httpOnly cookie, verify, attach user to request.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;

    (req as AuthenticatedRequest).user = {
      id: decoded.sub as string,
      tenantId: decoded.tenantId,
      hotelId: decoded.hotelId,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

/**
 * Role-based authorization middleware.
 * Returns 403 if the authenticated user's role is not in the allowed list.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Check whether the given role grants the requested permission. Pulls from the
 * canonical permission matrix in @hotel-ops/shared/constants.
 */
export function roleHasPermission(role: string, permission: string): boolean {
  const grants = PERMISSIONS[role as StaffRole];
  return Array.isArray(grants) && grants.includes(permission);
}

/**
 * Permission-based authorization middleware. Prefer this over requireRole so
 * the permission matrix stays the single source of truth.
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const granted = permissions.every((p) => roleHasPermission(user.role, p));
    if (!granted) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
