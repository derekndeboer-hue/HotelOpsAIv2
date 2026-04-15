import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { config } from '../config/env';

export interface ResolvedTenant {
  id: string;
  subdomain: string;
  name: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    resolvedTenant?: ResolvedTenant;
  }
}

interface TenantRow {
  id: string;
  subdomain: string;
  name: string;
}

const tenantCache = new Map<string, { value: ResolvedTenant; expires: number }>();
const TENANT_TTL_MS = 60_000;

function getCached(subdomain: string): ResolvedTenant | null {
  const hit = tenantCache.get(subdomain);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    tenantCache.delete(subdomain);
    return null;
  }
  return hit.value;
}

function setCached(subdomain: string, value: ResolvedTenant): void {
  tenantCache.set(subdomain, { value, expires: Date.now() + TENANT_TTL_MS });
}

/**
 * Extract the tenant subdomain from a Host header.
 * Returns null for localhost / IP / apex domain so callers can fall back.
 * Handles explicit ports (localhost:3000) and multi-level subdomains:
 *   gardens.hotelopsai.com      -> 'gardens'
 *   gardens.staging.hotelopsai.com -> 'gardens'
 *   hotelopsai.com              -> null
 *   localhost                   -> null
 *   127.0.0.1                   -> null
 */
export function extractSubdomain(host: string | undefined): string | null {
  if (!host) return null;
  const bare = host.split(':')[0].toLowerCase().trim();
  if (!bare) return null;
  if (bare === 'localhost' || bare === '127.0.0.1' || bare === '::1') return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(bare)) return null;

  const parts = bare.split('.');
  if (parts.length < 3) return null;

  const first = parts[0];
  if (first === 'www' || first === 'api') return null;
  return first;
}

async function fetchTenantBySubdomain(subdomain: string): Promise<ResolvedTenant | null> {
  const cached = getCached(subdomain);
  if (cached) return cached;

  // Tenant lookup runs without tenant context (RLS on tenants table does not
  // apply to itself; it's the anchor). Explicit system-level query.
  const result = await query<TenantRow>(
    `SELECT id, subdomain, name FROM tenants WHERE subdomain = $1 LIMIT 1`,
    [subdomain],
  );
  if (result.rows.length === 0) return null;
  const tenant: ResolvedTenant = {
    id: result.rows[0].id,
    subdomain: result.rows[0].subdomain,
    name: result.rows[0].name,
  };
  setCached(subdomain, tenant);
  return tenant;
}

/**
 * Resolve the active tenant from the request Host header before auth runs.
 *
 * v1 (single tenant): localhost and the apex domain fall through to the
 * DEFAULT_TENANT_SUBDOMAIN configured in env, so dev and the single boutique
 * deployment keep working without subdomain routing.
 *
 * SaaS cutover: set REQUIRE_TENANT_SUBDOMAIN=true. Requests without a
 * resolvable subdomain get 400. The auth layer already scopes login and
 * session lookups by tenantId on req.resolvedTenant, so no further code
 * changes are needed.
 */
export async function resolveTenant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const hostHeader =
      (req.headers['x-forwarded-host'] as string | undefined) ||
      (req.headers.host as string | undefined);

    const subdomain = extractSubdomain(hostHeader);
    const fallback = config.DEFAULT_TENANT_SUBDOMAIN;
    const require = config.REQUIRE_TENANT_SUBDOMAIN;

    let resolved: ResolvedTenant | null = null;

    if (subdomain) {
      resolved = await fetchTenantBySubdomain(subdomain);
    } else if (!require && fallback) {
      resolved = await fetchTenantBySubdomain(fallback);
    }

    if (!resolved) {
      if (require || subdomain) {
        res.status(404).json({ error: 'Tenant not found for host' });
        return;
      }
      next();
      return;
    }

    req.resolvedTenant = resolved;
    next();
  } catch (err) {
    next(err);
  }
}
