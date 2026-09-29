"use client";

import * as React from "react";
import { MapPin, Users, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLocationsQuery, sortStopsByRoute } from "@/features/locations";
import type { OpenPoolItem, OpenPoolMemberRequest } from "../types/driver.types";

interface OpenPoolCardProps {
  pool: OpenPoolItem;
  onAccept?: (poolId: string) => void;
  onDecline?: (poolId: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

interface GroupedStop {
  locationId: number;
  locationName: string;
  totalSeats: number;
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
        <OriginSegment
          pickupLocationName={pool.pickupLocationName}
        />

        <DropoffSegment
          pickupLocationId={pool.pickupLocationId}
          passengerCount={pool.passengerCount}
          memberRequests={pool.memberRequests}
        />

        <ActionSegment
          poolId={pool.id}
          isActionDisabled={isActionDisabled}
          isAccepting={isAccepting}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      </div>
    </Card>
  );
}

function OriginSegment({
  pickupLocationName,
}: {
  pickupLocationName: string;
}) {
  return (
    <div className="md:col-span-4 md:border-r md:border-border/60 md:pr-4 space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
        <MapPin className="size-3.5 shrink-0" />
        <span>Pickup Point</span>
      </div>
      <h3 className="text-xl font-bold tracking-tight text-ink">
        {pickupLocationName}
      </h3>
    </div>
  );
}

function DropoffSegment({
  pickupLocationId,
  passengerCount,
  memberRequests,
}: {
  pickupLocationId: number;
  passengerCount: number;
  memberRequests: OpenPoolMemberRequest[];
}) {
  return (
    <div className="md:col-span-5 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
        <span>Dropoff Destinations</span>
        <div className="flex items-center gap-1 normal-case tracking-normal font-medium text-sm text-ink-secondary">
          <Users className="size-3.5" />
          <span>
            {passengerCount} {passengerCount === 1 ? "passenger" : "passengers"}
          </span>
        </div>
      </div>

      <DropoffRouteChain
        pickupLocationId={pickupLocationId}
        memberRequests={memberRequests}
      />
    </div>
  );
}

function DropoffRouteChain({
  pickupLocationId,
  memberRequests,
}: {
  pickupLocationId: number;
  memberRequests: OpenPoolMemberRequest[];
}) {
  const { data: catalog } = useLocationsQuery();
  const groupedStops = groupStopsByDestination(memberRequests);
  const sortedStops = sortStopsByRoute(pickupLocationId, groupedStops, catalog?.routes);

  return (
    <div className="space-y-2.5 relative pt-0.5">
      {sortedStops.length > 1 && (
        <div
          className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-border -translate-x-1/2"
          aria-hidden="true"
        />
      )}

      {sortedStops.map((stop, index) => (
        <DropoffStopRow
          key={stop.locationId}
          stop={stop}
          isFinal={index === sortedStops.length - 1}
        />
      ))}
    </div>
  );
}

function DropoffStopRow({
  stop,
  isFinal,
}: {
  stop: GroupedStop;
  isFinal: boolean;
}) {
  const dotClasses = isFinal
    ? "border-black bg-black"
    : "border-border-strong bg-surface-subtle";

  return (
    <div className="flex items-center gap-2">
      <div className="w-5 flex justify-center shrink-0">
        <span className={`size-3 rounded-full border-2 ${dotClasses} z-10`} />
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-ink truncate">
          {stop.locationName}
        </span>
        <span className="text-[10px] text-ink-secondary font-medium bg-surface-subtle px-1.5 py-0.5 rounded border border-border/40 shrink-0">
          {stop.totalSeats} {stop.totalSeats === 1 ? "seat" : "seats"}
        </span>
      </div>
    </div>
  );
}

function ActionSegment({
  poolId,
  isActionDisabled,
  isAccepting,
  onAccept,
  onDecline,
}: {
  poolId: string;
  isActionDisabled: boolean;
  isAccepting: boolean;
  onAccept?: (poolId: string) => void;
  onDecline?: (poolId: string) => void;
}) {
  return (
    <div className="md:col-span-3 flex items-center justify-end gap-2 w-full pt-3 md:pt-0 border-t md:border-t-0 border-border/60">
      {onDecline && (
        <button
          type="button"
          disabled={isActionDisabled}
          onClick={() => onDecline(poolId)}
          className="flex-1 md:flex-none px-3 py-2 rounded-lg text-sm font-semibold text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors disabled:opacity-50 border border-transparent hover:border-border cursor-pointer"
        >
          Decline
        </button>
      )}
      {onAccept && (
        <button
          type="button"
          disabled={isActionDisabled}
          onClick={() => onAccept(poolId)}
          className="flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold bg-black text-white hover:bg-black/90 transition-all disabled:opacity-50 shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          {isAccepting && <Loader2 className="size-3.5 animate-spin" />}
          <span>{isAccepting ? "Accepting..." : "Accept"}</span>
        </button>
      )}
    </div>
  );
}

function groupStopsByDestination(memberRequests: OpenPoolMemberRequest[]): GroupedStop[] {
  const map = new Map<number, GroupedStop>();
  for (const req of memberRequests) {
    const existing = map.get(req.destLocationId);
    if (existing) {
      existing.totalSeats += req.seats;
    } else {
      map.set(req.destLocationId, {
        locationId: req.destLocationId,
        locationName: req.destLocationName,
        totalSeats: req.seats,
      });
    }
  }
  return Array.from(map.values());
}

export default OpenPoolCard;
