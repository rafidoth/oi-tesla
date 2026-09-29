"use client";

import * as React from "react";
import { FareDisplay } from "@/components/custom/fare-display";
import { Skeleton } from "@/components/ui/skeleton";
import type { EstimateResponseDto } from "../../types/rides.types";
import { Navigation } from "lucide-react";
import { cn } from "cn";

export interface FareTagProps {
  estimate?: EstimateResponseDto | null;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

export function FareTag({
  estimate,
  isLoading = false,
  isError = false,
  className,
}: FareTagProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-between py-2 px-3 rounded-lg bg-surface border border-border", className)}>
        <Skeleton className="h-4 w-20 rounded-xs" animate />
        <Skeleton className="h-6 w-24 rounded-xs" animate />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("p-2.5 rounded-[var(--radius-md)] bg-error-surface border border-error/20 text-sm text-error text-center font-medium", className)}>
        Corridor route not available
      </div>
    );
  }

  if (!estimate) {
    return null;
  }

  const distanceKm = (estimate.distanceM / 1000).toFixed(1);

  return (
    <div className={cn("flex items-center justify-between py-2.5 px-3.5 rounded-[var(--radius-md)] bg-surface border border-border", className)}>
      <div className="flex items-center gap-1.5 text-sm text-ink-secondary">
        <Navigation className="size-4 text-ink" />
        <span className="font-medium text-ink tabular-nums">{distanceKm} km</span>
      </div>

      <div className="flex items-center gap-2">
        <FareDisplay
          paisa={estimate.soloFarePaisa}
          size="default"
          align="right"
        />
      </div>
    </div>
  );
}
