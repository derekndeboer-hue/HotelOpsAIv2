# Phase 1B Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three Phase 1B blocking bugs (Firestore path mismatch, Pub/Sub topic names, missing realtime-sync service), resolve all CI lint/typecheck failures, and wire HousekeepingBoardPage to real-time Firestore.

**Architecture:** The API writes room state to Firestore at `hotels/{tenantId}_{hotelId}/rooms/{roomNumber}`, the `realtime-sync` Cloud Run service relays Pub/Sub push messages into Firestore, and the web frontend uses Firebase `onSnapshot` listeners. Currently, the backend writes to the wrong Firestore path, Pub/Sub topics don't match provisioned infrastructure, and the relay service doesn't exist.

**Tech Stack:** Node.js 20 + TypeScript (API and realtime-sync), Express 4, `@google-cloud/firestore` 7, `@google-cloud/pubsub` 4, React 18 + Firebase 10 (web), Vitest 1 (tests), ESLint 8 + `@typescript-eslint/recommended`.

---

## File Map

| Action | File |
|--------|------|
| Modify | `packages/api/src/config/firestore.ts` |
| Modify | `packages/api/src/config/pubsub.ts` |
| Modify | `packages/api/src/config/storage.ts` |
| Modify | `packages/api/src/modules/reports/reports.service.ts` |
| Modify | `package.json` (root — typecheck script) |
| Modify | `packages/api/package.json` (test script) |
| Create | `packages/api/vitest.config.ts` |
| Create | `packages/api/tests/setup.ts` |
| Create | `packages/realtime-sync/` (new package — 6 files) |
| Modify | `packages/web/src/pages/housekeeping/HousekeepingBoardPage.tsx` |

---

## Task 1: Fix Firestore room path

**Files:**
- Modify: `packages/api/src/config/firestore.ts`

The backend writes to `tenants/{tenantId}/hotels/{hotelId}/rooms/{roomNumber}` but the frontend listens at `hotels/{tenantId}_{hotelId}/rooms`. Fix: change the `updateRoomInFirestore` function to use the compound-key path the frontend expects.

- [ ] **Step 1: Open `packages/api/src/config/firestore.ts` and replace the `updateRoomInFirestore` path block**

Change lines 30–36 from:
```typescript
  const docRef = firestore
    .collection('tenants')
    .doc(tenantId)
    .collection('hotels')
    .doc(hotelId)
    .collection('rooms')
    .doc(roomNumber);
```
To:
```typescript
  const docRef = firestore
    .collection('hotels')
    .doc(`${tenantId}_${hotelId}`)
    .collection('rooms')
    .doc(roomNumber);
```

- [ ] **Step 2: Verify no other callers of `updateRoomInFirestore` exist that rely on the old path**

