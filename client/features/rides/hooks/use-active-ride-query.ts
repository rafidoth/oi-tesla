"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { ridesApi } from "../api/rides.api";
import type { ActiveRideDetailsDto } from "../types/rides.types";

export const ACTIVE_RIDE_QUERY_KEY = ["rides", "active"] as const;

/**
 * TanStack Query hook for fetching and live-tracking the passenger's active ride.
 * Implements 5-second background polling per ADR D14 while the ride is in an active state.
 * Polling ceases when there is no active ride or once the ride is COMPLETED / CANCELLED.
 */
export function useActiveRideQuery(): UseQueryResult<
  ActiveRideDetailsDto | null,
  Error
> {
  return useQuery({
    queryKey: ACTIVE_RIDE_QUERY_KEY,
    queryFn: () => ridesApi.fetchActiveRide(),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === "COMPLETED" || data.status === "CANCELLED") {
        return false;
      }
      return 5000; // 5-second polling per ADR D14
    },
  });
}

export default useActiveRideQuery;
