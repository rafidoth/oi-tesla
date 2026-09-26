"use client";

import * as React from "react";
import {
  LocationPicker,
  type LocationPickerProps,
} from "./booking/location-picker";
import {
  computeReachableDestinations,
  type ReachableDestination,
} from "./booking/use-booking-flow";
import { useLocationsQuery } from "@/features/locations";

export { computeReachableDestinations, type ReachableDestination, type LocationPickerProps };

export interface LocationSelectorsProps {
  pickupLocationId?: number | null;
  destLocationId?: number | null;
  onPickupChange: (id: number | null) => void;
  onDestChange: (id: number | null) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Connected corridor location selectors wrapper.
 */
export function LocationSelectors({
  pickupLocationId,
  destLocationId,
  onPickupChange,
  onDestChange,
  disabled = false,
  className,
}: LocationSelectorsProps) {
  const { data: catalog, isLoading } = useLocationsQuery();

  const reachableDestinations = React.useMemo(() => {
    return computeReachableDestinations(catalog, pickupLocationId);
  }, [catalog, pickupLocationId]);

  return (
    <LocationPicker
      locations={catalog?.locations}
      reachableDestinations={reachableDestinations}
      pickupLocationId={pickupLocationId}
      destLocationId={destLocationId}
      onPickupChange={onPickupChange}
      onDestChange={onDestChange}
      disabled={disabled}
      isLoading={isLoading}
      className={className}
    />
  );
}

export default LocationSelectors;
