"use client";

import * as React from "react";
import { FareDisplay } from "@/components/custom/fare-display";
import { Banknote, Zap } from "lucide-react";
import { cn } from "cn";

export interface RideFareProps {
  farePaisa: number;
  originalEstimateFarePaisa: number;
  paymentMethod: string;
  className?: string;
}

export function RideFare({
  farePaisa,
  originalEstimateFarePaisa,
  paymentMethod,
  className,
}: RideFareProps) {
  const isTeslaPay = paymentMethod === "TESLAPAY";

  return (
    <div className={cn("p-3.5 rounded-lg bg-surface border border-border flex items-center justify-between gap-4", className)}>
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
          Your Fare
        </span>
        <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
          {isTeslaPay ? (
            <>
              <Zap className="size-3 text-ink fill-black shrink-0" />
              <span>TeslaPay</span>
            </>
          ) : (
            <>
              <Banknote className="size-3 text-ink shrink-0" />
              <span>Cash</span>
            </>
          )}
        </div>
      </div>

      <FareDisplay
        paisa={farePaisa}
        originalPaisa={originalEstimateFarePaisa}
        showSavings={true}
        animateChange={true}
        size="default"
        align="right"
      />
    </div>
  );
}
