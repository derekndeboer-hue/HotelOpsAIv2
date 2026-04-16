import { query } from '../../config/database';
import { publishEvent, TOPICS } from '../../config/pubsub';
import { publishAlert } from '../../config/firestore';
import { AppError } from '../../middleware/error';
import { generateId } from '../../utils/helpers';

/**
 * List compliance items with optional filters.
 */
export async function listComplianceItems(
  tenantId: string,
  hotelId: string,
  filters: { category?: string; status?: string } = {}
) {
  let sql = `
    SELECT id, name, category, frequency, description, responsible_role,
           regulatory_body, status, last_completed, next_due_date,
           created_at, updated_at
    FROM compliance_items
    WHERE tenant_id = $1 AND hotel_id = $2
  `;
  const params: any[] = [tenantId, hotelId];
  let paramIdx = 3;

  if (filters.category) {
    sql += ` AND category = $${paramIdx}`;
    params.push(filters.category);
    paramIdx++;
  }
  if (filters.status) {
    sql += ` AND status = $${paramIdx}`;
    params.push(filters.status);
    paramIdx++;
  }

  sql += ' ORDER BY next_due_date ASC';
  const result = await query(sql, params);
  return result.rows;
}

/**
 * Create a compliance item.
 */
export async function createComplianceItem(
  tenantId: string,
  hotelId: string,
  userId: string,
  data: {
    name: string;
    category: string;
    frequency: string;
    description?: string;
    responsibleRole?: string;
    regulatoryBody?: string;
    dueDate?: string;
  }
) {
  const id = generateId();
  await query(
    `INSERT INTO compliance_items (
      id, tenant_id, hotel_id, name, category, frequency,
      description, responsible_role, regulatory_body,
      status, next_due_date, created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $11, NOW(), NOW())`,
    [
      id, tenantId, hotelId, data.name, data.category, data.frequency,
      data.description || null, data.responsibleRole || null,
      data.regulatoryBody || null, data.dueDate || null, userId,
    ]
  );

  return { id, ...data, status: 'active' };
}

/**
 * Update a compliance item.
 */
export async function updateComplianceItem(
  tenantId: string,
  itemId: string,
  updates: Record<string, any>
) {
  const allowedFields: Record<string, string> = {
    name: 'name',
    category: 'category',
    frequency: 'frequency',
    description: 'description',
    responsibleRole: 'responsible_role',
    regulatoryBody: 'regulatory_body',
    status: 'status',
    nextDueDate: 'next_due_date',
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

  params.push(itemId, tenantId);
  await query(
    `UPDATE compliance_items SET ${setClauses.join(', ')}
     WHERE id = $${paramIdx} AND tenant_id = $${paramIdx + 1}`,
    params
  );

  return { id: itemId, ...updates };
}

/**
 * Record completion of a compliance item and auto-calculate next due date.
 */
export async function recordCompletion(
  tenantId: string,
  _hotelId: string,
  itemId: string,
  userId: string,
  data: { notes?: string; photoUrl?: string }
) {
  // Get item details
  const itemResult = await query(
    `SELECT * FROM compliance_items WHERE id = $1 AND tenant_id = $2`,
    [itemId, tenantId]
  );

  if (itemResult.rows.length === 0) {
    throw new AppError('Compliance item not found', 404);
  }

  const item = itemResult.rows[0];

  // Calculate next due date based on frequency
  const frequencyDays: Record<string, number> = {
    daily: 1,
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    semi_annual: 180,
    annual: 365,
  };

  const daysUntilNext = frequencyDays[item.frequency] || 30;
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + daysUntilNext);

  // Record completion
  const completionId = generateId();
  await query(
    `INSERT INTO compliance_completions (
      id, tenant_id, compliance_item_id, completed_by, notes, photo_url, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [completionId, tenantId, itemId, userId, data.notes || null, data.photoUrl || null]
  );

  // Update item with next due date
  await query(
    `UPDATE compliance_items SET last_completed = NOW(), next_due_date = $1, updated_at = NOW()
     WHERE id = $2 AND tenant_id = $3`,
    [nextDueDate.toISOString().split('T')[0], itemId, tenantId]
  );

  return {
    itemId,
    completionId,
    lastCompleted: new Date().toISOString(),
    nextDueDate: nextDueDate.toISOString().split('T')[0],
  };
}

/**
 * Get compliance dashboard: overdue, due-soon, current.
 */
export async function getDashboard(tenantId: string, hotelId: string) {
  const overdue = await query(
    `SELECT id, name, category, frequency, next_due_date, responsible_role
     FROM compliance_items
     WHERE tenant_id = $1 AND hotel_id = $2 AND status = 'active'
       AND next_due_date < CURRENT_DATE
     ORDER BY next_due_date ASC`,
    [tenantId, hotelId]
  );

  const dueSoon = await query(
    `SELECT id, name, category, frequency, next_due_date, responsible_role
     FROM compliance_items
     WHERE tenant_id = $1 AND hotel_id = $2 AND status = 'active'
       AND next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
     ORDER BY next_due_date ASC`,
    [tenantId, hotelId]
  );

  const current = await query(
    `SELECT id, name, category, frequency, next_due_date, last_completed, responsible_role
     FROM compliance_items
     WHERE tenant_id = $1 AND hotel_id = $2 AND status = 'active'
       AND (next_due_date > CURRENT_DATE + INTERVAL '7 days' OR next_due_date IS NULL)
     ORDER BY next_due_date ASC`,
    [tenantId, hotelId]
  );

  const summary = await query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE next_due_date < CURRENT_DATE) AS overdue,
       COUNT(*) FILTER (WHERE next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') AS due_soon,
       COUNT(*) FILTER (WHERE next_due_date > CURRENT_DATE + INTERVAL '7 days' OR next_due_date IS NULL) AS current
     FROM compliance_items
     WHERE tenant_id = $1 AND hotel_id = $2 AND status = 'active'`,
    [tenantId, hotelId]
  );

  return {
    summary: summary.rows[0],
    overdue: overdue.rows,
    dueSoon: dueSoon.rows,
    current: current.rows,
  };
}

