import { Router, type Request, type Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db/client.js';

const router = Router();

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'error';
    latencyMs?: number;
    error?: string;
  };
}

router.get('/', async (_req: Request, res: Response<HealthCheckResponse>) => {
  let dbStatus: 'connected' | 'error' = 'connected';
  let dbLatencyMs: number | undefined;
  let dbError: string | undefined;

  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: unknown) {
    dbStatus = 'error';
    dbError = err instanceof Error ? err.message : 'Unknown database error';
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus,
      ...(dbLatencyMs !== undefined ? { latencyMs: dbLatencyMs } : {}),
      ...(dbError ? { error: dbError } : {}),
    },
  });
});

export default router;
