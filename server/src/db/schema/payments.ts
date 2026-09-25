import { bigint, check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { passengerRides } from './rides.js';
import { users } from './users.js';

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    passengerRideId: uuid('passenger_ride_id')
      .notNull()
      .unique()
      .references(() => passengerRides.id),
    method: text('method').notNull(),
    amountPaisa: bigint('amount_paisa', { mode: 'number' }).notNull(),
    status: text('status').notNull().default('PENDING'),
    paidAt: timestamp('paid_at', { withTimezone: true, mode: 'date' }),
    markedBy: uuid('marked_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    check('payments_method_check', sql`${table.method} IN ('CASH','TESLAPAY')`),
    check('payments_amount_paisa_check', sql`${table.amountPaisa} > 0`),
    check('payments_status_check', sql`${table.status} IN ('PENDING','PAID','FAILED')`),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
