"use client";

import * as React from "react";
import { ArrowRight, MapPin } from "lucide-react";
import type { DriverPoolHistoryItem, OpenPoolDestinationStop } from "../../types/driver.types";
import { formatTripDate, formatFareBDT, formatDestinationSummary } from "./history-utils";

export interface DriverPoolHistoryCardProps {
  pool: DriverPoolHistoryItem;
}

export function DriverPoolHistoryCard({ pool }: DriverPoolHistoryCardProps) {
  const isCancelled = pool.status === "CANCELLED";

  return (
    <div className="border border-border rounded-xl p-3.5 bg-card hover:border-border-strong transition space-y-2.5">
      <CardHeaderRow
        pickupName={pool.pickupLocationName}
        stops={pool.destinationStops}
        totalEarningsPaisa={pool.totalEarningsPaisa}
        isCancelled={isCancelled}
      />
      <CardMetaRow
        createdAt={pool.createdAt}
        passengerCount={pool.passengerCount}
        occupiedSeats={pool.occupiedSeats}
        status={pool.status}
      />
      <CardStopsRow stops={pool.destinationStops} />
    </div>
  );
}

function CardHeaderRow({
  pickupName,
  stops,
  totalEarningsPaisa,
  isCancelled,
}: {
  pickupName: string;
  stops: OpenPoolDestinationStop[];
  totalEarningsPaisa: number;
  isCancelled: boolean;
}) {
  const destinationText = formatDestinationSummary(stops);

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-sm font-bold text-ink truncate">
        <span className="truncate">{pickupName}</span>
        <ArrowRight className="size-3.5 text-muted shrink-0" />
        <span className="truncate">{destinationText}</span>
      </div>
      <div className="text-right shrink-0">
        <span
          className={`font-extrabold text-sm ${
            isCancelled ? "text-muted line-through" : "text-ink"
          }`}
        >
          {formatFareBDT(totalEarningsPaisa)}
        </span>
      </div>
    </div>
  );
}

function CardMetaRow({
  createdAt,
  passengerCount,
  occupiedSeats,
  status,
}: {
  createdAt: string;
  passengerCount: number;
  occupiedSeats: number;
  status: string;
}) {
  const isCompleted = status === "COMPLETED";

  return (
    <div className="flex items-center justify-between text-sm text-ink-secondary">
      <span>
        {formatTripDate(createdAt)} • {passengerCount} {passengerCount === 1 ? "passenger" : "passengers"} ({occupiedSeats} seats)
      </span>
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
          isCompleted
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-surface-subtle text-muted border-border"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

function CardStopsRow({ stops }: { stops: OpenPoolDestinationStop[] }) {
  if (!stops || stops.length === 0) return null;

  return (
    <div className="pt-2 border-t border-border/50 flex flex-wrap gap-1.5">
      {stops.map((stop, index) => (
        <span
          key={`${stop.locationId}-${index}`}
          className="inline-flex items-center gap-1 text-[11px] font-medium bg-surface-subtle border border-border px-2 py-0.5 rounded-md text-ink-secondary"
        >
          <MapPin className="size-3 text-muted shrink-0" />
          <span>Stop {index + 1}: {stop.locationName}</span>
        </span>
      ))}
    </div>
  );
}

export default DriverPoolHistoryCard;
