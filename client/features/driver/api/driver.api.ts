import apiClient, { baseUrlWrapper } from "@/api/axios";
import type { DriverMeResponse } from "../types/driver.types";

export const driverApi = {
  async getDriverMe(): Promise<DriverMeResponse> {
    const response = await apiClient.get<DriverMeResponse>(
      baseUrlWrapper("/driver/me")
    );
    return response.data;
  },
};

export default driverApi;
