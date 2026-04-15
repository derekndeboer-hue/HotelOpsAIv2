import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import { validate } from '../../middleware/validate';
import { createComplianceSchema } from '../../utils/validators';
import * as complianceService from './compliance.service';

const router = Router();

router.use(authenticate, setTenantContext);

/**
 * GET /api/compliance
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { category, status } = req.query;
    const items = await complianceService.listComplianceItems(user.tenantId, user.hotelId, {
      category: category as string,
      status: status as string,
    });
    res.json(items);
  })
);

/**
 * POST /api/compliance
 */
router.post(
  '/',
  requireRole('eng_supervisor', 'management', 'admin'),
  validate(createComplianceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await complianceService.createComplianceItem(
      user.tenantId, user.hotelId, user.id, req.body
    );
    res.status(201).json(result);
  })
);

/**
 * PUT /api/compliance/:id
 */
router.put(
  '/:id',
  requireRole('eng_supervisor', 'management', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await complianceService.updateComplianceItem(
      user.tenantId, req.params.id, req.body
    );
    res.json(result);
  })
);

/**
 * POST /api/compliance/:id/complete
 */
router.post(
  '/:id/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await complianceService.recordCompletion(
      user.tenantId, user.hotelId, req.params.id, user.id, req.body
    );
    res.json(result);
  })
);

/**
 * GET /api/compliance/dashboard
 */
router.get(
  '/dashboard',
  requireRole('eng_supervisor', 'management', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const dashboard = await complianceService.getDashboard(user.tenantId, user.hotelId);
    res.json(dashboard);
  })
);

/**
 * GET /api/compliance/report
 */
router.get(
  '/report',
  requireRole('management', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const alerts = await complianceService.runAlertEngine(user.tenantId, user.hotelId);
    res.json(alerts);
  })
);

export default router;
