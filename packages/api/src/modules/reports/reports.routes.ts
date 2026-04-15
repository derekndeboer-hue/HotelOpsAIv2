import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requirePermission } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import { reportRangeSchema, reportExportSchema } from '@hotel-ops/shared/validators/reports';
import * as reportsService from './reports.service';

const router = Router();

router.use(authenticate, setTenantContext);

/** GET /api/reports/kpi — management/admin only */
router.get(
  '/kpi',
  requirePermission('reports.operational.view', 'reports.financial.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const range = reportRangeSchema.parse(req.query);
    res.json(await reportsService.getKpiSummary(range));
  }),
);

/** GET /api/reports/occupancy */
router.get(
  '/occupancy',
  requirePermission('reports.operational.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const range = reportRangeSchema.parse(req.query);
    res.json(await reportsService.getOccupancyReport(range));
  }),
);

/** GET /api/reports/work-orders */
router.get(
  '/work-orders',
  requirePermission('reports.operational.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const range = reportRangeSchema.parse(req.query);
    res.json(await reportsService.getWorkOrderReport(range));
  }),
);

/** GET /api/reports/housekeeping */
router.get(
  '/housekeeping',
  requirePermission('reports.operational.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const range = reportRangeSchema.parse(req.query);
    res.json(await reportsService.getHousekeepingReport(range));
  }),
);

/** GET /api/reports/guest-requests */
router.get(
  '/guest-requests',
  requirePermission('reports.operational.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const range = reportRangeSchema.parse(req.query);
    res.json(await reportsService.getGuestRequestReport(range));
  }),
);

/** GET /api/reports/labor — management + admin only */
router.get(
  '/labor',
  requirePermission('reports.labor.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const range = reportRangeSchema.parse(req.query);
    res.json(await reportsService.getLaborReport(range));
  }),
);

/** GET /api/reports/response-times */
router.get(
  '/response-times',
  requirePermission('reports.operational.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const range = reportRangeSchema.parse(req.query);
    res.json(await reportsService.getResponseTimeReport(range));
  }),
);

/** GET /api/reports/:type/export */
router.get(
  '/:type/export',
  requirePermission('reports.export'),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = reportExportSchema.parse({
      ...req.query,
      report_type: req.params.type,
    });
    const result = await reportsService.exportReport(
      parsed.report_type,
      { from: parsed.from, to: parsed.to, zone: parsed.zone, granularity: parsed.granularity },
      parsed.format,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }),
);

export default router;
