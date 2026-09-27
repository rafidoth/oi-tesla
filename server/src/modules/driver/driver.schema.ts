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
export const poolIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type PoolIdParamsInput = z.infer<typeof poolIdParamsSchema>;

export const declinePoolSchema = z
  .object({
    reason: z.string().trim().max(255).optional(),
  })
  .default({});

export type DeclinePoolInput = z.infer<typeof declinePoolSchema>;
