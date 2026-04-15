import { query } from '../../config/database';
import { AppError } from '../../middleware/error';
import { createAuditEntry } from '../../middleware/audit';
import { generateId } from '../../utils/helpers';

/**
 * List equipment with optional filters.
 */
export async function listEquipment(
  tenantId: string,
  hotelId: string,
  filters: { category?: string; status?: string; location?: string } = {}
) {
  let sql = `
    SELECT e.id, e.name, e.category, e.manufacturer, e.model,
           e.serial_number, e.location, e.status, e.install_date,
           e.warranty_expiration, e.notes, e.room_id, e.created_at,
           r.room_number
    FROM equipment e
    LEFT JOIN rooms r ON r.id = e.room_id
    WHERE e.tenant_id = $1 AND e.hotel_id = $2
  `;
  const params: any[] = [tenantId, hotelId];
  let paramIdx = 3;

  if (filters.category) {
    sql += ` AND e.category = $${paramIdx}`;
    params.push(filters.category);
    paramIdx++;
  }
  if (filters.status) {
    sql += ` AND e.status = $${paramIdx}`;
    params.push(filters.status);
    paramIdx++;
  }
  if (filters.location) {
    sql += ` AND e.location ILIKE $${paramIdx}`;
    params.push(`%${filters.location}%`);
    paramIdx++;
  }

  sql += ' ORDER BY e.name ASC';
  const result = await query(sql, params);
  return result.rows;
}

/**
 * Get equipment profile with maintenance history.
 */
export async function getEquipmentProfile(tenantId: string, equipmentId: string) {
  const equipResult = await query(
    `SELECT * FROM equipment WHERE id = $1 AND tenant_id = $2`,
    [equipmentId, tenantId]
  );

  if (equipResult.rows.length === 0) {
    throw new AppError('Equipment not found', 404);
  }

  // Work order history for this equipment
  const woHistory = await query(
    `SELECT id, title, category, priority, status, created_at, completed_at
     FROM work_orders
     WHERE equipment_id = $1 AND tenant_id = $2
     ORDER BY created_at DESC
     LIMIT 20`,
    [equipmentId, tenantId]
  );

  // PM schedule
  const pmSchedule = await query(
    `SELECT id, name, frequency, last_completed, next_due_date, status
     FROM preventive_maintenance
     WHERE equipment_id = $1 AND tenant_id = $2
     ORDER BY next_due_date ASC`,
    [equipmentId, tenantId]
  );

  // Photos
  const photos = await query(
    `SELECT id, url, caption, photo_type, review_status, created_at
     FROM equipment_photos
     WHERE equipment_id = $1 AND tenant_id = $2
     ORDER BY created_at DESC`,
    [equipmentId, tenantId]
  );

  return {
    ...equipResult.rows[0],
    workOrderHistory: woHistory.rows,
    preventiveMaintenance: pmSchedule.rows,
    photos: photos.rows,
  };
}

/**
 * Create equipment.
 */
export async function createEquipment(
  tenantId: string,
  hotelId: string,
  userId: string,
  data: {
    name: string;
    category: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    location?: string;
    roomId?: string;
    installDate?: string;
    warrantyExpiration?: string;
    notes?: string;
  }
) {
  const id = generateId();
  await query(
    `INSERT INTO equipment (
      id, tenant_id, hotel_id, name, category, manufacturer, model,
      serial_number, location, room_id, status, install_date,
      warranty_expiration, notes, created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $11, $12, $13, $14, NOW(), NOW())`,
    [
      id, tenantId, hotelId, data.name, data.category,
      data.manufacturer || null, data.model || null, data.serialNumber || null,
      data.location || null, data.roomId || null, data.installDate || null,
      data.warrantyExpiration || null, data.notes || null, userId,
    ]
  );

  return { id, ...data, status: 'active' };
}

/**
 * Update equipment.
 */
export async function updateEquipment(
  tenantId: string,
  equipmentId: string,
  userId: string,
  updates: Record<string, any>
) {
  const allowedFields: Record<string, string> = {
    name: 'name',
    category: 'category',
    manufacturer: 'manufacturer',
    model: 'model',
    serialNumber: 'serial_number',
    location: 'location',
    roomId: 'room_id',
    status: 'status',
    notes: 'notes',
    warrantyExpiration: 'warranty_expiration',
  };

  const setClauses: string[] = ['updated_at = NOW()'];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(updates)) {
    const dbField = allowedFields[key];
    if (dbField) {
      setClauses.push(`${dbField} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  params.push(equipmentId, tenantId);
  await query(
    `UPDATE equipment SET ${setClauses.join(', ')}
     WHERE id = $${paramIdx} AND tenant_id = $${paramIdx + 1}`,
    params
  );

  await createAuditEntry(tenantId, userId, 'equipment_update', 'equipment', equipmentId, null, updates);

  return { id: equipmentId, ...updates };
}

/**
 * Decommission equipment.
 */
export async function decommissionEquipment(
  tenantId: string,
  equipmentId: string,
  userId: string,
  reason: string
) {
  await query(
    `UPDATE equipment SET status = 'decommissioned', decommission_reason = $1,
     decommissioned_at = NOW(), decommissioned_by = $2, updated_at = NOW()
     WHERE id = $3 AND tenant_id = $4`,
    [reason, userId, equipmentId, tenantId]
  );

  await createAuditEntry(tenantId, userId, 'equipment_decommission', 'equipment', equipmentId, null, { reason });

  return { id: equipmentId, status: 'decommissioned', reason };
}

/**
 * Add a photo to equipment.
 */
export async function addPhoto(
  tenantId: string,
  equipmentId: string,
  userId: string,
  data: { url: string; caption?: string; photoType?: string }
) {
  const id = generateId();
  await query(
    `INSERT INTO equipment_photos (
      id, tenant_id, equipment_id, url, caption, photo_type,
      uploaded_by, review_status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())`,
    [id, tenantId, equipmentId, data.url, data.caption || null, data.photoType || 'general', userId]
  );

  return { id, ...data, reviewStatus: 'pending' };
}

/**
 * Review an equipment photo.
 */
export async function reviewPhoto(
  tenantId: string,
  photoId: string,
  userId: string,
  status: 'approved' | 'rejected',
  notes?: string
) {
  await query(
    `UPDATE equipment_photos SET review_status = $1, reviewed_by = $2, review_notes = $3, reviewed_at = NOW()
     WHERE id = $4 AND tenant_id = $5`,
    [status, userId, notes || null, photoId, tenantId]
  );

  return { photoId, status, notes };
}
