import { query } from '../config/database';
import { firestore } from '../config/firestore';
import { FieldValue } from '@google-cloud/firestore';
import { generateId } from '../utils/helpers';

/**
 * Send a notification: insert to DB and push to Firestore for real-time delivery.
 */
export async function sendNotification(
  tenantId: string,
  hotelId: string,
  data: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    resourceType?: string;
    resourceId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }
) {
  const id = generateId();

  // Insert to DB for persistence
  await query(
    `INSERT INTO notifications (
      id, tenant_id, hotel_id, recipient_id, type, title, message,
      resource_type, resource_id, priority, is_read, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW())`,
    [
      id, tenantId, hotelId, data.recipientId, data.type,
      data.title, data.message, data.resourceType || null,
      data.resourceId || null, data.priority || 'normal',
    ]
  );

  // Push to Firestore for real-time delivery
  try {
    const notifRef = firestore
      .collection('tenants')
      .doc(tenantId)
      .collection('hotels')
      .doc(hotelId)
      .collection('notifications')
      .doc(data.recipientId)
      .collection('inbox')
      .doc(id);

    await notifRef.set({
      type: data.type,
      title: data.title,
      message: data.message,
      resourceType: data.resourceType || null,
      resourceId: data.resourceId || null,
      priority: data.priority || 'normal',
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to push notification to Firestore:', err);
  }

  return { id, ...data };
}

/**
 * Send an urgent alert to all staff with specified roles.
 */
export async function sendUrgentAlert(
  tenantId: string,
  hotelId: string,
  data: {
    type: string;
    title: string;
    message: string;
    targetRoles: string[];
    resourceType?: string;
    resourceId?: string;
  }
) {
  // Get all staff with matching roles
  const staffResult = await query(
    `SELECT id FROM staff
     WHERE tenant_id = $1 AND hotel_id = $2 AND role = ANY($3) AND is_active = true`,
    [tenantId, hotelId, data.targetRoles]
  );

  const notifications = [];
  for (const staff of staffResult.rows) {
    const notif = await sendNotification(tenantId, hotelId, {
      recipientId: staff.id,
      type: data.type,
      title: data.title,
      message: data.message,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      priority: 'urgent',
    });
    notifications.push(notif);
  }

  return {
    alertsSent: notifications.length,
    targetRoles: data.targetRoles,
  };
}

/**
 * Get notifications for a user.
 */
export async function getNotifications(
  tenantId: string,
  userId: string,
  filters: { unreadOnly?: boolean; limit?: number } = {}
) {
  let sql = `
    SELECT id, type, title, message, resource_type, resource_id,
           priority, is_read, acknowledged_at, created_at
    FROM notifications
    WHERE tenant_id = $1 AND recipient_id = $2
  `;
  const params: any[] = [tenantId, userId];
  let paramIdx = 3;

  if (filters.unreadOnly) {
    sql += ' AND is_read = false';
  }

  sql += ' ORDER BY created_at DESC';
  sql += ` LIMIT $${paramIdx}`;
  params.push(filters.limit || 50);

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Acknowledge/mark a notification as read.
 */
export async function acknowledgeNotification(
  tenantId: string,
  notificationId: string,
  userId: string
) {
  await query(
    `UPDATE notifications SET is_read = true, acknowledged_at = NOW()
     WHERE id = $1 AND tenant_id = $2 AND recipient_id = $3`,
    [notificationId, tenantId, userId]
  );

  return { notificationId, acknowledged: true };
}
