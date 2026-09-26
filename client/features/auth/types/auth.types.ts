export type UserRole = "PASSENGER" | "DRIVER";

export interface Vehicle {
  id?: string;
  name: string;
  regNo: string;
  capacity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  vehicle?: Vehicle;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  vehicle?: {
    name: string;
    regNo: string;
    capacity: number;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
