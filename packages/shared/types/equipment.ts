export enum EquipmentCategory {
  Hvac = 'hvac',
  Plumbing = 'plumbing',
  Electrical = 'electrical',
  FireSafety = 'fire_safety',
  Appliance = 'appliance',
  Structural = 'structural',
  Other = 'other',
}

export interface Equipment {
  id: string;
  tenantId: string;
  hotelId: string;
  name: string;
  category: EquipmentCategory;
  location: string;
  roomId: string | null;
  manufacturer: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
  installDate: string | null;
  warrantyExpiration: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
