import { check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { locations } from './locations.js';
import { users } from './users.js';
import { vehicles } from './vehicles.js';

export const pools = pgTable(
  'pools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pickupLocationId: integer('pickup_location_id')
      .notNull()
      .references(() => locations.id),
    status: text('status').notNull().default('OPEN'),
    driverId: uuid('driver_id').references(() => users.id),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id),
    capacity: integer('capacity').notNull(),
    occupiedSeats: integer('occupied_seats').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'pool_status_check',
      sql`${table.status} IN ('OPEN','MATCHED','DRIVER_ARRIVED','STARTED','COMPLETED','CANCELLED')`
    ),
    check('pool_capacity_check', sql`${table.capacity} BETWEEN 1 AND 6`),
    check('pool_occupied_seats_check', sql`${table.occupiedSeats} BETWEEN 0 AND ${table.capacity}`),
    index('pools_status_pickup_location_idx').on(table.status, table.pickupLocationId),
    uniqueIndex('pools_driver_active_unique_idx')
      .on(table.driverId)
      .where(sql`${table.status} IN ('MATCHED','DRIVER_ARRIVED','STARTED')`),
    index('pools_created_at_idx').on(table.createdAt),
  ]
);

export type Pool = typeof pools.$inferSelect;
export type NewPool = typeof pools.$inferInsert;
