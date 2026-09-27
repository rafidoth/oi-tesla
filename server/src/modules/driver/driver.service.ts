import { DriverRepository } from './driver.repository.js';
import type { EventsService } from '../events/events.service.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { InvalidTransitionError } from '../../shared/errors/InvalidTransitionError.js';
import { ConflictError } from '../../shared/errors/ConflictError.js';
import type { Vehicle, Pool } from '../../db/schema/index.js';
import type {
  DriverMeResponse,
  UpdateDriverStatusResponse,
  OpenPoolItem,
  DeclinePoolResponse,
  AcceptPoolResponse,
  DriverPoolDetailsResponse,
  OpenPoolDestinationStop,
  DriverPoolRosterMember,
} from './driver.types.js';
import type { DeclinePoolInput } from './driver.schema.js';

export class DriverService {
  constructor(
    private readonly driverRepo: DriverRepository,
    private readonly eventsService: EventsService
  ) {}

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

  async updateDriverStatus(
    driverId: string,
    status: 'ONLINE' | 'OFFLINE'
  ): Promise<UpdateDriverStatusResponse> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const updatedVehicle = await this.driverRepo.updateVehicleStatus(driverId, status);
    if (!updatedVehicle) {
      throw new NotFoundError('No vehicle assigned to driver');
    }

