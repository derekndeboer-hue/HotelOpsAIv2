import { CleaningType } from './room';

export enum AssignmentStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Skipped = 'skipped',
}

export enum InspectionStatus {
  Pending = 'pending',
  Passed = 'passed',
  Failed = 'failed',
}

export enum InspectionResult {
  Pass = 'pass',
  PassWithNote = 'pass_with_note',
  FailHousekeeping = 'fail_housekeeping',
  FailEngineering = 'fail_engineering',
  FailBoth = 'fail_both',
}

export interface HousekeepingAssignment {
  id: string;
  tenantId: string;
  hotelId: string;
  roomId: string;
  assignedTo: string;
  cleaningType: CleaningType;
  status: AssignmentStatus;
  inspectionStatus: InspectionStatus;
  inspectionResult: InspectionResult | null;
  inspectedBy: string | null;
  inspectedAt: string | null;
  inspectionNotes: string | null;
  scheduledDate: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedMinutes: number;
  actualMinutes: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
