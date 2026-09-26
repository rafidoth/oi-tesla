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
  CreateRideDto,
  RideBookingResponseDto,
  PoolAssignmentDto,
} from "../types/rides.types";

export type UseCreateRideMutationOptions = Omit<
  UseMutationOptions<RideBookingResponseDto, Error, CreateRideDto>,
  "mutationFn"
>;

/**
 * TanStack Query mutation hook for submitting a ride request.
 * Upon success, stores activeRideId and poolAssignment in the client store,
 * and invalidates relevant ride queries.
 */
export function useCreateRideMutation(
  options?: UseCreateRideMutationOptions
): UseMutationResult<RideBookingResponseDto, Error, CreateRideDto> {
  const queryClient = useQueryClient();
  const setActiveRideId = useRideBookingStore((state) => state.setActiveRideId);
  const setPoolAssignment = useRideBookingStore(
    (state) => state.setPoolAssignment
  );

  return useMutation({
    ...options,
    mutationFn: (payload: CreateRideDto) => ridesApi.createRide(payload),
    onSuccess: (...args) => {
      const [data] = args;
      // 1. Record active ride ID
      setActiveRideId(data.rideId);

      // 2. Set pool assignment snapshot
      const poolAssignment: PoolAssignmentDto = {
        poolId: data.poolId,
        status: (data.status as PoolAssignmentDto["status"]) || "OPEN",
        occupiedSeats: data.occupiedSeats ?? data.seats,
        capacity: data.capacity ?? 3,
        isNewPool: data.isNewPool,
        driverId: data.driverId ?? null,
        vehicleId: data.vehicleId ?? null,
      };
      setPoolAssignment(poolAssignment);

      // 3. Invalidate query keys
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["rides", "active"] });

      // 4. Invoke caller's onSuccess callback if provided
      options?.onSuccess?.(...args);
    },
  });
}

export default useCreateRideMutation;
