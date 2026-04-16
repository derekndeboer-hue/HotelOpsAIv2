import { query } from '../../config/database';
import { updateStaffPresence, updateRoomInFirestore } from '../../config/firestore';
import { publishEvent, TOPICS } from '../../config/pubsub';
import { AppError } from '../../middleware/error';
import { generateId, getPropertyZone } from '../../utils/helpers';

/**
 * Generate engineering schedule.
 * TODO: Full algorithm implementation
 * Pseudocode:
 *   1. Load inputs:
 *      a. Available engineers for the date (from staff table, filtered by schedule/availability)
 *      b. Fixed tasks: daily inspections, common area checks, opening/closing procedures
 *      c. Pending PMs due within the window (from preventive_maintenance table)
 *      d. Open work orders sorted by priority
 *   2. Phase 1 - Fixed tasks:
 *      a. Assign daily inspection routes by zone (fleming/simonton)
 *      b. Assign common area checks
 *      c. Assign opening/closing procedures by shift
 *   3. Phase 2 - PM bundling:
 *      a. Group PMs by room/zone for efficiency
 *      b. Estimate time per PM based on equipment type and historical data
 *      c. Assign PM bundles to engineers, balancing workload
 *   4. Phase 3 - Work order scheduling:
 *      a. Urgent WOs get first available slots
 *      b. High priority fills remaining morning slots
 *      c. Medium/low fill afternoon slots
 *      d. Zone-group WOs to minimize travel between wings
 *   5. Phase 4 - Buffer:
 *      a. Leave 15% of each engineer's day unscheduled for reactive work
 *      b. Flag any overflow (more work than capacity)
 *   6. Output: Array of task assignments with estimated start/end times
 */
export async function generateEngineeringSchedule(
  tenantId: string,
  hotelId: string,
  date: string,
  _userId: string
) {
  // Get available engineers
  const engineers = await query(
    `SELECT id, first_name, last_name FROM staff
     WHERE tenant_id = $1 AND hotel_id = $2 AND role = 'engineer' AND is_active = true`,
    [tenantId, hotelId]
  );

  // Get PMs due
  const pmsDue = await query(
    `SELECT pm.id, pm.name, pm.equipment_id, pm.estimated_minutes,
            e.name AS equipment_name, e.room_id, e.location,
            r.room_number, r.zone
     FROM preventive_maintenance pm
     JOIN equipment e ON e.id = pm.equipment_id
     LEFT JOIN rooms r ON r.id = e.room_id
     WHERE pm.tenant_id = $1 AND pm.next_due_date <= $2
       AND pm.status = 'due'
     ORDER BY pm.next_due_date ASC`,
    [tenantId, date]
  );

  // Get open work orders
  const openWOs = await query(
    `SELECT wo.id, wo.title, wo.category, wo.priority, wo.room_id,
            r.room_number, r.zone
     FROM work_orders wo
     LEFT JOIN rooms r ON r.id = wo.room_id
     WHERE wo.tenant_id = $1 AND wo.hotel_id = $2
       AND wo.status IN ('open', 'assigned')
     ORDER BY
       CASE wo.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END`,
    [tenantId, hotelId]
  );

  // TODO: Implement full scheduling algorithm per pseudocode above
  // For now, return raw data for manual scheduling
  return {
    date,
    engineers: engineers.rows,
    pmsDue: pmsDue.rows,
    openWorkOrders: openWOs.rows,
    generatedTasks: [],
    status: 'draft',
    message: 'Schedule data assembled. Full auto-generation pending implementation.',
  };
}

/**
 * Generate housekeeping schedule.
 * TODO: Full algorithm implementation
 * Pseudocode:
 *   1. Load inputs:
 *      a. Available housekeepers for the date
 *      b. Fixed common area assignments (lobby, pool, fitness, etc.)
 *      c. Checkout rooms (from today's departures)
 *      d. Stayover rooms (occupied, not checking out)
 *      e. Deep clean rotation schedule
 *   2. Phase 1 - Fixed common areas:
 *      a. Assign common area cleaning blocks (morning/afternoon)
 *      b. These are pre-assigned to specific staff or rotated
 *   3. Phase 2 - Categorize rooms:
 *      a. Checkout rooms: full clean, higher priority, ~45 min each
 *      b. Stayover rooms: light clean, ~25 min each
 *      c. Deep clean rooms: extended clean, ~90 min each
 *   4. Phase 3 - Zone grouping:
 *      a. Group rooms by zone (fleming/simonton) and floor
 *      b. Assign housekeepers to zones for efficiency
 *   5. Phase 4 - Load balancing:
 *      a. Calculate total minutes per housekeeper
 *      b. Target: 7-8 rooms per housekeeper per shift
 *      c. Rebalance if any housekeeper exceeds 110% of average
 *   6. Phase 5 - Priority ordering:
 *      a. VIP arrivals first
 *      b. Same-day arrivals second
 *      c. Stayovers last
 *   7. Output: Assignment list per housekeeper with room order
 */
