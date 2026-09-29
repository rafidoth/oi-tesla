"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useAuthModalStore } from "@/features/auth";
import { useLocationsQuery } from "@/features/locations";
import { useRideBookingStore } from "../store/ride-booking.store";
import { useFareEstimateQuery } from "./use-fare-estimate-query";
import { computeReachableDestinations } from "../components/booking/use-booking-flow";

export function useFareEstimator() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data: catalog, isLoading: isCatalogLoading } = useLocationsQuery();

  const {
    pickupLocationId,
    destLocationId,
    seats,
    setPickupLocationId,
    setDestLocationId,
    setSeats,
  } = useRideBookingStore();

  const reachableDestinations = useMemo(
    () => computeReachableDestinations(catalog, pickupLocationId),
    [catalog, pickupLocationId]
  );

  useEffect(() => {
    if (!catalog || destLocationId == null) return;
    const isReachable = reachableDestinations.some(
      (dest) => dest.location.id === destLocationId
    );
    if (!isReachable) setDestLocationId(null);
  }, [catalog, reachableDestinations, destLocationId, setDestLocationId]);

  const {
    data: estimate,
    isLoading: isEstimating,
    isError: isEstimateError,
  } = useFareEstimateQuery({
    pickupLocationId,
    destLocationId,
    seats,
  });

  const canRequest = Boolean(
    pickupLocationId && destLocationId && seats >= 1 && estimate
  );

  const { openModal } = useAuthModalStore();

  const handleRequestRide = () => {
    if (!canRequest) return;
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      openModal("login");
    }
  };

  return {
    locations: catalog?.locations ?? [],
    reachableDestinations,
    pickupLocationId,
    destLocationId,
    seats,
    estimate,
    isEstimating,
    isEstimateError,
    isCatalogLoading,
    canRequest,
    setPickup: setPickupLocationId,
    setDropoff: setDestLocationId,
    setSeats,
    handleRequestRide,
  };
}

export default useFareEstimator;
