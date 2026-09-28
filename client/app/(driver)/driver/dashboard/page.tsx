"use client";

import * as React from "react";
import {
  useDriverMeQuery,
  useUpdateDriverStatusMutation,
  useOpenPoolsQuery,
  useDeclinePoolMutation,
  useAcceptPoolMutation,
  DriverDashboardHeader,
  DriverOffDutyBanner,
  OpenPoolsFeed,
  ActivePoolConsole,
} from "@/features/driver";

export default function DriverDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDriverMeQuery();

  const [viewingCompletedPoolId, setViewingCompletedPoolId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (data?.activePool?.id) {
      setViewingCompletedPoolId(data.activePool.id);
    }
  }, [data?.activePool?.id]);

  const activePoolId = data?.activePool?.id ?? viewingCompletedPoolId;
  const hasActivePool = Boolean(activePoolId);
  const isOnline = data?.vehicle?.status === "ONLINE";
  const isOffline = data?.vehicle?.status === "OFFLINE";

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

  const [acceptError, setAcceptError] = React.useState<string | null>(null);

  const acceptPoolMutation = useAcceptPoolMutation({
    onMutate: () => {
      setAcceptError(null);
    },
    onSuccess: () => {
      setAcceptError(null);
      refetch();
    },
    onError: (err) => {
      const axiosError = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setAcceptError(
        axiosError.response?.data?.error?.message ||
        axiosError.message ||
        "Failed to accept pool"
      );
    },
  });

  const handleToggleStatus = (nextStatus: "ONLINE" | "OFFLINE") => {
    updateStatusMutation.mutate({ status: nextStatus });
  };

  const handleDeclinePool = (poolId: string) => {
    declinePoolMutation.mutate({ poolId });
  };

  const handleAcceptPool = (poolId: string) => {
    acceptPoolMutation.mutate({ poolId });
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

      {hasActivePool && activePoolId ? (
        <ActivePoolConsole
          poolId={activePoolId}
          onResetConsole={() => {
            setViewingCompletedPoolId(null);
            refetch();
            refetchOpenPools();
          }}
        />
      ) : (
        <>
          {isOffline && (
            <DriverOffDutyBanner
              onGoOnline={() => handleToggleStatus("ONLINE")}
              isUpdating={updateStatusMutation.isPending}
            />
          )}

          {isOnline && (
            <OpenPoolsFeed
              pools={openPools}
              isLoading={isOpenPoolsLoading}
              isFetching={isOpenPoolsFetching}
              isError={isOpenPoolsError}
              error={openPoolsError}
              acceptingPoolId={
                acceptPoolMutation.isPending
                  ? acceptPoolMutation.variables?.poolId
                  : undefined
              }
              decliningPoolId={
                declinePoolMutation.isPending
                  ? declinePoolMutation.variables?.poolId
                  : undefined
              }
              acceptError={acceptError}
              onClearAcceptError={() => setAcceptError(null)}
              onRefresh={() => refetchOpenPools()}
              onAccept={handleAcceptPool}
              onDecline={handleDeclinePool}
            />
          )}
        </>
      )}
    </div>
  );
}


