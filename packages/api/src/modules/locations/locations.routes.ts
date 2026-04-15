import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import { query } from '../../config/database';

const router = Router();

router.use(authenticate, setTenantContext);

router.get(
  '/',
  requirePermission('rooms.status.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { type, zone } = req.query as { type?: string; zone?: string };

    const where: string[] = ['tenant_id = $1', 'hotel_id = $2', 'is_active = true'];
    const params: any[] = [user.tenantId, user.hotelId];
    let idx = 3;
    if (type) { where.push(`location_type = $${idx}`); params.push(type); idx++; }
    if (zone) { where.push(`zone = $${idx}`); params.push(zone); idx++; }

    const result = await query(
      `SELECT id, name, slug, location_type, category, zone, building, is_active
       FROM locations
       WHERE ${where.join(' AND ')}
       ORDER BY zone, name`,
      params,
    );

    res.json(
      result.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        locationType: r.location_type,
        category: r.category,
        zone: r.zone,
        building: r.building,
        isActive: r.is_active,
      })),
    );
  }),
);

export default router;
