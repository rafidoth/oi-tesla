"use client";

import * as React from "react";
import { RefreshCw, AlertCircle, Lock, AlertTriangle, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SeatMeter } from "@/components/custom/seat-meter";
import { FareDisplay } from "@/components/custom/fare-display";
import { StatusBadge, type RideStatus } from "@/components/custom/status-badge";
import { useDriverPoolDetailsQuery } from "../hooks/use-driver-pool-details-query";
import { PoolLifecycleActions } from "./pool-lifecycle-actions";
import { PassengerRoster, PassengerRosterSkeleton } from "./passenger-roster";
import type { DriverPoolRosterMember } from "../types/driver.types";

interface ActivePoolConsoleProps {
  poolId: string;
  onResetConsole?: () => void;
}

export function ActivePoolConsole({ poolId, onResetConsole }: ActivePoolConsoleProps) {
  const { data: pool, isLoading, isError, error, refetch, isFetching } =
    useDriverPoolDetailsQuery({ poolId });

  const prevRosterCount = React.useRef<number | null>(null);
  const [showCancellationAlert, setShowCancellationAlert] = React.useState(false);

  React.useEffect(() => {
    if (!pool) return;
    if (prevRosterCount.current !== null && pool.roster.length < prevRosterCount.current && pool.status !== "CANCELLED") {
      setShowCancellationAlert(true);
    }
    prevRosterCount.current = pool.roster.length;
  }, [pool]);

  if (isLoading) {
    return <ActivePoolSkeleton />;
  }

  if (isError || !pool) {
    return (
      <ActivePoolError
        errorMessage={error?.message || "Failed to load active pool details"}
        onRetry={() => refetch()}
      />
    );
  }

  if (pool.status === "CANCELLED") {
    return (
      <PoolCancelledNotice
        poolId={pool.id}
        onReturnToFeed={onResetConsole}
      />
    );
  }

  const isStarted = pool.status === "STARTED" || pool.status === "COMPLETED";
  const isCompleted = pool.status === "COMPLETED";

  return (
    <div className="space-y-4">
      {showCancellationAlert && (
        <PassengerCancellationAlert onDismiss={() => setShowCancellationAlert(false)} />
      )}
      <ConsoleTopBar
        poolId={pool.id}
        status={pool.status}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-5">
            <RouteCorridor
              pickupLocationName={pool.pickupLocationName}
              destinationStops={pool.destinationStops}
            />
            {isCompleted ? (
              <SettlementSummaryCard roster={pool.roster} />
            ) : (
              <CapacityMeter
                capacity={pool.capacity}
                occupiedSeats={pool.occupiedSeats}
                isStarted={isStarted}
              />
            )}
            <PoolLifecycleActions
              poolId={pool.id}
              status={pool.status}
              onResetConsole={onResetConsole}
            />
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="p-6 space-y-5">
            <PassengerRoster
              roster={pool.roster}
              isStarted={isStarted}
              isCompleted={isCompleted}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function ConsoleTopBar({
  poolId,
  status,
  isFetching,
  onRefresh,
}: {
  poolId: string;
  status: string;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2.5">
        <StatusBadge status={status as RideStatus} />
        <span className="text-xs text-ink-secondary font-mono">
          #POOL-{poolId.slice(0, 8)}
        </span>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="p-1.5 rounded-md text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
        title="Refresh active pool"
      >
        <RefreshCw
          className={`size-3.5 ${isFetching ? "animate-spin text-ink" : ""}`}
        />
      </button>
    </div>
  );
}

function PassengerCancellationAlert({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 shadow-xs animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-amber-600 shrink-0" />
        <span className="font-medium">
          A passenger cancelled their ride before arrival. Fares and seats have been recalculated.
        </span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="px-2 py-0.5 rounded text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
      >
        Dismiss
      </button>
    </div>
  );
}

function PoolCancelledNotice({
  poolId,
  onReturnToFeed,
}: {
  poolId: string;
  onReturnToFeed?: () => void;
}) {
  return (
    <Card className="p-8 border border-neutral-200 bg-white rounded-xl text-center space-y-4 max-w-lg mx-auto shadow-sm">
      <div className="size-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
        <AlertCircle className="size-6" />
      </div>
      <div className="space-y-1">
        <div className="flex justify-center">
          <StatusBadge status="CANCELLED" />
        </div>
        <h3 className="text-base font-bold text-ink pt-2">Pool Cancelled by Passengers</h3>
        <p className="text-xs text-ink-secondary leading-relaxed max-w-sm mx-auto">
          All passengers in pool <span className="font-mono font-medium">#{poolId.slice(0, 8)}</span> cancelled their ride requests before vehicle arrival. The pool has been closed and your vehicle is released.
        </p>
      </div>
      <div className="pt-2">
        <button
          type="button"
          onClick={onReturnToFeed}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-black/90 transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          Return to Open Pools Feed
        </button>
      </div>
    </Card>
  );
}

function RouteCorridor({
  pickupLocationName,
  destinationStops,
}: {
  pickupLocationName: string;
  destinationStops: Array<{ locationId: number; locationName: string }>;
}) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
        Route Corridor
      </div>
      <div className="space-y-3 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        <div className="relative">
          <span className="absolute -left-6 top-1 size-3 rounded-full border-2 border-black bg-white" />
          <div className="text-xs text-ink-secondary">Pickup Origin</div>
          <div className="text-sm font-bold text-ink">{pickupLocationName}</div>
        </div>

        {destinationStops.map((stop, index) => (
          <RouteStopItem
            key={stop.locationId}
            stopName={stop.locationName}
            isFinal={index === destinationStops.length - 1}
            stopIndex={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

function RouteStopItem({
  stopName,
  isFinal,
  stopIndex,
}: {
  stopName: string;
  isFinal: boolean;
  stopIndex: number;
}) {
  const dotClasses = isFinal
    ? "border-black bg-black"
    : "border-border-strong bg-surface-subtle";

  return (
    <div className="relative">
      <span className={`absolute -left-6 top-1 size-3 rounded-full border-2 ${dotClasses}`} />
      <div className="text-xs text-ink-secondary">
        {isFinal ? "Final Stop" : `Stop ${stopIndex}`}
      </div>
      <div className="text-sm font-semibold text-ink">{stopName}</div>
    </div>
  );
}

function CapacityMeter({
  capacity,
  occupiedSeats,
  isStarted,
}: {
  capacity: number;
  occupiedSeats: number;
  isStarted?: boolean;
}) {
  const remainingSeats = Math.max(0, capacity - occupiedSeats);

  return (
    <div className="pt-4 border-t border-border/60 space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="text-ink-secondary font-medium">Vehicle Seating</span>
        <span className="font-bold tabular-nums text-ink">
          {occupiedSeats} / {capacity} Seats Booked
        </span>
      </div>
      <SeatMeter occupiedSeats={occupiedSeats} capacity={capacity} size="default" />
      <div className="text-[11px] text-ink-secondary pt-0.5">
        {isStarted ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-ink-secondary">
            <Lock className="size-3 text-ink-secondary shrink-0" />
            Membership locked · Trip in progress
          </span>
        ) : remainingSeats > 0 ? (
          `${remainingSeats} seat${remainingSeats === 1 ? "" : "s"} remaining for pooling`
        ) : (
          "Vehicle full"
        )}
      </div>
    </div>
  );
}

function SettlementSummaryCard({
  roster,
}: {
  roster: DriverPoolRosterMember[];
}) {
  const cashPaisa = roster
    .filter((item) => item.paymentMethod === "CASH")
    .reduce((sum, item) => sum + item.farePaisa, 0);
  const digitalPaisa = roster
    .filter((item) => item.paymentMethod === "TESLAPAY")
    .reduce((sum, item) => sum + item.farePaisa, 0);
  const pendingCount = roster.filter((item) => item.paymentStatus !== "PAID").length;

  return (
    <div className="pt-4 border-t border-border/60 space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
        Post-Trip Settlement
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-1">
          <div className="text-ink-secondary text-[11px]">Cash to Collect</div>
          <FareDisplay paisa={cashPaisa} size="sm" />
        </div>
        <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-1">
          <div className="text-ink-secondary text-[11px]">TeslaPay (Digital)</div>
          <FareDisplay paisa={digitalPaisa} size="sm" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
        <span className="text-ink-secondary">Pending Settlements</span>
        <span className="font-semibold text-ink">
          {pendingCount} passenger{pendingCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function ActivePoolSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white border border-border/60 rounded-xl p-6 space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-1/2" />
          <div className="h-20 bg-neutral-100 rounded-lg" />
          <div className="h-10 bg-neutral-100 rounded-lg" />
        </div>
      </div>
      <div className="lg:col-span-7">
        <div className="bg-white border border-border/60 rounded-xl p-6">
          <PassengerRosterSkeleton />
        </div>
      </div>
    </div>
  );
}

function ActivePoolError({
  errorMessage,
  onRetry,
}: {
  errorMessage: string;
  onRetry: () => void;
}) {
  return (
    <Card className="p-8 border border-red-200 bg-red-50/50 rounded-xl text-center space-y-3">
      <AlertCircle className="size-8 text-red-600 mx-auto" />
      <h3 className="text-sm font-bold text-red-900">Failed to load active pool</h3>
      <p className="text-xs text-red-700 max-w-sm mx-auto">{errorMessage}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-black/90 transition cursor-pointer"
      >
        Retry
      </button>
    </Card>
  );
}

export default ActivePoolConsole;
