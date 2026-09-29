"use client";

import * as React from "react";
import { useDriverPoolHistoryQuery } from "../../hooks/use-driver-pool-history-query";

export type DriverHistoryFilter = "ALL" | "COMPLETED" | "CANCELLED";

export function useDriverHistory() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<DriverHistoryFilter>("ALL");

  const historyQuery = useDriverPoolHistoryQuery({
    status: filter,
  });

  return {
    isOpen,
    setIsOpen,
    filter,
    setFilter,
    pools: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    isError: historyQuery.isError,
    refetch: historyQuery.refetch,
  };
}

export default useDriverHistory;
