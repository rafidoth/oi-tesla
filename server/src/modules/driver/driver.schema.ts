import { z } from 'zod';

export const updateDriverStatusSchema = z.object({
  status: z.enum(['ONLINE', 'OFFLINE']),
});

export type UpdateDriverStatusInput = z.infer<typeof updateDriverStatusSchema>;
