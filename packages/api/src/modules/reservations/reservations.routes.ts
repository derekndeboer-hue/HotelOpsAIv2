import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import { validate } from '../../middleware/validate';
import {
  createReservationSchema,
  updateReservationSchema,
  reservationFilterSchema,
} from '@hotel-ops/shared/validators/front-desk';
import * as reservationsService from './reservations.service';

const router = Router();

router.use(authenticate, setTenantContext);

// GET /api/reservations
router.get(
  '/',
  requirePermission('reservations.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const filters = reservationFilterSchema.parse(req.query);
    const reservations = await reservationsService.searchReservations(user.hotelId, filters);
    res.json(reservations);
  }),
);

// GET /api/reservations/availability
router.get(
  '/availability',
  requirePermission('reservations.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { arrivalDate, departureDate, roomType } = req.query;
    const rooms = await reservationsService.checkAvailability(
      user.hotelId,
      arrivalDate as string,
      departureDate as string,
      roomType as string | undefined,
    );
    res.json(rooms);
  }),
);

// GET /api/reservations/:id
router.get(
  '/:id',
  requirePermission('reservations.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const reservation = await reservationsService.getReservation(req.params.id);
    res.json(reservation);
  }),
);

// POST /api/reservations
router.post(
  '/',
  requirePermission('reservations.create'),
  validate(createReservationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await reservationsService.createReservation(user.hotelId, user.id, req.body);
    res.status(201).json(result);
  }),
);

// PUT /api/reservations/:id
router.put(
  '/:id',
  requirePermission('reservations.edit'),
  validate(updateReservationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await reservationsService.updateReservation(req.params.id, user.id, req.body);
    res.json(result);
  }),
);

// DELETE /api/reservations/:id
router.delete(
  '/:id',
  requirePermission('reservations.delete'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await reservationsService.cancelReservation(req.params.id, user.id, req.body.reason);
    res.json({ cancelled: true });
  }),
);

export default router;
