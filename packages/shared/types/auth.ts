import { StaffRole } from './staff';

export interface AuthUser {
  id: string;
  tenantId: string;
  hotelId: string;
  role: StaffRole;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenPayload {
  sub: string;
  tenantId: string;
  hotelId: string;
  role: StaffRole;
  name: string;
  iat: number;
  exp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
