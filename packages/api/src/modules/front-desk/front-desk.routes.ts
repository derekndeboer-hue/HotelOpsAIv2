import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import { validate } from '../../middleware/validate';
import {
  checkInSchema,
  checkOutSchema,
  roomAssignmentSchema,
  walkInSchema,
} from '@hotel-ops/shared/validators/front-desk';
import * as frontDeskService from './front-desk.service';

const router = Router();

router.use(authenticate, setTenantContext);

// GET /api/front-desk/dashboard
router.get(
  '/dashboard',
  requirePermission('front_desk.dashboard.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const dashboard = await frontDeskService.getDashboard(user.hotelId);
    res.json(dashboard);
  }),
);

// POST /api/front-desk/check-in
router.post(
  '/check-in',
  requirePermission('reservations.check_in'),
  validate(checkInSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await frontDeskService.processCheckIn(user.id, req.body);
    res.json(result);
  }),
);

// POST /api/front-desk/check-out
router.post(
  '/check-out',
  requirePermission('reservations.check_out'),
  validate(checkOutSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await frontDeskService.processCheckOut(user.id, req.body);
    res.json(result);
  }),
);

// POST /api/front-desk/assign-room
router.post(
  '/assign-room',
  requirePermission('rooms.assign'),
  validate(roomAssignmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await frontDeskService.assignRoom(user.id, req.body);
    res.json(result);
  }),
);

// POST /api/front-desk/walk-in
router.post(
  '/walk-in',
  requirePermission('reservations.check_in'),
  validate(walkInSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await frontDeskService.processWalkIn(user.id, user.hotelId, req.body);
    res.status(201).json(result);
  }),
);

// Legacy handoff routes — kept as-is, permission guarded
router.get(
  '/handoff',
  requirePermission('handoff.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const handoffs = await frontDeskService.getHandoffReport(user.hotelId);
    res.json(handoffs);
  }),
);

router.post(
  '/handoff/notes',
  requirePermission('handoff.create'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { handoffId, note } = req.body;
    const result = await frontDeskService.addHandoffNote(handoffId, user.id, note);
    res.status(201).json(result);
  }),
);

router.post(
  '/handoff/acknowledge',
  requirePermission('handoff.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { handoffId } = req.body;
    const result = await frontDeskService.acknowledgeHandoff(handoffId, user.id);
    res.json(result);
  }),
);

router.post(
  '/handoff/generate',
  requirePermission('handoff.create'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { shift, notes } = req.body;
    const result = await frontDeskService.generateShiftHandoff(user.id, user.hotelId, shift, notes);
    res.status(201).json(result);
  }),
);

export default router;
