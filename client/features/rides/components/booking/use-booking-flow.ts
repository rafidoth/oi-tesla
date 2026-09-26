"use client";

import * as React from "react";
import { useLocationsQuery, type LocationsCatalogResponse, type LocationDto } from "@/features/locations";
import { useRideBookingStore } from "../../store/ride-booking.store";
import { useCreateRideMutation } from "../../hooks/use-create-ride-mutation";
import { useFareEstimateQuery } from "../../hooks/use-fare-estimate-query";
import type { PaymentMethod, RideBookingResponseDto } from "../../types/rides.types";

export interface ReachableDestination {
  location: LocationDto;
  distanceM?: number;
  routeCodes?: string[];
}

/**
 * Computes downstream reachable destinations for a selected pickup location.
 */
export function computeReachableDestinations(
  catalog: LocationsCatalogResponse | null | undefined,
  pickupLocationId: number | null | undefined
): ReachableDestination[] {
  if (!catalog || !pickupLocationId) return [];

  const locationMap = new Map<number, LocationDto>();
  for (const loc of catalog.locations || []) {
    locationMap.set(loc.id, loc);
  }

  const destMap = new Map<number, { distanceM?: number; routeCodes: Set<string> }>();

  if (Array.isArray(catalog.servedPairs) && catalog.servedPairs.length > 0) {
    for (const pair of catalog.servedPairs) {
      if (pair.pickupLocationId === pickupLocationId) {
        const entry = destMap.get(pair.destLocationId) ?? {
          distanceM: pair.distanceM,
          routeCodes: new Set<string>(),
        };
        if (pair.distanceM !== undefined) entry.distanceM = pair.distanceM;
        if (Array.isArray(pair.routeIds) && Array.isArray(catalog.routes)) {
          for (const routeId of pair.routeIds) {
            const route = catalog.routes.find((r) => r.id === routeId);
            if (route?.code) entry.routeCodes.add(route.code);
          }
        }
        destMap.set(pair.destLocationId, entry);
      }
    }
  }

  if (Array.isArray(catalog.routes) && catalog.routes.length > 0) {
    for (const route of catalog.routes) {
      if (!Array.isArray(route.stops)) continue;
      const pickupStop = route.stops.find((s) => s.locationId === pickupLocationId);
      if (!pickupStop) continue;

      for (const stop of route.stops) {
        if (stop.position > pickupStop.position) {
          const entry = destMap.get(stop.locationId) ?? {
            routeCodes: new Set<string>(),
          };
          entry.routeCodes.add(route.code);
          destMap.set(stop.locationId, entry);
        }
      }
    }
  }

  const results: ReachableDestination[] = [];
  for (const [destId, info] of destMap.entries()) {
    const loc = locationMap.get(destId);
    if (loc) {
      results.push({
        location: loc,
        distanceM: info.distanceM,
        routeCodes: Array.from(info.routeCodes),
      });
    }
  }

  return results.sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
}

export interface UseBookingFlowOptions {
  onSuccess?: (response: RideBookingResponseDto) => void;
}

export function useBookingFlow(options?: UseBookingFlowOptions) {
  const {
    pickupLocationId,
    destLocationId,
    seats,
    paymentMethod,
    poolAssignment,
    setPickupLocationId,
    setDestLocationId,
    setSeats,
    setPaymentMethod,
    setPoolAssignment,
    resetBookingDraft,
  } = useRideBookingStore();

  const { data: catalog, isLoading: isCatalogLoading } = useLocationsQuery();

  const reachableDestinations = React.useMemo(() => {
    return computeReachableDestinations(catalog, pickupLocationId);
  }, [catalog, pickupLocationId]);

  // Reset destination if no longer reachable after pickup changes
  React.useEffect(() => {
    if (!catalog || destLocationId == null) return;
    const isReachable = reachableDestinations.some((d) => d.location.id === destLocationId);
    if (!isReachable) {
      setDestLocationId(null);
    }
  }, [catalog, reachableDestinations, destLocationId, setDestLocationId]);

  const pickupLocation = React.useMemo(() => {
    return catalog?.locations?.find((l) => l.id === pickupLocationId) ?? null;
  }, [catalog, pickupLocationId]);

  const destLocation = React.useMemo(() => {
    return catalog?.locations?.find((l) => l.id === destLocationId) ?? null;
  }, [catalog, destLocationId]);

  const createRideMutation = useCreateRideMutation({
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
  });

  const {
    data: estimate,
    isLoading: isEstimating,
    isError: isEstimateError,
  } = useFareEstimateQuery({
    pickupLocationId,
    destLocationId,
    seats,
  });

  const canSubmit = Boolean(
    pickupLocationId != null &&
    destLocationId != null &&
    seats >= 1 &&
    !createRideMutation.isPending
  );

  const hasSelection = Boolean(
    pickupLocationId != null || destLocationId != null || seats > 1
  );

  const submit = () => {
    if (!canSubmit || !pickupLocationId || !destLocationId) return;
    createRideMutation.mutate({
      pickupLocationId,
      destLocationId,
      seats,
      paymentMethod,
    });
  };

  const reset = () => {
    resetBookingDraft();
    createRideMutation.reset();
  };

  const dismissAlert = () => {
    setPoolAssignment(null);
    createRideMutation.reset();
  };

  const retrySubmit = () => {
    if (pickupLocationId && destLocationId) {
      createRideMutation.mutate({
        pickupLocationId,
        destLocationId,
        seats,
        paymentMethod,
      });
    }
  };

  return {
    // State
    pickupLocationId,
    destLocationId,
    seats,
    paymentMethod,
    poolAssignment,
    catalog,
    isCatalogLoading,
    reachableDestinations,
    pickupLocation,
    destLocation,
    estimate,
    isEstimating,
    isEstimateError,
    canSubmit,
    isSubmitting: createRideMutation.isPending,
    error: createRideMutation.error,
    hasSelection,

    // Actions
    setPickup: setPickupLocationId,
    setDropoff: setDestLocationId,
    setSeats,
    setPayment: (method: PaymentMethod) => setPaymentMethod(method),
    submit,
    reset,
    dismissAlert,
    retrySubmit,
  };
}
