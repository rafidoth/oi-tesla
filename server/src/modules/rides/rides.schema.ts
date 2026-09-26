import { z } from 'zod';

export const requestRideSchema = z
  .object({
    pickupLocationId: z.coerce.number().int().positive(),
    destLocationId: z.coerce.number().int().positive(),
    seats: z.coerce.number().int().min(1).max(4).default(1),
    paymentMethod: z.enum(['CASH', 'TESLAPAY']).default('CASH').optional(),
  })
  .refine((data) => data.pickupLocationId !== data.destLocationId, {
    message: 'Pickup and destination locations cannot be the same',
    path: ['destLocationId'],
  });

export type RequestRideInput = z.infer<typeof requestRideSchema>;
