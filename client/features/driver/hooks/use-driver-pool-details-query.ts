"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { driverApi } from "../api/driver.api";
import type { DriverPoolDetailsResponse } from "../types/driver.types";

export const DRIVER_POOL_DETAILS_QUERY_KEY = (poolId: string) =>
  ["driver", "pools", poolId] as const;

interface UseDriverPoolDetailsQueryOptions {
  poolId: string;
  enabled?: boolean;
}

export function useDriverPoolDetailsQuery(
  options: UseDriverPoolDetailsQueryOptions
): UseQueryResult<DriverPoolDetailsResponse, Error> {
  const isEnabled = (options.enabled ?? true) && Boolean(options.poolId);

  return useQuery({
    queryKey: DRIVER_POOL_DETAILS_QUERY_KEY(options.poolId),
    queryFn: () => driverApi.getDriverPoolDetails(options.poolId),
    enabled: isEnabled,
    refetchInterval: isEnabled ? 5000 : false,
  });
}

export default useDriverPoolDetailsQuery;
