export enum NotificationType {
  UrgentWorkOrder = 'urgent_work_order',
  VipArrival = 'vip_arrival',
  RoomBlocked = 'room_blocked',
  SchedulePublished = 'schedule_published',
  TaskAssigned = 'task_assigned',
  InspectionReady = 'inspection_ready',
  DndEscalation = 'dnd_escalation',
  TimeConflict = 'time_conflict',
  ComplianceDue = 'compliance_due',
  ShiftHandoff = 'shift_handoff',
  WorkComplete = 'work_complete',
  GuestComplaint = 'guest_complaint',
}

export enum NotificationStatus {
  Delivered = 'delivered',
  Read = 'read',
  Acknowledged = 'acknowledged',
  ActedOn = 'acted_on',
}

export interface Notification {
  id: string;
  tenantId: string;
  hotelId: string;
  recipientId: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  readAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}
