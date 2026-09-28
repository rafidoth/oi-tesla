"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { driverApi } from "../api/driver.api";
import type { DriverMeResponse } from "../types/driver.types";

export const DRIVER_ME_QUERY_KEY = ["driver", "me"] as const;

/**
 * TanStack Query hook for fetching the authenticated driver's profile,
 * vehicle overview, and any ongoing active pool assignment.
 */
export function useDriverMeQuery(): UseQueryResult<DriverMeResponse, Error> {
  return useQuery({
    queryKey: DRIVER_ME_QUERY_KEY,
    queryFn: () => driverApi.getDriverMe(),
    refetchInterval: (query) => {
      const data = query.state.data;
      // If there's an active pool in progress, poll every 5s per ADR D14
      if (data?.activePool) {
        return 5000;
      }
      return false;
    },
  });
}

export default useDriverMeQuery;
