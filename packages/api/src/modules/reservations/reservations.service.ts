import { query, withTransaction, getCurrentTenantId } from '../../config/database';
import { createAuditEntry } from '../../middleware/audit';
import { AppError } from '../../middleware/error';
import { generateId } from '../../utils/helpers';
import type {
  CreateReservationInput,
  UpdateReservationInput,
  ReservationFilterInput,
} from '@hotel-ops/shared/validators/front-desk';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function generateConfirmationNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GH-${yy}${mm}${dd}-${suffix}`;
}

// ── Availability check ────────────────────────────────────────────────────────

export async function checkAvailability(
  hotelId: string,
  arrivalDate: string,
  departureDate: string,
  roomType?: string,
) {
  if (!arrivalDate || !departureDate) {
    throw new AppError('arrivalDate and departureDate are required', 400);
  }
  if (departureDate <= arrivalDate) {
    throw new AppError('departureDate must be after arrivalDate', 400);
  }

  let sql = `
    SELECT rm.id, rm.room_number, rm.room_type, rm.floor, rm.zone, rm.status,
           rm.max_occupancy, rm.bed_type, rm.is_accessible
    FROM rooms rm
    WHERE rm.hotel_id = $1
      AND rm.status IN ('clean_inspected', 'ready', 'vacant_inspected', 'ready_for_checkin', 'vacant_clean')
      AND rm.id NOT IN (
        SELECT r.room_id FROM reservations r
        WHERE r.hotel_id = $1
          AND r.room_id IS NOT NULL
          AND r.status NOT IN ('cancelled', 'no_show', 'checked_out')
          AND r.check_in_date < $3
          AND r.check_out_date > $2
      )
  `;
  const params: any[] = [hotelId, arrivalDate, departureDate];

  if (roomType) {
    sql += ` AND rm.room_type = $4`;
    params.push(roomType);
  }

  sql += ` ORDER BY rm.floor ASC, rm.room_number ASC`;
  const result = await query<any>(sql, params);
  return result.rows;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function searchReservations(
  hotelId: string,
  filters: ReservationFilterInput = {},
) {
  let sql = `
    SELECT r.id, r.guest_id, r.room_id, r.confirmation_number,
           r.check_in_date, r.check_out_date, r.actual_check_in, r.actual_check_out,
           r.status, r.adults, r.children,
           r.special_requests, r.source, r.created_at,
           g.first_name AS guest_first_name, g.last_name AS guest_last_name,
           g.email AS guest_email, g.vip_status,
           rm.room_number, rm.room_type
    FROM reservations r
    JOIN guests g ON g.id = r.guest_id
    LEFT JOIN rooms rm ON rm.id = r.room_id
    WHERE r.hotel_id = $1
  `;
  const params: any[] = [hotelId];
  let idx = 2;

  if (filters.dateFrom) {
    sql += ` AND r.check_in_date >= $${idx++}`;
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    sql += ` AND r.check_in_date <= $${idx++}`;
    params.push(filters.dateTo);
  }
  if (filters.status) {
    sql += ` AND r.status = $${idx++}`;
    params.push(filters.status);
  }
  if (filters.source) {
    sql += ` AND r.source = $${idx++}`;
    params.push(filters.source);
  }
  if (filters.guestName) {
    sql += ` AND (g.first_name ILIKE $${idx} OR g.last_name ILIKE $${idx}
                  OR CONCAT(g.first_name, ' ', g.last_name) ILIKE $${idx})`;
    params.push(`%${filters.guestName}%`);
    idx++;
  }
  if (filters.confirmationNumber) {
    sql += ` AND r.confirmation_number = $${idx++}`;
    params.push(filters.confirmationNumber);
  }

  sql += ` ORDER BY r.check_in_date ASC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(filters.limit ?? 50, filters.offset ?? 0);

  const result = await query<any>(sql, params);
  return result.rows;
}

