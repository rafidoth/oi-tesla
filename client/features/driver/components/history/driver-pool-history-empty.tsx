"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import type { DriverHistoryFilter } from "./use-driver-history";

export function DriverPoolHistoryEmpty({ filter }: { filter: DriverHistoryFilter }) {
  const message =
    filter === "ALL" ? "No past pools yet" : `No ${filter.toLowerCase()} pools`;

  return (
    <div className="py-12 px-4 text-center space-y-3">
      <div className="size-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
        <Clock className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-neutral-900 text-sm">{message}</p>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto">
          Your completed and cancelled pool runs in Dhaka Tesla Pool will appear here.
        </p>
      </div>
    </div>
  );
}

export default DriverPoolHistoryEmpty;
