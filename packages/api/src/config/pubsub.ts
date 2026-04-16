import { config } from './env';
import * as gcpPubSub from '@google-cloud/pubsub';

const isLocalDev = !config.GCP_PROJECT_ID;

let pubsubClient: gcpPubSub.PubSub | null = null;

if (!isLocalDev) {
  pubsubClient = new gcpPubSub.PubSub({ projectId: config.GCP_PROJECT_ID });
} else {
  console.warn('[PubSub] Running in local mode — events logged to console');
}

// Topic name constants — must match infrastructure/terraform/pubsub.tf
export const TOPICS = {
  ROOM_STATUS_CHANGED: 'room-status-changes',
  WORK_ORDER_UPDATED: 'work-order-updates',
  SCHEDULE_UPDATED: 'schedule-updates',
  NOTIFICATION: 'notification-events',
  REPORT_REQUEST: 'report-requests',
} as const;

/**
 * Publish an event to a Pub/Sub topic.
 */
export async function publishEvent(
  topicName: string,
  data: Record<string, unknown>
): Promise<string> {
  if (isLocalDev || !pubsubClient) {
    console.warn(`[PubSub:local] ${topicName}:`, JSON.stringify(data).slice(0, 200));
    return `local-msg-${Date.now()}`;
  }

  const topic = pubsubClient.topic(topicName);
  const messageBuffer = Buffer.from(JSON.stringify(data));

  try {
    const messageId = await topic.publishMessage({ data: messageBuffer });
    return messageId;
  } catch (error) {
    console.error(`Failed to publish to ${topicName}:`, error);
    throw error;
  }
}

export const pubsub = pubsubClient;
