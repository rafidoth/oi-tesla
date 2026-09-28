"use client";

import * as React from "react";
import { usePassengerRideHistoryQuery } from "../../hooks/use-passenger-ride-history-query";
import { usePayTeslaPayMutation } from "../../hooks/use-pay-teslapay-mutation";

export type RideHistoryFilter = "ALL" | "COMPLETED" | "CANCELLED";

export function useRideHistory() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<RideHistoryFilter>("ALL");
  const [settlingRideId, setSettlingRideId] = React.useState<string | null>(null);
  const [failedRideId, setFailedRideId] = React.useState<string | null>(null);

  const historyQuery = usePassengerRideHistoryQuery(filter);
  const payMutation = usePayTeslaPayMutation();

  const handlePay = React.useCallback(
    (rideId: string) => {
      setSettlingRideId(rideId);
      setFailedRideId(null);
      payMutation.mutate(
        { rideId },
        {
          onSuccess: () => setSettlingRideId(null),
          onError: () => {
            setSettlingRideId(null);
            setFailedRideId(rideId);
          },
        }
      );
    },
    [payMutation]
  );

  return {
    isOpen,
    setIsOpen,
    filter,
    setFilter,
    rides: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    isError: historyQuery.isError,
    refetch: historyQuery.refetch,
    settlingRideId,
    failedRideId,
    handlePay,
  };
}
