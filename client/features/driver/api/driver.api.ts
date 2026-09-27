import apiClient, { baseUrlWrapper } from "@/api/axios";
import type {
  DriverMeResponse,
  UpdateDriverStatusInput,
  UpdateDriverStatusResponse,
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
};

export default driverApi;

