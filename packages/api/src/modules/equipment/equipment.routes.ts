import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import { validate } from '../../middleware/validate';
import { createEquipmentSchema } from '../../utils/validators';
import * as equipmentService from './equipment.service';

const router = Router();

router.use(authenticate, setTenantContext);

/**
 * GET /api/equipment
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { category, status, location } = req.query;
    const equipment = await equipmentService.listEquipment(user.tenantId, user.hotelId, {
      category: category as string,
      status: status as string,
      location: location as string,
    });
    res.json(equipment);
  })
);

/**
 * GET /api/equipment/:id — Profile with history.
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const profile = await equipmentService.getEquipmentProfile(user.tenantId, req.params.id);
    res.json(profile);
  })
);

/**
 * POST /api/equipment
 */
router.post(
  '/',
  requireRole('engineer', 'maint_tech', 'maint_supervisor', 'management', 'admin'),
  validate(createEquipmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await equipmentService.createEquipment(
      user.tenantId, user.hotelId, user.id, req.body
    );
    res.status(201).json(result);
  })
);

/**
 * PUT /api/equipment/:id
 */
router.put(
  '/:id',
  requireRole('engineer', 'maint_tech', 'maint_supervisor', 'management', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await equipmentService.updateEquipment(
      user.tenantId, req.params.id, user.id, req.body
    );
    res.json(result);
  })
);

/**
 * POST /api/equipment/:id/decommission
 */
router.post(
  '/:id/decommission',
  requireRole('maint_supervisor', 'management', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { reason } = req.body;
    const result = await equipmentService.decommissionEquipment(
      user.tenantId, req.params.id, user.id, reason
    );
    res.json(result);
  })
);

/**
 * POST /api/equipment/:id/photos
 */
router.post(
  '/:id/photos',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await equipmentService.addPhoto(
      user.tenantId, req.params.id, user.id, req.body
    );
    res.status(201).json(result);
  })
);

/**
 * POST /api/equipment/:id/photos/:photoId/review
 */
router.post(
  '/:id/photos/:photoId/review',
  requireRole('eng_supervisor', 'management', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { status, notes } = req.body;
    const result = await equipmentService.reviewPhoto(
      user.tenantId, req.params.photoId, user.id, status, notes
    );
    res.json(result);
  })
);

export default router;
