"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { driverApi } from "../api/driver.api";
import type { DriverPoolHistoryItem } from "../types/driver.types";

export const DRIVER_POOL_HISTORY_QUERY_KEY = (status?: string) =>
  ["driver", "pools", "history", status ?? "ALL"] as const;

interface UseDriverPoolHistoryQueryOptions {
  status?: string;
  enabled?: boolean;
}

export function useDriverPoolHistoryQuery(
  options?: UseDriverPoolHistoryQueryOptions
): UseQueryResult<DriverPoolHistoryItem[], Error> {
  const isEnabled = options?.enabled ?? true;

  return useQuery({
    queryKey: DRIVER_POOL_HISTORY_QUERY_KEY(options?.status),
    queryFn: () => driverApi.getDriverPoolHistory(options?.status),
    enabled: isEnabled,
  });
}

export default useDriverPoolHistoryQuery;
