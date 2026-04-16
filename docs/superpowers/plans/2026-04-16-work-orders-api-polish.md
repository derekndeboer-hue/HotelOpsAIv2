# Work Orders API Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three response shape mismatches between the work orders backend and the frontend type expectations: `addComment` returns a comment object instead of a WorkOrder, `getStats` returns snake_case fields, and the response normalizer for `listWorkOrders` / `getReviewQueue` isn't mapping `assignee_first_name` to `assigneeName`.

**Architecture:** All fixes are in the API service and route layers — no frontend changes needed. The frontend `api.ts` service layer already expects camelCase; the backend SQL queries return snake_case which needs normalizing before the JSON response is sent.

**Tech Stack:** Node.js 20 + TypeScript, Express 4, pg (Postgres), Vitest 1.

---

## File Map

| Action | File |
|--------|------|
| Modify | `packages/api/src/modules/work-orders/work-orders.service.ts` |
| Modify | `packages/api/src/modules/work-orders/work-orders.routes.ts` |

---

## Task 1: Fix `addComment` — return the full WorkOrder after adding a comment

**Files:**
- Modify: `packages/api/src/modules/work-orders/work-orders.service.ts`
- Modify: `packages/api/src/modules/work-orders/work-orders.routes.ts`

The `addComment` route returns `{ id, content, isSystem }` but the frontend `WorkOrderDetailPage` calls `setWO(updated)` expecting a full WorkOrder back. Fix: have the route return the full work order by calling `getWorkOrder` after inserting.

- [ ] **Step 1: Update the addComment route handler in `work-orders.routes.ts`**

Replace the addComment handler (lines 98–112):
```typescript
router.post(
  '/:id/comments',
  requirePermission('work_orders.update'),
  validate(workOrderCommentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const comment = await workOrdersService.addComment(
      user.tenantId,
      req.params.id,
      user.id,
      req.body.content,
    );
    res.status(201).json(comment);
  }),
);
```

With:
```typescript
router.post(
  '/:id/comments',
  requirePermission('work_orders.update'),
  validate(workOrderCommentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await workOrdersService.addComment(
      user.tenantId,
      req.params.id,
      user.id,
      req.body.content,
    );
    // Return the full work order so the client can update its local state
    const wo = await workOrdersService.getWorkOrder(user.tenantId, req.params.id);
    res.status(201).json(normalizeWorkOrder(wo));
  }),
);
```

- [ ] **Step 2: Add a `normalizeWorkOrder` helper at the top of `work-orders.routes.ts`**

Add after the imports:
```typescript
/** Normalize SQL snake_case row to camelCase WorkOrder shape for the frontend. */
function normalizeWorkOrder(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    roomId: row.room_id,
    roomNumber: row.room_number,
    locationId: row.location_id,
    locationName: row.location_name,
    locationType: row.location_type,
    assignedTo: row.assigned_to,
    assigneeName: row.assignee_first_name
      ? `${row.assignee_first_name} ${row.assignee_last_name ?? ''}`.trim()
      : null,
    reportedByName: row.creator_first_name
      ? `${row.creator_first_name} ${row.creator_last_name ?? ''}`.trim()
      : null,
    dueDate: row.due_date,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    comments: Array.isArray(row.comments)
      ? (row.comments as Record<string, unknown>[]).map((c) => ({
          id: c.id,
          text: c.content,
          userName: c.first_name
            ? `${c.first_name} ${c.last_name ?? ''}`.trim()
            : 'System',
          isSystem: c.is_system,
          createdAt: c.created_at,
        }))
      : [],
    photos: Array.isArray(row.photos)
      ? (row.photos as Record<string, unknown>[]).map((p) => ({
          id: p.id,
          url: p.url,
          caption: p.caption,
        }))
      : [],
  };
}
```

- [ ] **Step 3: Apply `normalizeWorkOrder` to the `GET /:id` route**

In the `GET /:id` handler, wrap the response:
```typescript
router.get(
  '/:id',
  requirePermission('work_orders.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const wo = await workOrdersService.getWorkOrder(user.tenantId, req.params.id);
    res.json(normalizeWorkOrder(wo));
  }),
);
```

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/modules/work-orders/
git commit -m "fix: addComment returns full WorkOrder; normalize snake_case to camelCase in GET /:id"
```

---

## Task 2: Fix `getStats` response shape

**Files:**
- Modify: `packages/api/src/modules/work-orders/work-orders.service.ts`

The frontend expects `{ open, inProgress, overdue, avgResponse, avgCompletion }`. The service returns the raw Postgres row with `open_count`, `in_progress_count`, etc.

- [ ] **Step 1: Add a mapping at the end of `getStats` in `work-orders.service.ts`**

Replace:
```typescript
  return result.rows[0];
