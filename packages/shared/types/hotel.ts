export interface HotelAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Hotel {
  id: string;
  tenantId: string;
  name: string;
  address: HotelAddress;
  totalRooms: number;
  timezone: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
