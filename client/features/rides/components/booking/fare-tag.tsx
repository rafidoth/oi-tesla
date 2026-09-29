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
  size?: "default" | "lg";
  className?: string;
}

export function FareTag({
  estimate,
  isLoading = false,
  isError = false,
  size = "default",
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
        Route not available
      </div>
    );
  }

  if (!estimate) {
    return null;
  }

  const distanceKm = (estimate.distanceM / 1000).toFixed(1);

  return (
    <div
      className={cn(
        "flex items-center justify-between bg-surface border border-border",
        size === "lg" ? "py-3 px-4 rounded-xl" : "py-2.5 px-3.5 rounded-[var(--radius-md)]",
        className
      )}
    >
      <div className="flex items-center gap-2 text-ink-secondary">
        <Navigation className={cn("text-ink", size === "lg" ? "size-5" : "size-4")} />
        <span
          className={cn(
            "font-semibold text-ink tabular-nums",
            size === "lg" ? "text-base" : "text-sm"
          )}
        >
          {distanceKm} km
        </span>
      </div>

      <div className="flex items-center gap-2">
        <FareDisplay
          paisa={estimate.soloFarePaisa}
          size={size === "lg" ? "default" : "sm"}
          align="right"
        />
      </div>
    </div>
  );
}
