import { config } from './env';

const isLocalDev = !config.GCP_PROJECT_ID;

let pubsub: any;

if (!isLocalDev) {
  const gcp = require('@google-cloud/pubsub');
  pubsub = new gcp.PubSub({ projectId: config.GCP_PROJECT_ID });
} else {
  console.log('[PubSub] Running in local mode — events logged to console');
}

// Topic name constants
export const TOPICS = {
  ROOM_STATUS_CHANGED: 'room-status-changed',
  WORK_ORDER_CREATED: 'work-order-created',
  WORK_ORDER_UPDATED: 'work-order-updated',
  GUEST_CHECK_IN: 'guest-check-in',
  GUEST_CHECK_OUT: 'guest-check-out',
  HOUSEKEEPING_ASSIGNED: 'housekeeping-assigned',
  HOUSEKEEPING_COMPLETED: 'housekeeping-completed',
  INSPECTION_RESULT: 'inspection-result',
  SCHEDULE_PUBLISHED: 'schedule-published',
  COMPLIANCE_ALERT: 'compliance-alert',
  SHIFT_HANDOFF: 'shift-handoff',
  URGENT_ALERT: 'urgent-alert',
  EQUIPMENT_STATUS: 'equipment-status',
  PM_DUE: 'pm-due',
} as const;

/**
 * Publish an event to a Pub/Sub topic.
 */
export async function publishEvent(
  topicName: string,
  data: Record<string, any>
): Promise<string> {
  if (isLocalDev) {
    console.log(`[PubSub:local] ${topicName}:`, JSON.stringify(data).slice(0, 200));
    return `local-msg-${Date.now()}`;
  }

  const topic = pubsub.topic(topicName);
  const messageBuffer = Buffer.from(JSON.stringify(data));

  try {
    const messageId = await topic.publishMessage({ data: messageBuffer });
    return messageId;
  } catch (error) {
    console.error(`Failed to publish to ${topicName}:`, error);
    throw error;
  }
}

export { pubsub };
