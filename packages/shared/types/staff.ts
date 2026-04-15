export enum StaffRole {
  FrontDesk = 'front_desk',
  Housekeeper = 'housekeeper',
  RoomAttendant = 'room_attendant',
  TurndownAttendant = 'turndown_attendant',
  LaundryAttendant = 'laundry_attendant',
  Engineer = 'engineer',
  MaintTech = 'maint_tech',
  MaintSupervisor = 'maint_supervisor',
  HkSupervisor = 'hk_supervisor',
  Management = 'management',
  Admin = 'admin',
}

export interface Staff {
  id: string;
  tenantId: string;
  hotelId: string;
  name: string;
  email: string;
  role: StaffRole;
  phone: string | null;
  isActive: boolean;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}
