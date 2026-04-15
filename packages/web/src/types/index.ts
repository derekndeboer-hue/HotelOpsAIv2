// ── Auth & Users ──
export type Role = 'gm' | 'front_desk' | 'housekeeping_manager' | 'housekeeper' | 'maintenance_manager' | 'technician' | 'concierge' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  hotelId: string;
  avatarUrl?: string;
}

// ── Rooms ──
export type RoomStatus =
  | 'occupied'
  | 'vacant_dirty'
  | 'cleaning_in_progress'
  | 'vacant_clean'
  | 'inspected'
  | 'ready'
  | 'out_of_order'
  | 'out_of_service'
  | 'do_not_disturb'
  | 'checkout_pending';

export type RoomType = 'standard_king' | 'standard_double' | 'deluxe_king' | 'suite' | 'penthouse';

export interface Room {
  id: string;
  number: string;
  floor: number;
  zone: string;
  type: RoomType;
  status: RoomStatus;
  guestName?: string;
  guestId?: string;
  reservationId?: string;
  assignedTo?: string;
  assignedToName?: string;
  lastUpdated: string;
  notes?: string;
}

// ── Locations ──
export type LocationType = 'common_area' | 'restaurant_common' | 'back_of_house' | 'exterior' | 'equipment_area';

export interface HotelLocation {
  id: string;
  name: string;
  slug: string;
  locationType: LocationType;
  category?: string;
  zone?: string;
  building?: string;
  isActive: boolean;
}

// ── Work Orders ──
export type WOPriority = 'urgent' | 'high' | 'medium' | 'low';
export type WOStatus = 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'pending_review' | 'completed' | 'cancelled';
export type WOCategory = 'plumbing' | 'electrical' | 'hvac' | 'furniture' | 'appliance' | 'general' | 'safety' | 'cosmetic';

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  roomId?: string | null;
  room_id?: string | null;
  roomNumber?: string;
  room_number?: string;
  locationId?: string | null;
  location_id?: string | null;
  locationName?: string;
  location_name?: string;
  locationType?: LocationType;
  location_type?: LocationType;
  category: WOCategory;
  priority: WOPriority;
  status: WOStatus;
  assigneeId?: string;
  assignedTo?: string | null;
  assigned_to?: string | null;
  assigneeName?: string;
  assignee_first_name?: string;
  assignee_last_name?: string;
  reportedBy?: string;
  reportedByName?: string;
  creator_first_name?: string;
  creator_last_name?: string;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  completedAt?: string;
  estimatedMinutes?: number;
  photos?: WOPhoto[] | string[];
  comments?: WOComment[];
}

export interface WOPhoto {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
}

export interface WOComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

// ── Housekeeping ──
export type HKCleaningType =
  | 'checkout'
  | 'stayover'
  | 'deep_clean'
  | 'touch_up'
  | 'turndown'
  | 'common_area';

export type HKAssignmentStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'inspection_pending'
  | 'inspected'
  | 'failed_inspection'
  | 'dnd_pending'
  | 'dnd_escalated';

export interface HKAssignment {
  id: string;
  roomId?: string | null;
  room_id?: string | null;
  roomNumber?: string;
  room_number?: string;
  locationId?: string | null;
  location_id?: string | null;
  locationName?: string;
  location_name?: string;
  assigneeId?: string;
  assigned_to?: string;
  assigneeName?: string;
  staff_first_name?: string;
  staff_last_name?: string;
  status: HKAssignmentStatus | 'pending' | 'in_progress' | 'completed' | 'inspected' | 'failed_inspection';
  type?: HKCleaningType;
  cleaningType?: HKCleaningType;
  isFixed?: boolean;
  is_fixed?: boolean;
  order?: number;
  sort_order?: number;
  priority?: number;
  date?: string;
  startedAt?: string;
  started_at?: string;
  completedAt?: string;
  completed_at?: string;
  inspectedBy?: string;
  inspector_id?: string;
  inspectionNotes?: string;
  inspectionResult?: 'pass' | 'fail';
  inspection_result?: 'pass' | 'fail';
  estimatedMinutes?: number;
  estimated_minutes?: number;
  notes?: string;
}

export interface HKDashboardData {
  totalRooms: number;
  cleaned: number;
  inProgress: number;
  pending: number;
  dnd: number;
  inspected: number;
  zones: { zone: string; total: number; done: number }[];
  housekeepers: { id: string; name: string; completed: number; total: number; avgMinutes: number }[];
}

// ── Guests ──
export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  vip: boolean;
  totalStays: number;
  lastStay?: string;
  preferences?: Record<string, string>;
  notes?: string;
}

export interface GuestPractice {
  id: string;
  guestId: string;
  category: string;
  description: string;
  reportedBy: string;
  createdAt: string;
}

// ── Reservations ──
export interface Reservation {
  id: string;
  guestId: string;
  guestName: string;
  roomId?: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  adults: number;
  children: number;
  notes?: string;
}

// ── Front Desk ──
export interface FDDashboardData {
  arrivals: Reservation[];
  departures: Reservation[];
  inHouse: number;
  roomsSummary: Record<RoomStatus, number>;
  pendingActions: { type: string; description: string; roomNumber?: string }[];
  alerts: Alert[];
}

export interface Interaction {
  id: string;
  guestId: string;
  guestName: string;
  type: 'request' | 'complaint' | 'inquiry' | 'feedback';
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  staffId: string;
  staffName: string;
}

// ── Alerts ──
export interface Alert {
  id: string;
  type: string;
  priority: WOPriority;
  title: string;
  message: string;
  roomNumber?: string;
  acknowledged: boolean;
  createdAt: string;
}

// ── Notifications ──
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ── Equipment ──
export interface Equipment {
  id: string;
  name: string;
  category: string;
  location: string;
  roomId?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  installDate?: string;
  warrantyExpiry?: string;
  status: 'operational' | 'needs_maintenance' | 'out_of_service' | 'decommissioned';
  lastServiceDate?: string;
  nextPmDate?: string;
  photos: string[];
}

// ── Schedule ──
export interface ScheduleEntry {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'evening';
  tasks: ScheduleTask[];
  published: boolean;
}

export interface ScheduleTask {
  id: string;
  description: string;
  roomId?: string;
  roomNumber?: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
}

// ── Staff ──
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  active: boolean;
  hireDate?: string;
  certifications?: string[];
}

// ── Compliance ──
export interface ComplianceItem {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  status: 'current' | 'due_soon' | 'overdue' | 'completed';
  assigneeId?: string;
  assigneeName?: string;
  notes?: string;
  completedAt?: string;
}

// ── Reports ──
export interface DashboardKPI {
  occupancy: number;
  openWorkOrders: number;
  avgResponseMinutes: number;
  hkRoomsRemaining: number;
  inspectionPassRate: number;
  staffOnDuty: number;
  revenueToday?: number;
}

export interface ReportData {
  title: string;
  period: { start: string; end: string };
  sections: ReportSection[];
}

export interface ReportSection {
  title: string;
  metrics: { label: string; value: string | number; trend?: 'up' | 'down' | 'flat' }[];
  chartData?: Record<string, unknown>[];
}

// ── Concierge ──
export interface ConciergeEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  phone?: string;
  address?: string;
  website?: string;
  rating?: number;
}

export interface ConciergeInquiry {
  id: string;
  guestId: string;
  guestName: string;
  query: string;
  results: ConciergeEntry[];
  status: 'open' | 'booked' | 'closed';
  createdAt: string;
}
