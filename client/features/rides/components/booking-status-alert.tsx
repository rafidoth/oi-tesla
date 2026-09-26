"use client";

import * as React from "react";
import { AlertCircle, CheckCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoolAssignmentDto } from "../types/rides.types";
import { cn } from "cn";

export interface BookingStatusAlertProps {
  poolAssignment?: PoolAssignmentDto | null;
  error?: Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function BookingStatusAlert({
  poolAssignment,
  error,
  onRetry,
  onDismiss,
  className,
}: BookingStatusAlertProps) {
  const currentKey = error
    ? `err:${error.message}`
    : poolAssignment
      ? `pool:${poolAssignment.poolId}:${poolAssignment.status}:${poolAssignment.occupiedSeats}`
      : null;

  const [dismissedKey, setDismissedKey] = React.useState<string | null>(null);

  if (!currentKey || dismissedKey === currentKey) {
    return null;
  }

  const handleDismiss = () => {
    setDismissedKey(currentKey);
    onDismiss?.();
  };

  // Error alert
  if (error) {
    return (
      <div
        data-slot="booking-status-alert-error"
        role="alert"
        className={cn(
          "flex items-center justify-between gap-3 p-3 rounded-lg border border-destructive/25 bg-destructive/10 text-destructive text-xs",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle className="size-4 shrink-0" />
          <span className="truncate">{error.message || "Booking failed"}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-6 px-2 text-[11px] border-destructive/30 text-destructive hover:bg-destructive/15"
            >
              <RefreshCw className="size-3 mr-1" />
              Retry
            </Button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="p-1 rounded text-destructive/70 hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Pool Assignment confirmation
  if (poolAssignment) {
    return (
      <div
        data-slot="booking-status-alert-pool"
        className={cn(
          "flex items-center justify-between gap-3 p-3 rounded-[var(--radius-md)] border border-info/20 bg-info-surface text-xs text-ink",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <CheckCircle className="size-4 text-info shrink-0" />
          <span>
            {poolAssignment.isNewPool ? "Formed new pool" : "Joined corridor pool"} • {poolAssignment.occupiedSeats}/{poolAssignment.capacity} seats filled
          </span>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="p-1 rounded text-ink-secondary hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return null;
}

export default BookingStatusAlert;
