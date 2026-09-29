"use client";

import * as React from "react";
import { FareDisplay } from "@/components/custom/fare-display";
import { Banknote, Zap, Lock } from "lucide-react";
import { cn } from "cn";

export interface RideFareProps {
  farePaisa: number;
  originalEstimateFarePaisa: number;
  paymentMethod: string;
  status?: string;
  className?: string;
}

export function RideFare({
  farePaisa,
  originalEstimateFarePaisa,
  paymentMethod,
  status,
  className,
}: RideFareProps) {
  const isTeslaPay = paymentMethod === "TESLAPAY";

  return (
    <div className={cn("p-3.5 rounded-xl bg-surface-subtle/80 flex items-center justify-between gap-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
            Your Fare
          </span>
          {(status === "STARTED" || status === "COMPLETED") && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-surface-subtle border border-border text-ink-secondary">
              <Lock className="size-2.5" />
              Final
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-ink-secondary">
          {isTeslaPay ? (
            <>
              <Zap className="size-3.5 text-ink fill-black shrink-0" />
              <span>TeslaPay</span>
            </>
          ) : (
            <>
              <Banknote className="size-3.5 text-ink shrink-0" />
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
