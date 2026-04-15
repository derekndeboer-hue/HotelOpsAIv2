import { query } from '../config/database';

/**
 * Create an audit log entry for tracking changes.
 */
export async function createAuditEntry(
  tenantId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  oldValue: Record<string, any> | null,
  newValue: Record<string, any> | null,
  ipAddress: string | null = null,
  isSystem: boolean = false
): Promise<void> {
  await query(
    `INSERT INTO audit_log (
      tenant_id, user_id, action, resource_type, resource_id,
      old_value, new_value, ip_address, is_system, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
    [
      tenantId,
      userId,
      action,
      resourceType,
      resourceId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      ipAddress,
      isSystem,
    ]
  );
}