Run:
```bash
cd packages/api && grep -r "updateRoomInFirestore" src/
```
Expected output: `src/modules/rooms/rooms.service.ts` and `src/modules/housekeeping/housekeeping.service.ts` — both are callers passing `(tenantId, hotelId, roomNumber, data)`, which is the correct signature. No path is specified by callers.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/config/firestore.ts
git commit -m "fix: align Firestore room path to hotels/{tenantId}_{hotelId}/rooms/{roomNumber}"
```

---

## Task 2: Fix Pub/Sub TOPICS alignment

**Files:**
- Modify: `packages/api/src/config/pubsub.ts`

The code has 14 topic constants; GCP Terraform provisions only 5 with different names. Events are silently dropped. Fix: reduce TOPICS to the 5 provisioned names.

Provisioned topics (from `infrastructure/terraform/pubsub.tf`):
- `room-status-changes` (not `room-status-changed`)
- `work-order-updates` (not `work-order-created` / `work-order-updated`)
- `schedule-updates`
- `notification-events`
- `report-requests`

- [ ] **Step 1: Replace the TOPICS export in `packages/api/src/config/pubsub.ts`**

Replace lines 14–30:
```typescript
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
```

With:
```typescript
// Topic name constants — must match infrastructure/terraform/pubsub.tf
export const TOPICS = {
  ROOM_STATUS_CHANGED: 'room-status-changes',
  WORK_ORDER_UPDATED: 'work-order-updates',
  SCHEDULE_UPDATED: 'schedule-updates',
  NOTIFICATION: 'notification-events',
  REPORT_REQUEST: 'report-requests',
} as const;
```

- [ ] **Step 2: Find all TOPICS usages to verify no broken references**

Run:
```bash
cd packages/api && grep -r "TOPICS\." src/ --include="*.ts"
```

Expected callers and required mapping:
- `TOPICS.ROOM_STATUS_CHANGED` → still valid (mapped to `room-status-changes`)
- `TOPICS.WORK_ORDER_CREATED` → change to `TOPICS.WORK_ORDER_UPDATED` in rooms/work-orders callers
- `TOPICS.WORK_ORDER_UPDATED` → still valid

- [ ] **Step 3: Fix remaining broken TOPICS references in callers**

In `packages/api/src/modules/rooms/rooms.service.ts` and `packages/api/src/modules/work-orders/work-orders.service.ts`, change any `TOPICS.WORK_ORDER_CREATED` to `TOPICS.WORK_ORDER_UPDATED` and any other removed topic names to the nearest match from the 5 provisioned topics.

Run:
```bash
cd packages/api && grep -n "TOPICS\." src/modules/rooms/rooms.service.ts src/modules/work-orders/work-orders.service.ts src/modules/housekeeping/housekeeping.service.ts
```

Replace each stale topic constant with the appropriate provisioned topic:
- `TOPICS.WORK_ORDER_CREATED` → `TOPICS.WORK_ORDER_UPDATED`
- `TOPICS.HOUSEKEEPING_ASSIGNED` → `TOPICS.NOTIFICATION`
- `TOPICS.HOUSEKEEPING_COMPLETED` → `TOPICS.NOTIFICATION`
- `TOPICS.INSPECTION_RESULT` → `TOPICS.NOTIFICATION`
- `TOPICS.SCHEDULE_PUBLISHED` → `TOPICS.SCHEDULE_UPDATED`
- `TOPICS.URGENT_ALERT` → `TOPICS.NOTIFICATION`
- Any other stale names → nearest provisioned topic

- [ ] **Step 4: Verify TypeScript compiles (no remaining TOPICS.XYZ references to removed keys)**

Run:
```bash
cd packages/api && npx tsc --noEmit 2>&1 | grep -i "topics"
```
Expected: no errors mentioning TOPICS.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/config/pubsub.ts packages/api/src/modules/
git commit -m "fix: align Pub/Sub topic names to provisioned Terraform infrastructure"
```

---

## Task 3: Fix `no-var-requires` lint errors in GCP config files

**Files:**
- Modify: `packages/api/src/config/firestore.ts`
- Modify: `packages/api/src/config/pubsub.ts`
- Modify: `packages/api/src/config/storage.ts`

The `@typescript-eslint/recommended` ruleset bans `require()` inside conditionals. Replace conditional `require()` with top-level ESM imports. The GCP packages are listed in `dependencies` so they're always installed; we just guard instantiation on `!isLocalDev`.

- [ ] **Step 1: Rewrite `packages/api/src/config/firestore.ts` to use top-level imports**

Replace the entire file with:
```typescript
import { config } from './env';
import * as gcpFirestore from '@google-cloud/firestore';

const isLocalDev = !config.GCP_PROJECT_ID;

let firestoreClient: gcpFirestore.Firestore | null = null;
const FieldValue = gcpFirestore.FieldValue;

if (!isLocalDev) {
  firestoreClient = new gcpFirestore.Firestore({ projectId: config.GCP_PROJECT_ID });
} else {
  console.warn('[Firestore] Running in local mode — changes logged to console');
}

/**
 * Update a room document in Firestore for real-time board updates.
 */
export async function updateRoomInFirestore(
  tenantId: string,
  hotelId: string,
  roomNumber: string,
  data: Record<string, unknown>
): Promise<void> {
  if (isLocalDev || !firestoreClient) {
    console.warn(`[Firestore:local] Room ${roomNumber} →`, JSON.stringify(data));
    return;
  }
  const docRef = firestoreClient
    .collection('hotels')
    .doc(`${tenantId}_${hotelId}`)
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
  if (isLocalDev || !firestoreClient) {
    console.warn(`[Firestore:local] Alert [${alert.severity}]: ${alert.title}`);
    return;
  }
  const alertsRef = firestoreClient
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
  if (isLocalDev || !firestoreClient) {
    console.warn(`[Firestore:local] Staff ${staffId}: ${data.status || 'update'}`);
    return;
  }
  const docRef = firestoreClient
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

export const firestore = firestoreClient;
export { FieldValue };
```

