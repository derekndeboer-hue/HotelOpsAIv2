import { Department } from './schedule';

export enum TaskCategory {
  PreventiveMaintenance = 'preventive_maintenance',
  RecurringCleaning = 'recurring_cleaning',
  Inspection = 'inspection',
  Seasonal = 'seasonal',
}

export enum Frequency {
  Daily = 'daily',
  Weekly = 'weekly',
  Biweekly = 'biweekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  SemiAnnual = 'semi_annual',
  Annual = 'annual',
}

export enum LocationType {
  Room = 'room',
  Equipment = 'equipment',
  CommonArea = 'common_area',
  BuildingSystem = 'building_system',
}

export interface TaskTemplate {
  id: string;
  tenantId: string;
  hotelId: string;
  title: string;
  description: string | null;
  department: Department;
  category: TaskCategory;
  frequency: Frequency;
  locationType: LocationType;
  locationId: string | null;
  estimatedMinutes: number;
  requiredRole: string | null;
  checklist: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
