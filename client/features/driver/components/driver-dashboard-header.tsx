"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type RideStatus } from "@/components/custom/status-badge";
import type { DriverMeResponse } from "../types/driver.types";

interface DriverDashboardHeaderProps {
  data?: DriverMeResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function DriverDashboardHeader({
  data,
  isLoading,
  isError,
  error,
  onRetry,
}: DriverDashboardHeaderProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24 rounded-xs" animate />
              <Skeleton className="h-3 w-12 rounded-full" animate />
            </div>
            <Skeleton className="h-7 w-44 rounded-sm" animate />
            <Skeleton className="h-4 w-32 rounded-xs" animate />
          </div>
          <div className="sm:border-l sm:border-border/60 sm:pl-5 space-y-1.5">
            <Skeleton className="h-3 w-20 rounded-xs" animate />
            <Skeleton className="h-5 w-24 rounded-sm" animate />
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
            <p className="text-xs text-error/90 mt-0.5">
              {error?.message || "Could not load driver or assigned vehicle information."}
            </p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-xs shrink-0 border-error/30 hover:bg-error/10 text-error gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              <span>Retry</span>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const { driver, vehicle, activePool } = data;
  const isOnline = vehicle.status === "ONLINE";

  return (
    <Card className="border-border bg-card p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Driver and Vehicle Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-ink">
              Driver Console
            </span>
            <span className="text-muted">•</span>
            {/* Minimal vehicle status indicator */}
            <span className="inline-flex items-center gap-1.5 text-xs">
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

          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {driver.name}
          </h1>

          <div className="flex items-center gap-2 text-xs text-ink-secondary pt-0.5">
            <span className="font-semibold text-ink">{vehicle.name}</span>
            <span className="text-muted">•</span>
            <span className="font-mono bg-surface-subtle text-ink px-1.5 py-0.5 rounded border border-border text-[11px] font-semibold">
              {vehicle.regNo}
            </span>
          </div>
        </div>

        {/* Right: Seating Capacity */}
        <div className="flex items-center gap-4 sm:border-l sm:border-border/60 sm:pl-5">
          <div className="text-left sm:text-right">
            <div className="text-xs text-ink-secondary font-medium">Physical Capacity</div>
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

      {/* Active Pool summary banner if currently in an active pool */}
      {activePool && (
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-ink-secondary">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">Active Pool:</span>
            <StatusBadge status={activePool.status as RideStatus} />
            {activePool.pickupLocationName && (
              <span>at {activePool.pickupLocationName}</span>
            )}
          </div>
          <div className="font-semibold text-ink">
            {activePool.occupiedSeats} / {activePool.capacity} seats
          </div>
        </div>
      )}
    </Card>
  );
}

export default DriverDashboardHeader;
