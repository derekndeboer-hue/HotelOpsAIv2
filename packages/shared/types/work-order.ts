export enum WorkOrderCategory {
  Plumbing = 'plumbing',
  Electrical = 'electrical',
  Hvac = 'hvac',
  Furniture = 'furniture',
  Appliance = 'appliance',
  General = 'general',
  Safety = 'safety',
  Cosmetic = 'cosmetic',
}

export enum WorkOrderPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

export enum WorkOrderStatus {
  Open = 'open',
  Assigned = 'assigned',
  InProgress = 'in_progress',
  OnHold = 'on_hold',
  Completed = 'completed',
  Cancelled = 'cancelled',
  PendingReview = 'pending_review',
}

export interface PartUsed {
  name: string;
  quantity: number;
  cost: number;
}

export interface WorkOrder {
  id: string;
  tenantId: string;
  hotelId: string;
  roomId: string | null;
  equipmentId: string | null;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  title: string;
  description: string;
  reportedBy: string;
  assignedTo: string | null;
  partsUsed: PartUsed[];
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
