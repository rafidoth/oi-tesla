import { LocationsRepository } from './locations.repository.js';
import { InvalidTransitionError } from '../../shared/errors/InvalidTransitionError.js';
import type {
  LocationDto,
  RouteDto,
  ServedPairDto,
  LocationsCatalogResponse,
  RoutePairValidationResult,
} from './locations.types.js';

export class LocationsService {
  constructor(private readonly repo: LocationsRepository) {}

  async getLocationsCatalog(): Promise<LocationsCatalogResponse> {
    const [locations, routes, segments] = await Promise.all([
      this.repo.findAllLocations(),
      this.repo.findAllRoutesWithStops(),
      this.repo.findAllRouteSegments(),
    ]);

    const locationDtos: LocationDto[] = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      lat: Number(loc.lat),
      lng: Number(loc.lng),
    }));

    const routeDtos: RouteDto[] = routes.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      stops: r.stops.map((s) => ({
        locationId: s.locationId,
        position: s.position,
      })),
    }));

    const segmentMap = new Map<string, number>();
    for (const seg of segments) {
      segmentMap.set(`${seg.routeId}:${seg.fromLocationId}:${seg.toLocationId}`, seg.distanceM);
    }

    const pairMap = new Map<string, ServedPairDto>();

    for (const route of routes) {
      const stops = route.stops;
      for (let i = 0; i < stops.length; i++) {
        let runningDistance = 0;
        for (let j = i + 1; j < stops.length; j++) {
          const fromLoc = stops[j - 1].locationId;
          const toLoc = stops[j].locationId;
          const segDist = segmentMap.get(`${route.id}:${fromLoc}:${toLoc}`);
          if (segDist === undefined) {
            break;
          }
          runningDistance += segDist;

          const pickupLocationId = stops[i].locationId;
          const destLocationId = stops[j].locationId;
          const pairKey = `${pickupLocationId}:${destLocationId}`;

          const existing = pairMap.get(pairKey);
          if (existing) {
            if (!existing.routeIds.includes(route.id)) {
              existing.routeIds.push(route.id);
            }
          } else {
            pairMap.set(pairKey, {
              pickupLocationId,
              destLocationId,
              distanceM: runningDistance,
              routeIds: [route.id],
            });
          }
        }
      }
    }

    return {
      locations: locationDtos,
      routes: routeDtos,
      servedPairs: Array.from(pairMap.values()),
    };
  }

  async validateRoutePair(
    pickupLocationId: number,
    destLocationId: number
  ): Promise<RoutePairValidationResult> {
    if (pickupLocationId === destLocationId) {
      throw new InvalidTransitionError('ROUTE_NOT_SERVED', 'The requested route is not served');
    }

    const [routes, segments] = await Promise.all([
      this.repo.findAllRoutesWithStops(),
      this.repo.findAllRouteSegments(),
    ]);

    const segmentMap = new Map<string, number>();
    for (const seg of segments) {
      segmentMap.set(`${seg.routeId}:${seg.fromLocationId}:${seg.toLocationId}`, seg.distanceM);
    }

    for (const route of routes) {
      const pickupStop = route.stops.find((s) => s.locationId === pickupLocationId);
      const destStop = route.stops.find((s) => s.locationId === destLocationId);

      if (pickupStop && destStop && destStop.position > pickupStop.position) {
        let distanceM = 0;
        let routeValid = true;

        const intermediateStops = route.stops
          .filter((s) => s.position >= pickupStop.position && s.position <= destStop.position)
          .sort((a, b) => a.position - b.position);

        for (let k = 0; k < intermediateStops.length - 1; k++) {
          const fromLoc = intermediateStops[k].locationId;
          const toLoc = intermediateStops[k + 1].locationId;
          const segDist = segmentMap.get(`${route.id}:${fromLoc}:${toLoc}`);
          if (segDist === undefined) {
            routeValid = false;
            break;
          }
          distanceM += segDist;
        }

        if (routeValid) {
          return {
            isServed: true,
            distanceM,
            routeId: route.id,
          };
        }
      }
    }

    throw new InvalidTransitionError('ROUTE_NOT_SERVED', 'The requested route is not served');
  }

  async getDistance(pickupLocationId: number, destLocationId: number): Promise<number> {
    const result = await this.validateRoutePair(pickupLocationId, destLocationId);
    return result.distanceM;
  }
}

export default LocationsService;
