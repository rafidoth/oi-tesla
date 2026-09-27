"use client";

import * as React from "react";
import {
  useDriverMeQuery,
  useUpdateDriverStatusMutation,
  DriverDashboardHeader,
  DriverOffDutyBanner,
} from "@/features/driver";

export default function DriverDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDriverMeQuery();
  const updateStatusMutation = useUpdateDriverStatusMutation({
    onSuccess: (response) => {
      if (response.status === "ONLINE") {
        refetch();
      }
    },
  });

  const isOffline = data?.vehicle && data.vehicle.status === "OFFLINE";

  const handleToggleStatus = (nextStatus: "ONLINE" | "OFFLINE") => {
    updateStatusMutation.mutate({ status: nextStatus });
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
    </div>
  );
}

