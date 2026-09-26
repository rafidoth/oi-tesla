import apiClient, { baseUrlWrapper } from "@/api/axios";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterPayload,
  User,
} from "../types/auth.types";

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      baseUrlWrapper("/auth/login"),
      credentials
    );
    return response.data;
  },

  async register(
    payload: RegisterPayload
  ): Promise<{ message: string; user: User }> {
    const response = await apiClient.post<{ message: string; user: User }>(
      baseUrlWrapper("/auth/register"),
      payload
    );
    return response.data;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await apiClient.get<{ user: User }>(baseUrlWrapper("/users/me"));
    return response.data;
  },
};

export default authApi;
