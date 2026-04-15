import { query } from '../../config/database';
import { AppError } from '../../middleware/error';
import { generateId } from '../../utils/helpers';
import { hashPassword } from '../auth/auth.service';

/**
 * List all staff for a hotel.
 */
export async function listStaff(
  tenantId: string,
  hotelId: string,
  filters: { role?: string; department?: string; isActive?: boolean } = {}
) {
  let sql = `
    SELECT id, first_name, last_name, email, phone, role, department,
           hire_date, is_active, last_login, created_at
    FROM staff
    WHERE tenant_id = $1 AND hotel_id = $2
  `;
  const params: any[] = [tenantId, hotelId];
  let paramIdx = 3;

  if (filters.role) {
    sql += ` AND role = $${paramIdx}`;
    params.push(filters.role);
    paramIdx++;
  }
  if (filters.department) {
    sql += ` AND department = $${paramIdx}`;
    params.push(filters.department);
    paramIdx++;
  }
  if (filters.isActive !== undefined) {
    sql += ` AND is_active = $${paramIdx}`;
    params.push(filters.isActive);
    paramIdx++;
  }

  sql += ' ORDER BY last_name, first_name';
  const result = await query(sql, params);
  return result.rows;
}

/**
 * Create a new staff member.
 */
export async function createStaff(
  tenantId: string,
  hotelId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
    department?: string;
    hireDate?: string;
  }
) {
  // Check for duplicate email
  const existing = await query(
    `SELECT id FROM staff WHERE email = $1 AND tenant_id = $2`,
    [data.email.toLowerCase(), tenantId]
  );
  if (existing.rows.length > 0) {
    throw new AppError('A staff member with this email already exists', 409);
  }

  const id = generateId();
  const passwordHash = await hashPassword(data.password);

  await query(
    `INSERT INTO staff (
      id, tenant_id, hotel_id, first_name, last_name, email, password_hash,
      phone, role, department, hire_date, is_active, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())`,
    [
      id, tenantId, hotelId, data.firstName, data.lastName,
      data.email.toLowerCase(), passwordHash, data.phone || null,
      data.role, data.department || null, data.hireDate || null,
    ]
  );

  return {
    id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
  };
}

/**
 * Update a staff member.
 */
export async function updateStaff(
  tenantId: string,
  staffId: string,
  updates: Record<string, any>
) {
  const allowedFields: Record<string, string> = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    role: 'role',
    department: 'department',
    isActive: 'is_active',
  };

  const setClauses: string[] = ['updated_at = NOW()'];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(updates)) {
    const dbField = allowedFields[key];
    if (dbField) {
      setClauses.push(`${dbField} = $${paramIdx}`);
      params.push(key === 'email' ? value.toLowerCase() : value);
      paramIdx++;
    }
  }

  // Handle password update separately
  if (updates.password) {
    const hash = await hashPassword(updates.password);
    setClauses.push(`password_hash = $${paramIdx}`);
    params.push(hash);
    paramIdx++;
  }

  params.push(staffId, tenantId);
  await query(
    `UPDATE staff SET ${setClauses.join(', ')}
     WHERE id = $${paramIdx} AND tenant_id = $${paramIdx + 1}`,
    params
  );

  return { id: staffId, ...updates };
}

/**
 * Soft-delete a staff member.
 */
export async function deleteStaff(tenantId: string, staffId: string) {
  await query(
    `UPDATE staff SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND tenant_id = $2`,
    [staffId, tenantId]
  );

  return { id: staffId, isActive: false };
}

/**
 * Import staff roster from CSV.
 * TODO: Implement CSV parsing
 * Pseudocode:
 *   1. Parse CSV (columns: first_name, last_name, email, phone, role, department)
 *   2. Validate each row
 *   3. For each valid row:
 *      a. Check if staff exists (match on email)
 *      b. If exists: update role/department if changed
 *      c. If new: create with generated temporary password
 *   4. Return { created, updated, errors }
 */
export async function importRoster(
  tenantId: string,
  hotelId: string,
  csvData: string
) {
  // TODO: Implement CSV parsing and import
  return {
    created: 0,
    updated: 0,
    errors: [] as Array<{ row: number; message: string }>,
    message: 'Roster import not yet implemented',
  };
}
