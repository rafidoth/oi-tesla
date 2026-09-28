"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { driverApi } from "../api/driver.api";
import { DRIVER_ME_QUERY_KEY } from "./use-driver-me";
import { DRIVER_POOL_DETAILS_QUERY_KEY } from "./use-driver-pool-details-query";
import type {
  PoolLifecycleAction,
  TransitionPoolResponse,
} from "../types/driver.types";
import { toast } from "@/components/ui/toast";

export interface PoolTransitionVariables {
  poolId: string;
  action: PoolLifecycleAction;
}

export type UsePoolTransitionMutationOptions = Omit<
  UseMutationOptions<TransitionPoolResponse, Error, PoolTransitionVariables>,
  "mutationFn"
>;

export function usePoolTransitionMutation(
  options?: UsePoolTransitionMutationOptions
): UseMutationResult<TransitionPoolResponse, Error, PoolTransitionVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ poolId, action }: PoolTransitionVariables) =>
      driverApi.transitionPool(poolId, action),
    onSuccess: (...args) => {
      const [data, variables] = args;
      queryClient.invalidateQueries({ queryKey: DRIVER_ME_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: DRIVER_POOL_DETAILS_QUERY_KEY(variables.poolId),
      });

      const actionTitles: Record<PoolLifecycleAction, string> = {
        arrive: "Driver Arrived",
        start: "Trip Started",
        complete: "Trip Completed",
      };

      toast.add({
        title: actionTitles[variables.action] ?? "Status Updated",
        description: `Pool transition to ${data.status} completed successfully.`,
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
        "Failed to update pool lifecycle.";

      toast.add({
        title: "Action Failed",
        description: message,
        type: "error",
      });

      options?.onError?.(...args);
    },
  });
}

export default usePoolTransitionMutation;
