/**
 * Messaging adapter interface.
 * Abstracts guest messaging so the system can work with
 * manual text or external messaging platforms.
 */
export interface MessagingAdapter {
  sendMessage(guestId: string, message: string, channel?: string): Promise<MessageResult>;
  getConversation(guestId: string): Promise<Message[]>;
  getTemplates(): Promise<MessageTemplate[]>;
}

export interface MessageResult {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  channel: string;
  timestamp: string;
}

export interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  channel: string;
  timestamp: string;
  staffId?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
}

/**
 * Manual Messaging Adapter.
 * Returns formatted text for staff to deliver manually.
 * No external messaging system involved.
 */
export class ManualAdapter implements MessagingAdapter {
  async sendMessage(_guestId: string, _message: string, channel?: string): Promise<MessageResult> {
    // In manual mode, messages are logged but delivered by staff in person or by phone
    return {
      messageId: `manual-${Date.now()}`,
      status: 'sent',
      channel: channel || 'in_person',
      timestamp: new Date().toISOString(),
    };
  }

  async getConversation(_guestId: string): Promise<Message[]> {
    // Manual mode has no automated conversation history
    return [];
  }

  async getTemplates(): Promise<MessageTemplate[]> {
    return [
      {
        id: 'welcome',
        name: 'Welcome Message',
        content: 'Welcome to our hotel, {guestName}! We hope you enjoy your stay. If you need anything, please call the front desk at extension 0.',
        category: 'check_in',
        variables: ['guestName'],
      },
      {
        id: 'checkout_reminder',
        name: 'Checkout Reminder',
        content: 'Good morning, {guestName}. This is a friendly reminder that checkout is at {checkoutTime}. Please let us know if you need a late checkout.',
        category: 'check_out',
        variables: ['guestName', 'checkoutTime'],
      },
      {
        id: 'maintenance_notice',
        name: 'Maintenance Notice',
        content: 'Dear {guestName}, we apologize for any inconvenience. Our team is addressing a {issueType} in your area. Expected resolution: {eta}.',
        category: 'maintenance',
        variables: ['guestName', 'issueType', 'eta'],
      },
    ];
  }
}

/**
 * Akia Messaging Adapter stub.
 * TODO: Implement Akia API integration
 * Pseudocode:
 *   1. Initialize with Akia API credentials (API key, property ID)
 *   2. sendMessage: POST /api/v1/messages { guestId, content, channel }
 *   3. getConversation: GET /api/v1/conversations/{guestId}
 *   4. getTemplates: GET /api/v1/templates
 *   5. Handle webhooks for inbound messages
 *   6. Map Akia message format to internal schema
 *   7. Support channels: SMS, WhatsApp, in-app
 */
export class AkiaAdapter implements MessagingAdapter {
  private _apiKey: string;
  private _propertyId: string;

  constructor(apiKey: string, propertyId: string) {
    this._apiKey = apiKey;
    this._propertyId = propertyId;
  }

  async sendMessage(_guestId: string, _message: string, _channel?: string): Promise<MessageResult> {
    // TODO: Implement Akia API call
    throw new Error('Akia messaging integration not yet implemented');
  }

  async getConversation(_guestId: string): Promise<Message[]> {
    throw new Error('Akia messaging integration not yet implemented');
  }

  async getTemplates(): Promise<MessageTemplate[]> {
    throw new Error('Akia messaging integration not yet implemented');
  }
}

/**
 * Factory to get the appropriate messaging adapter.
 */
export function getMessagingAdapter(type: string = 'manual'): MessagingAdapter {
  switch (type) {
    case 'akia':
      return new AkiaAdapter(
        process.env.AKIA_API_KEY || '',
        process.env.AKIA_PROPERTY_ID || ''
      );
    case 'manual':
    default:
      return new ManualAdapter();
  }
}
