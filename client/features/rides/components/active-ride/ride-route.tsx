"use client";

import * as React from "react";
import { CircleDot, MapPin } from "lucide-react";
import { cn } from "cn";

export interface RideRouteProps {
  pickupName: string;
  destName: string;
  className?: string;
}

export function RideRoute({ pickupName, destName, className }: RideRouteProps) {
  return (
    <div className={cn("relative pl-6 space-y-4", className)}>
      {/* Vertical connector line */}
      <div
        className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-border -translate-x-1/2"
        aria-hidden="true"
      />

      {/* Origin */}
      <div className="relative flex items-center gap-3">
        <div className="absolute -left-6 size-5 rounded-full bg-surface-subtle text-ink border border-border-strong flex items-center justify-center shrink-0">
          <CircleDot className="size-3.5 text-ink" />
        </div>
        <span className="text-base font-semibold text-ink leading-tight">
          {pickupName}
        </span>
      </div>

      {/* Destination */}
      <div className="relative flex items-center gap-3">
        <div className="absolute -left-6 size-5 rounded-full bg-black text-white border border-black flex items-center justify-center shrink-0">
          <MapPin className="size-3.5 text-white" />
        </div>
        <span className="text-base font-semibold text-ink leading-tight">
          {destName}
        </span>
      </div>
    </div>
  );
}
