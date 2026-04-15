import { Request, Response, NextFunction } from 'express';
import { runWithTenant } from '../config/database';
import { AuthenticatedRequest } from './auth';

/**
 * Bind the authenticated tenant to the request's AsyncLocalStorage scope.
 * Every database call that runs as part of this request — including ones
 * launched from nested awaits — inherits the tenant context and applies
 * the matching RLS policy automatically.
 *
 * Must run after the authenticate middleware.
 */
export function setTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as AuthenticatedRequest).user;

  if (!user?.tenantId) {
    res.status(400).json({ error: 'Tenant context missing' });
    return;
  }

  runWithTenant(user.tenantId, () => {
    next();
  });
}
