import apiClient, { baseUrlWrapper } from "@/api/axios";
import type {
  DriverMeResponse,
  UpdateDriverStatusInput,
  UpdateDriverStatusResponse,
  OpenPoolItem,
  AcceptPoolResponse,
} from "../types/driver.types";

export const driverApi = {
  async getDriverMe(): Promise<DriverMeResponse> {
    const response = await apiClient.get<DriverMeResponse>(
      baseUrlWrapper("/driver/me")
    );
    return response.data;
  },

  async updateStatus(
    input: UpdateDriverStatusInput
  ): Promise<UpdateDriverStatusResponse> {
    const response = await apiClient.patch<UpdateDriverStatusResponse>(
      baseUrlWrapper("/driver/status"),
      input
    );
    return response.data;
  },

  async getOpenPools(): Promise<OpenPoolItem[]> {
    const response = await apiClient.get<OpenPoolItem[]>(
      baseUrlWrapper("/driver/pools?status=OPEN")
    );
    return response.data;
  },

  async acceptPool(poolId: string): Promise<AcceptPoolResponse> {
    const response = await apiClient.post<AcceptPoolResponse>(
      baseUrlWrapper(`/driver/pools/${poolId}/accept`)
    );
    return response.data;
  },

  async declinePool(
    poolId: string,
    reason?: string
  ): Promise<{ success: boolean; poolId: string }> {
    const response = await apiClient.post<{ success: boolean; poolId: string }>(
      baseUrlWrapper(`/driver/pools/${poolId}/decline`),
      reason ? { reason } : {}
    );
    return response.data;
  },
};

export default driverApi;


