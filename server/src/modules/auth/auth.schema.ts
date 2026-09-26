import { z } from 'zod';

export const vehicleSchema = z.object({
  name: z.string().trim().min(1, 'Vehicle name is required'),
  regNo: z.string().trim().min(1, 'Registration number is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(6, 'Capacity cannot exceed 6'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['PASSENGER', 'DRIVER']),
    vehicle: vehicleSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'DRIVER') {
        return !!data.vehicle;
      }
      return true;
    },
    {
      message: 'Vehicle details (name, registration number, and capacity) are required for driver accounts',
      path: ['vehicle'],
    }
  );

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
