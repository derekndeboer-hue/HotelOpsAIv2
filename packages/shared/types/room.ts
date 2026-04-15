export enum RoomStatus {
  Clean = 'clean',
  Dirty = 'dirty',
  Inspected = 'inspected',
  OutOfOrder = 'out_of_order',
  Occupied = 'occupied',
  VacantDirty = 'vacant_dirty',
  EngineeringPending = 'engineering_pending',
  EngineeringInProgress = 'engineering_in_progress',
  EngineeringComplete = 'engineering_complete',
  HousekeepingInProgress = 'housekeeping_in_progress',
  PendingInspection = 'pending_inspection',
  ReadyForCheckin = 'ready_for_checkin',
  DndFirstCheck = 'dnd_first_check',
  DndSecondCheck = 'dnd_second_check',
  DndSkipped = 'dnd_skipped',
  OutOfService = 'out_of_service',
}

export enum RoomType {
  ClassicGuestroom = 'classic_guestroom',
  DeluxeGuestroom = 'deluxe_guestroom',
  PoolsideGuestroom = 'poolside_guestroom',
  BalconyDeluxe = 'balcony_deluxe',
  BahamaSuite = 'bahama_suite',
  DoubleDeluxe = 'double_deluxe',
  PremiereDouble = 'premiere_double',
  JamesHaskinsSuite = 'james_haskins_suite',
  JuliusOttoSuite = 'julius_otto_suite',
  WilliamKerrSuite = 'william_kerr_suite',
}

export enum CleaningType {
  Standard = 'standard',
  Deep = 'deep',
  Checkout = 'checkout',
  TouchUp = 'touch_up',
  CheckoutClean = 'checkout_clean',
  StayoverClean = 'stayover_clean',
  Turndown = 'turndown',
}

export enum PropertyZone {
  Fleming = 'fleming',
  Simonton = 'simonton',
}

export interface Room {
  id: string;
  tenantId: string;
  hotelId: string;
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  status: RoomStatus;
  isOccupied: boolean;
  currentGuestId: string | null;
  lastCleanedAt: string | null;
  lastInspectedAt: string | null;
  lastInspectedBy: string | null;
  notes: string | null;
  updatedAt: string;
}
