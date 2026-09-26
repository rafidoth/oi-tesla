"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchFareEstimate } from "../api/rides.api";
import type {
  RequestRideDto,
  EstimateResponseDto,
} from "../types/rides.types";

export interface UseFareEstimateQueryParams {
  pickupLocationId?: number | null;
  destLocationId?: number | null;
  seats?: number;
}

/**
 * Reactive TanStack Query hook for fetching upfront solo fare estimates.
 * Enables only when valid distinct pickup and destination IDs and seats are selected.
 */
export function useFareEstimateQuery(
  params: UseFareEstimateQueryParams
): UseQueryResult<EstimateResponseDto, Error> {
  const { pickupLocationId, destLocationId, seats = 1 } = params;

  const isEnabled = Boolean(
    pickupLocationId != null &&
      destLocationId != null &&
      destLocationId !== pickupLocationId &&
      typeof seats === "number" &&
      seats > 0
  );

  return useQuery({
    queryKey: [
      "rides",
      "estimate",
      { pickupLocationId, destLocationId, seats },
    ],
    queryFn: () => {
      if (pickupLocationId == null || destLocationId == null) {
        throw new Error("Missing pickup or destination location ID");
      }
      const payload: RequestRideDto = {
        pickupLocationId,
        destLocationId,
        seats,
      };
      return fetchFareEstimate(payload);
    },
    enabled: isEnabled,
    staleTime: 30_000,
  });
}

export default useFareEstimateQuery;
