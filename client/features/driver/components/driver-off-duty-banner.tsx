"use client";

import * as React from "react";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DriverOffDutyBannerProps {
  onGoOnline: () => void;
  isUpdating?: boolean;
}

export function DriverOffDutyBanner({
  onGoOnline,
  isUpdating = false,
}: DriverOffDutyBannerProps) {
  return (
    <div className="bg-surface-subtle border border-border/80 rounded-xl p-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-surface-muted flex items-center justify-center text-ink-secondary shrink-0">
            <Moon className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink">You are currently off duty</h4>
            <p className="text-xs text-ink-secondary mt-0.5">
              Switch your status to online to start discovering and receiving open passenger ride pools.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          disabled={isUpdating}
          onClick={onGoOnline}
          className="shrink-0 text-xs font-semibold bg-black hover:bg-black/90 text-white"
        >
          {isUpdating ? "Switching..." : "Go Online"}
        </Button>
      </div>
    </div>
  );
}

export default DriverOffDutyBanner;