    return {
      status: updatedVehicle.status as 'ONLINE' | 'OFFLINE',
      vehicle: {
        id: updatedVehicle.id,
        name: updatedVehicle.name,
        regNo: updatedVehicle.regNo,
        capacity: updatedVehicle.capacity,
        status: updatedVehicle.status as 'ONLINE' | 'OFFLINE',
      },
    };
  }

  async getOpenPoolsForDriver(driverId: string): Promise<OpenPoolItem[]> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const vehicle = await this.driverRepo.findVehicleByDriverId(driverId);
    if (!vehicle) {
      throw new NotFoundError('No vehicle assigned to driver');
    }

    if (vehicle.status !== 'ONLINE') {
      return [];
    }

    return this.driverRepo.findOpenPoolsForDriver(driverId, vehicle.capacity);
  }

  async declinePool(
    driverId: string,
    poolId: string,
    input?: DeclinePoolInput
  ): Promise<DeclinePoolResponse> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const pool = await this.driverRepo.findPoolById(poolId);
    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    if (pool.status !== 'OPEN' || pool.driverId !== null) {
      throw new InvalidTransitionError(
        'INVALID_POOL_STATE',
        `Pool cannot be declined in status ${pool.status}`
      );
    }

    const isAlreadyDeclined = await this.driverRepo.hasDriverDeclinedPool(driverId, poolId);
    if (isAlreadyDeclined) {
      return {
        success: true,
        poolId,
      };
    }

    await this.eventsService.logRideEvent({
      event: 'DRIVER_DECLINED',
      actorType: 'DRIVER',
      actorId: driverId,
      poolId,
      fromState: 'OPEN',
      toState: 'OPEN',
      payload: input?.reason ? { reason: input.reason } : undefined,
    });

    return {
      success: true,
      poolId,
    };
  }

  async acceptPool(driverId: string, poolId: string): Promise<AcceptPoolResponse> {
    const vehicle = await this.validateDriverAvailability(driverId);
    await this.validatePoolAvailability(poolId, vehicle.capacity);

    try {
      return await this.driverRepo.withTransaction(async (tx) => {
        const assignedPool = await this.assignPoolToDriver(tx, poolId, driverId, vehicle);
        await this.recordAcceptanceAuditEvents(tx, assignedPool, driverId, vehicle);
        return this.formatAcceptPoolResponse(assignedPool);
      });
    } catch (err: unknown) {
      this.handleAcceptanceError(err);
    }
  }

  async getDriverPoolById(
    driverId: string,
    poolId: string
  ): Promise<DriverPoolDetailsResponse> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const pool = await this.driverRepo.findDriverPoolById(poolId, driverId);
    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    const roster = await this.driverRepo.findActiveRosterForPool(poolId, pool.status);
    const destinationStops = this.extractDestinationStops(roster);

    return {
      id: pool.id,
      pickupLocationId: pool.pickupLocationId,
      pickupLocationName: pool.pickupLocationName,
      status: pool.status,
      capacity: pool.capacity,
      occupiedSeats: pool.occupiedSeats,
      driverId: pool.driverId,
      vehicleId: pool.vehicleId,
      destinationStops,
      roster,
      createdAt: pool.createdAt,
      updatedAt: pool.updatedAt,
    };
  }

  private extractDestinationStops(roster: DriverPoolRosterMember[]): OpenPoolDestinationStop[] {
    const stopMap = new Map<number, string>();
    for (const member of roster) {
      stopMap.set(member.destLocationId, member.destLocationName);
    }
    return Array.from(stopMap.entries()).map(([locationId, locationName]) => ({
      locationId,
      locationName,
    }));
  }

  private async validateDriverAvailability(driverId: string): Promise<Vehicle> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const vehicle = await this.driverRepo.findVehicleByDriverId(driverId);
    if (!vehicle) {
      throw new NotFoundError('No vehicle assigned to driver');
    }

    if (vehicle.status !== 'ONLINE') {
      throw new ConflictError('DRIVER_OFFLINE', 'Driver must be online to accept a pool');
    }

    const activePool = await this.driverRepo.findActivePoolByDriverId(driverId);
    if (activePool) {
      throw new ConflictError('DRIVER_HAS_ACTIVE_POOL', 'Driver already has an active pool in progress');
    }

    return vehicle;
  }

  private async validatePoolAvailability(poolId: string, vehicleCapacity: number): Promise<Pool> {
    const pool = await this.driverRepo.findPoolById(poolId);
    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    if (pool.status !== 'OPEN' || pool.driverId !== null) {
      throw new ConflictError('POOL_ALREADY_ASSIGNED', 'Pool is already assigned or no longer available');
    }

    if (vehicleCapacity < pool.occupiedSeats) {
      throw new ConflictError('VEHICLE_TOO_SMALL', 'Vehicle capacity is less than pool occupied seats', {
        vehicleCapacity,
        occupiedSeats: pool.occupiedSeats,
      });
    }

    return pool;
  }

  private async assignPoolToDriver(
    tx: any,
    poolId: string,
    driverId: string,
    vehicle: Vehicle
  ): Promise<Pool> {
    const updatedPool = await this.driverRepo.assignDriverToPool(
      poolId,
      driverId,
      vehicle.id,
      vehicle.capacity,
      tx
    );

    if (!updatedPool) {
      const latestPool = await this.driverRepo.findPoolById(poolId, tx);
      if (latestPool && latestPool.occupiedSeats > vehicle.capacity) {
        throw new ConflictError('VEHICLE_TOO_SMALL', 'Vehicle capacity is less than pool occupied seats', {
          vehicleCapacity: vehicle.capacity,
          occupiedSeats: latestPool.occupiedSeats,
        });
      }
      throw new ConflictError('POOL_ALREADY_ASSIGNED', 'Pool is already assigned or no longer available');
    }

    return updatedPool;
  }

  private async recordAcceptanceAuditEvents(
    tx: any,
    pool: Pool,
    driverId: string,
    vehicle: Vehicle
  ): Promise<void> {
    const activeMembers = await this.driverRepo.findActiveMembersByPoolId(pool.id, tx);

    await this.eventsService.logRideEvent(
      {
        event: 'DRIVER_ACCEPTED',
        actorType: 'DRIVER',
        actorId: driverId,
        poolId: pool.id,
        fromState: 'OPEN',
        toState: 'MATCHED',
        payload: {
          vehicleId: vehicle.id,
          vehicleCapacity: vehicle.capacity,
          occupiedSeats: pool.occupiedSeats,
        },
      },
      tx
    );

    for (const member of activeMembers) {
      await this.eventsService.logRideEvent(
        {
          event: 'RIDE_MATCHED',
          actorType: 'SYSTEM',
          actorId: member.passengerId,
          poolId: pool.id,
          passengerRideId: member.id,
          rideRequestId: member.rideRequestId,
          fromState: 'REQUESTED',
          toState: 'MATCHED',
        },
        tx
      );
    }
  }

  private formatAcceptPoolResponse(pool: Pool): AcceptPoolResponse {
    return {
      success: true,
      pool: {
        id: pool.id,
        pickupLocationId: pool.pickupLocationId,
        status: pool.status,
        capacity: pool.capacity,
        occupiedSeats: pool.occupiedSeats,
        driverId: pool.driverId!,
        vehicleId: pool.vehicleId!,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,
      },
    };
  }

  private handleAcceptanceError(err: unknown): never {
    const error = err as { code?: string; message?: string };
    if (error?.code === '23505' || error?.message?.includes('pools_driver_active_unique_idx')) {
      throw new ConflictError('DRIVER_HAS_ACTIVE_POOL', 'Driver already has an active pool in progress');
    }
    throw err;
  }
}

export default DriverService;


