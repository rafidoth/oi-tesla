"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import type { DerivedRideStatus } from "../../types/rides.types";
import { cn } from "cn";

export interface RideActionsProps {
  isCancellable: boolean;
  status: DerivedRideStatus;
  onCancelClick: () => void;
  className?: string;
}

export function RideActions({
  isCancellable,
  status,
  onCancelClick,
  className,
}: RideActionsProps) {
  if (status === "COMPLETED" || status === "CANCELLED") {
    return null;
  }

  return (
    <div className={cn("pt-2 flex items-center justify-between", className)}>
      {isCancellable ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancelClick}
          className="text-xs text-destructive hover:bg-destructive/10 border-border hover:border-destructive/30 cursor-pointer hover:cursor-pointer"
        >
          Cancel Ride
        </Button>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-ink-secondary bg-surface px-2.5 py-1 rounded-md border border-border">
          <Lock className="size-3 text-ink-secondary" />
          <span>{status === "STARTED" ? "Trip in motion" : "Driver arrived"}</span>
        </div>
      )}
    </div>
  );
}
