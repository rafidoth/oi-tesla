"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DriverPoolHistorySkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="border border-border rounded-xl p-3.5 space-y-2.5 bg-card"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-44 rounded-xs" animate />
            <Skeleton className="h-4 w-12 rounded-xs" animate />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-36 rounded-xs" animate />
            <Skeleton className="h-5 w-16 rounded-full" animate />
          </div>
          <div className="pt-2 border-t border-border/50 flex gap-2">
            <Skeleton className="h-4 w-20 rounded-md" animate />
            <Skeleton className="h-4 w-24 rounded-md" animate />
          </div>
        </div>
      ))}
    </div>
  );
}

export default DriverPoolHistorySkeleton;
