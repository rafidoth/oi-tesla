import type { RegisterDto, LoginDto } from './auth.schema.js';

export type { RegisterDto, LoginDto };

export interface VehicleResponse {
  id?: string;
  name: string;
  regNo: string;
  capacity: number;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: 'PASSENGER' | 'DRIVER';
  vehicle?: VehicleResponse;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface RegisterResponse {
  message: string;
  user: UserResponse;
}
