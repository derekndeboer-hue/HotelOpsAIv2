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
    res.status(201).json(result);
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
    res.json(result);
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
    res.json(queue);
  }),
);

router.get(
  '/:id',
  requirePermission('work_orders.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const wo = await workOrdersService.getWorkOrder(user.tenantId, req.params.id);
    res.json(wo);
  }),
);

router.put(
  '/:id',
  requirePermission('work_orders.update'),
  validate(updateWorkOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await workOrdersService.updateWorkOrder(
      user.tenantId,
      req.params.id,
      user.id,
      req.body,
    );
    res.json(result);
  }),
);

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