- [ ] **Step 2: Rewrite `packages/api/src/config/pubsub.ts` to use top-level imports**

Replace the `require` block (lines 1–12) with:
```typescript
import { config } from './env';
import * as gcpPubSub from '@google-cloud/pubsub';

const isLocalDev = !config.GCP_PROJECT_ID;

let pubsubClient: gcpPubSub.PubSub | null = null;

if (!isLocalDev) {
  pubsubClient = new gcpPubSub.PubSub({ projectId: config.GCP_PROJECT_ID });
} else {
  console.warn('[PubSub] Running in local mode — events logged to console');
}
```

Update `publishEvent` to use `pubsubClient` instead of `pubsub`:
```typescript
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
```

- [ ] **Step 3: Rewrite `packages/api/src/config/storage.ts` to use top-level imports**

Replace lines 1–16 with:
```typescript
import { config } from './env';
import fs from 'fs';
import path from 'path';
import * as gcpStorage from '@google-cloud/storage';

const isLocalDev = !config.GCP_PROJECT_ID;

let storageClient: gcpStorage.Storage | null = null;

if (!isLocalDev) {
  storageClient = new gcpStorage.Storage({ projectId: config.GCP_PROJECT_ID });
} else {
  console.warn('[Storage] Running in local mode — files saved to .local-uploads/');
  const uploadsDir = path.join(process.cwd(), '.local-uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}
```

Update `uploadFile` and `getSignedUrl` to use `storageClient`:
- Replace `storage.bucket(...)` with `storageClient!.bucket(...)`  
- Keep the `isLocalDev` guard at the top of each function

End with `export const storage = storageClient;`

- [ ] **Step 4: Run lint to verify no remaining `no-var-requires` errors**

