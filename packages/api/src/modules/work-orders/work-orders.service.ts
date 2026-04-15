import { query, withTransaction } from '../../config/database';
import { publishEvent, TOPICS } from '../../config/pubsub';
import { publishAlert } from '../../config/firestore';
import { createAuditEntry } from '../../middleware/audit';
import { AppError } from '../../middleware/error';
import { generateId } from '../../utils/helpers';

interface CreateWorkOrderInput {
  roomId?: string;
  roomNumber?: string;
  locationId?: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  assignedTo?: string;
  dueDate?: string;
  photos?: string[];
}

/**
 * Create a work order with same-day arrival auto-escalation check.
 */
export async function createWorkOrder(
  tenantId: string,
  hotelId: string,
  userId: string,
  input: CreateWorkOrderInput
) {
  return withTransaction(tenantId, async (client) => {
    const id = generateId();
    let effectivePriority = input.priority;
    let roomId = input.roomId;
    const locationId = input.locationId;

    if (roomId && locationId) {
      throw new AppError('A work order targets either a room or a location, not both', 400);
    }

    if (!roomId && !locationId && input.roomNumber) {
      const roomResult = await client.query(
        `SELECT id FROM rooms WHERE room_number = $1 AND tenant_id = $2 AND hotel_id = $3`,
        [input.roomNumber, tenantId, hotelId]
      );
      if (roomResult.rows.length > 0) {
        roomId = roomResult.rows[0].id;
      }
    }

    if (locationId) {
      const locResult = await client.query(
        `SELECT id FROM locations
         WHERE id = $1 AND tenant_id = $2 AND hotel_id = $3 AND is_active = true`,
        [locationId, tenantId, hotelId]
      );
      if (locResult.rows.length === 0) {
        throw new AppError('Location not found', 404);
      }
    }

    // Same-day arrival auto-escalation: if room has a check-in today, bump priority
    if (roomId) {
      const arrivalCheck = await client.query(
        `SELECT r.id, g.vip_status
         FROM reservations r
         JOIN guests g ON g.id = r.guest_id
         WHERE r.room_id = $1 AND r.check_in_date = CURRENT_DATE
           AND r.status IN ('confirmed', 'arriving_today')
         LIMIT 1`,
        [roomId]
      );

      if (arrivalCheck.rows.length > 0) {
        // Auto-escalate: low->medium, medium->high, high->urgent
        const escalationMap: Record<string, string> = {
          low: 'medium',
          medium: 'high',
          high: 'urgent',
        };
        if (escalationMap[effectivePriority]) {
          effectivePriority = escalationMap[effectivePriority];
        }

        // VIP guests escalate to urgent
        if (arrivalCheck.rows[0].vip_status && arrivalCheck.rows[0].vip_status !== 'none') {
          effectivePriority = 'urgent';
        }
      }
    }

    await client.query(
      `INSERT INTO work_orders (
        id, tenant_id, hotel_id, room_id, location_id, title, description,
        category, priority, status, created_by, assigned_to,
        due_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', $10, $11, $12, NOW(), NOW())`,
      [
        id, tenantId, hotelId, roomId || null, locationId || null, input.title, input.description,
        input.category, effectivePriority, userId, input.assignedTo || null,
        input.dueDate || null,
      ]
    );

    // Store photos if provided
    if (input.photos && input.photos.length > 0) {
      for (const photoUrl of input.photos) {
        await client.query(
          `INSERT INTO work_order_photos (id, work_order_id, tenant_id, url, uploaded_by, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [generateId(), id, tenantId, photoUrl, userId]
        );
      }
    }

    // Publish event
    try {
      await publishEvent(TOPICS.WORK_ORDER_CREATED, {
        tenantId,
        hotelId,
        workOrderId: id,
        roomId,
        category: input.category,
        priority: effectivePriority,
        assignedTo: input.assignedTo,
        createdBy: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to publish work order event:', err);
    }

    // If urgent, push alert to Firestore
    if (effectivePriority === 'urgent') {
      try {
        await publishAlert(tenantId, hotelId, {
          type: 'work_order_urgent',
          severity: 'urgent',
          title: `Urgent Work Order: ${input.title}`,
          message: input.description,
          resourceType: 'work_order',
          resourceId: id,
          targetRoles: ['engineer', 'eng_supervisor', 'management', 'admin'],
        });
      } catch (err) {
        console.error('Failed to publish urgent alert:', err);
      }
    }

    // Audit
    await createAuditEntry(tenantId, userId, 'work_order_create', 'work_order', id, null, {
      title: input.title,
      category: input.category,
      priority: effectivePriority,
      originalPriority: input.priority,
    });

    return {
      id,
      title: input.title,
      category: input.category,
      priority: effectivePriority,
      status: 'open',
      roomId: roomId || null,
      locationId: locationId || null,
      assignedTo: input.assignedTo || null,
    };
  });
}

/**
 * List work orders with role-based filtering.
 */
export async function listWorkOrders(
  tenantId: string,
  hotelId: string,
  userId: string,
  role: string,
  filters: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    roomId?: string;
    locationId?: string;
    targetType?: 'room' | 'location' | 'any';
    limit?: number;
    offset?: number;
  } = {}
) {
  const whereClauses: string[] = ['wo.tenant_id = $1', 'wo.hotel_id = $2'];
  const params: any[] = [tenantId, hotelId];
  let paramIdx = 3;

  if (role === 'engineer' || role === 'maint_tech') {
    whereClauses.push(`wo.assigned_to = $${paramIdx}`);
    params.push(userId);
    paramIdx++;
  }

  if (filters.status) { whereClauses.push(`wo.status = $${paramIdx}`); params.push(filters.status); paramIdx++; }
  if (filters.priority) { whereClauses.push(`wo.priority = $${paramIdx}`); params.push(filters.priority); paramIdx++; }
  if (filters.category) { whereClauses.push(`wo.category = $${paramIdx}`); params.push(filters.category); paramIdx++; }
  if (filters.assignedTo) { whereClauses.push(`wo.assigned_to = $${paramIdx}`); params.push(filters.assignedTo); paramIdx++; }
  if (filters.roomId) { whereClauses.push(`wo.room_id = $${paramIdx}`); params.push(filters.roomId); paramIdx++; }
  if (filters.locationId) { whereClauses.push(`wo.location_id = $${paramIdx}`); params.push(filters.locationId); paramIdx++; }
  if (filters.targetType === 'room') whereClauses.push('wo.room_id IS NOT NULL');
  if (filters.targetType === 'location') whereClauses.push('wo.location_id IS NOT NULL');

  const whereSql = whereClauses.join(' AND ');

  let sql = `
    SELECT wo.id, wo.room_id, wo.location_id, wo.title, wo.description, wo.category,
           wo.priority, wo.status, wo.created_by, wo.assigned_to,
           wo.due_date, wo.started_at, wo.completed_at, wo.created_at,
           r.room_number,
           loc.name AS location_name, loc.location_type AS location_type,
           creator.first_name AS creator_first_name, creator.last_name AS creator_last_name,
           assignee.first_name AS assignee_first_name, assignee.last_name AS assignee_last_name
    FROM work_orders wo
    LEFT JOIN rooms r ON r.id = wo.room_id
    LEFT JOIN locations loc ON loc.id = wo.location_id
    LEFT JOIN staff creator ON creator.id = wo.created_by
    LEFT JOIN staff assignee ON assignee.id = wo.assigned_to
    WHERE ${whereSql}
    ORDER BY
      CASE wo.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END ASC,
      wo.created_at DESC
  `;

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  sql += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);

  const countSql = `SELECT COUNT(*) FROM work_orders wo WHERE ${whereSql}`;
  const countParams = params.slice(0, paramIdx - 1);
  const countResult = await query(countSql, countParams);

  return {
    items: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
    limit,
    offset,
  };
}

/**
 * Get a single work order with comments and photos.
 */
export async function getWorkOrder(tenantId: string, workOrderId: string) {
  const woResult = await query(
    `SELECT wo.*,
            r.room_number,
            loc.name AS location_name, loc.location_type AS location_type,
            creator.first_name AS creator_first_name, creator.last_name AS creator_last_name,
            assignee.first_name AS assignee_first_name, assignee.last_name AS assignee_last_name
     FROM work_orders wo
     LEFT JOIN rooms r ON r.id = wo.room_id
     LEFT JOIN locations loc ON loc.id = wo.location_id
     LEFT JOIN staff creator ON creator.id = wo.created_by
     LEFT JOIN staff assignee ON assignee.id = wo.assigned_to
     WHERE wo.id = $1 AND wo.tenant_id = $2`,
    [workOrderId, tenantId]
  );

  if (woResult.rows.length === 0) {
    throw new AppError('Work order not found', 404);
  }

  // Get comments
  const commentsResult = await query(
    `SELECT c.id, c.content, c.created_at, c.is_system,
            s.first_name, s.last_name, s.role
     FROM work_order_comments c
     LEFT JOIN staff s ON s.id = c.user_id
     WHERE c.work_order_id = $1 AND c.tenant_id = $2
     ORDER BY c.created_at ASC`,
    [workOrderId, tenantId]
  );

  // Get photos
  const photosResult = await query(
    `SELECT id, url, caption, created_at
     FROM work_order_photos
     WHERE work_order_id = $1 AND tenant_id = $2
     ORDER BY created_at ASC`,
    [workOrderId, tenantId]
  );

  return {
    ...woResult.rows[0],
    comments: commentsResult.rows,
    photos: photosResult.rows,
  };
}

/**
 * Update a work order (status, assignment, priority, etc.).
 */
export async function updateWorkOrder(
  tenantId: string,
  workOrderId: string,
  userId: string,
  updates: {
    title?: string;
    status?: string;
    priority?: string;
    assignedTo?: string | null;
    description?: string;
    notes?: string;
    dueDate?: string | null;
    startedAt?: string;
    completedAt?: string;
  }
) {
  return withTransaction(tenantId, async (client) => {
    // Get current state
    const current = await client.query(
      `SELECT * FROM work_orders WHERE id = $1 AND tenant_id = $2`,
      [workOrderId, tenantId]
    );

    if (current.rows.length === 0) {
      throw new AppError('Work order not found', 404);
    }

    const oldValues = current.rows[0];
    const setClauses: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let paramIdx = 1;

    if (updates.title !== undefined) {
      setClauses.push(`title = $${paramIdx}`);
      params.push(updates.title);
      paramIdx++;
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIdx}`);
      params.push(updates.status);
      paramIdx++;

      if (updates.status === 'in_progress' && !oldValues.started_at) {
        setClauses.push('started_at = NOW()');
      }
      if (updates.status === 'completed') {
        setClauses.push('completed_at = NOW()');
      }
    }
    if (updates.priority !== undefined) {
      setClauses.push(`priority = $${paramIdx}`);
      params.push(updates.priority);
      paramIdx++;
    }
    if (updates.assignedTo !== undefined) {
      setClauses.push(`assigned_to = $${paramIdx}`);
      params.push(updates.assignedTo);
      paramIdx++;
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIdx}`);
      params.push(updates.description);
      paramIdx++;
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIdx}`);
      params.push(updates.notes);
      paramIdx++;
    }
    if (updates.dueDate !== undefined) {
      setClauses.push(`due_date = $${paramIdx}`);
      params.push(updates.dueDate);
      paramIdx++;
    }

    params.push(workOrderId, tenantId);
    await client.query(
      `UPDATE work_orders SET ${setClauses.join(', ')} WHERE id = $${paramIdx} AND tenant_id = $${paramIdx + 1}`,
      params
    );

    // Publish update event
    try {
      await publishEvent(TOPICS.WORK_ORDER_UPDATED, {
        tenantId,
        hotelId: oldValues.hotel_id,
        workOrderId,
        changes: updates,
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to publish work order update:', err);
    }

    // Audit
    await createAuditEntry(
      tenantId, userId, 'work_order_update', 'work_order', workOrderId,
      { status: oldValues.status, priority: oldValues.priority, assignedTo: oldValues.assigned_to },
      updates
    );

    return { id: workOrderId, ...updates };
  });
}

export async function addPhoto(
  tenantId: string,
  workOrderId: string,
  userId: string,
  url: string,
  caption: string | null,
) {
  const id = generateId();
  await query(
    `INSERT INTO work_order_photos (id, work_order_id, tenant_id, url, caption, uploaded_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [id, workOrderId, tenantId, url, caption, userId],
  );
  return { id, url, caption };
}

/**
 * Add a comment to a work order.
 */
export async function addComment(
  tenantId: string,
  workOrderId: string,
  userId: string,
  content: string,
  isSystem: boolean = false
) {
  const id = generateId();
  await query(
    `INSERT INTO work_order_comments (id, work_order_id, tenant_id, user_id, content, is_system, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [id, workOrderId, tenantId, userId, content, isSystem]
  );
  return { id, content, isSystem };
}

/**
 * Get work order statistics for the dashboard.
 */
export async function getStats(tenantId: string, hotelId: string) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'open') AS open_count,
       COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
       COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= CURRENT_DATE) AS completed_today,
       COUNT(*) FILTER (WHERE priority = 'urgent' AND status NOT IN ('completed', 'cancelled')) AS urgent_count,
       ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)
         FILTER (WHERE status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '30 days'), 1
       ) AS avg_completion_hours_30d,
       ROUND(AVG(EXTRACT(EPOCH FROM (started_at - created_at)) / 3600)
         FILTER (WHERE started_at IS NOT NULL AND started_at >= CURRENT_DATE - INTERVAL '30 days'), 1
       ) AS avg_response_hours_30d,
       COUNT(*) FILTER (WHERE status NOT IN ('completed', 'cancelled')
         AND due_date IS NOT NULL AND due_date < CURRENT_DATE) AS overdue_count
     FROM work_orders
     WHERE tenant_id = $1 AND hotel_id = $2`,
    [tenantId, hotelId]
  );

  return result.rows[0];
}

/**
 * Get the review queue: work orders needing supervisor attention.
 */
export async function getReviewQueue(tenantId: string, hotelId: string) {
  const result = await query(
    `SELECT wo.id, wo.title, wo.category, wo.priority, wo.status,
            wo.created_at, wo.room_id,
            r.room_number,
            assignee.first_name AS assignee_first_name, assignee.last_name AS assignee_last_name
     FROM work_orders wo
     LEFT JOIN rooms r ON r.id = wo.room_id
     LEFT JOIN staff assignee ON assignee.id = wo.assigned_to
     WHERE wo.tenant_id = $1 AND wo.hotel_id = $2
       AND (
         wo.status = 'pending_review'
         OR (wo.priority = 'urgent' AND wo.status = 'open')
         OR (wo.status NOT IN ('completed', 'cancelled') AND wo.due_date < CURRENT_DATE)
       )
     ORDER BY
       CASE wo.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
       wo.created_at ASC`,
    [tenantId, hotelId]
  );

  return result.rows;
}