export async function generateHousekeepingSchedule(
  tenantId: string,
  hotelId: string,
  date: string,
  _userId: string
) {
  // Get available housekeepers
  const housekeepers = await query(
    `SELECT id, first_name, last_name FROM staff
     WHERE tenant_id = $1 AND hotel_id = $2 AND role = 'housekeeper' AND is_active = true`,
    [tenantId, hotelId]
  );

  // Get checkout rooms
  const checkouts = await query(
    `SELECT r.id AS room_id, r.room_number, r.floor, r.zone, r.room_type,
            res.guest_id, g.vip_status
     FROM reservations res
     JOIN rooms r ON r.id = res.room_id
     JOIN guests g ON g.id = res.guest_id
     WHERE res.tenant_id = $1 AND res.hotel_id = $2
       AND res.check_out_date = $3 AND res.status = 'checked_in'
     ORDER BY r.floor, r.room_number`,
    [tenantId, hotelId, date]
  );

  // Get stayover rooms
  const stayovers = await query(
    `SELECT r.id AS room_id, r.room_number, r.floor, r.zone, r.room_type
     FROM rooms r
     WHERE r.tenant_id = $1 AND r.hotel_id = $2 AND r.status = 'occupied'
       AND r.id NOT IN (
         SELECT room_id FROM reservations
         WHERE check_out_date = $3 AND status = 'checked_in' AND room_id IS NOT NULL
       )
     ORDER BY r.floor, r.room_number`,
    [tenantId, hotelId, date]
  );

  // Get arrivals (for priority)
  const arrivals = await query(
    `SELECT res.room_id, r.room_number, g.vip_status
     FROM reservations res
     JOIN rooms r ON r.id = res.room_id
     JOIN guests g ON g.id = res.guest_id
     WHERE res.tenant_id = $1 AND res.hotel_id = $2
       AND res.check_in_date = $3 AND res.status IN ('confirmed', 'arriving_today')`,
    [tenantId, hotelId, date]
  );

  // TODO: Implement full scheduling algorithm per pseudocode above
  return {
    date,
    housekeepers: housekeepers.rows,
    checkoutRooms: checkouts.rows,
    stayoverRooms: stayovers.rows,
    arrivalsToday: arrivals.rows,
    generatedAssignments: [],
    status: 'draft',
    message: 'Schedule data assembled. Full auto-generation pending implementation.',
  };
}

/**
 * Publish a schedule (make it visible to staff).
 */
