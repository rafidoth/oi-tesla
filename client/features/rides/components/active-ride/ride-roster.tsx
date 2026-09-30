"use client";

import * as React from "react";
import { SeatMeter } from "@/components/custom/seat-meter";
import { Radio, MapPin, Users } from "lucide-react";
import { cn } from "cn";
import type { CoPassengerSummary } from "../../types/rides.types";

export interface RideRosterProps {
  occupiedSeats: number;
  capacity: number;
  userSeats: number;
  driver?: { name: string } | null;
  vehicle?: { name: string; regNo: string } | null;
  coPassengers?: CoPassengerSummary[];
  className?: string;
}

export function RideRoster({
  occupiedSeats,
  capacity,
  userSeats,
  driver,
  vehicle,
  coPassengers = [],
  className,
}: RideRosterProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Occupancy */}
        <div className="p-3.5 rounded-xl bg-surface-subtle/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              Pool Occupancy
            </span>
            <p className="text-sm font-medium text-ink">
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
        <div className="p-3.5 rounded-xl bg-surface-subtle/80 flex items-center justify-between">
          {driver ? (
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                Driver & Vehicle
              </span>
              <p className="text-sm font-semibold text-ink truncate">
                {driver.name}
              </p>
              {vehicle && (
                <p className="text-xs text-ink-secondary truncate">
                  {vehicle.name} • {vehicle.regNo}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-ink-secondary py-1">
              <Radio className="size-3.5 text-ink-secondary animate-spin shrink-0" />
              <span>Matching Tesla...</span>
            </div>
          )}
        </div>
      </div>

      {/* Co-Passengers (D16) */}
      {coPassengers.length > 0 && (
        <div className="p-3.5 rounded-xl bg-surface-subtle/80 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-ink-secondary shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              Co-Passengers
            </span>
          </div>
          <div className="space-y-1.5">
            {coPassengers.map((cp, i) => (
              <div
                key={`${cp.name}-${cp.destLocationName}-${i}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium text-ink truncate">
                  {cp.name}
                </span>
                <div className="flex items-center gap-1 text-ink-secondary shrink-0 ml-3">
                  <MapPin className="size-3 shrink-0" />
                  <span className="text-xs">
                    {cp.destLocationName}
                    {cp.seats > 1 && ` · ${cp.seats} seats`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

