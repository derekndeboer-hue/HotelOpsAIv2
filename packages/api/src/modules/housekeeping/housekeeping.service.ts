import { query, withTransaction } from '../../config/database';
import { updateRoomInFirestore, publishAlert } from '../../config/firestore';
import { publishEvent, TOPICS } from '../../config/pubsub';
import { createAuditEntry } from '../../middleware/audit';
import { AppError } from '../../middleware/error';
import { generateId } from '../../utils/helpers';
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  AssignmentFilterInput,
  InspectionInput,
  GenerateScheduleInput,
} from '@hotel-ops/shared/validators/housekeeping';

// ---------------------------------------------------------------------------
// List assignments (rooms + common areas, optional filters)
// ---------------------------------------------------------------------------
export async function listAssignments(
  tenantId: string,
  hotelId: string,
  filters: AssignmentFilterInput & { assignedTo?: string } = {},
) {
  const where: string[] = ['hka.tenant_id = $1', 'hka.hotel_id = $2'];
  const params: any[] = [tenantId, hotelId];
  let idx = 3;

  if (filters.date) {
    where.push(`hka.date = $${idx}`);
    params.push(filters.date);
    idx++;
  } else if (filters.dateFrom || filters.dateTo) {
    if (filters.dateFrom) {
      where.push(`hka.date >= $${idx}`);
      params.push(filters.dateFrom);
      idx++;
    }
    if (filters.dateTo) {
      where.push(`hka.date <= $${idx}`);
      params.push(filters.dateTo);
      idx++;
    }
  } else {
    where.push(`hka.date = CURRENT_DATE`);
  }

  if (filters.assignedTo) {
    where.push(`hka.assigned_to = $${idx}`);
    params.push(filters.assignedTo);
    idx++;
  }
  if (filters.status) {
    where.push(`hka.status = $${idx}`);
    params.push(filters.status);
    idx++;
  }
  if (filters.roomId) {
    where.push(`hka.room_id = $${idx}`);
    params.push(filters.roomId);
    idx++;
  }
  if (filters.locationId) {
    where.push(`hka.location_id = $${idx}`);
    params.push(filters.locationId);
    idx++;
  }
  if (filters.targetType === 'room') where.push('hka.room_id IS NOT NULL');
  if (filters.targetType === 'common') where.push('hka.location_id IS NOT NULL');

  const limit = filters.limit ?? 200;
  const offset = filters.offset ?? 0;

  const sql = `
    SELECT hka.id, hka.room_id, hka.location_id, hka.assigned_to,
           hka.status, hka.type, hka.priority, hka.date,
           hka.started_at, hka.completed_at, hka.inspection_result,
           hka.inspector_id, hka.notes, hka.estimated_minutes,
           hka.is_fixed, hka.sort_order, hka.created_at, hka.updated_at,
           r.room_number, r.floor, r.room_type, r.zone AS room_zone,
           r.status AS room_status,
           loc.name AS location_name, loc.location_type,
           loc.zone AS location_zone, loc.category AS location_category,
           s.first_name AS staff_first_name, s.last_name AS staff_last_name
    FROM housekeeping_assignments hka
    LEFT JOIN rooms r ON r.id = hka.room_id
    LEFT JOIN locations loc ON loc.id = hka.location_id
    LEFT JOIN staff s ON s.id = hka.assigned_to
    WHERE ${where.join(' AND ')}
    ORDER BY hka.is_fixed DESC, hka.priority ASC, hka.sort_order ASC,
             r.room_number ASC NULLS LAST, loc.name ASC NULLS LAST
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
}

// ---------------------------------------------------------------------------
// Create assignments (bulk). Each item targets room_id XOR location_id.
// ---------------------------------------------------------------------------
export async function createAssignments(
  tenantId: string,
  hotelId: string,
  userId: string,
  assignments: CreateAssignmentInput[],
) {
  return withTransaction(tenantId, async (client) => {
    const out: Array<{ id: string } & CreateAssignmentInput> = [];

    for (const a of assignments) {
      if ((a.roomId && a.locationId) || (!a.roomId && !a.locationId)) {
        throw new AppError('Assignment must target exactly one of roomId or locationId', 400);
      }

      if (a.locationId) {
        const loc = await client.query(
          `SELECT id FROM locations
           WHERE id = $1 AND tenant_id = $2 AND hotel_id = $3 AND is_active = true
             AND location_type <> 'equipment_area'`,
          [a.locationId, tenantId, hotelId],
        );
        if (loc.rows.length === 0) {
          throw new AppError('Location not found or not housekeepable', 404);
        }
      }

      if (a.roomId) {
        const rm = await client.query(
          `SELECT id FROM rooms WHERE id = $1 AND tenant_id = $2 AND hotel_id = $3`,
          [a.roomId, tenantId, hotelId],
        );
        if (rm.rows.length === 0) throw new AppError('Room not found', 404);
      }

      const id = generateId();
      await client.query(
        `INSERT INTO housekeeping_assignments (
           id, tenant_id, hotel_id, room_id, location_id, assigned_to, status, type,
           priority, date, estimated_minutes, is_fixed, notes, created_by,
           created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,'assigned',$7,$8,$9,$10,$11,$12,$13, NOW(), NOW())`,
        [
          id, tenantId, hotelId, a.roomId ?? null, a.locationId ?? null, a.assignedTo,
          a.cleaningType, a.priority, a.assignmentDate,
          a.estimatedMinutes ?? null, a.isFixed ?? false,
          a.notes ?? null, userId,
        ],
      );
      out.push({ id, ...a });
    }

    try {
      await publishEvent(TOPICS.HOUSEKEEPING_ASSIGNED, {
        tenantId,
        hotelId,
        count: assignments.length,
        date: assignments[0]?.assignmentDate,
        assignedBy: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to publish HK assignment event:', err);
    }

    return out;
  });
}

// ---------------------------------------------------------------------------
// Update a single assignment
// ---------------------------------------------------------------------------
export async function updateAssignment(
  tenantId: string,
  assignmentId: string,
  userId: string,
  updates: UpdateAssignmentInput,
) {
  const setClauses: string[] = ['updated_at = NOW()'];
  const params: any[] = [];
  let idx = 1;

  if (updates.status !== undefined) {
    setClauses.push(`status = $${idx}`);
    params.push(updates.status);
    idx++;
  }
  if (updates.assignedTo !== undefined) {
    setClauses.push(`assigned_to = $${idx}`);
    params.push(updates.assignedTo);
    idx++;
  }
  if (updates.priority !== undefined) {
    setClauses.push(`priority = $${idx}`);
    params.push(updates.priority);
    idx++;
  }
  if (updates.notes !== undefined) {
    setClauses.push(`notes = $${idx}`);
    params.push(updates.notes);
    idx++;
  }
  if (updates.estimatedMinutes !== undefined) {
    setClauses.push(`estimated_minutes = $${idx}`);
    params.push(updates.estimatedMinutes);
    idx++;
  }
  if (updates.startedAt !== undefined) {
    setClauses.push(`started_at = $${idx}`);
    params.push(updates.startedAt);
    idx++;
  }
  if (updates.completedAt !== undefined) {
    setClauses.push(`completed_at = $${idx}`);
    params.push(updates.completedAt);
    idx++;
  }

  params.push(assignmentId, tenantId);
  const result = await query(
    `UPDATE housekeeping_assignments SET ${setClauses.join(', ')}
     WHERE id = $${idx} AND tenant_id = $${idx + 1}
     RETURNING id, room_id, location_id, status`,
    params,
  );

  if (result.rows.length === 0) {
    throw new AppError('Assignment not found', 404);
  }

  await createAuditEntry(
    tenantId, userId, 'hk_assignment_update', 'housekeeping_assignment', assignmentId,
    null, updates,
  );

  return result.rows[0];
}

// ---------------------------------------------------------------------------
// Inspect a room after cleaning. Pass/fail pipeline.
// ---------------------------------------------------------------------------
export async function inspectRoom(
  tenantId: string,
  hotelId: string,
  assignmentId: string,
  inspectorId: string,
  input: InspectionInput,
) {
  return withTransaction(tenantId, async (client) => {
    const assignmentResult = await client.query(
      `SELECT hka.*, r.room_number FROM housekeeping_assignments hka
       LEFT JOIN rooms r ON r.id = hka.room_id
       WHERE hka.id = $1 AND hka.tenant_id = $2`,
      [assignmentId, tenantId],
    );

    if (assignmentResult.rows.length === 0) {
      throw new AppError('Assignment not found', 404);
    }

    const assignment = assignmentResult.rows[0];

    await client.query(
      `UPDATE housekeeping_assignments
         SET inspection_result = $1, inspector_id = $2, notes = COALESCE($3, notes),
             failure_reasons = $4, inspected_at = NOW(), updated_at = NOW(),
             status = $5
       WHERE id = $6 AND tenant_id = $7`,
      [
        input.result,
        inspectorId,
        input.notes ?? null,
        input.failureReasons ? JSON.stringify(input.failureReasons) : null,
        input.result === 'pass' ? 'inspected' : 'failed_inspection',
        assignmentId,
        tenantId,
      ],
    );

    // Only room-targeted assignments drive the room status pipeline.
    if (assignment.room_id) {
      if (input.result === 'pass') {
        const arrivalCheck = await client.query(
          `SELECT id FROM reservations
           WHERE room_id = $1 AND check_in_date = CURRENT_DATE
             AND status IN ('confirmed', 'arriving_today')
           LIMIT 1`,
          [assignment.room_id],
        );
        const newStatus = arrivalCheck.rows.length > 0 ? 'ready_for_checkin' : 'vacant_inspected';

        await client.query(
          `UPDATE rooms SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
          [newStatus, assignment.room_id, tenantId],
        );

        try {
          await updateRoomInFirestore(tenantId, hotelId, assignment.room_number, {
            status: newStatus,
            inspectionResult: 'pass',
            inspectedBy: inspectorId,
          });
        } catch (err) {
          console.error('Firestore update failed:', err);
        }
      } else {
        await client.query(
          `UPDATE rooms SET status = 'vacant_dirty', updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2`,
          [assignment.room_id, tenantId],
        );

        const newId = generateId();
        await client.query(
          `INSERT INTO housekeeping_assignments (
             id, tenant_id, hotel_id, room_id, assigned_to, status, type,
             priority, date, notes, parent_assignment_id, created_by,
             created_at, updated_at
           ) VALUES ($1,$2,$3,$4,$5,'assigned',$6, 1, CURRENT_DATE, $7, $8, $9, NOW(), NOW())`,
          [
            newId, tenantId, hotelId, assignment.room_id, assignment.assigned_to,
            assignment.type, `Re-clean required: ${input.notes ?? 'Failed inspection'}`,
            assignmentId, inspectorId,
          ],
        );

        try {
          await updateRoomInFirestore(tenantId, hotelId, assignment.room_number, {
            status: 'vacant_dirty',
            inspectionResult: 'fail',
            failureReasons: input.failureReasons,
          });
        } catch (err) {
          console.error('Firestore update failed:', err);
        }
      }
    }

    try {
      await publishEvent(TOPICS.INSPECTION_RESULT, {
        tenantId,
        hotelId,
        assignmentId,
        roomNumber: assignment.room_number,
        result: input.result,
        inspectorId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to publish inspection event:', err);
    }

    await createAuditEntry(
      tenantId, inspectorId, 'room_inspection', 'housekeeping_assignment', assignmentId,
      { status: assignment.status },
      { result: input.result, notes: input.notes, failureReasons: input.failureReasons },
    );

    return { assignmentId, result: input.result, roomNumber: assignment.room_number };
  });
}

