import { asc } from 'drizzle-orm';
import type { db } from '../../db/client.js';
import {
  locations,
  routes,
  routeStops,
  routeSegments,
  type Location,
  type Route,
  type RouteStop,
  type RouteSegment,
} from '../../db/schema/index.js';

export interface RouteWithStops extends Route {
  stops: RouteStop[];
}

type DbType = typeof db;

export class LocationsRepository {
  constructor(private readonly db: DbType) {}

  async findAllLocations(): Promise<Location[]> {
    return await this.db
      .select()
      .from(locations)
      .orderBy(asc(locations.id));
  }

  async findAllRoutesWithStops(): Promise<RouteWithStops[]> {
    const allRoutes = await this.db
      .select()
      .from(routes)
      .orderBy(asc(routes.id));

    const allStops = await this.db
      .select()
      .from(routeStops)
      .orderBy(asc(routeStops.position));

    const stopsByRouteId = new Map<number, RouteStop[]>();
    for (const stop of allStops) {
      const existing = stopsByRouteId.get(stop.routeId);
      if (existing) {
        existing.push(stop);
      } else {
        stopsByRouteId.set(stop.routeId, [stop]);
      }
    }

    return allRoutes.map((route) => ({
      ...route,
      stops: stopsByRouteId.get(route.id) || [],
    }));
  }

  async findAllRouteSegments(): Promise<RouteSegment[]> {
    return await this.db.select().from(routeSegments);
  }
}

export default LocationsRepository;
