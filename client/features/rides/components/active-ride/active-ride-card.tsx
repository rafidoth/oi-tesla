"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { ActiveRideDetailsDto } from "../../types/rides.types";
import { RideHeader } from "./ride-header";
import { RideRoute } from "./ride-route";
import { RideRoster } from "./ride-roster";
import { RideFare } from "./ride-fare";
import { RideActions } from "./ride-actions";
import { CancelRideDialog } from "../cancel/cancel-ride-dialog";
import { cn } from "cn";

export interface ActiveRideCardProps {
  ride: ActiveRideDetailsDto;
  onDismissCompleted?: () => void;
  className?: string;
}

export function ActiveRideCard({
  ride,
  onDismissCompleted,
  className,
}: ActiveRideCardProps) {
  const [cancelOpen, setCancelOpen] = React.useState(false);

  return (
    <>
      <Card
        data-slot="active-ride-card"
        className={cn("border-border shadow-card bg-card overflow-hidden", className)}
      >
        <CardHeader className="pb-3 border-b border-border/50">
          <RideHeader id={ride.id} status={ride.status} />
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <RideRoute
            pickupName={ride.pickupLocation.name}
            destName={ride.destLocation.name}
          />

          <RideRoster
            occupiedSeats={ride.pool.occupiedSeats}
            capacity={ride.pool.capacity}
            userSeats={ride.seats}
            driver={ride.pool.driver}
            vehicle={ride.pool.vehicle}
          />

          <RideFare
            farePaisa={ride.farePaisa}
            originalEstimateFarePaisa={ride.originalEstimateFarePaisa}
            paymentMethod={ride.paymentMethod}
            status={ride.status}
          />

          <RideActions
            isCancellable={ride.isCancellable}
            status={ride.status}
            paymentMethod={ride.paymentMethod}
            farePaisa={ride.farePaisa}
            paymentStatus={ride.paymentStatus}
            onCancelClick={() => setCancelOpen(true)}
            onDismissCompleted={onDismissCompleted}
          />
        </CardContent>
      </Card>

      <CancelRideDialog
        ride={ride}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
    </>
  );
}

export default ActiveRideCard;
