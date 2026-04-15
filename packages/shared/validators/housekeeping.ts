import { z } from 'zod';

export const cleaningTypeEnum = z.enum([
  'checkout',
  'stayover',
  'deep_clean',
  'touch_up',
  'turndown',
  'common_area',
]);

export const hkAssignmentStatusEnum = z.enum([
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'inspection_pending',
  'inspected',
  'failed_inspection',
  'dnd_pending',
  'dnd_escalated',
]);

export const roomHkStatusEnum = z.enum([
  'vacant_dirty',
  'cleaning_in_progress',
  'vacant_clean',
  'inspection_pending',
  'vacant_inspected',
  'ready_for_checkin',
  'out_of_order',
  'out_of_service',
]);

export const hkShiftEnum = z.enum(['morning', 'midday', 'evening']);

export const inspectionResultEnum = z.enum(['pass', 'fail']);

export const targetTypeEnum = z.enum(['room', 'common', 'any']);

export const createAssignmentSchema = z
  .object({
    roomId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
    cleaningType: cleaningTypeEnum,
    priority: z.number().int().min(0).max(10).default(0),
    assignedTo: z.string().uuid(),
    assignmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    estimatedMinutes: z.number().int().positive().max(480).optional(),
    isFixed: z.boolean().optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (v) => (v.roomId ? 1 : 0) + (v.locationId ? 1 : 0) === 1,
    { message: 'Provide exactly one of roomId or locationId', path: ['roomId'] },
  );

export const createAssignmentsBulkSchema = z.object({
  assignments: z.array(createAssignmentSchema).min(1).max(200),
});

export const updateAssignmentSchema = z
  .object({
    status: hkAssignmentStatusEnum.optional(),
    assignedTo: z.string().uuid().optional(),
    priority: z.number().int().min(0).max(10).optional(),
    notes: z.string().trim().max(2000).optional(),
    estimatedMinutes: z.number().int().positive().max(480).optional(),
    startedAt: z.string().datetime({ offset: true }).optional(),
    completedAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No updates supplied' });

// Legal housekeeper-driven transitions (no inspection bypass here).
const LEGAL_ROOM_TRANSITIONS: Record<string, string[]> = {
  vacant_dirty: ['cleaning_in_progress', 'out_of_service'],
  cleaning_in_progress: ['inspection_pending', 'vacant_dirty'],
  inspection_pending: ['cleaning_in_progress'],
  vacant_clean: ['cleaning_in_progress', 'out_of_service'],
  vacant_inspected: ['cleaning_in_progress'],
  ready_for_checkin: ['cleaning_in_progress'],
  out_of_order: ['vacant_dirty'],
  out_of_service: ['vacant_dirty'],
};

export const updateRoomStatusSchema = z.object({
  status: roomHkStatusEnum,
  fromStatus: roomHkStatusEnum.optional(),
  notes: z.string().trim().max(1000).optional(),
}).refine(
  (v) => {
    if (!v.fromStatus) return true;
    const legal = LEGAL_ROOM_TRANSITIONS[v.fromStatus] ?? [];
    return legal.includes(v.status);
  },
  { message: 'Illegal status transition for a housekeeper', path: ['status'] },
);

export const inspectionSchema = z.object({
  result: inspectionResultEnum,
  notes: z.string().trim().max(2000).optional(),
  failureReasons: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
}).refine(
  (v) => v.result === 'pass' || (v.failureReasons && v.failureReasons.length > 0),
  { message: 'Failed inspections require at least one failure reason', path: ['failureReasons'] },
);

export const assignmentFilterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  assignedTo: z.string().uuid().optional(),
  status: hkAssignmentStatusEnum.optional(),
  targetType: targetTypeEnum.optional(),
  locationId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const generateScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  strategy: z.enum(['even', 'by_zone', 'load_balanced']).default('by_zone'),
  includeCommonAreas: z.boolean().default(true),
  dryRun: z.boolean().default(false),
});

export type CleaningType = z.infer<typeof cleaningTypeEnum>;
export type HkAssignmentStatus = z.infer<typeof hkAssignmentStatusEnum>;
export type RoomHkStatus = z.infer<typeof roomHkStatusEnum>;
export type HkShift = z.infer<typeof hkShiftEnum>;
export type InspectionResult = z.infer<typeof inspectionResultEnum>;
export type TargetType = z.infer<typeof targetTypeEnum>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type CreateAssignmentsBulkInput = z.infer<typeof createAssignmentsBulkSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type UpdateRoomStatusInput = z.infer<typeof updateRoomStatusSchema>;
export type InspectionInput = z.infer<typeof inspectionSchema>;
export type AssignmentFilterInput = z.infer<typeof assignmentFilterSchema>;
export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;
