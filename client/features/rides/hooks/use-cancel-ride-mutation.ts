"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { ridesApi } from "../api/rides.api";
import { useRideBookingStore } from "../store/ride-booking.store";
import type {
  CancelRideDto,
  CancelRideResponseDto,
} from "../types/rides.types";

export interface CancelRideVariables {
  rideId: string;
  payload?: CancelRideDto;
}

export type UseCancelRideMutationOptions = Omit<
  UseMutationOptions<CancelRideResponseDto, Error, CancelRideVariables>,
  "mutationFn"
>;

/**
 * TanStack Query mutation hook for cancelling an active passenger ride.
 * Upon success:
 * - Resets booking draft store state via resetBookingDraft() and setActiveRideId(null)
 * - Invalidates 'rides' and ['rides', 'active'] query keys
 * - Invokes caller's onSuccess callback
 */
export function useCancelRideMutation(
  options?: UseCancelRideMutationOptions
): UseMutationResult<CancelRideResponseDto, Error, CancelRideVariables> {
  const queryClient = useQueryClient();
  const resetBookingDraft = useRideBookingStore(
    (state) => state.resetBookingDraft
  );
  const setActiveRideId = useRideBookingStore(
    (state) => state.setActiveRideId
  );

  return useMutation({
    ...options,
    mutationFn: ({ rideId, payload }: CancelRideVariables) =>
      ridesApi.cancelRide(rideId, payload),
    onSuccess: (...args) => {
      // 1. Reset booking store state
      resetBookingDraft();
      setActiveRideId(null);

      // 2. Invalidate query keys
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["rides", "active"] });

      // 3. Invoke caller's onSuccess callback if provided
      options?.onSuccess?.(...args);
    },
  });
}

export default useCancelRideMutation;
