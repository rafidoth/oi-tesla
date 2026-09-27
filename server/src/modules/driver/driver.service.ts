import { DriverRepository } from './driver.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import type { DriverMeResponse } from './driver.types.js';

export class DriverService {
  constructor(private readonly driverRepo: DriverRepository) {}

  async getDriverMe(driverId: string): Promise<DriverMeResponse> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const vehicle = await this.driverRepo.findVehicleByDriverId(driverId);
    if (!vehicle) {
      throw new NotFoundError('No vehicle assigned to driver');
    }

    const activePool = await this.driverRepo.findActivePoolByDriverId(driverId);

    return {
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        role: 'DRIVER',
      },
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        regNo: vehicle.regNo,
        capacity: vehicle.capacity,
        status: vehicle.status as 'ONLINE' | 'OFFLINE',
      },
      activePool: activePool
        ? {
            id: activePool.id,
            pickupLocationId: activePool.pickupLocationId,
            pickupLocationName: activePool.pickupLocationName,
            status: activePool.status,
            capacity: activePool.capacity,
            occupiedSeats: activePool.occupiedSeats,
            createdAt: activePool.createdAt,
            updatedAt: activePool.updatedAt,
          }
        : null,
    };
  }
}

export default DriverService;
