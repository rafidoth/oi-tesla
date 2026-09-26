import { UsersRepository } from './users.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import type { UserResponse } from '../auth/auth.types.js';

export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.usersRepo.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    let vehicleDetails: { id?: string; name: string; regNo: string; capacity: number } | undefined;
    if (user.role === 'DRIVER') {
      const vehicle = await this.usersRepo.findVehicleByDriverId(user.id);
      if (vehicle) {
        vehicleDetails = {
          id: vehicle.id,
          name: vehicle.name,
          regNo: vehicle.regNo,
          capacity: vehicle.capacity,
        };
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'PASSENGER' | 'DRIVER',
      vehicle: vehicleDetails,
    };
  }
}

export default UsersService;
