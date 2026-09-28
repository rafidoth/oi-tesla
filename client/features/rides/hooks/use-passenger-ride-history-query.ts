"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { ridesApi } from "../api/rides.api";
import type { PassengerRideHistoryItemDto } from "../types/rides.types";

export const PASSENGER_RIDES_HISTORY_QUERY_KEY = [
  "passenger-rides-history",
] as const;

export function usePassengerRideHistoryQuery(
  status?: "COMPLETED" | "CANCELLED" | "ALL"
): UseQueryResult<PassengerRideHistoryItemDto[], Error> {
  return useQuery({
    queryKey: [...PASSENGER_RIDES_HISTORY_QUERY_KEY, status ?? "ALL"],
    queryFn: () =>
      ridesApi.fetchPassengerRideHistory(status ? { status } : undefined),
  });
}

export default usePassengerRideHistoryQuery;
