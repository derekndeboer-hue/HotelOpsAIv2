import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import * as staffService from './staff.service';

const router = Router();

router.use(authenticate, setTenantContext, requireRole('management', 'admin'));

/**
 * GET /api/staff
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { role, department, isActive } = req.query;
    const staff = await staffService.listStaff(user.tenantId, user.hotelId, {
      role: role as string,
      department: department as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    res.json(staff);
  })
);

/**
 * POST /api/staff
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await staffService.createStaff(user.tenantId, user.hotelId, req.body);
    res.status(201).json(result);
  })
);

/**
 * PUT /api/staff/:id
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await staffService.updateStaff(user.tenantId, req.params.id, req.body);
    res.json(result);
  })
);

/**
 * DELETE /api/staff/:id — Soft delete.
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await staffService.deleteStaff(user.tenantId, req.params.id);
    res.json(result);
  })
);

/**
 * POST /api/staff/roster — Import roster from CSV.
 */
router.post(
  '/roster',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await staffService.importRoster(user.tenantId, user.hotelId, req.body.csvData);
    res.json(result);
  })
);

export default router;
