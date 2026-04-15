import { query, withTransaction } from '../../config/database';
import { updateRoomInFirestore } from '../../config/firestore';
import { publishEvent, TOPICS } from '../../config/pubsub';
import { createAuditEntry } from '../../middleware/audit';
import { AppError } from '../../middleware/error';

interface RoomFilters {
  status?: string;
  floor?: number;
  type?: string;
  zone?: string;
}

/**
 * List rooms with optional filters.
 */
export async function listRooms(tenantId: string, hotelId: string, filters: RoomFilters = {}) {
  let sql = `
    SELECT r.id, r.room_number, r.floor, r.room_type, r.status,
           r.zone, r.is_accessible, r.max_occupancy, r.bed_type,
           r.notes, r.out_of_order_reason, r.updated_at
    FROM rooms r
    WHERE r.tenant_id = $1 AND r.hotel_id = $2
  `;
  const params: any[] = [tenantId, hotelId];
  let paramIdx = 3;

  if (filters.status) {
    sql += ` AND r.status = $${paramIdx}`;
    params.push(filters.status);
    paramIdx++;
  }
  if (filters.floor) {
    sql += ` AND r.floor = $${paramIdx}`;
    params.push(filters.floor);
    paramIdx++;
  }
  if (filters.type) {
    sql += ` AND r.room_type = $${paramIdx}`;
    params.push(filters.type);
    paramIdx++;
  }
  if (filters.zone) {
    sql += ` AND r.zone = $${paramIdx}`;
    params.push(filters.zone);
    paramIdx++;
  }

  sql += ' ORDER BY r.room_number ASC';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Get a single room by ID with full details.
 */
export async function getRoomById(tenantId: string, roomId: string) {
  const result = await query(
    `SELECT r.*,
            g.first_name AS guest_first_name, g.last_name AS guest_last_name,
            g.vip_status AS guest_vip_status,
            res.check_in_date, res.check_out_date, res.confirmation_number
     FROM rooms r
     LEFT JOIN reservations res ON res.room_id = r.id
       AND res.status = 'checked_in'
     LEFT JOIN guests g ON g.id = res.guest_id
     WHERE r.id = $1 AND r.tenant_id = $2`,
    [roomId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Room not found', 404);
  }

  return result.rows[0];
}

/**
 * Update room status with full event pipeline:
 * 1. Update DB
 * 2. Publish to Pub/Sub
 * 3. Update Firestore for real-time
 * 4. Create audit log
 */
export async function updateRoomStatus(
  tenantId: string,
  roomId: string,
  newStatus: string,
  userId: string,
  notes?: string
) {
  return withTransaction(tenantId, async (client) => {
    // Get current state for audit
    const current = await client.query(
      `SELECT id, room_number, hotel_id, status, zone FROM rooms WHERE id = $1 AND tenant_id = $2`,
      [roomId, tenantId]
    );

    if (current.rows.length === 0) {
      throw new AppError('Room not found', 404);
    }

    const room = current.rows[0];
    const oldStatus = room.status;

    // Update room status
    await client.query(
      `UPDATE rooms SET status = $1, notes = COALESCE($2, notes), updated_at = NOW(), updated_by = $3
       WHERE id = $4 AND tenant_id = $5`,
      [newStatus, notes, userId, roomId, tenantId]
    );

    // Publish event to Pub/Sub
    try {
      await publishEvent(TOPICS.ROOM_STATUS_CHANGED, {
        tenantId,
        hotelId: room.hotel_id,
        roomId,
        roomNumber: room.room_number,
        oldStatus,
        newStatus,
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to publish room status event:', err);
    }

    // Update Firestore for real-time board
    try {
      await updateRoomInFirestore(tenantId, room.hotel_id, room.room_number, {
        status: newStatus,
        previousStatus: oldStatus,
        updatedBy: userId,
      });
    } catch (err) {
      console.error('Failed to update Firestore:', err);
    }

    // Create audit entry
    await createAuditEntry(
      tenantId,
      userId,
      'room_status_change',
      'room',
      roomId,
      { status: oldStatus },
      { status: newStatus, notes },
      null
    );

    return {
      id: roomId,
      roomNumber: room.room_number,
      oldStatus,
      newStatus,
    };
  });
}

/**
 * Get the optimized room board view: all rooms with current assignment and guest info.
 */
export async function getRoomBoard(tenantId: string, hotelId: string) {
  const result = await query(
    `SELECT
       r.id, r.room_number, r.floor, r.room_type, r.status,
       r.zone, r.is_accessible, r.bed_type,
       r.out_of_order_reason,
       -- Current guest
       g.id AS guest_id, g.first_name AS guest_first_name,
       g.last_name AS guest_last_name, g.vip_status,
       -- Reservation
       res.id AS reservation_id, res.check_in_date, res.check_out_date,
       res.confirmation_number,
       -- HK assignment
       hka.id AS hk_assignment_id, hka.status AS hk_status,
       hka.assigned_to AS hk_assigned_to,
       hk_staff.first_name AS hk_staff_first_name,
       hk_staff.last_name AS hk_staff_last_name,
       -- Active work orders count
       (SELECT COUNT(*) FROM work_orders wo
        WHERE wo.room_id = r.id AND wo.status NOT IN ('completed', 'cancelled')
       ) AS active_work_order_count
     FROM rooms r
     LEFT JOIN reservations res ON res.room_id = r.id
       AND res.status = 'checked_in'
     LEFT JOIN guests g ON g.id = res.guest_id
     LEFT JOIN housekeeping_assignments hka ON hka.room_id = r.id
       AND hka.date = CURRENT_DATE AND hka.status != 'cancelled'
     LEFT JOIN staff hk_staff ON hk_staff.id = hka.assigned_to
     WHERE r.tenant_id = $1 AND r.hotel_id = $2
     ORDER BY r.floor ASC, r.room_number ASC`,
    [tenantId, hotelId]
  );

  return result.rows;
}

/**
 * Get the pipeline status for a specific room (current state in the turn process).
 */
export async function getRoomPipelineStatus(tenantId: string, roomId: string) {
  const result = await query(
    `SELECT
       r.id, r.room_number, r.status AS room_status,
       -- Latest HK assignment
       hka.id AS hk_assignment_id, hka.status AS hk_status,
       hka.started_at AS hk_started_at, hka.completed_at AS hk_completed_at,
       hka.inspection_result,
       -- Active work orders
       COALESCE(
         json_agg(
           json_build_object(
             'id', wo.id,
             'title', wo.title,
             'status', wo.status,
             'priority', wo.priority,
             'category', wo.category
           )
         ) FILTER (WHERE wo.id IS NOT NULL),
         '[]'
       ) AS active_work_orders,
       -- Upcoming reservation
       next_res.id AS next_reservation_id,
       next_res.guest_id AS next_guest_id,
       next_res.check_in_date AS next_check_in,
       next_g.first_name AS next_guest_first_name,
       next_g.last_name AS next_guest_last_name,
       next_g.vip_status AS next_guest_vip
     FROM rooms r
     LEFT JOIN housekeeping_assignments hka ON hka.room_id = r.id
       AND hka.date = CURRENT_DATE AND hka.status != 'cancelled'
     LEFT JOIN work_orders wo ON wo.room_id = r.id
       AND wo.status NOT IN ('completed', 'cancelled')
     LEFT JOIN reservations next_res ON next_res.room_id = r.id
       AND next_res.check_in_date = CURRENT_DATE AND next_res.status = 'confirmed'
     LEFT JOIN guests next_g ON next_g.id = next_res.guest_id
     WHERE r.id = $1 AND r.tenant_id = $2
     GROUP BY r.id, hka.id, next_res.id, next_g.id`,
    [roomId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Room not found', 404);
  }

  return result.rows[0];
}
