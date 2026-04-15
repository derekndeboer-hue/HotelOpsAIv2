import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../../config/database';
import { config } from '../../config/env';
import { AppError } from '../../middleware/error';

interface StaffRow {
  id: string;
  tenant_id: string;
  hotel_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  tokens: TokenPair;
  user: {
    id: string;
    tenantId: string;
    hotelId: string;
    role: string;
    name: string;
    email: string;
  };
}

/**
 * Authenticate a user by email and password.
 *
 * Login is always scoped to a tenant. The tenant-resolver middleware
 * attaches req.resolvedTenant from the request's host/subdomain, and the
 * auth route forwards that tenantId here. In v1 the middleware falls back
 * to DEFAULT_TENANT_SUBDOMAIN so single-tenant dev and production keep
 * working without subdomain routing. SaaS cutover flips
 * REQUIRE_TENANT_SUBDOMAIN=true and no code changes are needed.
 */
export async function login(
  email: string,
  password: string,
  tenantId: string | null,
): Promise<AuthResult> {
  if (!tenantId) {
    throw new AppError('Tenant could not be resolved from request host', 400);
  }

  const result = await query<StaffRow>(
    `SELECT id, tenant_id, hotel_id, email, password_hash, first_name, last_name, role, is_active
     FROM staff
     WHERE email = $1 AND tenant_id = $2
     LIMIT 1`,
    [email.toLowerCase(), tenantId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const staff = result.rows[0];

  if (!staff.is_active) {
    throw new AppError('Account is deactivated', 401);
  }

  const passwordValid = await bcrypt.compare(password, staff.password_hash);
  if (!passwordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = generateTokens(staff);

  await query(
    `UPDATE staff SET last_login_at = NOW() WHERE id = $1`,
    [staff.id]
  );

  return {
    tokens,
    user: {
      id: staff.id,
      tenantId: staff.tenant_id,
      hotelId: staff.hotel_id,
      role: staff.role,
      name: `${staff.first_name} ${staff.last_name}`,
      email: staff.email,
    },
  };
}

/**
 * Generate JWT access token and refresh token.
 */
export function generateTokens(staff: StaffRow): TokenPair {
  const accessToken = jwt.sign(
    {
      sub: staff.id,
      tenantId: staff.tenant_id,
      hotelId: staff.hotel_id,
      role: staff.role,
      name: `${staff.first_name} ${staff.last_name}`,
      email: staff.email,
    },
    config.JWT_SECRET,
    { expiresIn: '8h' }
  );

  const refreshToken = jwt.sign(
    {
      sub: staff.id,
      tenantId: staff.tenant_id,
      type: 'refresh',
    },
    config.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}

/**
 * Refresh tokens using a valid refresh token.
 */
export async function refreshToken(token: string): Promise<TokenPair> {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as jwt.JwtPayload;

    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    const result = await query<StaffRow>(
      `SELECT id, tenant_id, hotel_id, email, password_hash, first_name, last_name, role, is_active
       FROM staff
       WHERE id = $1 AND is_active = true
       LIMIT 1`,
      [decoded.sub]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found or deactivated', 401);
    }

    return generateTokens(result.rows[0]);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid refresh token', 401);
  }
}

/**
 * Hash a password with bcrypt (12 rounds).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Get the current user's profile by ID.
 */
export async function getMe(userId: string) {
  const result = await query(
    `SELECT id, tenant_id, hotel_id, email, first_name, last_name, role,
            phone, department, hire_date, is_active, last_login_at, created_at
     FROM staff
     WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const s = result.rows[0];
  return {
    id: s.id,
    tenantId: s.tenant_id,
    hotelId: s.hotel_id,
    email: s.email,
    firstName: s.first_name,
    lastName: s.last_name,
    name: `${s.first_name} ${s.last_name}`,
    role: s.role,
    phone: s.phone,
    department: s.department,
    hireDate: s.hire_date,
    isActive: s.is_active,
    lastLogin: s.last_login_at,
    createdAt: s.created_at,
  };
}
