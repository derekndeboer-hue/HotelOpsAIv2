export enum ConciergeCategory {
  Dining = 'dining',
  Tours = 'tours',
  WaterSports = 'water_sports',
  Transportation = 'transportation',
  Entertainment = 'entertainment',
  Wellness = 'wellness',
  Shopping = 'shopping',
  Events = 'events',
  Other = 'other',
}

export enum HotelRelationship {
  PreferredPartner = 'preferred_partner',
  CommissionReferral = 'commission_referral',
  Recommended = 'recommended',
  Standard = 'standard',
}

export enum BookingMethod {
  PhoneCall = 'phone_call',
  Email = 'email',
  OnlineLink = 'online_link',
  WalkIn = 'walk_in',
}

export interface ConciergeDirectory {
  id: string;
  tenantId: string;
  hotelId: string;
  name: string;
  category: ConciergeCategory;
  relationship: HotelRelationship;
  bookingMethod: BookingMethod;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  address: string | null;
  description: string | null;
  commissionRate: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConciergeBooking {
  id: string;
  tenantId: string;
  hotelId: string;
  directoryId: string;
  guestId: string;
  bookedBy: string;
  bookingMethod: BookingMethod;
  bookingDate: string;
  bookingTime: string | null;
  partySize: number | null;
  confirmationNumber: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
