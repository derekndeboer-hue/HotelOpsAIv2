import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export const createWorkOrderSchema = z.object({
  roomId: z.string().uuid().optional(),
  roomNumber: z.string().optional(),
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().min(1, 'Description required'),
  category: z.enum([
    'plumbing', 'electrical', 'hvac', 'carpentry', 'painting',
    'appliance', 'furniture', 'exterior', 'safety', 'other',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  photos: z.array(z.string().url()).optional(),
});

export const updateRoomStatusSchema = z.object({
  status: z.enum([
    'vacant_clean', 'vacant_dirty', 'vacant_inspected',
    'occupied', 'out_of_order', 'out_of_service',
    'due_out', 'checkout', 'ready_for_checkin',
    'cleaning_in_progress', 'inspection_pending',
  ]),
  notes: z.string().optional(),
});

export const createGuestSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  vipStatus: z.enum(['none', 'silver', 'gold', 'platinum', 'diamond']).default('none'),
  notes: z.string().optional(),
  preferences: z.record(z.any()).optional(),
});

export const processCheckInSchema = z.object({
  reservationId: z.string().uuid(),
  roomId: z.string().uuid(),
  guestId: z.string().uuid(),
  idVerified: z.boolean(),
  creditCardOnFile: z.boolean(),
  specialRequests: z.string().optional(),
  estimatedDeparture: z.string().optional(),
});

export const processCheckOutSchema = z.object({
  reservationId: z.string().uuid(),
  roomId: z.string().uuid(),
  guestId: z.string().uuid(),
  folioSettled: z.boolean(),
  minibarCharges: z.number().optional(),
  damageReport: z.string().optional(),
  feedbackScore: z.number().min(1).max(10).optional(),
  feedbackNotes: z.string().optional(),
});

export const createEquipmentSchema = z.object({
  name: z.string().min(1, 'Name required'),
  category: z.enum([
    'hvac', 'plumbing', 'electrical', 'kitchen', 'laundry',
    'elevator', 'pool', 'fire_safety', 'security', 'other',
  ]),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  installDate: z.string().optional(),
  warrantyExpiration: z.string().optional(),
  notes: z.string().optional(),
});

export const createComplianceSchema = z.object({
  name: z.string().min(1, 'Name required'),
  category: z.enum([
    'fire_safety', 'health', 'building', 'ada', 'environmental',
    'food_safety', 'pool', 'elevator', 'electrical', 'other',
  ]),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual']),
  description: z.string().optional(),
  responsibleRole: z.string().optional(),
  regulatoryBody: z.string().optional(),
  dueDate: z.string().optional(),
});

export const logComplaintSchema = z.object({
  guestId: z.string().uuid().optional(),
  roomNumber: z.string().optional(),
  category: z.enum([
    'noise', 'cleanliness', 'maintenance', 'service',
    'food', 'billing', 'amenities', 'safety', 'other',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(1, 'Description required'),
  actionTaken: z.string().optional(),
  compensationOffered: z.string().optional(),
});
