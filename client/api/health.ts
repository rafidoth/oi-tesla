import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "./axios";

export interface HealthResponse {
  status: "ok" | "degraded" | "error" | string;
  timestamp: string;
  message?: string;
  uptime?: number;
  environment?: string;
}

export async function getHealthCheck(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>(`${process.env.NEXT_PUBLIC_API_URL}/health`);
  return response.data;
}


export function useHealthCheck(
  options?: Omit<UseQueryOptions<HealthResponse, Error, HealthResponse, string[]>, "queryKey" | "queryFn">
): UseQueryResult<HealthResponse, Error> {
  return useQuery({
    queryKey: ["health"],
    queryFn: getHealthCheck,
    ...options,
  });
}
