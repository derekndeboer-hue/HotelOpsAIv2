/**
 * Local development fallbacks for GCP services.
 *
 * When running locally without GCP credentials, these no-op implementations
 * replace Firestore, Pub/Sub, and Cloud Storage. They log actions to console
 * instead of calling GCP APIs, so the app boots and runs without any cloud deps.
 *
 * The app auto-detects local mode when GCP_PROJECT_ID is not set.
 */

const isLocalDev = !process.env.GCP_PROJECT_ID;

// ---------- Firestore fallback ----------

interface RoomUpdate {
  [key: string]: unknown;
}

interface AlertData {
  type: string;
  message: string;
  roomNumber?: string;
  priority?: string;
}

interface PresenceData {
  name: string;
  role: string;
  isOnline: boolean;
}

class LocalFirestoreClient {
  private store: Map<string, Map<string, Record<string, unknown>>> = new Map();

  async updateRoom(
    tenantId: string,
    hotelId: string,
    roomNumber: string,
    data: RoomUpdate,
  ): Promise<void> {
    const key = `${tenantId}_${hotelId}`;
    if (!this.store.has(key)) this.store.set(key, new Map());
    const rooms = this.store.get(key)!;
    rooms.set(roomNumber, { ...rooms.get(roomNumber), ...data, lastUpdated: new Date().toISOString() });
    if (isLocalDev) {
      console.log(`[Firestore:local] Room ${roomNumber} updated:`, JSON.stringify(data));
    }
  }

  async publishAlert(tenantId: string, hotelId: string, alert: AlertData): Promise<void> {
    if (isLocalDev) {
      console.log(`[Firestore:local] Alert published:`, JSON.stringify(alert));
    }
  }

  async updatePresence(
    tenantId: string,
    hotelId: string,
    staffId: string,
    data: PresenceData,
  ): Promise<void> {
    if (isLocalDev) {
      console.log(`[Firestore:local] Presence ${staffId}:`, data.isOnline ? 'online' : 'offline');
    }
  }

  async getRoom(
    tenantId: string,
    hotelId: string,
    roomNumber: string,
  ): Promise<Record<string, unknown> | undefined> {
    return this.store.get(`${tenantId}_${hotelId}`)?.get(roomNumber);
  }
}

// ---------- Pub/Sub fallback ----------

type EventHandler = (data: Record<string, unknown>) => void;

class LocalPubSubClient {
  private handlers: Map<string, EventHandler[]> = new Map();

  async publish(topic: string, data: Record<string, unknown>): Promise<void> {
    if (isLocalDev) {
      console.log(`[PubSub:local] ${topic}:`, JSON.stringify(data).slice(0, 200));
    }
    // Fire local handlers synchronously for dev
    const topicHandlers = this.handlers.get(topic) || [];
    for (const handler of topicHandlers) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[PubSub:local] Handler error on ${topic}:`, err);
      }
    }
  }

  subscribe(topic: string, handler: EventHandler): void {
    if (!this.handlers.has(topic)) this.handlers.set(topic, []);
    this.handlers.get(topic)!.push(handler);
  }
}

// ---------- Cloud Storage fallback ----------

class LocalStorageClient {
  async uploadFile(
    _bucket: string,
    filePath: string,
    _buffer: Buffer,
    _contentType: string,
  ): Promise<string> {
    const url = `http://localhost:8080/local-storage/${filePath}`;
    if (isLocalDev) {
      console.log(`[Storage:local] File "uploaded": ${filePath}`);
    }
    return url;
  }

  async getSignedUrl(_bucket: string, filePath: string): Promise<string> {
    return `http://localhost:8080/local-storage/${filePath}?token=local-dev`;
  }
}

// ---------- Exports ----------

export const localFirestore = new LocalFirestoreClient();
export const localPubSub = new LocalPubSubClient();
export const localStorage = new LocalStorageClient();

export { isLocalDev };

/**
 * Usage in config files:
 *
 * import { isLocalDev, localFirestore } from './local-fallbacks';
 * import { Firestore } from '@google-cloud/firestore';
 *
 * export const firestoreClient = isLocalDev
 *   ? localFirestore
 *   : new Firestore({ projectId: process.env.GCP_PROJECT_ID });
 */
