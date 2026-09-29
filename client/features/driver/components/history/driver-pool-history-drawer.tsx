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
import { useDriverHistory, type DriverHistoryFilter } from "./use-driver-history";
import { DriverPoolHistoryCard } from "./driver-pool-history-card";
import { DriverPoolHistorySkeleton } from "./driver-pool-history-skeleton";
import { DriverPoolHistoryEmpty } from "./driver-pool-history-empty";
import type { DriverPoolHistoryItem } from "../../types/driver.types";

export interface DriverPoolHistoryDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function DriverPoolHistoryDrawer({
  open,
  onOpenChange,
  trigger,
}: DriverPoolHistoryDrawerProps) {
  const history = useDriverHistory();
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
                Past Pools
              </DrawerTitle>
              <DrawerDescription className="text-xs text-ink-secondary">
                Dhaka Tesla Pool trip history and earnings
              </DrawerDescription>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-ink-secondary">
              {history.pools.length} {history.pools.length === 1 ? "pool" : "pools"}
            </span>
          </div>
        </DrawerHeader>

        <DrawerFilterBar
          currentFilter={history.filter}
          onSelectFilter={history.setFilter}
        />

        <DrawerPoolList
          isLoading={history.isLoading}
          pools={history.pools}
          filter={history.filter}
        />
      </DrawerContent>
    </Drawer>
  );
}

function DrawerFilterBar({
  currentFilter,
  onSelectFilter,
}: {
  currentFilter: DriverHistoryFilter;
  onSelectFilter: (filter: DriverHistoryFilter) => void;
}) {
  const filters: { label: string; value: DriverHistoryFilter }[] = [
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

function DrawerPoolList({
  isLoading,
  pools,
  filter,
}: {
  isLoading: boolean;
  pools: DriverPoolHistoryItem[];
  filter: DriverHistoryFilter;
}) {
  return (
    <div className="px-4 pb-6 overflow-y-auto flex-1 space-y-2.5 min-h-[220px]">
      {isLoading ? (
        <DriverPoolHistorySkeleton />
      ) : pools.length === 0 ? (
        <DriverPoolHistoryEmpty filter={filter} />
      ) : (
        pools.map((pool) => (
          <DriverPoolHistoryCard key={pool.id} pool={pool} />
        ))
      )}
    </div>
  );
}

export default DriverPoolHistoryDrawer;
