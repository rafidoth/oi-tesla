"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { driverApi } from "../api/driver.api";
import { DRIVER_ME_QUERY_KEY } from "./use-driver-me";
import type {
  DriverMeResponse,
  UpdateDriverStatusInput,
  UpdateDriverStatusResponse,
} from "../types/driver.types";

export type UseUpdateDriverStatusMutationOptions = Omit<
  UseMutationOptions<UpdateDriverStatusResponse, Error, UpdateDriverStatusInput>,
  "mutationFn"
>;

export function useUpdateDriverStatusMutation(
  options?: UseUpdateDriverStatusMutationOptions
): UseMutationResult<UpdateDriverStatusResponse, Error, UpdateDriverStatusInput> {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (input: UpdateDriverStatusInput) => driverApi.updateStatus(input),
    onSuccess: (...args) => {
      const [data] = args;
      queryClient.setQueryData<DriverMeResponse>(DRIVER_ME_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          vehicle: {
            ...old.vehicle,
            status: data.status,
          },
        };
      });

      queryClient.invalidateQueries({ queryKey: DRIVER_ME_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

export default useUpdateDriverStatusMutation;
