import dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/oitesla';

export const queryClient = postgres(databaseUrl, {
  connect_timeout: 3,
  idle_timeout: 20,
  max: 10,
});

export const db = drizzle(queryClient);