```

With:
```typescript
  const row = result.rows[0];
  return {
    open: parseInt(row.open_count, 10) || 0,
    inProgress: parseInt(row.in_progress_count, 10) || 0,
    overdue: parseInt(row.overdue_count, 10) || 0,
    urgentOpen: parseInt(row.urgent_count, 10) || 0,
    completedToday: parseInt(row.completed_today, 10) || 0,
    avgResponse: parseFloat(row.avg_response_hours_30d) || 0,
    avgCompletion: parseFloat(row.avg_completion_hours_30d) || 0,
  };
```

- [ ] **Step 2: Verify the frontend dashboard renders correctly**

The `MaintenanceDashboardPage` uses `stats?.open`, `stats?.inProgress`, `stats?.overdue`, `stats?.avgResponse`, `stats?.avgCompletion`. All five now map to the response fields above.

Run typecheck:
```bash
cd /path/to/hotel-ops && tsc --noEmit -p packages/api/tsconfig.json 2>&1
```
Expected: no errors in work-orders files.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/modules/work-orders/work-orders.service.ts
git commit -m "fix: normalize getStats response to camelCase for frontend compatibility"
```

---

## Task 3: Normalize `listWorkOrders` and `getReviewQueue` responses

**Files:**
- Modify: `packages/api/src/modules/work-orders/work-orders.routes.ts`

Both list endpoints return raw SQL rows. The `WorkOrderListPage` renders `row.assignee_first_name` with a fallback in `displayAssignee()`, so it's partially resilient. But the `WorkOrderCard` component (used in `MaintenanceDashboardPage`) and the `DataTable` rendering use both snake and camel names interchangeably. Normalize at the route layer using the `normalizeWorkOrder` helper added in Task 1.

- [ ] **Step 1: Normalize the list response in the `GET /` route**

Replace the list route handler return with:
```typescript
router.get(
  '/',
  requirePermission('work_orders.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const parsed = workOrderFilterSchema.parse(req.query);
    const result = await workOrdersService.listWorkOrders(
      user.tenantId,
      user.hotelId,
      user.id,
      user.role,
      parsed,
    );
    res.json({
      ...result,
      items: result.items.map(normalizeWorkOrder),
    });
  }),
);
```

- [ ] **Step 2: Normalize the queue response in `GET /queue`**

Replace:
```typescript
    const queue = await workOrdersService.getReviewQueue(user.tenantId, user.hotelId);
    res.json(queue);
```

With:
```typescript
    const queue = await workOrdersService.getReviewQueue(user.tenantId, user.hotelId);
    res.json(queue.map(normalizeWorkOrder));
```

- [ ] **Step 3: Normalize the update response in `PUT /:id`**

The `updateWorkOrder` service returns `{ id, ...updates }` which is a partial. Fetch and return the full work order:
```typescript
router.put(
  '/:id',
  requirePermission('work_orders.update'),
  validate(updateWorkOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await workOrdersService.updateWorkOrder(
      user.tenantId,
      req.params.id,
      user.id,
      req.body,
    );
    const wo = await workOrdersService.getWorkOrder(user.tenantId, req.params.id);
    res.json(normalizeWorkOrder(wo));
  }),
);
```

- [ ] **Step 4: Normalize the create response in `POST /`**

The `createWorkOrder` service returns a minimal `{ id, title, category, priority, status, roomId, locationId, assignedTo }`. Fetch and return the full work order:
```typescript
router.post(
  '/',
  requirePermission('work_orders.create'),
  validate(createWorkOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await workOrdersService.createWorkOrder(
      user.tenantId,
      user.hotelId,
      user.id,
      req.body,
    );
    const wo = await workOrdersService.getWorkOrder(user.tenantId, result.id);
    res.status(201).json(normalizeWorkOrder(wo));
  }),
);
```

- [ ] **Step 5: Run the full lint and typecheck**

```bash
cd /path/to/hotel-ops && npm run lint 2>&1 | tail -20
cd /path/to/hotel-ops && npm run typecheck 2>&1 | tail -20
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/modules/work-orders/work-orders.routes.ts
git commit -m "fix: normalize all work order API responses to camelCase WorkOrder shape"
```

---

## Self-Review

**Spec coverage:**
- [x] `addComment` returns full WorkOrder — `WorkOrderDetailPage.setWO(updated)` gets valid data (Task 1)
- [x] `getStats` returns camelCase fields — `MaintenanceDashboardPage` renders KPIs correctly (Task 2)
- [x] `listWorkOrders` normalized — `WorkOrderListPage` DataTable renders without snake_case fallback (Task 3)
- [x] `getReviewQueue` normalized — `MaintenanceDashboardPage` "Needs Attention" panel renders (Task 3)
- [x] `createWorkOrder` returns full WorkOrder — redirect to detail page has correct data (Task 3)
- [x] `updateWorkOrder` returns full WorkOrder — status change in `WorkOrderDetailPage` shows live state (Task 3)

**Type consistency:**
- `normalizeWorkOrder` defined once in routes.ts and used for all four handlers ✓
- `comments[].text` matches `TimelineEntry` usage in `WorkOrderDetailPage`: `c.text` ✓
- `photos[].url` matches photo rendering in `WorkOrderDetailPage` ✓
