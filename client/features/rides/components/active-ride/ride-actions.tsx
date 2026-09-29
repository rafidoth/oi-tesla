"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, Zap, Banknote, Loader2 } from "lucide-react";
import type { DerivedRideStatus } from "../../types/rides.types";
import { usePayTeslaPayMutation } from "../../hooks/use-pay-teslapay-mutation";
import { cn } from "cn";

export interface RideActionsProps {
  rideId?: string;
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
  rideId,
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
        rideId={rideId}
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
          className="text-sm text-destructive hover:bg-destructive/10 border-border hover:border-destructive/30 cursor-pointer"
        >
          Cancel Ride
        </Button>
      ) : (
        <div className="flex items-center gap-1.5 text-sm text-ink-secondary bg-surface px-3 py-1.5 rounded-md border border-border">
          <Lock className="size-3.5 text-ink-secondary" />
          <span>{status === "STARTED" ? "Trip in motion" : "Driver arrived"}</span>
        </div>
      )}
    </div>
  );
}

function CompletedTripBanner() {
  return (
    <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm flex items-center gap-2 font-bold text-emerald-900">
      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
      <span>Trip Completed! Destination reached.</span>
    </div>
  );
}

function TeslaPaySettlementHeader({ formattedFare }: { formattedFare: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
          <Zap className="size-3.5 fill-white" />
        </div>
        <div>
          <p className="font-bold text-ink leading-tight">TeslaPay Digital Settlement</p>
          <p className="text-xs text-ink-secondary">Corridor billing</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-ink">{formattedFare}</p>
        <p className="text-xs text-muted">Final Fare</p>
      </div>
    </div>
  );
}

function TeslaPaySettledBadge({ formattedFare }: { formattedFare: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-emerald-600" />
        <span>TeslaPay Settled</span>
      </div>
      <span>{formattedFare} Paid</span>
    </div>
  );
}

function TeslaPayPayButton({
  rideId,
  formattedFare,
  isPending,
  isError,
  onPay,
}: {
  rideId?: string;
  formattedFare: string;
  isPending: boolean;
  isError: boolean;
  onPay: () => void;
}) {
  return (
    <div className="space-y-2">
      {isError && (
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center justify-between">
          <span>Settlement failed. Please retry.</span>
          <button
            type="button"
            onClick={onPay}
            className="font-bold underline text-sm cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
      <Button
        type="button"
        disabled={isPending || !rideId}
        onClick={onPay}
        className="w-full py-2.5 px-4 rounded-xl bg-black text-white hover:bg-black/90 font-bold text-sm flex items-center justify-between cursor-pointer transition disabled:opacity-75"
      >
        <span className="flex items-center gap-1.5">
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Zap className="size-3.5 fill-white" />
          )}
          <span>{isPending ? "Authorizing TeslaPay..." : "Pay with TeslaPay"}</span>
        </span>
        <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-semibold">
          {formattedFare} →
        </span>
      </Button>
    </div>
  );
}

function TeslaPaySettlementAction({
  rideId,
  formattedFare,
  isPaid,
}: {
  rideId?: string;
  formattedFare: string;
  isPaid: boolean;
}) {
  const mutation = usePayTeslaPayMutation();

  return (
    <div className="border border-border rounded-xl p-3.5 space-y-3 bg-surface">
      <TeslaPaySettlementHeader formattedFare={formattedFare} />
      {isPaid ? (
        <TeslaPaySettledBadge formattedFare={formattedFare} />
      ) : (
        <TeslaPayPayButton
          rideId={rideId}
          formattedFare={formattedFare}
          isPending={mutation.isPending}
          isError={mutation.isError}
          onPay={() => rideId && mutation.mutate({ rideId })}
        />
      )}
    </div>
  );
}

function CashSettlementInfo({
  formattedFare,
  isPaid,
}: {
  formattedFare: string;
  isPaid: boolean;
}) {
  return (
    <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-sm space-y-2">
      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
        <span>Trip Completed! Destination reached.</span>
      </div>
      <p className="text-emerald-800 leading-relaxed">
        Please pay your final fare of {formattedFare} in cash to your driver.
      </p>
      <div className="flex items-center gap-1 text-xs font-semibold bg-white/80 px-2 py-0.5 rounded border border-emerald-300 w-fit text-emerald-900">
        <Banknote className="size-3 text-black" />
        <span>{isPaid ? "Cash Paid to Driver" : "Cash Settlement Pending"}</span>
      </div>
    </div>
  );
}

function CompletedRidePrompt({
  rideId,
  paymentMethod,
  farePaisa,
  paymentStatus,
  onDismiss,
  className,
}: {
  rideId?: string;
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
      {isTeslaPay ? (
        <>
          <CompletedTripBanner />
          <TeslaPaySettlementAction
            rideId={rideId}
            formattedFare={formattedFare}
            isPaid={isPaid}
          />
        </>
      ) : (
        <CashSettlementInfo formattedFare={formattedFare} isPaid={isPaid} />
      )}

      {onDismiss && (
        <Button
          type="button"
          onClick={onDismiss}
          className="w-full py-2.5 text-sm font-semibold rounded-lg bg-black text-white hover:bg-black/90 transition cursor-pointer"
        >
          Book Another Ride
        </Button>
      )}
    </div>
  );
}

export default RideActions;
