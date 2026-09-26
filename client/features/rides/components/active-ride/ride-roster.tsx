"use client";

import * as React from "react";
import { SeatMeter } from "@/components/custom/seat-meter";
import { Radio } from "lucide-react";
import { cn } from "cn";

export interface RideRosterProps {
  occupiedSeats: number;
  capacity: number;
  userSeats: number;
  driver?: { name: string } | null;
  vehicle?: { name: string; regNo: string } | null;
  className?: string;
}

export function RideRoster({
  occupiedSeats,
  capacity,
  userSeats,
  driver,
  vehicle,
  className,
}: RideRosterProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
      {/* Occupancy */}
      <div className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
            Pool Occupancy
          </span>
          <p className="text-xs font-medium text-ink">
            {userSeats} {userSeats === 1 ? "seat" : "seats"} for you
          </p>
        </div>

        <SeatMeter
          occupiedSeats={occupiedSeats}
          capacity={capacity}
          showCount
          size="default"
        />
      </div>

      {/* Driver & Vehicle */}
      <div className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between">
        {driver ? (
          <div className="space-y-0.5 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
              Driver & Vehicle
            </span>
            <p className="text-xs font-semibold text-ink truncate">
              {driver.name}
            </p>
            {vehicle && (
              <p className="text-[11px] text-ink-secondary truncate">
                {vehicle.name} • {vehicle.regNo}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-ink-secondary py-1">
            <Radio className="size-3.5 text-ink-secondary animate-spin shrink-0" />
            <span>Matching Tesla...</span>
          </div>
        )}
      </div>
    </div>
  );
}