/**
 * Run the alert engine: check for items crossing alert thresholds.
 */
export async function runAlertEngine(tenantId: string, hotelId: string) {
  // Items overdue (past due date)
  const overdueItems = await query(
    `SELECT id, name, category, next_due_date, responsible_role
     FROM compliance_items
     WHERE tenant_id = $1 AND hotel_id = $2 AND status = 'active'
       AND next_due_date < CURRENT_DATE
       AND id NOT IN (
         SELECT DISTINCT compliance_item_id FROM compliance_alerts
         WHERE alert_type = 'overdue' AND created_at > CURRENT_DATE - INTERVAL '1 day'
       )`,
    [tenantId, hotelId]
  );

  // Items due within 3 days (warning threshold)
  const warningItems = await query(
    `SELECT id, name, category, next_due_date, responsible_role
     FROM compliance_items
     WHERE tenant_id = $1 AND hotel_id = $2 AND status = 'active'
       AND next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
       AND id NOT IN (
         SELECT DISTINCT compliance_item_id FROM compliance_alerts
         WHERE alert_type = 'warning' AND created_at > CURRENT_DATE - INTERVAL '1 day'
       )`,
    [tenantId, hotelId]
  );

  const alerts = [];

  for (const item of overdueItems.rows) {
    const alertId = generateId();
    await query(
      `INSERT INTO compliance_alerts (id, tenant_id, compliance_item_id, alert_type, created_at)
       VALUES ($1, $2, $3, 'overdue', NOW())`,
      [alertId, tenantId, item.id]
    );

    try {
      await publishAlert(tenantId, hotelId, {
        type: 'compliance_overdue',
        severity: 'critical',
        title: `OVERDUE: ${item.name}`,
        message: `Compliance item "${item.name}" (${item.category}) was due on ${item.next_due_date}.`,
        resourceType: 'compliance_item',
        resourceId: item.id,
        targetRoles: [item.responsible_role, 'management', 'admin'].filter(Boolean),
      });
    } catch (err) {
      console.error('Failed to publish compliance alert:', err);
    }

    alerts.push({ itemId: item.id, type: 'overdue', name: item.name });
  }

  for (const item of warningItems.rows) {
    const alertId = generateId();
    await query(
      `INSERT INTO compliance_alerts (id, tenant_id, compliance_item_id, alert_type, created_at)
       VALUES ($1, $2, $3, 'warning', NOW())`,
      [alertId, tenantId, item.id]
    );

    try {
      await publishEvent(TOPICS.NOTIFICATION, {
        tenantId, hotelId,
        itemId: item.id,
        name: item.name,
        type: 'warning',
        dueDate: item.next_due_date,
      });
    } catch (err) {
      console.error('Failed to publish compliance warning:', err);
    }

    alerts.push({ itemId: item.id, type: 'warning', name: item.name });
  }

  return {
    overdueAlerts: overdueItems.rows.length,
    warningAlerts: warningItems.rows.length,
    alerts,
  };
}
