"use client";

import * as React from "react";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleOnline } from "@/components/custom/toggle-online";
import type { DriverMeResponse } from "../types/driver.types";
import { DriverPoolHistoryDrawer } from "./history";

interface DriverDashboardHeaderProps {
  data?: DriverMeResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onToggleStatus?: (nextStatus: "ONLINE" | "OFFLINE") => void;
  isUpdatingStatus?: boolean;
  hasActivePool?: boolean;
  historyTrigger?: React.ReactNode;
}

export function DriverDashboardHeader({
  data,
  isLoading,
  isError,
  error,
  onRetry,
  onToggleStatus,
  isUpdatingStatus = false,
  hasActivePool = false,
  historyTrigger,
}: DriverDashboardHeaderProps) {
  if (isLoading) {
    return (
      <Card className="p-5 space-y-4 ">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24 rounded-xs" animate />
              <Skeleton className="h-3 w-12 rounded-full" animate />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-44 rounded-sm" animate />
              <Skeleton className="h-7 w-24 rounded-lg" animate />
            </div>
            <Skeleton className="h-4 w-32 rounded-xs" animate />
          </div>
          <div className="flex items-center gap-6 sm:border-l sm:border-border/60 sm:pl-6">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16 rounded-xs" animate />
              <Skeleton className="h-6 w-12 rounded-full" animate />
            </div>
            <div className="border-l border-border/40 pl-6 space-y-1.5">
              <Skeleton className="h-3 w-20 rounded-xs" animate />
              <Skeleton className="h-5 w-24 rounded-sm" animate />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-error/20 bg-error-surface p-5 space-y-3 shadow-xs">
        <div className="flex items-start gap-3 text-error">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold tracking-tight">Driver profile unavailable</h3>
            <p className="text-sm text-error/90 mt-0.5">
              {error?.message || "Could not load driver or assigned vehicle information."}
            </p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-sm shrink-0 border-error/30 hover:bg-error/10 text-error gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              <span>Retry</span>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const { driver, vehicle } = data;
  const isOnline = vehicle.status === "ONLINE";

  return (
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Driver and Vehicle Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-ink-secondary">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-ink">
              DRIVER
            </span>
            <span className="text-muted">•</span>
            <span className="inline-flex items-center gap-1.5 text-sm">
              <span
                className={`size-1.5 rounded-full ${
                  isOnline ? "bg-success" : "bg-muted"
                }`}
              />
              <span className={isOnline ? "text-ink font-medium" : "text-ink-secondary"}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {driver.name}
            </h1>
            {historyTrigger ?? (
              <DriverPoolHistoryDrawer
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-sm font-semibold h-7 px-2.5 rounded-lg border-border hover:bg-surface-subtle text-ink cursor-pointer"
                  >
                    <Clock className="size-3.5 text-ink-secondary" />
                    <span>Past Pools</span>
                  </Button>
                }
              />
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-ink-secondary pt-0.5">
            <span className="font-semibold text-ink">{vehicle.name}</span>
            <span className="text-muted">•</span>
            <span className="font-mono bg-surface-subtle text-ink px-1.5 py-0.5 rounded border border-border text-[11px] font-semibold">
              {vehicle.regNo}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 sm:border-l sm:border-border/60 sm:pl-6">
          {onToggleStatus && (
            <div className="flex flex-col items-start sm:items-end gap-1">
              <span className="text-sm text-ink-secondary font-medium">Availability</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">
                  {hasActivePool ? "On Trip" : isOnline ? "Available" : "Off Duty"}
                </span>
                <ToggleOnline
                  online={isOnline}
                  onToggle={(nextState) =>
                    onToggleStatus(nextState ? "ONLINE" : "OFFLINE")
                  }
                  disabled={isUpdatingStatus || hasActivePool}
                />
              </div>
            </div>
          )}

          <div className="border-l border-border/40 pl-4 sm:pl-6 text-left sm:text-right">
            <div className="text-sm text-ink-secondary font-medium">Physical Capacity</div>
            <div className="text-base font-bold text-ink flex items-center sm:justify-end gap-1.5 mt-0.5">
              <div className="flex gap-1" aria-label={`${vehicle.capacity} seats`}>
                {Array.from({ length: vehicle.capacity }).map((_, i) => (
                  <span
                    key={i}
                    className="size-2 rounded-full bg-black"
                  />
                ))}
              </div>
              <span>{vehicle.capacity} seats</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default DriverDashboardHeader;
