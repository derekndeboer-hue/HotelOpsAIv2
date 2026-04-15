import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { setTenantContext } from '../../middleware/tenant';
import * as scheduleService from './schedule.service';

const router = Router();

router.use(authenticate, setTenantContext);

/**
 * POST /api/schedule/generate
 * Generate a schedule (engineering or housekeeping).
 */
router.post(
  '/generate',
  requireRole('eng_supervisor', 'hk_supervisor', 'management', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { type, date } = req.body;
    const scheduleDate = date || new Date().toISOString().split('T')[0];

    let result;
    if (type === 'engineering') {
      result = await scheduleService.generateEngineeringSchedule(
        user.tenantId, user.hotelId, scheduleDate, user.id
      );
    } else {
      result = await scheduleService.generateHousekeepingSchedule(
        user.tenantId, user.hotelId, scheduleDate, user.id
      );
    }

    res.json(result);
  })
);

/**
 * GET /api/schedule/review
 * Review a draft schedule.
 */
router.get(
  '/review',
  requireRole('eng_supervisor', 'hk_supervisor', 'management', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { scheduleId } = req.query;
    // Return schedule details for review
    const result = await import('../../config/database').then((db) =>
      db.query(
        `SELECT * FROM schedules WHERE id = $1 AND tenant_id = $2`,
        [scheduleId, user.tenantId]
      )
    );
    res.json(result.rows[0] || null);
  })
);

/**
 * PUT /api/schedule/edit
 * Edit a draft schedule.
 */
router.put(
  '/edit',
  requireRole('eng_supervisor', 'hk_supervisor', 'management', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { scheduleId, tasks } = req.body;
    // Update schedule tasks
    const db = await import('../../config/database');
    await db.query(
      `UPDATE schedules SET tasks = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
      [JSON.stringify(tasks), scheduleId, user.tenantId]
    );
    res.json({ scheduleId, status: 'updated' });
  })
);

/**
 * POST /api/schedule/publish
 */
router.post(
  '/publish',
  requireRole('eng_supervisor', 'hk_supervisor', 'management', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { scheduleId } = req.body;
    const result = await scheduleService.publishSchedule(
      user.tenantId, user.hotelId, scheduleId, user.id
    );
    res.json(result);
  })
);

/**
 * GET /api/schedule/my
 * Get the current user's schedule.
 */
router.get(
  '/my',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const tasks = await scheduleService.getMySchedule(user.tenantId, user.id, date);
    res.json(tasks);
  })
);

/**
 * PUT /api/schedule/tasks/:id
 * Update task status.
 */
router.put(
  '/tasks/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { status, notes, photoUrl } = req.body;
    const result = await scheduleService.updateTaskStatus(
      user.tenantId, req.params.id, user.id, status, { notes, photoUrl }
    );
    res.json(result);
  })
);

/**
 * POST /api/schedule/tasks/:id/extend
 * Request time extension for a task.
 */
router.post(
  '/tasks/:id/extend',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { additionalMinutes, reason } = req.body;
    const result = await scheduleService.requestTimeExtension(
      user.tenantId, req.params.id, user.id, additionalMinutes, reason
    );
    res.json(result);
  })
);

/**
 * POST /api/schedule/clock
 * Clock in/out of a room.
 */
router.post(
  '/clock',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { roomId, action } = req.body;
    const result = await scheduleService.roomClockInOut(
      user.tenantId, user.hotelId, user.id, roomId, action
    );
    res.json(result);
  })
);

export default router;
