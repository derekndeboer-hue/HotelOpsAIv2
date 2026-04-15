import { Department } from './schedule';

export interface HandoffReport {
  id: string;
  tenantId: string;
  hotelId: string;
  department: Department;
  shiftDate: string;
  shiftType: string;
  createdBy: string;
  summary: string;
  pendingItems: string[];
  completedItems: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HandoffNote {
  id: string;
  tenantId: string;
  handoffId: string;
  authorId: string;
  priority: 'fyi' | 'action_needed';
  content: string;
  relatedResourceType: string | null;
  relatedResourceId: string | null;
  createdAt: string;
}

export interface HandoffAcknowledgment {
  id: string;
  tenantId: string;
  handoffId: string;
  acknowledgedBy: string;
  acknowledgedAt: string;
  notes: string | null;
}
