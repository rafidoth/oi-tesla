import { bigint, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { locations } from './locations.js';
import { pools } from './pools.js';
import { users } from './users.js';

export const rideRequests = pgTable(
  'ride_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    passengerId: uuid('passenger_id')
      .notNull()
      .references(() => users.id),
    pickupLocationId: integer('pickup_location_id')
      .notNull()
      .references(() => locations.id),
    destLocationId: integer('dest_location_id')
      .notNull()
      .references(() => locations.id),
    seats: integer('seats').notNull(),
    paymentMethod: text('payment_method').notNull().default('CASH'),
    estimateFarePaisa: bigint('estimate_fare_paisa', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    check('ride_requests_pickup_dest_check', sql`${table.pickupLocationId} <> ${table.destLocationId}`),
    check('ride_requests_seats_check', sql`${table.seats} BETWEEN 1 AND 4`),
    check('ride_requests_payment_method_check', sql`${table.paymentMethod} IN ('CASH','TESLAPAY')`),
    index('ride_requests_passenger_created_at_idx').on(table.passengerId, table.createdAt.desc()),
  ]
);

export const passengerRides = pgTable(
  'passenger_rides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rideRequestId: uuid('ride_request_id')
      .notNull()
      .unique()
      .references(() => rideRequests.id),
    passengerId: uuid('passenger_id')
      .notNull()
      .references(() => users.id),
    poolId: uuid('pool_id')
      .notNull()
      .references(() => pools.id),
    seats: integer('seats').notNull(),
    farePaisa: bigint('fare_paisa', { mode: 'number' }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'date' }),
    cancelReason: text('cancel_reason'),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    check('passenger_rides_seats_check', sql`${table.seats} BETWEEN 1 AND 4`),
    uniqueIndex('passenger_rides_pool_passenger_unique_idx')
      .on(table.poolId, table.passengerId)
      .where(sql`${table.cancelledAt} IS NULL`),
    index('passenger_rides_passenger_created_at_idx').on(table.passengerId, table.createdAt.desc()),
    index('passenger_rides_pool_idx').on(table.poolId),
  ]
);

export type RideRequest = typeof rideRequests.$inferSelect;
export type NewRideRequest = typeof rideRequests.$inferInsert;
export type PassengerRide = typeof passengerRides.$inferSelect;
export type NewPassengerRide = typeof passengerRides.$inferInsert;
