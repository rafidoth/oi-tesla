"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useRideHistory, type RideHistoryFilter } from "./use-ride-history";
import { RideHistoryCard } from "./ride-history-card";
import { RideHistorySkeleton } from "./ride-history-skeleton";
import { RideHistoryEmpty } from "./ride-history-empty";
import type { PassengerRideHistoryItemDto } from "../../types/rides.types";

export interface RideHistoryDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function RideHistoryDrawer({
  open,
  onOpenChange,
  trigger,
}: RideHistoryDrawerProps) {
  const history = useRideHistory();
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : history.isOpen;
  const handleOpenChange = isControlled ? onOpenChange : history.setIsOpen;

  return (
    <Drawer
      open={currentOpen}
      onOpenChange={handleOpenChange}
      showSwipeHandle
      swipeDirection="down"
    >
      {trigger && (
        <DrawerTrigger
          render={React.isValidElement(trigger) ? trigger : undefined}
        >
          {!React.isValidElement(trigger) ? trigger : null}
        </DrawerTrigger>
      )}
      <DrawerContent className="max-w-xl mx-auto max-h-[85vh] flex flex-col">
        <DrawerHeader className="text-left px-5 pt-3 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg font-bold text-ink">
                Past Rides
              </DrawerTitle>
              <DrawerDescription className="text-xs text-ink-secondary">
                Dhaka Tesla Pool trip history and settlements
              </DrawerDescription>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-ink-secondary">
              {history.rides.length} {history.rides.length === 1 ? "trip" : "trips"}
            </span>
          </div>
        </DrawerHeader>

        <DrawerFilterBar
          currentFilter={history.filter}
          onSelectFilter={history.setFilter}
        />

        <DrawerTripList
          isLoading={history.isLoading}
          rides={history.rides}
          filter={history.filter}
          settlingRideId={history.settlingRideId}
          failedRideId={history.failedRideId}
          onPay={history.handlePay}
        />
      </DrawerContent>
    </Drawer>
  );
}

function DrawerFilterBar({
  currentFilter,
  onSelectFilter,
}: {
  currentFilter: RideHistoryFilter;
  onSelectFilter: (filter: RideHistoryFilter) => void;
}) {
  const filters: { label: string; value: RideHistoryFilter }[] = [
    { label: "All", value: "ALL" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div className="p-3 bg-surface-subtle mx-4 my-2.5 rounded-xl flex gap-1 text-xs font-bold text-center shrink-0">
      {filters.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onSelectFilter(tab.value)}
          className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
            currentFilter === tab.value
              ? "bg-white text-ink shadow-xs"
              : "text-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function DrawerTripList({
  isLoading,
  rides,
  filter,
  settlingRideId,
  failedRideId,
  onPay,
}: {
  isLoading: boolean;
  rides: PassengerRideHistoryItemDto[];
  filter: RideHistoryFilter;
  settlingRideId: string | null;
  failedRideId: string | null;
  onPay: (rideId: string) => void;
}) {
  return (
    <div className="px-4 pb-6 overflow-y-auto flex-1 space-y-2.5 min-h-[220px]">
      {isLoading ? (
        <RideHistorySkeleton />
      ) : rides.length === 0 ? (
        <RideHistoryEmpty filter={filter} />
      ) : (
        rides.map((ride) => (
          <RideHistoryCard
            key={ride.id}
            ride={ride}
            isSettling={settlingRideId === ride.id}
            hasError={failedRideId === ride.id}
            onPay={onPay}
          />
        ))
      )}
    </div>
  );
}
