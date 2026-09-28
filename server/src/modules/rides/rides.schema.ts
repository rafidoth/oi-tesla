import { z } from 'zod';

export const createRideSchema = z
  .object({
    pickupLocationId: z.coerce.number().int().positive(),
    destLocationId: z.coerce.number().int().positive(),
    seats: z.coerce.number().int().min(1).max(4).default(1),
    paymentMethod: z.enum(['CASH', 'TESLAPAY']).default('CASH'),
  })
  .refine((data) => data.pickupLocationId !== data.destLocationId, {
    message: 'Pickup and destination locations cannot be the same',
    path: ['destLocationId'],
  });

export type CreateRideInput = z.infer<typeof createRideSchema>;

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

export const cancelRideSchema = z.object({
  reason: z.string().trim().max(255).optional(),
});

export type CancelRideInput = z.infer<typeof cancelRideSchema>;

export const rideIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type RideIdParamsInput = z.infer<typeof rideIdParamsSchema>;

export const getPassengerRidesQuerySchema = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED', 'ALL']).optional(),
});

export type GetPassengerRidesQueryInput = z.infer<typeof getPassengerRidesQuerySchema>;

