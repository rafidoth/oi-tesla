"use client";

import * as React from "react";
import { Clock } from "lucide-react";

export function RideHistoryEmpty({ filter }: { filter: string }) {
  const message =
    filter === "ALL" ? "No past rides yet" : `No ${filter.toLowerCase()} rides`;

  return (
    <div className="py-12 px-4 text-center space-y-3">
      <div className="size-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
        <Clock className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-neutral-900 text-sm">{message}</p>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto">
          Your completed and cancelled trips in the Dhaka Tesla Pool will appear
          here.
        </p>
      </div>
    </div>
  );
}
