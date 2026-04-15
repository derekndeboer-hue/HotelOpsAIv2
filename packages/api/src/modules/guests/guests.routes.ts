import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import * as guestsService from './guests.service';

const router = Router();

router.use(authenticate, setTenantContext);

// GET /api/guests
router.get(
  '/',
  requirePermission('guests.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { q, limit } = req.query;
    const guests = await guestsService.searchGuests(
      user.hotelId,
      (q as string) || '',
      limit ? parseInt(limit as string, 10) : 20,
    );
    res.json(guests);
  }),
);

// GET /api/guests/upcoming-rg
router.get(
  '/upcoming-rg',
  requirePermission('guests.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const guests = await guestsService.getUpcomingRepeatGuests(user.hotelId);
    res.json(guests);
  }),
);

// GET /api/guests/:id
router.get(
  '/:id',
  requirePermission('guests.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const profile = await guestsService.getGuestProfile(req.params.id);
    res.json(profile);
  }),
);

// POST /api/guests
router.post(
  '/',
  requirePermission('guests.create'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const guest = await guestsService.createGuest(user.hotelId, req.body);
    res.status(201).json(guest);
  }),
);

// PUT /api/guests/:id
router.put(
  '/:id',
  requirePermission('guests.edit'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await guestsService.updateGuest(req.params.id, req.body);
    res.json(result);
  }),
);

// POST /api/guests/:id/practices
router.post(
  '/:id/practices',
  requirePermission('guests.edit'),
  asyncHandler(async (req: Request, res: Response) => {
    const practice = await guestsService.addPractice(req.params.id, req.body);
    res.status(201).json(practice);
  }),
);

// GET /api/guests/:id/practices
router.get(
  '/:id/practices',
  requirePermission('guests.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const practices = await guestsService.getPractices(req.params.id);
    res.json(practices);
  }),
);

// POST /api/guests/:id/preferences
router.post(
  '/:id/preferences',
  requirePermission('guests.edit'),
  asyncHandler(async (req: Request, res: Response) => {
    const pref = await guestsService.addPreference(req.params.id, req.body);
    res.status(201).json(pref);
  }),
);

export default router;
