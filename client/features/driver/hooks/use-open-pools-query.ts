"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { driverApi } from "../api/driver.api";
import type { OpenPoolItem } from "../types/driver.types";

export const OPEN_POOLS_QUERY_KEY = ["driver", "pools", "open"] as const;

interface UseOpenPoolsQueryOptions {
  enabled?: boolean;
}

export function useOpenPoolsQuery(
  options?: UseOpenPoolsQueryOptions
): UseQueryResult<OpenPoolItem[], Error> {
  const isEnabled = options?.enabled ?? true;

  return useQuery({
    queryKey: OPEN_POOLS_QUERY_KEY,
    queryFn: () => driverApi.getOpenPools(),
    enabled: isEnabled,
    refetchInterval: isEnabled ? 5000 : false,
  });
}

export default useOpenPoolsQuery;
