import { check, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    driverId: uuid('driver_id')
      .notNull()
      .unique()
      .references(() => users.id),
    name: text('name').notNull(),
    regNo: text('reg_no').notNull().unique(),
    capacity: integer('capacity').notNull(),
    status: text('status').notNull().default('OFFLINE'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    check('vehicle_capacity_check', sql`${table.capacity} BETWEEN 1 AND 6`),
    check('vehicle_status_check', sql`${table.status} IN ('ONLINE', 'OFFLINE')`),
  ]
);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
