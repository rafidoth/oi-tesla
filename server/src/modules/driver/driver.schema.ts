import { z } from 'zod';

export const updateDriverStatusSchema = z.object({
  status: z.enum(['ONLINE', 'OFFLINE']),
});

export type UpdateDriverStatusInput = z.infer<typeof updateDriverStatusSchema>;

export const getDriverPoolsQuerySchema = z.object({
  status: z
    .enum(['OPEN', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED'])
    .optional()
    .default('OPEN'),
});

export type GetDriverPoolsQueryInput = z.infer<typeof getDriverPoolsQuerySchema>;

