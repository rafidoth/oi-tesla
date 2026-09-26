"use client";

import * as React from "react";
import {
  ActiveRideCard as ModularActiveRideCard,
  type ActiveRideCardProps,
} from "./active-ride/active-ride-card";

export type { ActiveRideCardProps };

/**
 * Passenger active ride tracking card wrapper.
 * Composes modular subcomponents: RideHeader, RideRoute, RideRoster, RideFare, and RideActions.
 */
export function ActiveRideCard(props: ActiveRideCardProps) {
  return <ModularActiveRideCard {...props} />;
}

export default ActiveRideCard;
