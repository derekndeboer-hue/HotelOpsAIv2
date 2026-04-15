import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import { validate } from '../../middleware/validate';
import { updateRoomStatusSchema } from '../../utils/validators';
import * as roomsService from './rooms.service';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, setTenantContext);

/**
 * GET /api/rooms
 * List rooms with optional filters (status, floor, type, zone).
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { status, floor, type, zone } = req.query;
    const rooms = await roomsService.listRooms(user.tenantId, user.hotelId, {
      status: status as string,
      floor: floor ? parseInt(floor as string, 10) : undefined,
      type: type as string,
      zone: zone as string,
    });
    res.json(rooms);
  })
);

/**
 * GET /api/rooms/board
 * Optimized room board view with assignments and guest info.
 */
router.get(
  '/board',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const board = await roomsService.getRoomBoard(user.tenantId, user.hotelId);
    res.json(board);
  })
);

/**
 * GET /api/rooms/:id
 * Get detailed room info including current guest and reservation.
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const room = await roomsService.getRoomById(user.tenantId, req.params.id);
    res.json(room);
  })
);

/**
 * PUT /api/rooms/:id/status
 * Update room status. Restricted to housekeeping, supervisors, management, admin.
 */
router.put(
  '/:id/status',
  requireRole('housekeeper', 'hk_supervisor', 'management', 'admin'),
  validate(updateRoomStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { status, notes } = req.body;
    const result = await roomsService.updateRoomStatus(
      user.tenantId,
      req.params.id,
      status,
      user.id,
      notes
    );
    res.json(result);
  })
);

/**
 * GET /api/rooms/:id/pipeline
 * Get the current pipeline status for a room (turn process state).
 */
router.get(
  '/:id/pipeline',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const pipeline = await roomsService.getRoomPipelineStatus(user.tenantId, req.params.id);
    res.json(pipeline);
  })
);

export default router;
