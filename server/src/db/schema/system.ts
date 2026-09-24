import { pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

export const systemHealth = pgTable('system_health', {
  id: serial('id').primaryKey(),
  bootedAt: timestamp('booted_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});
