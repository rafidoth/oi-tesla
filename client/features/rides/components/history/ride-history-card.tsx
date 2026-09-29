"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PassengerRideHistoryItemDto } from "../../types/rides.types";
import {
  formatTripDate,
  formatFareBDT,
  isPendingTeslaPay,
} from "./history-utils";

export interface RideHistoryCardProps {
  ride: PassengerRideHistoryItemDto;
  isSettling: boolean;
  hasError: boolean;
  onPay: (rideId: string) => void;
}

export function RideHistoryCard({
  ride,
  isSettling,
  hasError,
  onPay,
}: RideHistoryCardProps) {
  const isPending = isPendingTeslaPay(ride.paymentMethod, ride.paymentStatus);

  return (
    <div className="border border-border rounded-xl p-3.5 bg-card hover:border-border-strong transition space-y-2.5">
      <CardHeaderRow
        pickupName={ride.pickupLocation.name}
        destName={ride.destLocation.name}
        farePaisa={ride.farePaisa}
        isCancelled={ride.status === "CANCELLED"}
      />

      <CardMetaRow
        createdAt={ride.createdAt}
        seats={ride.seats}
        status={ride.status}
      />

      <CardPaymentRow
        paymentMethod={ride.paymentMethod}
        paymentStatus={ride.paymentStatus}
        status={ride.status}
        isPending={isPending}
        isSettling={isSettling}
        hasError={hasError}
        onPay={() => onPay(ride.id)}
      />

      {ride.cancelReason && (
        <p className="text-xs text-muted italic">
          Reason: {ride.cancelReason}
        </p>
      )}
    </div>
  );
}

function CardHeaderRow({
  pickupName,
  destName,
  farePaisa,
  isCancelled,
}: {
  pickupName: string;
  destName: string;
  farePaisa: number;
  isCancelled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-base font-bold text-ink truncate">
        <span className="truncate">{pickupName}</span>
        <ArrowRight className="size-3.5 text-muted shrink-0" />
        <span className="truncate">{destName}</span>
      </div>
      <div className="text-right shrink-0">
        <span
          className={`font-extrabold text-base ${
            isCancelled ? "text-muted line-through" : "text-ink"
          }`}
        >
          {formatFareBDT(farePaisa)}
        </span>
      </div>
    </div>
  );
}

function CardMetaRow({
  createdAt,
  seats,
  status,
}: {
  createdAt: string;
  seats: number;
  status: "COMPLETED" | "CANCELLED";
}) {
  const isCompleted = status === "COMPLETED";

  return (
    <div className="flex items-center justify-between text-sm text-ink-secondary">
      <span>
        {formatTripDate(createdAt)} • {seats} {seats === 1 ? "seat" : "seats"}
      </span>
      <span
        className={`px-2 py-0.5 rounded text-xs font-bold border ${
          isCompleted
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-surface-subtle text-muted border-border"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

function CardPaymentRow({
  paymentMethod,
  paymentStatus,
  status,
  isPending,
  isSettling,
  hasError,
  onPay,
}: {
  paymentMethod: string;
  paymentStatus: string | null;
  status: "COMPLETED" | "CANCELLED";
  isPending: boolean;
  isSettling: boolean;
  hasError: boolean;
  onPay: () => void;
}) {
  if (status === "CANCELLED") return null;

  return (
    <div className="pt-2 border-t border-border/60 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <PaymentBadge method={paymentMethod} status={paymentStatus} />
        {isPending && !hasError && (
          <span className="text-xs font-semibold text-amber-700">
            Settlement Pending
          </span>
        )}
      </div>

      {hasError && (
        <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center justify-between">
          <span>Settlement failed</span>
          <button
            type="button"
            onClick={onPay}
            className="font-bold underline text-sm cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {isPending && (
        <Button
          type="button"
          size="sm"
          onClick={onPay}
          disabled={isSettling}
          className="w-full bg-black text-white hover:bg-neutral-800 font-bold text-sm h-8.5 gap-1.5 cursor-pointer"
        >
          {isSettling ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Zap className="size-3.5 fill-white" />
          )}
          <span>{isSettling ? "Settling..." : "Pay with TeslaPay"}</span>
        </Button>
      )}
    </div>
  );
}

function PaymentBadge({
  method,
  status,
}: {
  method: string;
  status: string | null;
}) {
  if (method === "CASH") {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-surface-subtle border border-border text-ink-secondary">
        Cash
      </span>
    );
  }

  const isPaid = status === "PAID";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
        isPaid
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-amber-50 text-amber-800 border-amber-200"
      }`}
    >
      {isPaid ? (
        <CheckCircle2 className="size-3 text-emerald-600" />
      ) : (
        <Zap className="size-3 text-amber-600" />
      )}
      <span>{isPaid ? "TeslaPay Settled" : "TeslaPay"}</span>
    </span>
  );
}
