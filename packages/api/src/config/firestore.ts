import { config } from './env';

const isLocalDev = !config.GCP_PROJECT_ID;

let firestore: any;
let FieldValue: any;

if (!isLocalDev) {
  const gcp = require('@google-cloud/firestore');
  firestore = new gcp.Firestore({ projectId: config.GCP_PROJECT_ID });
  FieldValue = gcp.FieldValue;
} else {
  console.log('[Firestore] Running in local mode — changes logged to console');
  FieldValue = { serverTimestamp: () => new Date().toISOString() };
}

/**
 * Update a room document in Firestore for real-time board updates.
 */
export async function updateRoomInFirestore(
  tenantId: string,
  hotelId: string,
  roomNumber: string,
  data: Record<string, any>
): Promise<void> {
  if (isLocalDev) {
    console.log(`[Firestore:local] Room ${roomNumber} →`, JSON.stringify(data));
    return;
  }
  const docRef = firestore
    .collection('tenants')
    .doc(tenantId)
    .collection('hotels')
    .doc(hotelId)
    .collection('rooms')
    .doc(roomNumber);

  await docRef.set(
    {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Publish a real-time alert to Firestore for the hotel dashboard.
 */
export async function publishAlert(
  tenantId: string,
  hotelId: string,
  alert: {
    type: string;
    severity: 'info' | 'warning' | 'urgent' | 'critical';
    title: string;
    message: string;
    resourceType?: string;
    resourceId?: string;
    targetRoles?: string[];
  }
): Promise<void> {
  if (isLocalDev) {
    console.log(`[Firestore:local] Alert [${alert.severity}]: ${alert.title}`);
    return;
  }
  const alertsRef = firestore
    .collection('tenants')
    .doc(tenantId)
    .collection('hotels')
    .doc(hotelId)
    .collection('alerts');

  await alertsRef.add({
    ...alert,
    acknowledged: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Update staff presence/location in Firestore for real-time tracking.
 */
export async function updateStaffPresence(
  tenantId: string,
  hotelId: string,
  staffId: string,
  data: {
    status?: 'online' | 'offline' | 'busy' | 'break';
    currentRoom?: string | null;
    currentZone?: string | null;
    lastSeen?: Date;
  }
): Promise<void> {
  if (isLocalDev) {
    console.log(`[Firestore:local] Staff ${staffId}: ${data.status || 'update'}`);
    return;
  }
  const docRef = firestore
    .collection('tenants')
    .doc(tenantId)
    .collection('hotels')
    .doc(hotelId)
    .collection('staff_presence')
    .doc(staffId);

  await docRef.set(
    {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export { firestore };
