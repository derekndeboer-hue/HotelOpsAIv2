import { query, withTransaction, getCurrentTenantId } from '../../config/database';
import { updateRoomInFirestore } from '../../config/firestore';
import { publishEvent, TOPICS } from '../../config/pubsub';
import { createAuditEntry } from '../../middleware/audit';
import { AppError } from '../../middleware/error';
import { generateId } from '../../utils/helpers';
import type { CheckInInput, CheckOutInput, RoomAssignmentInput, WalkInInput } from '@hotel-ops/shared/validators/front-desk';
import { generateConfirmationNumber } from '../reservations/reservations.service';

// ── Operational KPI ──────────────────────────────────────────────────────────

export async function getOperationalKpi(hotelId: string) {
  const [occupancyRes, openWORes, avgResponseRes, hkRemainingRes, inspectionRes, staffOnDutyRes] =
    await Promise.all([
      // occupancy: % of rooms currently occupied
      query<{ occupied: string; total: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'occupied') AS occupied,
           COUNT(*) AS total
         FROM rooms
         WHERE hotel_id = $1`,
        [hotelId],
      ),
      // openWorkOrders: WOs not completed or cancelled
      query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM work_orders
         WHERE hotel_id = $1
           AND status NOT IN ('completed', 'cancelled')`,
        [hotelId],
      ),
      // avgResponseMinutes: avg time from created_at → started_at for WOs created in last 24h
      query<{ avg_minutes: string | null }>(
        `SELECT ROUND(
           AVG(EXTRACT(EPOCH FROM (started_at - created_at)) / 60)
             FILTER (WHERE started_at IS NOT NULL)
         ) AS avg_minutes
         FROM work_orders
         WHERE hotel_id = $1
           AND created_at >= NOW() - INTERVAL '24 hours'`,
        [hotelId],
      ),
      // hkRoomsRemaining: assignments today not yet completed
      query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM housekeeping_assignments
         WHERE hotel_id = $1
           AND date = CURRENT_DATE
           AND status IN ('assigned', 'in_progress')`,
        [hotelId],
      ),
      // inspectionPassRate: % of today's completed assignments that passed
      query<{ passed: string; total: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE inspection_result = 'pass') AS passed,
           COUNT(*) AS total
         FROM housekeeping_assignments
         WHERE hotel_id = $1
           AND date = CURRENT_DATE
           AND status = 'completed'`,
        [hotelId],
      ),
      // staffOnDuty: distinct staff with active WO or HK assignments today
      query<{ count: string }>(
        `SELECT COUNT(DISTINCT staff_id) AS count FROM (
           SELECT assigned_to AS staff_id
           FROM work_orders
           WHERE hotel_id = $1
             AND assigned_to IS NOT NULL
             AND status IN ('acknowledged', 'in_progress')
           UNION
           SELECT assigned_to AS staff_id
           FROM housekeeping_assignments
           WHERE hotel_id = $1
             AND date = CURRENT_DATE
             AND status IN ('assigned', 'in_progress')
         ) s`,
        [hotelId],
      ),
    ]);

  const occupied = parseInt(occupancyRes.rows[0]?.occupied ?? '0', 10);
  const totalRooms = parseInt(occupancyRes.rows[0]?.total ?? '0', 10);
  const inspPassed = parseInt(inspectionRes.rows[0]?.passed ?? '0', 10);
  const inspTotal = parseInt(inspectionRes.rows[0]?.total ?? '0', 10);

  return {
    occupancy: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
    openWorkOrders: parseInt(openWORes.rows[0]?.count ?? '0', 10),
    avgResponseMinutes: avgResponseRes.rows[0]?.avg_minutes != null
      ? parseFloat(avgResponseRes.rows[0].avg_minutes)
      : 0,
    hkRoomsRemaining: parseInt(hkRemainingRes.rows[0]?.count ?? '0', 10),
    inspectionPassRate: inspTotal > 0 ? Math.round((inspPassed / inspTotal) * 100) : null,
    staffOnDuty: parseInt(staffOnDutyRes.rows[0]?.count ?? '0', 10),
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboard(hotelId: string) {
  const [arrivals, departures, inHouse, roomsSummary, openRequests] = await Promise.all([
    query<any>(
      `SELECT r.id, r.confirmation_number, r.check_in_date, r.check_out_date,
              r.status, r.special_requests,
              g.first_name, g.last_name, g.vip_status, g.email,
              rm.room_number, rm.room_type
       FROM reservations r
       JOIN guests g ON g.id = r.guest_id
       LEFT JOIN rooms rm ON rm.id = r.room_id
       WHERE r.hotel_id = $1
         AND r.check_in_date = CURRENT_DATE
         AND r.status IN ('confirmed', 'pending')
       ORDER BY g.vip_status DESC NULLS LAST, g.last_name ASC`,
      [hotelId],
    ),
    query<any>(
      `SELECT r.id, r.confirmation_number, r.check_out_date, r.status,
              g.first_name, g.last_name, g.vip_status,
              rm.room_number, rm.room_type
       FROM reservations r
       JOIN guests g ON g.id = r.guest_id
       LEFT JOIN rooms rm ON rm.id = r.room_id
       WHERE r.hotel_id = $1
         AND r.check_out_date = CURRENT_DATE
         AND r.status = 'checked_in'
       ORDER BY g.last_name ASC`,
      [hotelId],
    ),
    query<any>(
      `SELECT COUNT(*) AS count FROM reservations
       WHERE hotel_id = $1 AND status = 'checked_in'`,
      [hotelId],
    ),
    query<any>(
      `SELECT status, COUNT(*) AS count
       FROM rooms
       WHERE hotel_id = $1
       GROUP BY status`,
      [hotelId],
    ),
    query<any>(
      `SELECT id, request_type, description, priority, status, created_at,
              g.first_name, g.last_name, rm.room_number
       FROM guest_requests gr
       JOIN guests g ON g.id = gr.guest_id
       LEFT JOIN rooms rm ON rm.id = gr.room_id
       WHERE gr.hotel_id = $1
         AND gr.status IN ('open', 'routed', 'in_progress')
       ORDER BY
         CASE gr.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
         gr.created_at ASC
       LIMIT 20`,
      [hotelId],
    ),
  ]);

  const totalRoomsResult = await query<any>(
    `SELECT COUNT(*) AS total FROM rooms WHERE hotel_id = $1`,
    [hotelId],
  );
  const totalRooms = parseInt(totalRoomsResult.rows[0]?.total ?? '0', 10);
  const occupiedCount = roomsSummary.rows.find((r: any) => r.status === 'occupied')?.count ?? 0;
  const occupancyPct = totalRooms > 0
    ? Math.round((parseInt(occupiedCount, 10) / totalRooms) * 100)
    : 0;

  const roomSummaryMap: Record<string, number> = {};
  for (const row of roomsSummary.rows) {
    roomSummaryMap[row.status] = parseInt(row.count, 10);
  }

  return {
    arrivals: arrivals.rows,
    arrivalsCount: arrivals.rows.length,
    departures: departures.rows,
    departuresCount: departures.rows.length,
    inHouse: parseInt(inHouse.rows[0]?.count ?? '0', 10),
    occupancyPct,
    totalRooms,
    roomsSummary: roomSummaryMap,
    openGuestRequests: openRequests.rows,
  };
}

// ── Check-in ──────────────────────────────────────────────────────────────────

export async function processCheckIn(userId: string, data: CheckInInput) {
  return withTransaction(async (client) => {
    // Verify reservation exists and is in a check-in-able state
    const resResult = await client.query(
      `SELECT r.id, r.guest_id, r.hotel_id, r.status, r.check_in_date
       FROM reservations r
       WHERE r.id = $1`,
      [data.reservationId],
    );
    if (resResult.rows.length === 0) throw new AppError('Reservation not found', 404);
    const res = resResult.rows[0];
    if (!['confirmed', 'pending'].includes(res.status)) {
      throw new AppError(`Reservation is ${res.status} — cannot check in`, 400);
    }

    // Verify room is ready
    const roomResult = await client.query(
      `SELECT id, room_number, status, hotel_id FROM rooms WHERE id = $1`,
      [data.assignedRoomId],
    );
    if (roomResult.rows.length === 0) throw new AppError('Room not found', 404);
    const room = roomResult.rows[0];

    if (!['clean_inspected', 'ready', 'vacant_inspected', 'ready_for_checkin', 'vacant_clean'].includes(room.status)) {
      throw new AppError(
        `Room ${room.room_number} is not ready for check-in (status: ${room.status})`,
        400,
      );
    }

    // Update reservation
    await client.query(
      `UPDATE reservations
       SET status = 'checked_in', actual_check_in = NOW(), room_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [data.assignedRoomId, data.reservationId],
    );

    // Update room
    await client.query(
      `UPDATE rooms SET status = 'occupied', updated_at = NOW(), updated_by = $1
       WHERE id = $2`,
      [userId, data.assignedRoomId],
    );

    // Increment guest total_stays
    await client.query(
      `UPDATE guests
       SET total_stays = total_stays + 1, last_stay_date = CURRENT_DATE, updated_at = NOW()
       WHERE id = $1`,
      [res.guest_id],
    );

    await createAuditEntry(getCurrentTenantId() ?? '', userId, 'check_in', 'reservation', data.reservationId, null, {
      roomNumber: room.room_number,
      guestId: res.guest_id,
      keyCardsIssued: data.keyCardsIssued,
      paymentMethod: data.paymentMethod,
      arrivalNotes: data.arrivalNotes,
    });

    try {
      await publishEvent(TOPICS.NOTIFICATION, {
        reservationId: data.reservationId,
        roomId: data.assignedRoomId,
        roomNumber: room.room_number,
        guestId: res.guest_id,
        hotelId: res.hotel_id,
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('check-in event publish failed:', err);
    }

    try {
      await updateRoomInFirestore(getCurrentTenantId() ?? '', res.hotel_id, room.room_number, {
        status: 'occupied',
        guestId: res.guest_id,
        checkedInAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Firestore check-in update failed:', err);
    }

    return {
      reservationId: data.reservationId,
      roomNumber: room.room_number,
      status: 'checked_in',
      keyCardsIssued: data.keyCardsIssued,
    };
  });
}

// ── Check-out ─────────────────────────────────────────────────────────────────

export async function processCheckOut(userId: string, data: CheckOutInput) {
  return withTransaction(async (client) => {
    const resResult = await client.query(
      `SELECT r.id, r.guest_id, r.hotel_id, r.room_id, r.status
       FROM reservations r
       WHERE r.id = $1`,
      [data.reservationId],
    );
    if (resResult.rows.length === 0) throw new AppError('Reservation not found', 404);
    const res = resResult.rows[0];
    if (res.status !== 'checked_in') {
      throw new AppError(`Reservation is ${res.status} — cannot check out`, 400);
    }

    const roomResult = await client.query(
      `SELECT id, room_number FROM rooms WHERE id = $1`,
      [res.room_id],
    );
    if (roomResult.rows.length === 0) throw new AppError('Room not found', 404);
    const room = roomResult.rows[0];

    // Update reservation
    await client.query(
      `UPDATE reservations
       SET status = 'checked_out', actual_check_out = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [data.reservationId],
    );

    // Room → vacant_dirty; housekeeping pipeline picks it up via existing trigger/schedule
    await client.query(
      `UPDATE rooms SET status = 'vacant_dirty', updated_at = NOW()
       WHERE id = $1`,
      [res.room_id],
    );

    await createAuditEntry(getCurrentTenantId() ?? '', userId, 'check_out', 'reservation', data.reservationId, null, {
      roomNumber: room.room_number,
      guestId: res.guest_id,
      folioSettled: data.folioSettled,
      departureNotes: data.departureNotes,
    });

    // TODO: Pub/Sub wiring for GUEST_CHECK_OUT event (emit to housekeeping turn pipeline)
    try {
      await publishEvent(TOPICS.NOTIFICATION, {
        reservationId: data.reservationId,
        roomId: res.room_id,
        roomNumber: room.room_number,
        guestId: res.guest_id,
        hotelId: res.hotel_id,
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('check-out event publish failed:', err);
    }

    try {
      await updateRoomInFirestore(getCurrentTenantId() ?? '', res.hotel_id, room.room_number, {
        status: 'vacant_dirty',
        guestId: null,
      });
    } catch (err) {
      console.error('Firestore check-out update failed:', err);
    }

    return {
      reservationId: data.reservationId,
      roomNumber: room.room_number,
      status: 'checked_out',
    };
  });
}

// ── Room assignment ───────────────────────────────────────────────────────────

export async function assignRoom(userId: string, data: RoomAssignmentInput) {
  return withTransaction(async (client) => {
    const roomResult = await client.query(
      `SELECT id, room_number, status FROM rooms WHERE id = $1`,
      [data.roomId],
    );
    if (roomResult.rows.length === 0) throw new AppError('Room not found', 404);
    const room = roomResult.rows[0];

    if (!['clean_inspected', 'ready', 'vacant_inspected', 'ready_for_checkin', 'vacant_clean'].includes(room.status)) {
      if (!data.overrideReason) {
        throw new AppError(
          `Room ${room.room_number} is not ready (status: ${room.status}). Provide override_reason to force.`,
          400,
        );
      }
    }

    await client.query(
      `UPDATE reservations SET room_id = $1, updated_at = NOW() WHERE id = $2`,
      [data.roomId, data.reservationId],
    );

    await createAuditEntry(getCurrentTenantId() ?? '', userId, 'room_assignment', 'reservation', data.reservationId, null, {
      roomNumber: room.room_number,
      overrideReason: data.overrideReason,
    });

    return { reservationId: data.reservationId, roomId: data.roomId, roomNumber: room.room_number };
  });
}

// ── Walk-in ───────────────────────────────────────────────────────────────────

export async function processWalkIn(userId: string, hotelId: string, data: WalkInInput) {
  return withTransaction(async (client) => {
    // Verify room
    const roomResult = await client.query(
      `SELECT id, room_number, status FROM rooms WHERE id = $1`,
      [data.assignedRoomId],
    );
    if (roomResult.rows.length === 0) throw new AppError('Room not found', 404);
    const room = roomResult.rows[0];
    if (!['clean_inspected', 'ready', 'vacant_inspected', 'ready_for_checkin', 'vacant_clean'].includes(room.status)) {
      throw new AppError(`Room ${room.room_number} is not ready (status: ${room.status})`, 400);
    }

    // Get tenant from context (set by ALS via setTenantContext middleware)
    const tenantResult = await client.query(
      `SELECT tenant_id FROM hotels WHERE id = $1 LIMIT 1`,
      [hotelId],
    );
    const tenantId = tenantResult.rows[0]?.tenant_id;

    // Create guest
    const guestId = generateId();
    await client.query(
      `INSERT INTO guests (id, tenant_id, hotel_id, first_name, last_name, email, phone,
        vip_status, total_stays, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'none', 0, NOW(), NOW())`,
      [guestId, tenantId, hotelId, data.guestFirstName, data.guestLastName,
        data.guestEmail ?? null, data.guestPhone ?? null],
    );

    // Create reservation
    const reservationId = generateId();
    const today = new Date().toISOString().slice(0, 10);
    const confirmationNumber = generateConfirmationNumber();
    await client.query(
      `INSERT INTO reservations (id, tenant_id, hotel_id, guest_id, room_id, confirmation_number,
        check_in_date, check_out_date, status, adults, children,
        special_requests, source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', $9, $10, $11, 'walk_in', NOW(), NOW())`,
      [reservationId, tenantId, hotelId, guestId, data.assignedRoomId, confirmationNumber,
        today, data.departureDate, data.adults, data.children, data.specialRequests ?? null],
    );

    // Immediately check in
    await client.query(
      `UPDATE reservations
       SET status = 'checked_in', actual_check_in = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [reservationId],
    );
    await client.query(
      `UPDATE rooms SET status = 'occupied', updated_at = NOW(), updated_by = $1
       WHERE id = $2`,
      [userId, data.assignedRoomId],
    );
    await client.query(
      `UPDATE guests SET total_stays = 1, last_stay_date = CURRENT_DATE, updated_at = NOW()
       WHERE id = $1`,
      [guestId],
    );

    await createAuditEntry(getCurrentTenantId() ?? '', userId, 'walk_in_check_in', 'reservation', reservationId, null, {
      guestId,
      roomNumber: room.room_number,
      confirmationNumber,
    });

    return {
      guestId,
      reservationId,
      confirmationNumber,
      roomNumber: room.room_number,
      status: 'checked_in',
    };
  });
}

// ── Handoff (legacy, permission-guarded) ─────────────────────────────────────

export async function getHandoffReport(hotelId: string) {
  const result = await query<any>(
    `SELECT h.id, h.shift, h.created_by, h.notes, h.status,
            h.acknowledged_by, h.acknowledged_at, h.created_at,
            s.first_name AS author_first_name, s.last_name AS author_last_name
     FROM shift_handoffs h
     JOIN staff s ON s.id = h.created_by
     WHERE h.hotel_id = $1
     ORDER BY h.created_at DESC
     LIMIT 5`,
    [hotelId],
  );
  return result.rows;
}

export async function addHandoffNote(handoffId: string, userId: string, note: string) {
  const id = generateId();
  await query(
    `INSERT INTO shift_handoff_notes (id, handoff_id, note, created_by, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [id, handoffId, note, userId],
  );
  return { id, note };
}

export async function acknowledgeHandoff(handoffId: string, userId: string) {
  await query(
    `UPDATE shift_handoffs
     SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = NOW()
     WHERE id = $2`,
    [userId, handoffId],
  );
  return { handoffId, acknowledgedBy: userId };
}

export async function generateShiftHandoff(
  userId: string,
  hotelId: string,
  shift: string,
  notes: string,
) {
  const id = generateId();

  const [openWO, openComplaints, openReqs] = await Promise.all([
    query<any>(
      `SELECT COUNT(*) FROM work_orders
       WHERE hotel_id = $1 AND status NOT IN ('completed', 'cancelled')`,
      [hotelId],
    ),
    query<any>(
      `SELECT COUNT(*) FROM complaints
       WHERE hotel_id = $1 AND status NOT IN ('resolved', 'closed')`,
      [hotelId],
    ),
    query<any>(
      `SELECT COUNT(*) FROM guest_requests
       WHERE hotel_id = $1 AND status NOT IN ('resolved', 'cancelled')`,
      [hotelId],
    ),
  ]);

  const dashboard = await getDashboard(hotelId);

  await query(
    `INSERT INTO shift_handoffs (id, hotel_id, shift, created_by, notes, status, snapshot, created_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())`,
    [
      id, hotelId, shift, userId, notes,
      JSON.stringify({
        arrivalsRemaining: dashboard.arrivals.filter((a: any) => a.status !== 'checked_in').length,
        departuresRemaining: dashboard.departuresCount,
        occupancyPct: dashboard.occupancyPct,
        openWorkOrders: parseInt(openWO.rows[0].count, 10),
        openComplaints: parseInt(openComplaints.rows[0].count, 10),
        openGuestRequests: parseInt(openReqs.rows[0].count, 10),
      }),
    ],
  );

  try {
    await publishEvent(TOPICS.NOTIFICATION, {
      hotelId,
      handoffId: id,
      shift,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('handoff event publish failed:', err);
  }

  return { id, shift, notes, status: 'pending' };
}