// ---------------------------------------------------------------------------
// Complete a clean. Room-targeted assignments move the room to inspection_pending.
// ---------------------------------------------------------------------------
export async function completeClean(
  tenantId: string,
  hotelId: string,
  assignmentId: string,
  staffId: string,
  notes?: string,
) {
  return withTransaction(tenantId, async (client) => {
    const assignmentResult = await client.query(
      `SELECT hka.*, r.room_number FROM housekeeping_assignments hka
       LEFT JOIN rooms r ON r.id = hka.room_id
       WHERE hka.id = $1 AND hka.tenant_id = $2`,
      [assignmentId, tenantId],
    );

    if (assignmentResult.rows.length === 0) {
      throw new AppError('Assignment not found', 404);
    }
    const assignment = assignmentResult.rows[0];

    await client.query(
      `UPDATE housekeeping_assignments
         SET status = 'completed', completed_at = NOW(),
             completion_notes = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [notes ?? null, assignmentId, tenantId],
    );

    if (assignment.room_id) {
      await client.query(
        `UPDATE rooms SET status = 'inspection_pending', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [assignment.room_id, tenantId],
      );

      try {
        await updateRoomInFirestore(tenantId, hotelId, assignment.room_number, {
          status: 'inspection_pending',
          cleanCompletedBy: staffId,
          cleanCompletedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Firestore update failed:', err);
      }
    }

    try {
      await publishEvent(TOPICS.HOUSEKEEPING_COMPLETED, {
        tenantId,
        hotelId,
        assignmentId,
        roomNumber: assignment.room_number,
        staffId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to publish HK completion event:', err);
    }

    return {
      assignmentId,
      roomNumber: assignment.room_number,
      status: assignment.room_id ? 'inspection_pending' : 'completed',
    };
  });
}

// ---------------------------------------------------------------------------
// Mark an assignment in-progress (start clock)
// ---------------------------------------------------------------------------
export async function startAssignment(
  tenantId: string,
  hotelId: string,
  assignmentId: string,
  staffId: string,
) {
  return withTransaction(tenantId, async (client) => {
    const current = await client.query(
      `SELECT room_id FROM housekeeping_assignments
       WHERE id = $1 AND tenant_id = $2`,
      [assignmentId, tenantId],
    );
    if (current.rows.length === 0) throw new AppError('Assignment not found', 404);

    await client.query(
      `UPDATE housekeeping_assignments
         SET status = 'in_progress', started_at = COALESCE(started_at, NOW()),
             updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [assignmentId, tenantId],
    );

    const roomId: string | null = current.rows[0].room_id;
    if (roomId) {
      await client.query(
        `UPDATE rooms SET status = 'cleaning_in_progress', updated_at = NOW(), updated_by = $1
         WHERE id = $2 AND tenant_id = $3`,
        [staffId, roomId, tenantId],
      );
      try {
        const rn = await client.query(
          `SELECT room_number FROM rooms WHERE id = $1 AND tenant_id = $2`,
          [roomId, tenantId],
        );
        if (rn.rows.length > 0) {
          await updateRoomInFirestore(tenantId, hotelId, rn.rows[0].room_number, {
            status: 'cleaning_in_progress',
            cleanStartedBy: staffId,
          });
        }
      } catch (err) {
        console.error('Firestore update failed:', err);
      }
    }

    return { assignmentId, status: 'in_progress' };
  });
}

// ---------------------------------------------------------------------------
// Housekeeper board: room grid with current HK-relevant status.
// ---------------------------------------------------------------------------
export async function getBoard(tenantId: string, hotelId: string, zone?: string) {
  const where: string[] = ['r.tenant_id = $1', 'r.hotel_id = $2'];
  const params: any[] = [tenantId, hotelId];
  let idx = 3;
  if (zone) {
    where.push(`r.zone = $${idx}`);
    params.push(zone);
    idx++;
  }

  const rooms = await query(
    `SELECT r.id, r.room_number, r.floor, r.room_type, r.zone, r.status,
            r.updated_at,
            hka.id AS assignment_id, hka.status AS assignment_status,
            hka.assigned_to, hka.type AS cleaning_type,
            s.first_name AS assignee_first_name, s.last_name AS assignee_last_name
     FROM rooms r
     LEFT JOIN LATERAL (
       SELECT id, status, assigned_to, type
       FROM housekeeping_assignments
       WHERE tenant_id = r.tenant_id AND room_id = r.id AND date = CURRENT_DATE
       ORDER BY created_at DESC LIMIT 1
     ) hka ON true
     LEFT JOIN staff s ON s.id = hka.assigned_to
     WHERE ${where.join(' AND ')}
     ORDER BY r.zone, r.room_number`,
    params,
  );
  return rooms.rows;
}

// ---------------------------------------------------------------------------
// Dashboard summary (kept for existing UI).
// ---------------------------------------------------------------------------
export async function getDashboard(tenantId: string, hotelId: string) {
  const stats = await query(
    `SELECT
       COUNT(*) FILTER (WHERE hka.status = 'assigned') AS pending,
       COUNT(*) FILTER (WHERE hka.status = 'in_progress') AS in_progress,
       COUNT(*) FILTER (WHERE hka.status = 'completed') AS completed,
       COUNT(*) FILTER (WHERE hka.status = 'inspected') AS inspected,
       COUNT(*) FILTER (WHERE hka.status = 'failed_inspection') AS failed,
       COUNT(*) FILTER (WHERE hka.status IN ('dnd_pending', 'dnd_escalated')) AS dnd,
       COUNT(*) AS total
     FROM housekeeping_assignments hka
     WHERE hka.tenant_id = $1 AND hka.hotel_id = $2 AND hka.date = CURRENT_DATE`,
    [tenantId, hotelId],
  );

  const staffStats = await query(
    `SELECT s.id, s.first_name, s.last_name,
            COUNT(*) AS total_assignments,
            COUNT(*) FILTER (WHERE hka.status IN ('completed','inspected')) AS completed,
            COUNT(*) FILTER (WHERE hka.status = 'in_progress') AS in_progress
     FROM housekeeping_assignments hka
     JOIN staff s ON s.id = hka.assigned_to
     WHERE hka.tenant_id = $1 AND hka.hotel_id = $2 AND hka.date = CURRENT_DATE
     GROUP BY s.id, s.first_name, s.last_name
     ORDER BY s.first_name`,
    [tenantId, hotelId],
  );

  const roomSummary = await query(
    `SELECT status, COUNT(*) AS count
     FROM rooms WHERE tenant_id = $1 AND hotel_id = $2
     GROUP BY status`,
    [tenantId, hotelId],
  );

  return {
    assignments: stats.rows[0],
    staffBreakdown: staffStats.rows,
    roomStatusSummary: roomSummary.rows,
  };
}

// ---------------------------------------------------------------------------
// Fn39: Generate a day's housekeeping schedule.
// Strategy:
//   1. Room turns — one assignment per room whose status is vacant_dirty
//      or whose reservation departs today.
//   2. Common-area fixed tasks — one assignment per location with a matching
//      cadence (daily, twice_daily one per day here, weekly if date is Monday,
//      as_needed is skipped in auto-generation).
//   3. Load-balance across housekeepers on duty (round-robin by default; by_zone
//      strategy groups rooms by zone, load_balanced re-uses round-robin).
//   4. Equipment areas are skipped entirely — maintenance owns those.
// Dry-run returns the plan without writing.
// ---------------------------------------------------------------------------
export async function generateHousekeepingSchedule(
  tenantId: string,
  hotelId: string,
  userId: string,
  input: GenerateScheduleInput,
) {
  const { date, strategy, includeCommonAreas, dryRun } = input;
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=Sun

  // Active housekeepers on that tenant.
  const staffResult = await query(
    `SELECT id, first_name, last_name, role
     FROM staff
     WHERE tenant_id = $1 AND is_active = true
       AND role IN ('housekeeper', 'room_attendant', 'turndown_attendant')
     ORDER BY first_name`,
    [tenantId],
  );
  const housekeepers: { id: string }[] = staffResult.rows;
  if (housekeepers.length === 0) {
    throw new AppError('No active housekeepers to assign', 400);
  }

  // Rooms that need a turn today: dirty, or checking out today.
  const roomsResult = await query(
    `SELECT DISTINCT r.id, r.room_number, r.zone, r.status, r.room_type,
            CASE WHEN res.id IS NOT NULL THEN 'checkout' ELSE 'stayover' END AS cleaning_type
     FROM rooms r
     LEFT JOIN reservations res
       ON res.room_id = r.id
      AND res.check_out_date = $3::date
      AND res.status IN ('checked_in', 'checked_out')
     WHERE r.tenant_id = $1 AND r.hotel_id = $2
       AND (r.status IN ('vacant_dirty', 'checkout_pending', 'occupied') OR res.id IS NOT NULL)
     ORDER BY r.zone, r.room_number`,
    [tenantId, hotelId, date],
  );
  const rooms: Array<{ id: string; room_number: string; zone: string; cleaning_type: string }> =
    roomsResult.rows;

  // Common-area locations: pick by cadence.
  let locations: Array<{
    id: string; name: string; zone: string;
    housekeeping_frequency: string; default_hk_shift: string | null;
    hk_estimated_minutes: number | null;
  }> = [];

  if (includeCommonAreas) {
    const locResult = await query(
      `SELECT id, name, zone, housekeeping_frequency, default_hk_shift, hk_estimated_minutes
       FROM locations
       WHERE tenant_id = $1 AND hotel_id = $2 AND is_active = true
         AND location_type <> 'equipment_area'
         AND housekeeping_frequency IS NOT NULL
         AND housekeeping_frequency <> 'as_needed'
         AND (
           housekeeping_frequency IN ('daily', 'twice_daily')
           OR (housekeeping_frequency = 'weekly' AND $3::int = 1)
         )
       ORDER BY zone, name`,
      [tenantId, hotelId, dow],
    );
    locations = locResult.rows;
  }

  // Plan assignments. Round-robin across staff; zone strategy sorts rooms so
  // each zone sticks together (already handled by ORDER BY).
  type Plan = {
    roomId?: string;
    locationId?: string;
    assignedTo: string;
    cleaningType: string;
    priority: number;
    assignmentDate: string;
    estimatedMinutes?: number;
    isFixed: boolean;
    notes?: string;
  };
  const plan: Plan[] = [];

  const orderedRooms = strategy === 'by_zone'
    ? rooms
    : [...rooms].sort((a, b) => a.room_number.localeCompare(b.room_number));

  orderedRooms.forEach((r, i) => {
    plan.push({
      roomId: r.id,
      assignedTo: housekeepers[i % housekeepers.length].id,
      cleaningType: r.cleaning_type,
      priority: r.cleaning_type === 'checkout' ? 1 : 3,
      assignmentDate: date,
      isFixed: false,
    });
  });

  // Common-area assignments land at the head of the morning, marked fixed so
  // they can't be re-sorted by load-balancers downstream.
  locations.forEach((l, i) => {
    plan.push({
      locationId: l.id,
      assignedTo: housekeepers[(orderedRooms.length + i) % housekeepers.length].id,
      cleaningType: 'common_area',
      priority: 0,
      assignmentDate: date,
      estimatedMinutes: l.hk_estimated_minutes ?? 20,
      isFixed: true,
      notes: `Fixed morning task: ${l.name}`,
    });

    if (l.housekeeping_frequency === 'twice_daily') {
      plan.push({
        locationId: l.id,
        assignedTo: housekeepers[(orderedRooms.length + i + 1) % housekeepers.length].id,
        cleaningType: 'common_area',
        priority: 0,
        assignmentDate: date,
        estimatedMinutes: l.hk_estimated_minutes ?? 20,
        isFixed: true,
        notes: `Fixed afternoon task: ${l.name}`,
      });
    }
  });

  if (dryRun) {
    return {
      date,
      strategy,
      rooms: rooms.length,
      commonAreas: locations.length,
      totalAssignments: plan.length,
      plan,
      dryRun: true,
    };
  }

  const created = await withTransaction(tenantId, async (client) => {
    // Wipe any existing auto-generated plan for that date so re-runs are idempotent.
    await client.query(
      `DELETE FROM housekeeping_assignments
       WHERE tenant_id = $1 AND hotel_id = $2 AND date = $3
         AND status = 'assigned' AND started_at IS NULL`,
      [tenantId, hotelId, date],
    );

    const ids: string[] = [];
    let sort = 0;
    for (const p of plan) {
      const id = generateId();
      await client.query(
        `INSERT INTO housekeeping_assignments (
           id, tenant_id, hotel_id, room_id, location_id, assigned_to, status, type,
           priority, date, estimated_minutes, is_fixed, sort_order, notes, created_by,
           created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,'assigned',$7,$8,$9,$10,$11,$12,$13,$14, NOW(), NOW())`,
        [
          id, tenantId, hotelId, p.roomId ?? null, p.locationId ?? null, p.assignedTo,
          p.cleaningType, p.priority, p.assignmentDate,
          p.estimatedMinutes ?? null, p.isFixed, sort++, p.notes ?? null, userId,
        ],
      );
      ids.push(id);
    }
    return ids;
  });

  try {
    await publishEvent(TOPICS.HOUSEKEEPING_ASSIGNED, {
      tenantId,
      hotelId,
      date,
      count: created.length,
      generatedBy: userId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to publish schedule event:', err);
  }

  await createAuditEntry(
    tenantId, userId, 'hk_schedule_generate', 'housekeeping_schedule', date,
    null, { strategy, rooms: rooms.length, commonAreas: locations.length, total: created.length },
  );

  return {
    date,
    strategy,
    rooms: rooms.length,
    commonAreas: locations.length,
    totalAssignments: created.length,
    assignmentIds: created,
    dryRun: false,
  };
}

// ---------------------------------------------------------------------------
// DND two-attempt protocol (kept from prior implementation).
// ---------------------------------------------------------------------------
export async function handleDND(
  tenantId: string,
  hotelId: string,
  assignmentId: string,
  _staffId: string,
  attemptNumber: number,
) {
  return withTransaction(tenantId, async (client) => {
    const assignmentResult = await client.query(
      `SELECT hka.*, r.room_number FROM housekeeping_assignments hka
       LEFT JOIN rooms r ON r.id = hka.room_id
       WHERE hka.id = $1 AND hka.tenant_id = $2`,
      [assignmentId, tenantId],
    );

    if (assignmentResult.rows.length === 0) {
      throw new AppError('Assignment not found', 404);
    }
    const assignment = assignmentResult.rows[0];

    await client.query(
      `UPDATE housekeeping_assignments
         SET dnd_attempts = $1, last_dnd_at = NOW(), updated_at = NOW(),
             status = CASE WHEN $1 >= 2 THEN 'dnd_escalated' ELSE 'dnd_pending' END
       WHERE id = $2 AND tenant_id = $3`,
      [attemptNumber, assignmentId, tenantId],
    );

    if (attemptNumber >= 2) {
      try {
        await publishAlert(tenantId, hotelId, {
          type: 'dnd_escalation',
          severity: 'warning',
          title: `DND Escalation: Room ${assignment.room_number}`,
          message: `Room ${assignment.room_number} has refused housekeeping ${attemptNumber} times today.`,
          resourceType: 'housekeeping_assignment',
          resourceId: assignmentId,
          targetRoles: ['hk_supervisor', 'management'],
        });
      } catch (err) {
        console.error('Failed to publish DND alert:', err);
      }
    }

    return {
      assignmentId,
      roomNumber: assignment.room_number,
      attemptNumber,
      escalated: attemptNumber >= 2,
    };
  });
}
