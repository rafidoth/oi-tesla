import { integer, numeric, pgTable, text } from 'drizzle-orm/pg-core';

export const locations = pgTable('locations', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  lat: numeric('lat', { precision: 9, scale: 6 }).notNull(),
  lng: numeric('lng', { precision: 9, scale: 6 }).notNull(),
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
