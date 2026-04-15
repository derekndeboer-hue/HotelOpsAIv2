import { get, post, put, del } from '@/hooks/useApi';
import type {
  User, Room, WorkOrder, HKAssignment, HKDashboardData, Guest, GuestPractice,
  Reservation, FDDashboardData, Interaction, Equipment, ScheduleEntry,
  StaffMember, ComplianceItem, DashboardKPI, ReportData, ConciergeEntry,
  ConciergeInquiry, WOPriority, WOCategory, WOStatus, RoomStatus, HotelLocation,
} from '@/types';

interface WorkOrderListResponse {
  items: WorkOrder[];
  total: number;
  limit: number;
  offset: number;
}

// ── Auth ──
const auth = {
  login: (email: string, password: string) =>
    post<User>('/auth/login', { email, password }),
  logout: () => post<void>('/auth/logout'),
  me: () => get<User>('/auth/me'),
};

// ── Rooms ──
const rooms = {
  list: (params?: { status?: RoomStatus; floor?: number; zone?: string }) =>
    get<Room[]>('/rooms', { params }),
  get: (id: string) => get<Room>(`/rooms/${id}`),
  updateStatus: (id: string, status: RoomStatus, notes?: string) =>
    put<Room>(`/rooms/${id}/status`, { status, notes }),
  board: () => get<Room[]>('/rooms/board'),
  pipeline: (id: string) =>
    get<{ status: RoomStatus; timestamp: string; user: string }[]>(`/rooms/${id}/pipeline`),
};

