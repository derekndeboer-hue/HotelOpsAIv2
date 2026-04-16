import type { Request, Response } from 'express';
import { Firestore, FieldValue } from '@google-cloud/firestore';

const db = new Firestore({ projectId: process.env.GCP_PROJECT_ID });

interface RoomStatusPayload {
  tenantId: string;
  hotelId: string;
  roomNumber: string;
  status: string;
  updatedBy?: string;
  timestamp?: string;
}

export async function handleRoomStatus(req: Request, res: Response): Promise<void> {
  // Pub/Sub push delivers: { message: { data: base64string, messageId, publishTime }, subscription }
  const envelope = req.body as { message?: { data?: string } };

  if (!envelope.message?.data) {
    res.status(400).json({ error: 'Missing message.data' });
    return;
  }

  let payload: RoomStatusPayload;
  try {
    const raw = Buffer.from(envelope.message.data, 'base64').toString('utf8');
    payload = JSON.parse(raw) as RoomStatusPayload;
  } catch {
    res.status(400).json({ error: 'Failed to decode message' });
    return;
  }

  const { tenantId, hotelId, roomNumber, status } = payload;

  if (!tenantId || !hotelId || !roomNumber || !status) {
    // Ack without writing — malformed message, don't retry
    res.status(204).send();
    return;
  }

  try {
    const docRef = db
      .collection('hotels')
      .doc(`${tenantId}_${hotelId}`)
      .collection('rooms')
      .doc(roomNumber);

    await docRef.set(
      {
        status,
        number: roomNumber,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: payload.updatedBy ?? null,
      },
      { merge: true }
    );

    res.status(204).send();
  } catch (err) {
    console.error('[realtime-sync] Firestore write failed:', err);
    // Return 500 so Pub/Sub retries
    res.status(500).json({ error: 'Firestore write failed' });
  }
}
