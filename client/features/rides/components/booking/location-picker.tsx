"use client";

import * as React from "react";
import type { LocationDto } from "@/features/locations";
import type { ReachableDestination } from "./use-booking-flow";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleDot, MapPin, X } from "lucide-react";
import { cn } from "cn";

export interface LocationPickerProps {
  locations?: LocationDto[];
  reachableDestinations: ReachableDestination[];
  pickupLocationId?: number | null;
  destLocationId?: number | null;
  onPickupChange: (id: number | null) => void;
  onDestChange: (id: number | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
  size?: "default" | "lg";
  className?: string;
}

export function LocationPicker({
  locations = [],
  reachableDestinations,
  pickupLocationId,
  destLocationId,
  onPickupChange,
  onDestChange,
  disabled = false,
  isLoading = false,
  size = "default",
  className,
}: LocationPickerProps) {
  const pickupLocation = React.useMemo(() => {
    if (!pickupLocationId) return null;
    return locations.find((l) => l.id === pickupLocationId) ?? null;
  }, [locations, pickupLocationId]);

  const destLocation = React.useMemo(() => {
    if (!destLocationId) return null;
    return (
      reachableDestinations.find((d) => d.location.id === destLocationId)?.location ??
      locations.find((l) => l.id === destLocationId) ??
      null
    );
  }, [reachableDestinations, locations, destLocationId]);

  if (isLoading) {
    return (
      <div className={cn("space-y-2.5", className)}>
        <Skeleton className="h-11 w-full rounded-lg" animate />
        <Skeleton className="h-11 w-full rounded-lg" animate />
      </div>
    );
  }

  const pickupValue = pickupLocationId ? String(pickupLocationId) : undefined;
  const destValue = destLocationId ? String(destLocationId) : undefined;

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Pickup Input Trigger & Select */}
      <div className="relative group">
        <Select
          value={pickupValue}
          onValueChange={(val) => onPickupChange(val ? Number(val) : null)}
          disabled={disabled}
        >
          <SelectTrigger
            className={cn(
              "w-full bg-white border border-border-strong rounded-[var(--radius-md)] transition-all outline-none",
              size === "lg" ? "h-12 px-3.5 text-base" : "h-[42px] px-3 text-sm",
              "hover:border-black/50 hover:bg-surface-subtle/60 cursor-pointer",
              "focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
              <CircleDot className={cn("text-ink shrink-0", size === "lg" ? "size-5" : "size-4")} />
              <span
                className={cn(
                  "truncate",
                  size === "lg" ? "text-base font-semibold" : "text-sm",
                  pickupLocation ? "text-ink" : "text-muted-foreground font-normal"
                )}
              >
                {pickupLocation ? pickupLocation.name : "Select pickup hub"}
              </span>
            </div>
          </SelectTrigger>

          <SelectContent className="max-h-64">
            <SelectGroup>
              {locations.map((loc) => (
                <SelectItem
                  key={loc.id}
                  value={String(loc.id)}
                  className={cn(
                    "cursor-pointer hover:bg-surface-subtle",
                    size === "lg" ? "py-2.5 px-3 text-base" : "py-2 px-2.5 text-sm"
                  )}
                >
                  <span className="font-medium text-ink">{loc.name}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {pickupLocation && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPickupChange(null);
            }}
            aria-label="Clear pickup"
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-sm text-ink-secondary hover:text-ink hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Dropoff Input Trigger & Select */}
      <div className="relative group">
        <Select
          value={destValue}
          onValueChange={(val) => onDestChange(val ? Number(val) : null)}
          disabled={disabled || !pickupLocationId || reachableDestinations.length === 0}
        >
          <SelectTrigger
            className={cn(
              "w-full bg-white border border-border-strong rounded-[var(--radius-md)] transition-all outline-none",
              size === "lg" ? "h-12 px-3.5 text-base" : "h-[42px] px-3 text-sm",
              !pickupLocationId
                ? "opacity-60 cursor-not-allowed bg-surface-subtle/30"
                : "hover:border-black/50 hover:bg-surface-subtle/60 cursor-pointer",
              "focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
              <MapPin className={cn("text-ink shrink-0", size === "lg" ? "size-5" : "size-4")} />
              <span
                className={cn(
                  "truncate",
                  size === "lg" ? "text-base font-semibold" : "text-sm",
                  destLocation ? "text-ink" : "text-muted-foreground font-normal"
                )}
              >
                {destLocation
                  ? destLocation.name
                  : !pickupLocationId
                    ? "Select pickup first"
                    : reachableDestinations.length === 0
                      ? "No route destinations"
                      : "Select drop-off stop"}
              </span>
            </div>
          </SelectTrigger>

          <SelectContent className="max-h-64">
            <SelectGroup>
              {reachableDestinations.map((dest) => {
                const km = dest.distanceM ? (dest.distanceM / 1000).toFixed(1) : null;
                return (
                  <SelectItem
                    key={dest.location.id}
                    value={String(dest.location.id)}
                    className={cn(
                      "cursor-pointer hover:bg-surface-subtle",
                      size === "lg" ? "py-2.5 px-3 text-base" : "py-2 px-2.5 text-sm"
                    )}
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium text-ink">{dest.location.name}</span>
                      {km && (
                        <span className="text-xs font-medium text-ink-secondary tabular-nums">
                          {km} km
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        {destLocation && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDestChange(null);
            }}
            aria-label="Clear dropoff"
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-sm text-ink-secondary hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default LocationPicker;
