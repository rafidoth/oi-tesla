"use client";

import * as React from "react";
import { useDriverMeQuery, DriverDashboardHeader } from "@/features/driver";

export default function DriverDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDriverMeQuery();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Driver & Vehicle Profile Header */}
      <DriverDashboardHeader
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
      />
    </div>
  );
}
