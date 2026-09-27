"use client";

import * as React from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SeatMeter } from "@/components/custom/seat-meter";
import { FareDisplay } from "@/components/custom/fare-display";
import { StatusBadge, type RideStatus } from "@/components/custom/status-badge";
import { useDriverPoolDetailsQuery } from "../hooks/use-driver-pool-details-query";
import type {
  DriverPoolDetailsResponse,
  DriverPoolRosterMember,
} from "../types/driver.types";

interface ActivePoolConsoleProps {
  poolId: string;
}

export function ActivePoolConsole({ poolId }: ActivePoolConsoleProps) {
  const { data: pool, isLoading, isError, error, refetch, isFetching } =
    useDriverPoolDetailsQuery({ poolId });

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

  return (
    <div className="space-y-4">
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
            <CapacityMeter
              capacity={pool.capacity}
              occupiedSeats={pool.occupiedSeats}
            />
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="p-6 space-y-5">
            <RosterSection roster={pool.roster} />
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
}: {
  capacity: number;
  occupiedSeats: number;
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
        {remainingSeats > 0
          ? `${remainingSeats} seat${remainingSeats === 1 ? "" : "s"} remaining for pooling`
          : "Vehicle full"}
      </div>
    </div>
  );
}

function RosterSection({ roster }: { roster: DriverPoolRosterMember[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
          Passenger Roster
        </h3>
        <span className="text-xs font-semibold tabular-nums text-ink-secondary">
          {roster.length} confirmed
        </span>
      </div>

      <RosterList roster={roster} />
      <PoolValueFooter roster={roster} />
    </div>
  );
}

function RosterList({ roster }: { roster: DriverPoolRosterMember[] }) {
  if (roster.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-ink-secondary">
        No passengers assigned yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {roster.map((member) => (
        <RosterItem key={member.id} member={member} />
      ))}
    </div>
  );
}

function RosterItem({ member }: { member: DriverPoolRosterMember }) {
  return (
    <div className="py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <RosterInitialsAvatar name={member.passengerName} />
        <RosterPassengerInfo
          name={member.passengerName}
          seats={member.seats}
          destLocationName={member.destLocationName}
        />
      </div>
      <RosterFareInfo
        farePaisa={member.farePaisa}
        paymentMethod={member.paymentMethod}
      />
    </div>
  );
}

function RosterInitialsAvatar({ name }: { name: string }) {
  const initials = getInitials(name);

  return (
    <div className="size-8 rounded-full bg-surface-subtle border border-border flex items-center justify-center font-bold text-xs text-ink shrink-0">
      {initials}
    </div>
  );
}

function RosterPassengerInfo({
  name,
  seats,
  destLocationName,
}: {
  name: string;
  seats: number;
  destLocationName: string;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-semibold text-sm text-ink truncate">{name}</span>
        <span className="text-[11px] bg-surface-subtle text-ink-secondary px-1.5 py-0.2 rounded font-mono">
          {seats} seat{seats === 1 ? "" : "s"}
        </span>
      </div>
      <div className="text-xs text-ink-secondary truncate">
        ↳ {destLocationName}
      </div>
    </div>
  );
}

function RosterFareInfo({
  farePaisa,
  paymentMethod,
}: {
  farePaisa: number;
  paymentMethod: string;
}) {
  const methodLabel = paymentMethod === "TESLAPAY" ? "TeslaPay" : "Cash";

  return (
    <div className="text-right shrink-0">
      <FareDisplay paisa={farePaisa} size="sm" align="right" />
      <span className="text-[11px] text-ink-secondary block">
        {methodLabel}
      </span>
    </div>
  );
}

function PoolValueFooter({ roster }: { roster: DriverPoolRosterMember[] }) {
  const totalPaisa = roster.reduce((sum, item) => sum + item.farePaisa, 0);

  return (
    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
      <span className="text-xs font-semibold text-ink-secondary">
        Total Projected Value
      </span>
      <FareDisplay paisa={totalPaisa} size="sm" align="right" />
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ActivePoolSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      <div className="lg:col-span-5">
        <div className="bg-neutral-100 rounded-xl h-80" />
      </div>
      <div className="lg:col-span-7">
        <div className="bg-neutral-100 rounded-xl h-80" />
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
