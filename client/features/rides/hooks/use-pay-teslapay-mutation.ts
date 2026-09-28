"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { ridesApi } from "../api/rides.api";
import type { PayRideResponseDto } from "../types/rides.types";

export interface PayTeslaPayVariables {
  rideId: string;
}

export type UsePayTeslaPayMutationOptions = Omit<
  UseMutationOptions<PayRideResponseDto, Error, PayTeslaPayVariables>,
  "mutationFn"
>;

export function usePayTeslaPayMutation(
  options?: UsePayTeslaPayMutationOptions
): UseMutationResult<PayRideResponseDto, Error, PayTeslaPayVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ rideId }: PayTeslaPayVariables) =>
      ridesApi.payTeslaPayRide(rideId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["rides", "active"] });
      queryClient.invalidateQueries({ queryKey: ["active-ride"] });
      queryClient.invalidateQueries({ queryKey: ["passenger-rides-history"] });
      options?.onSuccess?.(...args);
    },
  });
}

export default usePayTeslaPayMutation;
