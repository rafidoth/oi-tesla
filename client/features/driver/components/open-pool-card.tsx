"use client";

import * as React from "react";
import { MapPin, Users, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SeatMeter } from "@/components/custom/seat-meter";
import type { OpenPoolItem } from "../types/driver.types";

interface OpenPoolCardProps {
  pool: OpenPoolItem;
  onAccept?: (poolId: string) => void;
  onDecline?: (poolId: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

export function OpenPoolCard({
  pool,
  onAccept,
  onDecline,
  isAccepting = false,
  isDeclining = false,
}: OpenPoolCardProps) {
  const isActionDisabled = isAccepting || isDeclining;

  return (
    <Card className="p-5 border border-border/80 hover:border-black/30 transition-all bg-card shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Origin Hub Segment */}
        <div className="md:col-span-4 md:border-r md:border-border/60 md:pr-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <MapPin className="size-3.5 shrink-0" />
            <span>Pickup Origin</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-ink">
            {pool.pickupLocationName}
          </h3>
          <div className="text-xs text-ink-secondary font-mono">
            Pool #{pool.id.slice(0, 8)}
          </div>
        </div>

        {/* Dropoffs & Passenger Details Segment */}
        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
            <span>Dropoff Destinations</span>
            <div className="flex items-center gap-1 normal-case tracking-normal font-medium text-xs text-ink-secondary">
              <Users className="size-3.5" />
              <span>
                {pool.passengerCount} {pool.passengerCount === 1 ? "passenger" : "passengers"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {pool.memberRequests.map((req, idx) => (
              <span
                key={req.passengerRideId || idx}
                className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-border text-xs font-semibold text-ink"
              >
                {req.destLocationName} • {req.seats} {req.seats === 1 ? "seat" : "seats"}
              </span>
            ))}
          </div>
        </div>

        {/* Occupancy & Action Controls Segment */}
        <div className="md:col-span-3 flex flex-col md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-border/60">
          <div className="space-y-1 md:text-right">
            <div className="text-[11px] font-medium text-ink-secondary">Occupancy</div>
            <SeatMeter
              occupiedSeats={pool.occupiedSeats}
              capacity={pool.capacity}
              showCount
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {onDecline && (
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={() => onDecline(pool.id)}
                className="flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors disabled:opacity-50 border border-transparent hover:border-border"
              >
                Decline
              </button>
            )}
            {onAccept && (
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={() => onAccept(pool.id)}
                className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold bg-black text-white hover:bg-black/90 transition-all disabled:opacity-50 shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                {isAccepting && <Loader2 className="size-3.5 animate-spin" />}
                <span>{isAccepting ? "Accepting..." : "Accept"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default OpenPoolCard;
