"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Loader2, RotateCcw } from "lucide-react";
import { useBookingFlow } from "./use-booking-flow";
import { LocationPicker } from "./location-picker";
import { SeatStepper } from "./seat-stepper";
import { PaymentPicker } from "./payment-picker";
import { FareTag } from "./fare-tag";
import { BookingStatusAlert } from "../booking-status-alert";
import type { RideBookingResponseDto } from "../../types/rides.types";
import { cn } from "cn";

export interface BookingCardProps {
  onSuccess?: (response: RideBookingResponseDto) => void;
  className?: string;
}

export function BookingCard({ onSuccess, className }: BookingCardProps) {
  const {
    pickupLocationId,
    destLocationId,
    seats,
    paymentMethod,
    poolAssignment,
    catalog,
    isCatalogLoading,
    reachableDestinations,
    estimate,
    isEstimating,
    isEstimateError,
    canSubmit,
    isSubmitting,
    error,
    hasSelection,
    setPickup,
    setDropoff,
    setSeats,
    setPayment,
    submit,
    reset,
    dismissAlert,
    retrySubmit,
  } = useBookingFlow({ onSuccess });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  return (
    <Card
      data-slot="booking-card"
      className={cn("border-border shadow-card bg-card overflow-hidden", className)}
    >
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/50">
        <CardTitle className="text-xl font-bold text-ink tracking-tight">
          Request Ride
        </CardTitle>

        {hasSelection && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={isSubmitting}
            className="h-7 px-2 text-xs text-ink-secondary hover:text-ink gap-1 cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {(poolAssignment || error) && (
          <BookingStatusAlert
            poolAssignment={poolAssignment}
            error={error}
            onRetry={retrySubmit}
            onDismiss={dismissAlert}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <LocationPicker
            locations={catalog?.locations}
            reachableDestinations={reachableDestinations}
            pickupLocationId={pickupLocationId}
            destLocationId={destLocationId}
            onPickupChange={setPickup}
            onDestChange={setDropoff}
            disabled={isSubmitting}
            isLoading={isCatalogLoading}
          />

          <div className="pt-3 border-t border-border/60">
            <SeatStepper
              value={seats}
              onChange={setSeats}
              maxSeats={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-3 border-t border-border/60">
            <PaymentPicker
              value={paymentMethod}
              onChange={setPayment}
              disabled={isSubmitting}
            />
          </div>

          {estimate && (
            <div className="pt-3 border-t border-border/60">
              <FareTag
                estimate={estimate}
                isLoading={isEstimating}
                isError={isEstimateError}
              />
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-10 rounded-[var(--radius-md)] bg-black text-white font-semibold hover:bg-black-soft active:bg-black-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm gap-2 cursor-pointer hover:cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <Car className="size-4" />
                  <span>Request Tesla Pool</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default BookingCard;
