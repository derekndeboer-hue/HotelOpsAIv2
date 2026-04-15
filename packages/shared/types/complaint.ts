export enum ComplaintSeverity {
  Minor = 'minor',
  Moderate = 'moderate',
  Major = 'major',
}

export enum ComplaintCategory {
  RoomCondition = 'room_condition',
  Noise = 'noise',
  Cleanliness = 'cleanliness',
  Maintenance = 'maintenance',
  StaffService = 'staff_service',
  Amenity = 'amenity',
  Billing = 'billing',
  Safety = 'safety',
  Other = 'other',
}

export enum GuestDemeanor {
  Calm = 'calm',
  Frustrated = 'frustrated',
  Angry = 'angry',
  EscalationRisk = 'escalation_risk',
}

export interface Complaint {
  id: string;
  tenantId: string;
  hotelId: string;
  guestId: string;
  roomId: string | null;
  reportedBy: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  guestDemeanor: GuestDemeanor;
  description: string;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  workOrderId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