// ── Work Orders ──
const workOrders = {
  list: (params?: {
    status?: WOStatus;
    priority?: WOPriority;
    category?: WOCategory;
    assignedTo?: string;
    roomId?: string;
    locationId?: string;
    targetType?: 'room' | 'location' | 'any';
    limit?: number;
    offset?: number;
  }) =>
    get<WorkOrderListResponse>('/work-orders', { params }),
  get: (id: string) => get<WorkOrder>(`/work-orders/${id}`),
  create: (data: {
    title: string;
    description: string;
    roomId?: string;
    locationId?: string;
    category: WOCategory;
    priority: WOPriority;
    assignedTo?: string;
    photos?: string[];
  }) => post<WorkOrder>('/work-orders', data),
  update: (id: string, data: Partial<WorkOrder>) =>
    put<WorkOrder>(`/work-orders/${id}`, data),
  addComment: (id: string, content: string) =>
    post<WorkOrder>(`/work-orders/${id}/comments`, { content }),
  addPhotos: (id: string, formData: FormData) =>
    post<WorkOrder>(`/work-orders/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  stats: () =>
    get<{ open: number; inProgress: number; overdue: number; avgResponse: number; avgCompletion: number }>('/work-orders/stats'),
  queue: () => get<WorkOrder[]>('/work-orders/queue'),
};

// ── Locations ──
const locations = {
  list: (params?: { type?: string; zone?: string }) =>
    get<HotelLocation[]>('/locations', { params }),
};

// ── Housekeeping ──
interface HKListFilters {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: string;
  status?: string;
  targetType?: 'room' | 'common' | 'any';
  locationId?: string;
  roomId?: string;
  limit?: number;
  offset?: number;
  assigneeId?: string;
}

interface HKCreateAssignment {
  roomId?: string;
  locationId?: string;
  cleaningType: string;
  priority?: number;
  assignedTo: string;
  assignmentDate: string;
  estimatedMinutes?: number;
  isFixed?: boolean;
  notes?: string;
}

interface HKBoardRow {
  id: string;
  room_number: string;
  floor: number;
  zone: string;
  status: RoomStatus;
  assignment_id: string | null;
  assignment_status: string | null;
  assigned_to: string | null;
  cleaning_type: string | null;
  assignee_first_name: string | null;
  assignee_last_name: string | null;
}

const housekeeping = {
  assignments: (params?: HKListFilters) => {
    const p: Record<string, unknown> = { ...params };
    if (params?.assigneeId && !params.assignedTo) p.assignedTo = params.assigneeId;
    delete p.assigneeId;
    return get<HKAssignment[]>('/housekeeping/assignments', { params: p });
  },
  create: (assignments: HKCreateAssignment[]) =>
    post<Array<HKCreateAssignment & { id: string }>>('/housekeeping/assignments', { assignments }),
  update: (id: string, data: Partial<HKAssignment> & { status?: string; notes?: string }) =>
    put<HKAssignment>(`/housekeeping/assignments/${id}`, data),
  inspect: (id: string, data: { result: 'pass' | 'fail'; notes?: string; failureReasons?: string[] }) =>
    post<HKAssignment>(`/housekeeping/assignments/${id}/inspect`, data),
  complete: (id: string, notes?: string) =>
    post<HKAssignment>(`/housekeeping/assignments/${id}/complete`, { notes }),
  start: (id: string) =>
    post<HKAssignment>(`/housekeeping/assignments/${id}/start`),
  updateRoomStatus: (roomId: string, data: { status: RoomStatus; fromStatus?: RoomStatus; notes?: string }) =>
    put<Room>(`/housekeeping/rooms/${roomId}/status`, data),
  board: (params?: { zone?: string }) =>
    get<HKBoardRow[]>('/housekeeping/board', { params }),
  generate: (data: {
    date: string;
    strategy?: 'even' | 'by_zone' | 'load_balanced';
    includeCommonAreas?: boolean;
    dryRun?: boolean;
  }) =>
    post<{
      date: string;
      strategy: string;
      rooms: number;
      commonAreas: number;
      totalAssignments: number;
      dryRun: boolean;
    }>('/housekeeping/schedule/generate', data),
  dnd: (assignmentId: string, attemptNumber: number) =>
    post<void>('/housekeeping/dnd', { assignmentId, attemptNumber }),
  dashboard: () => get<HKDashboardData>('/housekeeping/dashboard'),
  stats: (params?: { dateFrom?: string; dateTo?: string }) =>
    get<Record<string, unknown>>('/housekeeping/stats', { params }),
};

// ── Guests ──
const guests = {
  search: (q: string) => get<Guest[]>('/guests/search', { params: { q } }),
  profile: (id: string) => get<Guest>(`/guests/${id}`),
  create: (data: Partial<Guest>) => post<Guest>('/guests', data),
  update: (id: string, data: Partial<Guest>) => put<Guest>(`/guests/${id}`, data),
  practices: (guestId: string) => get<GuestPractice[]>(`/guests/${guestId}/practices`),
  addPractice: (guestId: string, data: Partial<GuestPractice>) =>
    post<GuestPractice>(`/guests/${guestId}/practices`, data),
  preferences: (guestId: string) =>
    get<Record<string, string>>(`/guests/${guestId}/preferences`),
  updatePreferences: (guestId: string, prefs: Record<string, string>) =>
    put<void>(`/guests/${guestId}/preferences`, prefs),
  upcomingReturnGuests: () => get<Guest[]>('/guests/upcoming-returns'),
};

// ── Reservations ──
const reservations = {
  search: (params: {
    guestName?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    source?: string;
    confirmationNumber?: string;
    limit?: number;
    offset?: number;
  }) => get<Reservation[]>('/reservations', { params }),
  get: (id: string) => get<Reservation>(`/reservations/${id}`),
  create: (data: Record<string, unknown>) => post<{ id: string; confirmationNumber: string; status: string }>('/reservations', data),
  update: (id: string, data: Record<string, unknown>) =>
    put<Reservation>(`/reservations/${id}`, data),
  cancel: (id: string, reason?: string) =>
    del<{ cancelled: boolean }>(`/reservations/${id}`, { data: { reason } }),
  availability: (params: { arrivalDate: string; departureDate: string; roomType?: string }) =>
    get<Room[]>('/reservations/availability', { params }),
};

// ── Front Desk ──
const frontDesk = {
  dashboard: () => get<Record<string, unknown>>('/front-desk/dashboard'),
  checkIn: (data: Record<string, unknown>) =>
    post<{ reservationId: string; roomNumber: string; status: string; keyCardsIssued: number }>('/front-desk/check-in', data),
  checkOut: (data: Record<string, unknown>) =>
    post<{ reservationId: string; roomNumber: string; status: string }>('/front-desk/check-out', data),
  assignRoom: (data: { reservationId: string; roomId: string; overrideReason?: string }) =>
    post<{ reservationId: string; roomId: string; roomNumber: string }>('/front-desk/assign-room', data),
  walkIn: (data: Record<string, unknown>) =>
    post<{ guestId: string; reservationId: string; confirmationNumber: string; roomNumber: string; status: string }>('/front-desk/walk-in', data),
  handoff: {
    list: () => get<Record<string, unknown>[]>('/front-desk/handoff'),
    generate: (data: { shift: string; notes: string }) =>
      post<{ id: string; shift: string; status: string }>('/front-desk/handoff/generate', data),
    acknowledge: (handoffId: string) =>
      post<void>('/front-desk/handoff/acknowledge', { handoffId }),
    addNote: (handoffId: string, note: string) =>
      post<void>('/front-desk/handoff/notes', { handoffId, note }),
  },
};

// ── Guest Requests ──
const guestRequests = {
  list: (params?: { status?: string; requestType?: string; limit?: number; offset?: number }) =>
    get<Record<string, unknown>[]>('/guest-requests', { params }),
  create: (data: {
    guestId: string;
    requestType: string;
    description: string;
    priority?: string;
    reservationId?: string;
    roomId?: string;
    routeToDepartment?: string;
  }) => post<{ id: string; requestType: string; routedTo: string; status: string }>('/guest-requests', data),
  resolve: (id: string, resolutionNote?: string) =>
    put<{ id: string; status: string }>(`/guest-requests/${id}/resolve`, { resolutionNote }),
};

// ── Reports ──
interface RangeParams {
  from: string;
  to: string;
  zone?: 'fleming' | 'simonton' | 'all';
  granularity?: 'day' | 'week' | 'month';
}

const reports = {
  kpi: (params: RangeParams) => get<Record<string, unknown>>('/reports/kpi', { params }),
  occupancy: (params: RangeParams) => get<unknown[]>('/reports/occupancy', { params }),
  workOrders: (params: RangeParams) => get<Record<string, unknown>>('/reports/work-orders', { params }),
  housekeeping: (params: RangeParams) => get<Record<string, unknown>>('/reports/housekeeping', { params }),
  guestRequests: (params: RangeParams) => get<Record<string, unknown>>('/reports/guest-requests', { params }),
  labor: (params: RangeParams) => get<Record<string, unknown>>('/reports/labor', { params }),
  responseTimes: (params: RangeParams) => get<Record<string, unknown>>('/reports/response-times', { params }),
  export: (
    reportType: string,
    params: RangeParams & { format: 'csv' | 'json' },
  ) => {
    const url = `/api/reports/${reportType}/export?` +
      new URLSearchParams(params as Record<string, string>).toString();
    window.open(url, '_blank');
  },
};

// ── Staff ──
const staff = {
  list: (params?: { role?: string; active?: boolean }) =>
    get<StaffMember[]>('/staff', { params }),
  create: (data: Partial<StaffMember>) => post<StaffMember>('/staff', data),
  update: (id: string, data: Partial<StaffMember>) =>
    put<StaffMember>(`/staff/${id}`, data),
  deactivate: (id: string) => del<void>(`/staff/${id}`),
  roster: () => get<StaffMember[]>('/staff/roster'),
};

// ── Equipment ──
const equipment = {
  list: (params?: { category?: string; status?: string; location?: string }) =>
    get<Equipment[]>('/equipment', { params }),
  profile: (id: string) => get<Equipment>(`/equipment/${id}`),
  create: (data: Partial<Equipment>) => post<Equipment>('/equipment', data),
  update: (id: string, data: Partial<Equipment>) =>
    put<Equipment>(`/equipment/${id}`, data),
  decommission: (id: string, reason: string) =>
    put<void>(`/equipment/${id}/decommission`, { reason }),
  addPhotos: (id: string, formData: FormData) =>
    post<Equipment>(`/equipment/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── Schedule ──
const schedule = {
  generate: (date: string) => post<ScheduleEntry[]>('/schedule/generate', { date }),
  review: (date: string) => get<ScheduleEntry[]>('/schedule', { params: { date } }),
  edit: (id: string, data: Partial<ScheduleEntry>) =>
    put<ScheduleEntry>(`/schedule/${id}`, data),
  publish: (date: string) => post<void>('/schedule/publish', { date }),
  my: (params?: { date?: string }) =>
    get<ScheduleEntry[]>('/schedule/my', { params }),
  updateTask: (entryId: string, taskId: string, status: string) =>
    put<void>(`/schedule/${entryId}/tasks/${taskId}`, { status }),
  extend: (entryId: string, taskId: string, minutes: number) =>
    put<void>(`/schedule/${entryId}/tasks/${taskId}/extend`, { minutes }),
  clock: (action: 'in' | 'out') =>
    post<void>('/schedule/clock', { action }),
};

// ── Compliance ──
const compliance = {
  list: (params?: { status?: string; category?: string }) =>
    get<ComplianceItem[]>('/compliance', { params }),
  create: (data: Partial<ComplianceItem>) => post<ComplianceItem>('/compliance', data),
  update: (id: string, data: Partial<ComplianceItem>) =>
    put<ComplianceItem>(`/compliance/${id}`, data),
  complete: (id: string, notes?: string) =>
    put<ComplianceItem>(`/compliance/${id}/complete`, { notes }),
  dashboard: () =>
    get<{ overdue: ComplianceItem[]; dueSoon: ComplianceItem[]; current: ComplianceItem[] }>('/compliance/dashboard'),
  report: (params: { from: string; to: string }) =>
    get<ReportData>('/compliance/report', { params }),
};

// ── Concierge ──
const concierge = {
  directory: (params?: { category?: string; q?: string }) =>
    get<ConciergeEntry[]>('/concierge/directory', { params }),
  inquiry: (data: { guestId: string; query: string }) =>
    post<ConciergeInquiry>('/concierge/inquiry', data),
  booking: (inquiryId: string, entryId: string, details: string) =>
    post<void>(`/concierge/inquiry/${inquiryId}/book`, { entryId, details }),
  history: (guestId: string) =>
    get<ConciergeInquiry[]>(`/concierge/history/${guestId}`),
};

export const api = {
  auth,
  rooms,
  workOrders,
  locations,
  housekeeping,
  guests,
  reservations,
  frontDesk,
  guestRequests,
  reports,
  staff,
  equipment,
  schedule,
  compliance,
  concierge,
};
