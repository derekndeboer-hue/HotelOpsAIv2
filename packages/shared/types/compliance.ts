export enum ComplianceCategory {
  FireSafety = 'fire_safety',
  Elevator = 'elevator',
  Plumbing = 'plumbing',
  Electrical = 'electrical',
  HealthDepartment = 'health_department',
  Pool = 'pool',
  Structural = 'structural',
  Environmental = 'environmental',
  Insurance = 'insurance',
  Other = 'other',
}

export enum ComplianceResult {
  Passed = 'passed',
  PassedWithConditions = 'passed_with_conditions',
  Failed = 'failed',
}

export interface ComplianceItem {
  id: string;
  tenantId: string;
  hotelId: string;
  category: ComplianceCategory;
  title: string;
  description: string | null;
  authority: string;
  frequency: string;
  lastCompletedAt: string | null;
  nextDueDate: string;
  leadTimeDays: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceCompletion {
  id: string;
  tenantId: string;
  complianceItemId: string;
  completedBy: string;
  completedAt: string;
  result: ComplianceResult;
  inspectorName: string | null;
  certificateNumber: string | null;
  expirationDate: string | null;
  notes: string | null;
  attachments: string[];
  createdAt: string;
}
