import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import { validate } from '../../middleware/validate';
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  workOrderFilterSchema,
  workOrderCommentSchema,
  workOrderPhotoSchema,
} from '@hotel-ops/shared/validators/work-orders';
import * as workOrdersService from './work-orders.service';

const router = Router();

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

router.use(authenticate, setTenantContext);

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

router.get(
  '/stats',
  requirePermission('work_orders.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const stats = await workOrdersService.getStats(user.tenantId, user.hotelId);
    res.json(stats);
  }),
);

router.get(
  '/queue',
  requirePermission('work_orders.assign'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const queue = await workOrdersService.getReviewQueue(user.tenantId, user.hotelId);
    res.json(queue.map(normalizeWorkOrder));
  }),
);

router.get(
  '/:id',
  requirePermission('work_orders.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const wo = await workOrdersService.getWorkOrder(user.tenantId, req.params.id);
    res.json(normalizeWorkOrder(wo));
  }),
);

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

router.post(
  '/:id/photos',
  requirePermission('work_orders.update'),
  validate(workOrderPhotoSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const photo = await workOrdersService.addPhoto(
      user.tenantId,
      req.params.id,
      user.id,
      req.body.url,
      req.body.caption ?? null,
    );
    res.status(201).json(photo);
  }),
);

export default router;