export async function publishSchedule(
  tenantId: string,
  hotelId: string,
  scheduleId: string,
  userId: string
) {
  await query(
    `UPDATE schedules SET status = 'published', published_by = $1, published_at = NOW()
     WHERE id = $2 AND tenant_id = $3`,
    [userId, scheduleId, tenantId]
  );

  try {
    await publishEvent(TOPICS.SCHEDULE_UPDATED, {
      tenantId, hotelId, scheduleId, userId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to publish schedule event:', err);
  }

  return { scheduleId, status: 'published' };
}

/**
 * Get current user's schedule for a date.
 */
export async function getMySchedule(tenantId: string, staffId: string, date: string) {
  const tasks = await query(
    `SELECT t.id, t.title, t.description, t.task_type, t.status,
            t.priority, t.estimated_minutes, t.scheduled_start, t.scheduled_end,
            t.actual_start, t.actual_end, t.room_id,
            r.room_number, r.floor, r.zone
     FROM schedule_tasks t
     LEFT JOIN rooms r ON r.id = t.room_id
     WHERE t.tenant_id = $1 AND t.assigned_to = $2 AND t.date = $3
     ORDER BY t.scheduled_start ASC, t.priority ASC`,
    [tenantId, staffId, date]
  );

  return tasks.rows;
}

/**
 * Update task status.
 */
export async function updateTaskStatus(
  tenantId: string,
  taskId: string,
  _staffId: string,
  status: string,
  data: { notes?: string; photoUrl?: string } = {}
) {
  const setClauses: string[] = [`status = $1`, 'updated_at = NOW()'];
  const params: any[] = [status];
  let paramIdx = 2;

  if (status === 'in_progress') {
    setClauses.push('actual_start = NOW()');
  }
  if (status === 'completed') {
    setClauses.push('actual_end = NOW()');
    // Photo validation: some tasks require completion photos
    if (data.photoUrl) {
      setClauses.push(`completion_photo = $${paramIdx}`);
      params.push(data.photoUrl);
      paramIdx++;
    }
  }
  if (data.notes) {
    setClauses.push(`notes = $${paramIdx}`);
    params.push(data.notes);
    paramIdx++;
  }

  params.push(taskId, tenantId);
  await query(
    `UPDATE schedule_tasks SET ${setClauses.join(', ')}
     WHERE id = $${paramIdx} AND tenant_id = $${paramIdx + 1}`,
    params
  );

  return { taskId, status };
}

/**
 * Request a time extension for a task.
 * Auto-approves if within the buffer window.
 */
export async function requestTimeExtension(
  tenantId: string,
  taskId: string,
  staffId: string,
  additionalMinutes: number,
  reason: string
) {
  const taskResult = await query(
    `SELECT id, estimated_minutes, scheduled_end FROM schedule_tasks
     WHERE id = $1 AND tenant_id = $2`,
    [taskId, tenantId]
  );

  if (taskResult.rows.length === 0) {
    throw new AppError('Task not found', 404);
  }

  const task = taskResult.rows[0];
  const bufferMinutes = Math.ceil(task.estimated_minutes * 0.15); // 15% buffer
  const autoApproved = additionalMinutes <= bufferMinutes;

  await query(
    `INSERT INTO time_extensions (
      id, tenant_id, task_id, requested_by, additional_minutes,
      reason, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      generateId(), tenantId, taskId, staffId, additionalMinutes,
      reason, autoApproved ? 'approved' : 'pending',
    ]
  );

  if (autoApproved) {
    await query(
      `UPDATE schedule_tasks SET
         estimated_minutes = estimated_minutes + $1,
         scheduled_end = scheduled_end + INTERVAL '1 minute' * $1
       WHERE id = $2 AND tenant_id = $3`,
      [additionalMinutes, taskId, tenantId]
    );
  }

  return {
    taskId,
    additionalMinutes,
    autoApproved,
    status: autoApproved ? 'approved' : 'pending_supervisor',
  };
}

/**
 * Clock in/out of a room. Starts/stops the room timer and updates Firestore.
 */
export async function roomClockInOut(
  tenantId: string,
  hotelId: string,
  staffId: string,
  roomId: string,
  action: 'clock_in' | 'clock_out'
) {
  const roomResult = await query(
    `SELECT room_number FROM rooms WHERE id = $1 AND tenant_id = $2`,
    [roomId, tenantId]
  );

  if (roomResult.rows.length === 0) {
    throw new AppError('Room not found', 404);
  }

  const roomNumber = roomResult.rows[0].room_number;

  if (action === 'clock_in') {
    await query(
      `INSERT INTO room_clock_entries (id, tenant_id, staff_id, room_id, clock_in, created_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [generateId(), tenantId, staffId, roomId]
    );

    // Update Firestore with staff presence
    try {
      await updateStaffPresence(tenantId, hotelId, staffId, {
        status: 'busy',
        currentRoom: roomNumber,
        currentZone: getPropertyZone(roomNumber),
      });
      await updateRoomInFirestore(tenantId, hotelId, roomNumber, {
        activeStaffId: staffId,
        cleanStartedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Firestore update failed:', err);
    }
  } else {
    // Clock out: update the latest open entry
    await query(
      `UPDATE room_clock_entries SET clock_out = NOW()
       WHERE staff_id = $1 AND room_id = $2 AND tenant_id = $3 AND clock_out IS NULL`,
      [staffId, roomId, tenantId]
    );

    try {
      await updateStaffPresence(tenantId, hotelId, staffId, {
        status: 'online',
        currentRoom: null,
        currentZone: null,
      });
      await updateRoomInFirestore(tenantId, hotelId, roomNumber, {
        activeStaffId: null,
        cleanEndedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Firestore update failed:', err);
    }
  }

  return { staffId, roomId, roomNumber, action, timestamp: new Date().toISOString() };
}
