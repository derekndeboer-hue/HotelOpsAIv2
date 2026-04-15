export enum VipStatus {
  None = 'none',
  Standard = 'standard',
  Returning = 'returning',
  Vip = 'vip',
  TopVip = 'top_vip',
  Silver = 'silver',
  Gold = 'gold',
  Platinum = 'platinum',
}

export enum PracticeType {
  RoomPreference = 'room_preference',
  AmenityDelivery = 'amenity_delivery',
  StorageRetrieval = 'storage_retrieval',
  SpecialSetup = 'special_setup',
  Dietary = 'dietary',
  General = 'general',
}

export enum Timing {
  OnReservationCreated = 'on_reservation_created',
  DayBeforeArrival = 'day_before_arrival',
  DayOfArrival = 'day_of_arrival',
  OnCheckin = 'on_checkin',
  DuringStay = 'during_stay',
}

export interface Guest {
  id: string;
  tenantId: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  vipStatus: VipStatus;
  totalStays: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuestPractice {
  id: string;
  tenantId: string;
  guestId: string;
  practiceType: PracticeType;
  timing: Timing;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