export async function getReservation(reservationId: string) {
  const result = await query<any>(
    `SELECT r.*,
            g.first_name AS guest_first_name, g.last_name AS guest_last_name,
            g.email AS guest_email, g.phone AS guest_phone, g.vip_status,
            rm.room_number, rm.room_type, rm.floor, rm.zone
     FROM reservations r
     JOIN guests g ON g.id = r.guest_id
     LEFT JOIN rooms rm ON rm.id = r.room_id
     WHERE r.id = $1`,
    [reservationId],
  );
  if (result.rows.length === 0) throw new AppError('Reservation not found', 404);
  return result.rows[0];
}

export async function createReservation(
  hotelId: string,
  userId: string,
  data: CreateReservationInput,
) {
  return withTransaction(async (client) => {
    const hotelResult = await client.query(
      `SELECT tenant_id FROM hotels WHERE id = $1 LIMIT 1`,
      [hotelId],
    );
    const tenantId = hotelResult.rows[0]?.tenant_id;

    // Find or create guest
    let guestId: string;
    if (data.guestEmail) {
      const existing = await client.query(
        `SELECT id FROM guests WHERE hotel_id = $1 AND email = $2 LIMIT 1`,
        [hotelId, data.guestEmail],
      );
      guestId = existing.rows[0]?.id;
    }

    if (!guestId!) {
      guestId = generateId();
      await client.query(
        `INSERT INTO guests (id, tenant_id, hotel_id, first_name, last_name, email, phone,
          vip_status, total_stays, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'none', 0, NOW(), NOW())`,
        [guestId, tenantId, hotelId, data.guestFirstName, data.guestLastName,
          data.guestEmail ?? null, data.guestPhone ?? null],
      );
    }

    const reservationId = generateId();
    const confirmationNumber = data.confirmationNumber ?? generateConfirmationNumber();

    await client.query(
      `INSERT INTO reservations (
        id, tenant_id, hotel_id, guest_id, confirmation_number,
        check_in_date, check_out_date, status, adults, children,
        special_requests, source, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8, $9, $10, $11, NOW(), NOW())`,
      [
        reservationId, tenantId, hotelId, guestId, confirmationNumber,
        data.arrivalDate, data.departureDate,
        data.adults, data.children,
        data.specialRequests ?? null, data.source,
      ],
    );

    await createAuditEntry(tenantId, userId, 'reservation_create', 'reservation', reservationId, null, {
      guestId,
      confirmationNumber,
      arrivalDate: data.arrivalDate,
    });

    return { id: reservationId, guestId, confirmationNumber, status: 'confirmed' };
  });
}

export async function updateReservation(
  reservationId: string,
  userId: string,
  updates: UpdateReservationInput,
) {
  const FIELD_MAP: Record<string, string> = {
    arrivalDate: 'check_in_date',
    departureDate: 'check_out_date',
    adults: 'adults',
    children: 'children',
    ratePlan: 'rate_plan',
    specialRequests: 'special_requests',
    status: 'status',
    roomId: 'room_id',
  };

  const setClauses: string[] = ['updated_at = NOW()'];
  const params: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    const col = FIELD_MAP[key];
    if (col) {
      setClauses.push(`${col} = $${idx++}`);
      params.push(value);
    }
  }

  params.push(reservationId);
  const result = await query<any>(
    `UPDATE reservations SET ${setClauses.join(', ')}
     WHERE id = $${idx}
     RETURNING id, status, check_in_date, check_out_date`,
    params,
  );
  if (result.rows.length === 0) throw new AppError('Reservation not found', 404);

  await createAuditEntry(getCurrentTenantId() ?? '', userId, 'reservation_update', 'reservation', reservationId, null, updates as any);
  return result.rows[0];
}

export async function cancelReservation(reservationId: string, userId: string, reason?: string) {
  const result = await query<any>(
    `UPDATE reservations
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND status NOT IN ('checked_in', 'checked_out')
     RETURNING id`,
    [reservationId],
  );
  if (result.rows.length === 0) {
    throw new AppError('Reservation not found or cannot be cancelled at this stage', 400);
  }
  await createAuditEntry(getCurrentTenantId() ?? '', userId, 'reservation_cancel', 'reservation', reservationId, null, { reason });
  return { id: reservationId, status: 'cancelled' };
}
