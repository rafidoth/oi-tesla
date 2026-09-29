import type { RouteDto } from "../types/locations.types";

export function findRouteForTrip(
  pickupLocationId: number,
  destLocationIds: number[],
  routes: RouteDto[] = []
): RouteDto | null {
  return (
    routes.find((route) => {
      const pickupStop = route.stops.find((s) => s.locationId === pickupLocationId);
      if (!pickupStop) return false;
      return destLocationIds.every((destId) => {
        const destStop = route.stops.find((s) => s.locationId === destId);
        return destStop && destStop.position > pickupStop.position;
      });
    }) ?? null
  );
}

export function getStopPosition(
  route: RouteDto | null,
  locationId: number
): number {
  if (!route) return 0;
  return route.stops.find((s) => s.locationId === locationId)?.position ?? 0;
}

export function sortStopsByRoute<T extends { locationId?: number; destLocationId?: number }>(
  pickupLocationId: number,
  stops: T[],
  routes: RouteDto[] = []
): T[] {
  const destIds = stops.map((s) => s.locationId ?? s.destLocationId ?? 0);
  const route = findRouteForTrip(pickupLocationId, destIds, routes);
  if (!route) return stops;
  return [...stops].sort((a, b) => {
    const posA = getStopPosition(route, a.locationId ?? a.destLocationId ?? 0);
    const posB = getStopPosition(route, b.locationId ?? b.destLocationId ?? 0);
    return posA - posB;
  });
}
