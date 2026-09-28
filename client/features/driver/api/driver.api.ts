import apiClient, { baseUrlWrapper } from "@/api/axios";
import type {
  DriverMeResponse,
  UpdateDriverStatusInput,
  UpdateDriverStatusResponse,
  OpenPoolItem,
  AcceptPoolResponse,
  DriverPoolDetailsResponse,
  DriverPoolRosterMember,
  PoolLifecycleAction,
  TransitionPoolResponse,
} from "../types/driver.types";

export const driverApi = {
  async getDriverPoolDetails(poolId: string): Promise<DriverPoolDetailsResponse> {
    const response = await apiClient.get<DriverPoolDetailsResponse>(
      baseUrlWrapper(`/driver/pools/${poolId}`)
    );
    return response.data;
  },

  async getDriverPoolRoster(poolId: string): Promise<DriverPoolRosterMember[]> {
    const response = await apiClient.get<DriverPoolRosterMember[]>(
      baseUrlWrapper(`/driver/pools/${poolId}/roster`)
    );
    return response.data;
  },
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

  async transitionPool(
    poolId: string,
    action: PoolLifecycleAction
  ): Promise<TransitionPoolResponse> {
    const response = await apiClient.post<TransitionPoolResponse>(
      baseUrlWrapper(`/driver/pools/${poolId}/${action}`)
    );
    return response.data;
  },
};

export default driverApi;


