export enum ReservationStatus {
  Confirmed = 'confirmed',
  CheckedIn = 'checked_in',
  CheckedOut = 'checked_out',
  Cancelled = 'cancelled',
  NoShow = 'no_show',
}

export interface Reservation {
  id: string;
  tenantId: string;
  hotelId: string;
  guestId: string;
  roomId: string | null;
  status: ReservationStatus;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests: string | null;
  confirmationNumber: string;
  createdAt: string;
  updatedAt: string;
}
