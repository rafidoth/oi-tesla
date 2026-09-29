"use client";

import { useFareEstimator } from "../../hooks/use-fare-estimator";
import { LocationPicker } from "../booking/location-picker";
import { SeatStepper } from "../booking/seat-stepper";
import { FareTag } from "../booking/fare-tag";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car } from "lucide-react";
import { cn } from "cn";

function EstimatorHeader() {
  return (
    <div className="flex items-center gap-2.5 pb-3.5 border-b border-border/60">
      <div className="size-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
        <Car className="size-4 text-white" />
      </div>
      <h2 className="text-xl font-extrabold text-ink tracking-tight">
        Route Fare Calculator
      </h2>
    </div>
  );
}

function EstimatorAction({
  canRequest,
  onClick,
}: {
  canRequest: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={!canRequest}
      className={cn(
        "w-full h-12 rounded-xl bg-black text-white font-bold text-base",
        "flex items-center justify-center gap-2 shadow-sm",
        "hover:bg-black-soft active:scale-[0.99] transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      )}
    >
      <span>Request Ride</span>
      <ArrowRight className="size-4.5" />
    </Button>
  );
}

export function FareEstimatorCard({ className }: { className?: string }) {
  const {
    locations,
    reachableDestinations,
    pickupLocationId,
    destLocationId,
    seats,
    estimate,
    isEstimating,
    isEstimateError,
    isCatalogLoading,
    canRequest,
    setPickup,
    setDropoff,
    setSeats,
    handleRequestRide,
  } = useFareEstimator();

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-white/95 backdrop-blur-md",
        "p-6 sm:p-7 shadow-xl space-y-5",
        className
      )}
    >
      <EstimatorHeader />

      <LocationPicker
        locations={locations}
        reachableDestinations={reachableDestinations}
        pickupLocationId={pickupLocationId}
        destLocationId={destLocationId}
        onPickupChange={setPickup}
        onDestChange={setDropoff}
        isLoading={isCatalogLoading}
        size="lg"
      />

      <SeatStepper
        value={seats}
        onChange={setSeats}
        maxSeats={3}
        size="lg"
      />

      {estimate && (
        <FareTag
          estimate={estimate}
          isLoading={isEstimating}
          isError={isEstimateError}
          size="lg"
        />
      )}

      <div className="pt-1">
        <EstimatorAction
          canRequest={canRequest}
          onClick={handleRequestRide}
        />
      </div>
    </div>
  );
}

export default FareEstimatorCard;
