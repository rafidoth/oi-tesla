"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { driverApi } from "../api/driver.api";
import { OPEN_POOLS_QUERY_KEY } from "./use-open-pools-query";
import { DRIVER_ME_QUERY_KEY } from "./use-driver-me";
import type { AcceptPoolResponse } from "../types/driver.types";
import { toast } from "@/components/ui/toast";

export interface AcceptPoolVariables {
  poolId: string;
}

export type UseAcceptPoolMutationOptions = Omit<
  UseMutationOptions<AcceptPoolResponse, Error, AcceptPoolVariables>,
  "mutationFn"
>;

export function useAcceptPoolMutation(
  options?: UseAcceptPoolMutationOptions
): UseMutationResult<AcceptPoolResponse, Error, AcceptPoolVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ poolId }: AcceptPoolVariables) => driverApi.acceptPool(poolId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: DRIVER_ME_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: OPEN_POOLS_QUERY_KEY });

      toast.add({
        title: "Pool Accepted",
        description: "You have been assigned to this ride pool.",
        type: "success",
      });

      options?.onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error] = args;
      const axiosError = error as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      const message =
        axiosError.response?.data?.error?.message ||
        error.message ||
        "Failed to accept pool.";

      toast.add({
        title: "Cannot Accept Pool",
        description: message,
        type: "error",
      });

      options?.onError?.(...args);
    },
  });
}

export default useAcceptPoolMutation;
