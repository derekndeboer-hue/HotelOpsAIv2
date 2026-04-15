import { query, withTransaction, getCurrentTenantId } from '../../config/database';
import { AppError } from '../../middleware/error';
import { createAuditEntry } from '../../middleware/audit';
import { generateId } from '../../utils/helpers';
import type { GuestRequestInput } from '@hotel-ops/shared/validators/front-desk';
import { createWorkOrder } from '../work-orders/work-orders.service';

// Derive the routing department from request type.
const ROUTE_MAP: Record<string, string> = {
  amenity: 'concierge',
  maintenance: 'engineering',
  housekeeping: 'housekeeping',
  concierge: 'concierge',
  other: 'front_desk',
};

export async function createGuestRequest(
  userId: string,
  hotelId: string,
  data: GuestRequestInput,
) {
  const id = generateId();
  const routedTo = data.routeToDepartment ?? ROUTE_MAP[data.requestType] ?? 'front_desk';

  return withTransaction(async (client) => {
    // Verify guest exists
    const guestResult = await client.query(
      `SELECT id, first_name, last_name FROM guests WHERE id = $1`,
      [data.guestId],
    );
    if (guestResult.rows.length === 0) throw new AppError('Guest not found', 404);
    const guest = guestResult.rows[0];

    // Get hotel's tenant_id for audit
    const tenantId = getCurrentTenantId() ?? '';

    await client.query(
      `INSERT INTO guest_requests (
        id, hotel_id, guest_id, reservation_id, request_type,
        description, priority, status, routed_to, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, $9, NOW(), NOW())`,
      [
        id, hotelId, data.guestId, data.reservationId ?? null,
        data.requestType, data.description, data.priority,
        routedTo, userId,
      ],
    );

    // Cross-module: maintenance requests create a work order automatically.
    if (data.requestType === 'maintenance') {
      try {
        await createWorkOrder(tenantId || getCurrentTenantId() || '', hotelId, userId, {
          title: `Guest Request: ${guest.first_name} ${guest.last_name}`,
          description: data.description,
          category: 'general',
          priority: data.priority === 'urgent' ? 'urgent'
            : data.priority === 'high' ? 'high'
            : 'medium',
          roomId: data.roomId,
          // Link the source guest request in notes so ops can trace it
          notes: `Auto-created from guest request ${id}`,
        } as any);
      } catch (err) {
        // Work-order creation failure should not abort the guest request itself
        console.error('auto work-order creation for guest request failed:', err);
      }
    }

    await client.query(
      `UPDATE guest_requests SET status = 'routed', updated_at = NOW()
       WHERE id = $1`,
      [id],
    );

    await createAuditEntry(tenantId, userId, 'guest_request_create', 'guest_request', id, null, {
      requestType: data.requestType,
      routedTo,
      guestId: data.guestId,
    });

    return { id, requestType: data.requestType, routedTo, status: 'routed', priority: data.priority };
  });
}

export async function listGuestRequests(
  hotelId: string,
  filters: { status?: string; requestType?: string; limit?: number; offset?: number } = {},
) {
  let sql = `
    SELECT gr.id, gr.request_type, gr.description, gr.priority, gr.status,
           gr.routed_to, gr.created_at, gr.updated_at,
           g.first_name, g.last_name, g.vip_status,
           rm.room_number
    FROM guest_requests gr
    JOIN guests g ON g.id = gr.guest_id
    LEFT JOIN rooms rm ON rm.id = gr.room_id
    WHERE gr.hotel_id = $1
  `;
  const params: any[] = [hotelId];
  let idx = 2;

  if (filters.status) {
    sql += ` AND gr.status = $${idx++}`;
    params.push(filters.status);
  }
  if (filters.requestType) {
    sql += ` AND gr.request_type = $${idx++}`;
    params.push(filters.requestType);
  }

  sql += ` ORDER BY
    CASE gr.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
    gr.created_at ASC
    LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(filters.limit ?? 50, filters.offset ?? 0);

  const result = await query<any>(sql, params);
  return result.rows;
}

export async function resolveGuestRequest(requestId: string, userId: string, resolutionNote?: string) {
  const result = await query<any>(
    `UPDATE guest_requests
     SET status = 'resolved', resolved_by = $1, resolved_at = NOW(),
         resolution_note = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, status`,
    [userId, resolutionNote ?? null, requestId],
  );
  if (result.rows.length === 0) throw new AppError('Guest request not found', 404);
  return result.rows[0];
}
