"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function RideHistorySkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="border border-border rounded-xl p-3.5 space-y-2.5 bg-card"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40 rounded-xs" animate />
            <Skeleton className="h-4 w-12 rounded-xs" animate />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32 rounded-xs" animate />
            <Skeleton className="h-5 w-16 rounded-full" animate />
          </div>
        </div>
      ))}
    </div>
  );
}
