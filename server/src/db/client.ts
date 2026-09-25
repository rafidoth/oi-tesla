import dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

export const queryClient = postgres(databaseUrl, {
  connect_timeout: 3,
  idle_timeout: 20,
  max: 10,
});

export const db = drizzle(queryClient);
