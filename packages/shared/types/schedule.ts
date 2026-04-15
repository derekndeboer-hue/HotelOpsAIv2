export enum ScheduleStatus {
  Draft = 'draft',
  Published = 'published',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export enum TaskInstanceStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Blocked = 'blocked',
  Deferred = 'deferred',
  Contingent = 'contingent',
}

export enum ScheduleType {
  Fixed = 'fixed',
  Flexible = 'flexible',
  Contingent = 'contingent',
}

export enum Department {
  Engineering = 'engineering',
  Housekeeping = 'housekeeping',
}

export interface TaskInstance {
  id: string;
  tenantId: string;
  hotelId: string;
  scheduleId: string;
  templateId: string | null;
  assignedTo: string | null;
  title: string;
  description: string | null;
  department: Department;
  scheduleType: ScheduleType;
  status: TaskInstanceStatus;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  locationId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailySchedule {
  id: string;
  tenantId: string;
  hotelId: string;
  department: Department;
  date: string;
  status: ScheduleStatus;
  publishedBy: string | null;
  publishedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
