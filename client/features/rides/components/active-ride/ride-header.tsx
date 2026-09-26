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
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-black" />
        <span className="text-xs text-ink-secondary bg-surface px-2 py-0.5 rounded-[var(--radius-sm)] border border-border tabular-nums font-medium">
          #{id.slice(0, 8)}
        </span>
      </div>

      <StatusBadge status={status} />
    </div>
  );
}
