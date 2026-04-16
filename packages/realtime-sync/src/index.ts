import express from 'express';
import { handleRoomStatus } from './handlers/roomStatus';
import { handleAck } from './handlers/generic';

const app = express();
app.use(express.json());

// Health check — required by Cloud Run
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Pub/Sub push endpoints — paths match push subscription `pushConfig.pushEndpoint` in Terraform
app.post('/pubsub/room-status', handleRoomStatus);
app.post('/pubsub/work-orders', handleAck);
app.post('/pubsub/schedules', handleAck);
app.post('/pubsub/notifications', handleAck);

const PORT = parseInt(process.env.PORT || '8080', 10);
app.listen(PORT, () => {
  console.warn(`[realtime-sync] Listening on port ${PORT}`);
});
