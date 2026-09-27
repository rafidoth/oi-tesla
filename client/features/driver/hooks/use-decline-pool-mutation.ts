"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { driverApi } from "../api/driver.api";
import { OPEN_POOLS_QUERY_KEY } from "./use-open-pools-query";
import type { OpenPoolItem } from "../types/driver.types";
import { toast } from "@/components/ui/toast";

export interface DeclinePoolVariables {
  poolId: string;
  reason?: string;
}

interface DeclinePoolContext {
  previousPools?: OpenPoolItem[];
}

export type UseDeclinePoolMutationOptions = Omit<
  UseMutationOptions<
    { success: boolean; poolId: string },
    Error,
    DeclinePoolVariables,
    DeclinePoolContext
  >,
  "mutationFn"
>;

export function useDeclinePoolMutation(
  options?: UseDeclinePoolMutationOptions
): UseMutationResult<
  { success: boolean; poolId: string },
  Error,
  DeclinePoolVariables,
  DeclinePoolContext
> {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ poolId, reason }: DeclinePoolVariables) =>
      driverApi.declinePool(poolId, reason),
    onMutate: async ({ poolId }: DeclinePoolVariables) => {
      await queryClient.cancelQueries({ queryKey: OPEN_POOLS_QUERY_KEY });

      const previousPools = queryClient.getQueryData<OpenPoolItem[]>(OPEN_POOLS_QUERY_KEY);

      queryClient.setQueryData<OpenPoolItem[]>(OPEN_POOLS_QUERY_KEY, (old) =>
        old ? old.filter((pool) => pool.id !== poolId) : []
      );

      return { previousPools };
    },
    onError: (...args) => {
      const [error, , context] = args;
      if (context?.previousPools) {
        queryClient.setQueryData(OPEN_POOLS_QUERY_KEY, context.previousPools);
      }

      toast.add({
        title: "Failed to decline pool",
        description: error.message || "An unexpected error occurred.",
        type: "error",
      });

      options?.onError?.(...args);
    },
    onSuccess: (...args) => {
      toast.add({
        title: "Pool declined",
        description: "Pool removed from your available requests feed.",
        type: "info",
      });

      options?.onSuccess?.(...args);
    },
    onSettled: (...args) => {
      queryClient.invalidateQueries({ queryKey: OPEN_POOLS_QUERY_KEY });
      options?.onSettled?.(...args);
    },
  });
}

export default useDeclinePoolMutation;
