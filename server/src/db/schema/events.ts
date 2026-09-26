import { bigserial, check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { pools } from './pools.js';
import { passengerRides, rideRequests } from './rides.js';
import { users } from './users.js';

export const rideEvents = pgTable(
  'ride_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    event: text('event').notNull(),
    actorType: text('actor_type').notNull(),
    actorId: uuid('actor_id').references(() => users.id),
    poolId: uuid('pool_id').references(() => pools.id),
    passengerRideId: uuid('passenger_ride_id').references(() => passengerRides.id),
    rideRequestId: uuid('ride_request_id').references(() => rideRequests.id),
    fromState: text('from_state'),
    toState: text('to_state'),
    payload: jsonb('payload'),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    check('ride_events_actor_type_check', sql`${table.actorType} IN ('PASSENGER','DRIVER','SYSTEM')`),
    index('ride_events_pool_id_idx').on(table.poolId, table.id),
    index('ride_events_passenger_ride_id_idx').on(table.passengerRideId, table.id),
    index('ride_events_ride_request_id_idx').on(table.rideRequestId, table.id),
    index('ride_events_occurred_at_idx').on(table.occurredAt),
  ]
);

export type RideEvent = typeof rideEvents.$inferSelect;
export type NewRideEvent = typeof rideEvents.$inferInsert;
