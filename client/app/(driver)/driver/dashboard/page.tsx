"use client";

import * as React from "react";
import {
  useDriverMeQuery,
  useUpdateDriverStatusMutation,
  useOpenPoolsQuery,
  useDeclinePoolMutation,
  DriverDashboardHeader,
  DriverOffDutyBanner,
  OpenPoolsFeed,
} from "@/features/driver";

export default function DriverDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDriverMeQuery();

  const isOnline = data?.vehicle?.status === "ONLINE";
  const hasActivePool = Boolean(data?.activePool);

  const {
    data: openPools,
    isLoading: isOpenPoolsLoading,
    isFetching: isOpenPoolsFetching,
    isError: isOpenPoolsError,
    error: openPoolsError,
    refetch: refetchOpenPools,
  } = useOpenPoolsQuery({
    enabled: isOnline && !hasActivePool,
  });

  const updateStatusMutation = useUpdateDriverStatusMutation({
    onSuccess: (response) => {
      refetch();
      if (response.status === "ONLINE") {
        refetchOpenPools();
      }
    },
  });

  const declinePoolMutation = useDeclinePoolMutation();

  const isOffline = data?.vehicle && data.vehicle.status === "OFFLINE";

  const handleToggleStatus = (nextStatus: "ONLINE" | "OFFLINE") => {
    updateStatusMutation.mutate({ status: nextStatus });
  };

  const handleDeclinePool = (poolId: string) => {
    declinePoolMutation.mutate({ poolId });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <DriverDashboardHeader
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        onToggleStatus={handleToggleStatus}
        isUpdatingStatus={updateStatusMutation.isPending}
      />

      {isOffline && (
        <DriverOffDutyBanner
          onGoOnline={() => handleToggleStatus("ONLINE")}
          isUpdating={updateStatusMutation.isPending}
        />
      )}

      {isOnline && !hasActivePool && (
        <OpenPoolsFeed
          pools={openPools}
          isLoading={isOpenPoolsLoading}
          isFetching={isOpenPoolsFetching}
          isError={isOpenPoolsError}
          error={openPoolsError}
          decliningPoolId={
            declinePoolMutation.isPending
              ? declinePoolMutation.variables?.poolId
              : undefined
          }
          onRefresh={() => refetchOpenPools()}
          onDecline={handleDeclinePool}
        />
      )}
    </div>
  );
}


