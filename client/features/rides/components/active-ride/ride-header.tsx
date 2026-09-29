"use client";

import * as React from "react";
import { StatusBadge, type RideStatus } from "@/components/custom/status-badge";
import { cn } from "cn";

export interface RideHeaderProps {
  id: string;
  status: RideStatus;
  className?: string;
}

export function RideHeader({ id, status, className }: RideHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="text-sm font-bold uppercase tracking-wider text-ink-secondary">
        Active Trip
      </span>
      <StatusBadge status={status} />
    </div>
  );
}
