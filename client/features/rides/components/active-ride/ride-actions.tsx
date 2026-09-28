"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, Zap, Banknote } from "lucide-react";
import type { DerivedRideStatus } from "../../types/rides.types";
import { cn } from "cn";

export interface RideActionsProps {
  isCancellable: boolean;
  status: DerivedRideStatus;
  paymentMethod?: string;
  farePaisa?: number;
  paymentStatus?: string | null;
  onCancelClick: () => void;
  onDismissCompleted?: () => void;
  className?: string;
}

export function RideActions({
  isCancellable,
  status,
  paymentMethod,
  farePaisa = 0,
  paymentStatus,
  onCancelClick,
  onDismissCompleted,
  className,
}: RideActionsProps) {
  if (status === "CANCELLED") {
    return null;
  }

  if (status === "COMPLETED") {
    return (
      <CompletedRidePrompt
        paymentMethod={paymentMethod}
        farePaisa={farePaisa}
        paymentStatus={paymentStatus}
        onDismiss={onDismissCompleted}
        className={className}
      />
    );
  }

  return (
    <div className={cn("pt-2 flex items-center justify-between", className)}>
      {isCancellable ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancelClick}
          className="text-xs text-destructive hover:bg-destructive/10 border-border hover:border-destructive/30 cursor-pointer hover:cursor-pointer"
        >
          Cancel Ride
        </Button>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-ink-secondary bg-surface px-2.5 py-1 rounded-md border border-border">
          <Lock className="size-3 text-ink-secondary" />
          <span>{status === "STARTED" ? "Trip in motion" : "Driver arrived"}</span>
        </div>
      )}
    </div>
  );
}

function CompletedRidePrompt({
  paymentMethod,
  farePaisa,
  paymentStatus,
  onDismiss,
  className,
}: {
  paymentMethod?: string;
  farePaisa: number;
  paymentStatus?: string | null;
  onDismiss?: () => void;
  className?: string;
}) {
  const isTeslaPay = paymentMethod === "TESLAPAY";
  const formattedFare = `৳${(farePaisa / 100).toFixed(0)}`;
  const isPaid = paymentStatus === "PAID";

  return (
    <div className={cn("pt-2 space-y-3", className)}>
      <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>Trip Completed! Destination reached.</span>
        </div>
        <p className="text-emerald-800 leading-relaxed">
          {isTeslaPay
            ? `Your final fare of ${formattedFare} is queued for digital settlement via TeslaPay.`
            : `Please pay your final fare of ${formattedFare} in cash to your driver.`}
        </p>
        <div className="flex items-center gap-2 pt-1 font-semibold text-emerald-900">
          {isTeslaPay ? (
            <div className="flex items-center gap-1 text-[11px] bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
              <Zap className="size-3 text-black fill-black" />
              <span>{isPaid ? "TeslaPay Settled" : "TeslaPay Settlement Pending"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
              <Banknote className="size-3 text-black" />
              <span>{isPaid ? "Cash Paid to Driver" : "Cash Settlement Pending"}</span>
            </div>
          )}
        </div>
      </div>

      {onDismiss && (
        <Button
          type="button"
          onClick={onDismiss}
          className="w-full py-2 text-xs font-semibold rounded-lg bg-black text-white hover:bg-black/90 transition cursor-pointer"
        >
          Book Another Ride
        </Button>
      )}
    </div>
  );
}
