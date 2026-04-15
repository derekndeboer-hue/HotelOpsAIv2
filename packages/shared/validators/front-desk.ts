import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const reservationStatusEnum = z.enum([
  'pending',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
  'no_show',
]);

export const reservationSourceEnum = z.enum(['direct', 'ota', 'walk_in', 'phone', 'group']);

export const ratePlanEnum = z.enum(['rack', 'bar', 'package', 'corporate', 'gov', 'comp']);

export const paymentMethodEnum = z.enum([
  'credit_card',
  'debit_card',
  'cash',
  'corporate_account',
  'comp',
]);

export const guestRequestTypeEnum = z.enum([
  'amenity',
  'maintenance',
  'housekeeping',
  'concierge',
  'other',
]);

export const guestRequestStatusEnum = z.enum([
  'open',
  'routed',
  'in_progress',
  'resolved',
  'cancelled',
]);

export const guestRequestPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

// ── Schemas ───────────────────────────────────────────────────────────────────

export const createReservationSchema = z
  .object({
    guestFirstName: z.string().trim().min(1).max(80),
    guestLastName: z.string().trim().min(1).max(80),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().trim().max(30).optional(),
    roomType: z.string().trim().min(1).max(40),
    arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    adults: z.number().int().min(1).max(10).default(1),
    children: z.number().int().min(0).max(10).default(0),
    ratePlan: ratePlanEnum.default('rack'),
    specialRequests: z.string().trim().max(2000).optional(),
    source: reservationSourceEnum.default('direct'),
    confirmationNumber: z.string().trim().max(40).optional(),
  })
  .refine((v) => v.departureDate > v.arrivalDate, {
    message: 'Departure must be after arrival',
    path: ['departureDate'],
  });

export const updateReservationSchema = z
  .object({
    arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    adults: z.number().int().min(1).max(10).optional(),
    children: z.number().int().min(0).max(10).optional(),
    ratePlan: ratePlanEnum.optional(),
    specialRequests: z.string().trim().max(2000).optional(),
    status: reservationStatusEnum.optional(),
    roomId: z.string().uuid().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No updates supplied' })
  .refine(
    (v) => {
      if (v.arrivalDate && v.departureDate) return v.departureDate > v.arrivalDate;
      return true;
    },
    { message: 'Departure must be after arrival', path: ['departureDate'] },
  );

export const checkInSchema = z.object({
  reservationId: z.string().uuid(),
  assignedRoomId: z.string().uuid(),
  idVerified: z.literal(true, {
    errorMap: () => ({ message: 'ID verification is required before check-in' }),
  }),
  paymentMethod: paymentMethodEnum,
  incidentalsAuthorized: z.boolean().default(false),
  keyCardsIssued: z.number().int().min(1).max(4).default(1),
  arrivalNotes: z.string().trim().max(2000).optional(),
  overrideReason: z.string().trim().max(500).optional(),
});

export const checkOutSchema = z.object({
  reservationId: z.string().uuid(),
  finalChargesReviewed: z.boolean(),
  folioSettled: z.boolean(),
  keyCardsReturned: z.number().int().min(0).max(4).default(0),
  departureNotes: z.string().trim().max(2000).optional(),
  forwardingAddress: z.string().trim().max(500).optional(),
});

export const roomAssignmentSchema = z.object({
  reservationId: z.string().uuid(),
  roomId: z.string().uuid(),
  overrideReason: z.string().trim().max(500).optional(),
});

export const walkInSchema = z
  .object({
    guestFirstName: z.string().trim().min(1).max(80),
    guestLastName: z.string().trim().min(1).max(80),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().trim().max(30).optional(),
    roomType: z.string().trim().min(1).max(40),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    adults: z.number().int().min(1).max(10).default(1),
    children: z.number().int().min(0).max(10).default(0),
    ratePlan: ratePlanEnum.default('rack'),
    specialRequests: z.string().trim().max(2000).optional(),
    assignedRoomId: z.string().uuid(),
    idVerified: z.literal(true, {
      errorMap: () => ({ message: 'ID verification is required for walk-in check-in' }),
    }),
    paymentMethod: paymentMethodEnum,
    incidentalsAuthorized: z.boolean().default(false),
    keyCardsIssued: z.number().int().min(1).max(4).default(1),
  })
  .refine(
    (v) => {
      const today = new Date().toISOString().slice(0, 10);
      return v.departureDate > today;
    },
    { message: 'Departure date must be in the future', path: ['departureDate'] },
  );

export const guestRequestSchema = z.object({
  reservationId: z.string().uuid().optional(),
  guestId: z.string().uuid(),
  requestType: guestRequestTypeEnum,
  description: z.string().trim().min(1).max(2000),
  priority: guestRequestPriorityEnum.default('normal'),
  roomId: z.string().uuid().optional(),
  routeToDepartment: z.string().trim().max(40).optional(),
});

export const reservationFilterSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: reservationStatusEnum.optional(),
  source: reservationSourceEnum.optional(),
  guestName: z.string().trim().max(100).optional(),
  confirmationNumber: z.string().trim().max(40).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type ReservationStatus = z.infer<typeof reservationStatusEnum>;
export type ReservationSource = z.infer<typeof reservationSourceEnum>;
export type RatePlan = z.infer<typeof ratePlanEnum>;
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;
export type GuestRequestType = z.infer<typeof guestRequestTypeEnum>;
export type GuestRequestStatus = z.infer<typeof guestRequestStatusEnum>;
export type GuestRequestPriority = z.infer<typeof guestRequestPriorityEnum>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type RoomAssignmentInput = z.infer<typeof roomAssignmentSchema>;
export type WalkInInput = z.infer<typeof walkInSchema>;
export type GuestRequestInput = z.infer<typeof guestRequestSchema>;
export type ReservationFilterInput = z.infer<typeof reservationFilterSchema>;
