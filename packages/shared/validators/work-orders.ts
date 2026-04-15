import { z } from 'zod';

export const workOrderCategoryEnum = z.enum([
  'plumbing',
  'electrical',
  'hvac',
  'furniture',
  'appliance',
  'general',
  'safety',
  'cosmetic',
]);

export const workOrderPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const workOrderStatusEnum = z.enum([
  'open',
  'assigned',
  'in_progress',
  'on_hold',
  'pending_review',
  'completed',
  'cancelled',
]);

export const workOrderTargetSchema = z
  .object({
    roomId: z.string().uuid().optional(),
    roomNumber: z.string().trim().min(1).optional(),
    locationId: z.string().uuid().optional(),
  })
  .refine(
    (t) => !(t.roomId && t.locationId) && !(t.roomNumber && t.locationId),
    { message: 'roomId/roomNumber and locationId are mutually exclusive' },
  );

export const createWorkOrderSchema = z
  .object({
    title: z.string().trim().min(1, 'Title required').max(200),
    description: z.string().trim().min(1, 'Description required').max(5000),
    category: workOrderCategoryEnum,
    priority: workOrderPriorityEnum.default('medium'),
    roomId: z.string().uuid().optional(),
    roomNumber: z.string().trim().min(1).optional(),
    locationId: z.string().uuid().optional(),
    assignedTo: z.string().uuid().optional(),
    dueDate: z.string().datetime({ offset: true }).optional(),
    photos: z.array(z.string().url()).max(10).optional(),
  })
  .refine((v) => !(v.roomId && v.locationId) && !(v.roomNumber && v.locationId), {
    message: 'A work order targets either a room or a location, not both',
    path: ['locationId'],
  });

export const updateWorkOrderSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(5000).optional(),
    status: workOrderStatusEnum.optional(),
    priority: workOrderPriorityEnum.optional(),
    assignedTo: z.string().uuid().nullable().optional(),
    notes: z.string().trim().max(5000).optional(),
    dueDate: z.string().datetime({ offset: true }).nullable().optional(),
    startedAt: z.string().datetime({ offset: true }).optional(),
    completedAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No updates supplied' });

export const workOrderFilterSchema = z.object({
  status: workOrderStatusEnum.optional(),
  priority: workOrderPriorityEnum.optional(),
  category: workOrderCategoryEnum.optional(),
  assignedTo: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  targetType: z.enum(['room', 'location', 'any']).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const workOrderCommentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export const workOrderPhotoSchema = z.object({
  url: z.string().url(),
  caption: z.string().trim().max(500).optional(),
});

export type WorkOrderCategoryInput = z.infer<typeof workOrderCategoryEnum>;
export type WorkOrderPriorityInput = z.infer<typeof workOrderPriorityEnum>;
export type WorkOrderStatusInput = z.infer<typeof workOrderStatusEnum>;
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type WorkOrderFilterInput = z.infer<typeof workOrderFilterSchema>;
export type WorkOrderCommentInput = z.infer<typeof workOrderCommentSchema>;
export type WorkOrderPhotoInput = z.infer<typeof workOrderPhotoSchema>;
