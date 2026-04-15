import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import { validate } from '../../middleware/validate';
import {
  createAssignmentsBulkSchema,
  updateAssignmentSchema,
  inspectionSchema,
  assignmentFilterSchema,
  generateScheduleSchema,
  updateRoomStatusSchema,
} from '@hotel-ops/shared/validators/housekeeping';
import * as hkService from './housekeeping.service';
import { updateRoomStatus as updateRoomStatusCore } from '../rooms/rooms.service';

const router = Router();

router.use(authenticate, setTenantContext);

router.get(
  '/assignments',
  requirePermission('housekeeping.assignments.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const parsed = assignmentFilterSchema.parse(req.query);
    const filters = { ...parsed } as typeof parsed & { assignedTo?: string };
    if (!filters.assignedTo && user.role === 'housekeeper') {
      filters.assignedTo = user.id;
    }
    const result = await hkService.listAssignments(user.tenantId, user.hotelId, filters);
    res.json(result);
  }),
);

router.post(
  '/assignments',
  requirePermission('housekeeping.assignments.create'),
  validate(createAssignmentsBulkSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await hkService.createAssignments(
      user.tenantId, user.hotelId, user.id, req.body.assignments,
    );
    res.status(201).json(result);
  }),
);

router.put(
  '/assignments/:id',
  requirePermission('housekeeping.assignments.update'),
  validate(updateAssignmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await hkService.updateAssignment(
      user.tenantId, req.params.id, user.id, req.body,
    );
    res.json(result);
  }),
);

router.post(
  '/assignments/:id/start',
  requirePermission('housekeeping.assignments.update'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await hkService.startAssignment(
      user.tenantId, user.hotelId, req.params.id, user.id,
    );
    res.json(result);
  }),
);

router.post(
  '/assignments/:id/complete',
  requirePermission('housekeeping.assignments.update'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await hkService.completeClean(
      user.tenantId, user.hotelId, req.params.id, user.id, req.body?.notes,
    );
    res.json(result);
  }),
);

router.post(
  '/assignments/:id/inspect',
  requirePermission('housekeeping.inspect'),
  validate(inspectionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await hkService.inspectRoom(
      user.tenantId, user.hotelId, req.params.id, user.id, req.body,
    );
    res.json(result);
  }),
);

router.put(
  '/rooms/:id/status',
  requirePermission('housekeeping.rooms.update_status'),
  validate(updateRoomStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { status, notes } = req.body;
    const result = await updateRoomStatusCore(
      user.tenantId, req.params.id, status, user.id, notes,
    );
    res.json(result);
  }),
);

router.get(
  '/board',
  requirePermission('housekeeping.assignments.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { zone } = req.query as { zone?: string };
    const board = await hkService.getBoard(user.tenantId, user.hotelId, zone);
    res.json(board);
  }),
);

router.get(
  '/dashboard',
  requirePermission('housekeeping.assignments.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const dashboard = await hkService.getDashboard(user.tenantId, user.hotelId);
    res.json(dashboard);
  }),
);

router.get(
  '/stats',
  requirePermission('housekeeping.assignments.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const dashboard = await hkService.getDashboard(user.tenantId, user.hotelId);
    res.json(dashboard.assignments);
  }),
);

router.post(
  '/schedule/generate',
  requirePermission('housekeeping.schedule.generate'),
  validate(generateScheduleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await hkService.generateHousekeepingSchedule(
      user.tenantId, user.hotelId, user.id, req.body,
    );
    res.status(201).json(result);
  }),
);

router.post(
  '/dnd',
  requirePermission('housekeeping.assignments.update'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { assignmentId, attemptNumber } = req.body;
    const result = await hkService.handleDND(
      user.tenantId, user.hotelId, assignmentId, user.id, attemptNumber,
    );
    res.json(result);
  }),
);

export default router;