```bash
cd /path/to/hotel-ops && npx eslint packages/api/src/config/ --ext .ts 2>&1
```
Expected: no errors (warnings for `no-console` are acceptable and expected given the `console.warn` calls).

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/config/
git commit -m "fix: replace conditional require() with top-level imports in GCP config files"
```

---

## Task 4: Fix remaining lint warnings

**Files:**
- Modify: `packages/api/src/modules/reports/reports.service.ts`

- [ ] **Step 1: Remove `@ts-ignore` comment in `reports.service.ts` lines 19–21**

The `zoneClause` function is defined but not called. Replace:
```typescript
// @ts-ignore TS6133 — will be called once zone-split reports land
function zoneClause(zone: string | undefined, tableAlias = ''): string {
```
With:
```typescript
function _zoneClause(zone: string | undefined, tableAlias = ''): string {
```
(The `_` prefix suppresses the `no-unused-vars` warning per the ESLint config's `argsIgnorePattern` pattern. Update all internal references from `zoneClause` to `_zoneClause` if any exist.)

- [ ] **Step 2: Run full lint to confirm clean output**

```bash
cd /path/to/hotel-ops && npx eslint packages/api/src/ --ext .ts 2>&1 | grep -E "error|warning" | head -30
```
Expected: no `@typescript-eslint/ban-ts-comment` errors, no `no-var-requires` errors.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/modules/reports/reports.service.ts
git commit -m "fix: remove @ts-ignore, rename unused zoneClause to _zoneClause"
```

---

## Task 5: Fix typecheck script and vitest config

**Files:**
- Modify: `package.json` (root)
- Modify: `packages/api/package.json`
- Create: `packages/api/vitest.config.ts`
- Create: `packages/api/tests/setup.ts`

- [ ] **Step 1: Fix the root typecheck script to build shared first**

In `package.json`, change:
```json
"typecheck": "tsc --noEmit -p packages/shared/tsconfig.json && tsc --noEmit -p packages/api/tsconfig.json && tsc --noEmit -p packages/web/tsconfig.json"
```
To:
```json
"typecheck": "npm run build -w packages/shared && tsc --noEmit -p packages/api/tsconfig.json && tsc --noEmit -p packages/web/tsconfig.json"
```

- [ ] **Step 2: Fix the api test script to run once (not watch mode)**

In `packages/api/package.json`, change:
```json
"test": "vitest"
```
To:
```json
"test": "vitest --run"
```

- [ ] **Step 3: Create `packages/api/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'node',
    reporters: ['verbose'],
  },
});
```

- [ ] **Step 4: Create `packages/api/tests/setup.ts`**

```typescript
// Set required env vars before any module is loaded in tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/hotel_ops_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /path/to/hotel-ops && npm run test:api 2>&1
```
Expected: all tests in `tests/unit/auth-permissions.test.ts` and `tests/unit/tenant-context.test.ts` pass. No "missing required environment variable" errors.

- [ ] **Step 6: Commit**

```bash
git add package.json packages/api/package.json packages/api/vitest.config.ts packages/api/tests/setup.ts
git commit -m "fix: typecheck builds shared first; vitest runs in --run mode with env setup"
```

---

## Task 6: Build `packages/realtime-sync` service

**Files:**
- Create: `packages/realtime-sync/package.json`
- Create: `packages/realtime-sync/tsconfig.json`
- Create: `packages/realtime-sync/src/index.ts`
- Create: `packages/realtime-sync/src/handlers/roomStatus.ts`
- Create: `packages/realtime-sync/src/handlers/workOrders.ts`
- Create: `packages/realtime-sync/src/handlers/generic.ts`
- Create: `packages/realtime-sync/Dockerfile`

This is the Pub/Sub push relay: it receives HTTP POST messages from GCP Pub/Sub push subscriptions and writes the decoded payloads to Firestore. The Cloud Run service URL is already wired up in Terraform push subscription config. The four endpoints are:
- `POST /pubsub/room-status` — writes to `hotels/{tenantId}_{hotelId}/rooms/{roomNumber}`
- `POST /pubsub/work-orders` — no-op ack for now (WO real-time not yet implemented in frontend)
- `POST /pubsub/schedules` — no-op ack
- `POST /pubsub/notifications` — no-op ack

- [ ] **Step 1: Create `packages/realtime-sync/package.json`**

```json
{
  "name": "@hotel-ops/realtime-sync",
  "version": "1.0.0",
  "private": true,
  "description": "Pub/Sub push relay — writes events to Firestore for real-time frontend updates",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@google-cloud/firestore": "^7.3.0",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `packages/realtime-sync/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `packages/realtime-sync/src/handlers/roomStatus.ts`**

This is the critical handler. It decodes the Pub/Sub message envelope and writes to Firestore.

```typescript
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
```

- [ ] **Step 4: Create `packages/realtime-sync/src/handlers/generic.ts`**

For the three topics (work-orders, schedules, notifications) where the frontend doesn't yet have Firestore listeners, just ack the message.

```typescript
import type { Request, Response } from 'express';

export function handleAck(_req: Request, res: Response): void {
  // Acknowledge without processing — frontend has no listener for this topic yet
  res.status(204).send();
}
```

- [ ] **Step 5: Create `packages/realtime-sync/src/index.ts`**

```typescript
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
```

- [ ] **Step 6: Create `packages/realtime-sync/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

- [ ] **Step 7: Add `packages/realtime-sync` to root workspace**

In root `package.json`, update the `workspaces` array:
```json
"workspaces": [
  "packages/shared",
  "packages/api",
  "packages/web",
  "packages/realtime-sync"
]
```

- [ ] **Step 8: Install dependencies for the new package**

```bash
cd /path/to/hotel-ops && npm install
```
Expected: `packages/realtime-sync/node_modules` is populated.

- [ ] **Step 9: Build the new package to verify TypeScript compiles**

```bash
cd /path/to/hotel-ops && npm run build -w packages/realtime-sync 2>&1
```
Expected: `packages/realtime-sync/dist/` created, no TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add packages/realtime-sync/ package.json
git commit -m "feat: add realtime-sync service — Pub/Sub push relay to Firestore"
```

---

## Task 7: Wire HousekeepingBoardPage to Firestore real-time

**Files:**
- Modify: `packages/web/src/pages/housekeeping/HousekeepingBoardPage.tsx`

The HousekeepingBoardPage currently polls via REST every 30 seconds. It should use a Firestore `onSnapshot` listener for the same real-time behavior as RoomBoardPage. The board still needs to display assignment/housekeeping-specific data (assignee name, cleaning type, assignment status) that isn't stored in Firestore — so the pattern is: load the full board via REST on mount, then subscribe to Firestore room-status updates to patch the `status` field in the local state without re-fetching the entire board.

- [ ] **Step 1: Add Firestore imports to HousekeepingBoardPage.tsx**

At the top of the file, add:
```typescript
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useFirestore } from '@/context/FirestoreContext';
import { useAuth } from '@/context/AuthContext';
```

- [ ] **Step 2: Add Firestore context hooks inside the component**

After the existing state declarations (`const [rooms, setRooms] ...`), add:
```typescript
const { db } = useFirestore();
const { user } = useAuth();
```

- [ ] **Step 3: Replace the polling `useEffect` with a hybrid approach**

Replace the current polling `useEffect` (lines 82–87):
```typescript
useEffect(() => {
  setLoading(true);
  load();
  const t = setInterval(load, 30000);
  return () => clearInterval(t);
}, [load]);
```

With:
```typescript
// Initial REST load for full board data (assignee names, cleaning types, etc.)
useEffect(() => {
  setLoading(true);
  load();
}, [load]);

// Firestore subscription patches room statuses in real-time
useEffect(() => {
  if (!db || !user) return;
  const colPath = `hotels/${user.tenantId}_${user.hotelId}/rooms`;
  const q = query(collection(db, colPath));
  const unsub = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified' || change.type === 'added') {
        const fsData = change.doc.data();
        setRooms((prev) =>
          prev.map((r) =>
            r.room_number === change.doc.id
              ? { ...r, status: fsData.status ?? r.status }
              : r
          )
        );
      }
    });
  });
  return unsub;
}, [db, user]);
```

- [ ] **Step 4: Remove the manual refresh button's reliance on polling**

The `RefreshCw` button still calls `load()` directly, which is fine — it lets the user manually force a full re-fetch of assignment data. No change needed here.

- [ ] **Step 5: Verify TypeScript compiles for the web package**

```bash
cd /path/to/hotel-ops && tsc --noEmit -p packages/web/tsconfig.json 2>&1
```
Expected: no errors related to HousekeepingBoardPage.

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/pages/housekeeping/HousekeepingBoardPage.tsx
git commit -m "feat: wire HousekeepingBoardPage to Firestore real-time status updates"
```

---

## Self-Review

**Spec coverage:**
- [x] Firestore path mismatch fixed (Task 1)
- [x] Pub/Sub topic names aligned (Task 2)
- [x] `no-var-requires` lint errors fixed (Task 3)
- [x] `ban-ts-comment` lint warning removed (Task 4)
- [x] Typecheck script builds shared first (Task 5)
- [x] Vitest runs non-interactively with env setup (Task 5)
- [x] `realtime-sync` service built (Task 6)
- [x] HousekeepingBoardPage real-time (Task 7)

**Type consistency:**
- `firestoreClient` used throughout firestore.ts replacing `firestore` variable — exported as `firestore` for backward compat ✓
- `pubsubClient` used internally, exported as `pubsub` ✓
- Firestore path in Task 1 matches Task 6 handler (`hotels/${tenantId}_${hotelId}/rooms/${roomNumber}`) ✓
- `TOPICS.ROOM_STATUS_CHANGED` constant name preserved but value changed to `room-status-changes` ✓
