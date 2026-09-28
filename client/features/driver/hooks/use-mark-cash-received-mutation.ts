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
import type { MarkCashReceivedResponse } from "../types/driver.types";
import { toast } from "@/components/ui/toast";

export interface MarkCashReceivedVariables {
  passengerRideId: string;
  poolId?: string;
}

export type UseMarkCashReceivedMutationOptions = Omit<
  UseMutationOptions<MarkCashReceivedResponse, Error, MarkCashReceivedVariables>,
  "mutationFn"
>;

export function useMarkCashReceivedMutation(
  options?: UseMarkCashReceivedMutationOptions
): UseMutationResult<MarkCashReceivedResponse, Error, MarkCashReceivedVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ passengerRideId }: MarkCashReceivedVariables) =>
      driverApi.markCashReceived(passengerRideId),
    onSuccess: (...args) => {
      const [, variables] = args;
      if (variables.poolId) {
        queryClient.invalidateQueries({
          queryKey: DRIVER_POOL_DETAILS_QUERY_KEY(variables.poolId),
        });
      }
      queryClient.invalidateQueries({ queryKey: DRIVER_ME_QUERY_KEY });

      toast.add({
        title: "Cash Received",
        description: "Payment marked as paid successfully.",
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
        "Failed to record cash payment.";

      toast.add({
        title: "Action Failed",
        description: message,
        type: "error",
      });

      options?.onError?.(...args);
    },
  });
}

export default useMarkCashReceivedMutation;
