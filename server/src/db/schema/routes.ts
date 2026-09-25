import { check, integer, pgTable, primaryKey, text, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { locations } from './locations.js';

export const routes = pgTable('routes', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
});

export const routeStops = pgTable(
  'route_stops',
  {
    routeId: integer('route_id')
      .notNull()
      .references(() => routes.id),
    locationId: integer('location_id')
      .notNull()
      .references(() => locations.id),
    position: integer('position').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.routeId, table.position] }),
    unique().on(table.routeId, table.locationId),
    check('route_stop_position_check', sql`${table.position} >= 1`),
  ]
);

export const routeSegments = pgTable(
  'route_segments',
  {
    routeId: integer('route_id')
      .notNull()
      .references(() => routes.id),
    fromLocationId: integer('from_location_id')
      .notNull()
      .references(() => locations.id),
    toLocationId: integer('to_location_id')
      .notNull()
      .references(() => locations.id),
    distanceM: integer('distance_m').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.routeId, table.fromLocationId, table.toLocationId] }),
    check('route_segment_distance_check', sql`${table.distanceM} > 0`),
  ]
);

export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type RouteStop = typeof routeStops.$inferSelect;
export type NewRouteStop = typeof routeStops.$inferInsert;
export type RouteSegment = typeof routeSegments.$inferSelect;
export type NewRouteSegment = typeof routeSegments.$inferInsert;
