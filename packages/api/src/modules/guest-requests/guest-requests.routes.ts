import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import { validate } from '../../middleware/validate';
import { guestRequestSchema } from '@hotel-ops/shared/validators/front-desk';
import * as guestRequestsService from './guest-requests.service';

const router = Router();

router.use(authenticate, setTenantContext);

// GET /api/guest-requests
router.get(
  '/',
  requirePermission('front_desk.dashboard.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { status, requestType, limit, offset } = req.query;
    const results = await guestRequestsService.listGuestRequests(user.hotelId, {
      status: status as string | undefined,
      requestType: requestType as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json(results);
  }),
);

// POST /api/guest-requests
router.post(
  '/',
  requirePermission('guest_requests.create'),
  validate(guestRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await guestRequestsService.createGuestRequest(user.id, user.hotelId, req.body);
    res.status(201).json(result);
  }),
);

// PUT /api/guest-requests/:id/resolve
router.put(
  '/:id/resolve',
  requirePermission('guest_requests.route'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await guestRequestsService.resolveGuestRequest(
      req.params.id,
      user.id,
      req.body.resolutionNote,
    );
    res.json(result);
  }),
);

export default router;
