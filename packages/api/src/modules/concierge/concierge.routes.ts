import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import * as conciergeService from './concierge.service';

const router = Router();

router.use(authenticate, setTenantContext);

/**
 * GET /api/concierge/directory
 */
router.get(
  '/directory',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { category, search } = req.query;
    const entries = await conciergeService.getDirectory(user.tenantId, user.hotelId, {
      category: category as string,
      search: search as string,
    });
    res.json(entries);
  })
);

/**
 * POST /api/concierge/directory
 */
router.post(
  '/directory',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await conciergeService.addDirectoryEntry(
      user.tenantId, user.hotelId, user.id, req.body
    );
    res.status(201).json(result);
  })
);

/**
 * PUT /api/concierge/directory/:id
 */
router.put(
  '/directory/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await conciergeService.updateDirectoryEntry(
      user.tenantId, req.params.id, req.body
    );
    res.json(result);
  })
);

/**
 * POST /api/concierge/inquiry
 */
router.post(
  '/inquiry',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await conciergeService.handleInquiry(
      user.tenantId, user.hotelId, user.id, req.body
    );
    res.json(result);
  })
);

/**
 * POST /api/concierge/booking
 */
router.post(
  '/booking',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await conciergeService.logBooking(
      user.tenantId, user.hotelId, user.id, req.body
    );
    res.status(201).json(result);
  })
);

/**
 * GET /api/concierge/history/:guestId
 */
router.get(
  '/history/:guestId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const history = await conciergeService.getGuestHistory(user.tenantId, req.params.guestId);
    res.json(history);
  })
);

export default router;
