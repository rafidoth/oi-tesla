import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverService } from '../../src/modules/driver/driver.service.js';
import type { DriverRepository } from '../../src/modules/driver/driver.repository.js';
import { NotFoundError } from '../../src/shared/errors/NotFoundError.js';
import { InvalidTransitionError } from '../../src/shared/errors/InvalidTransitionError.js';
import { ConflictError } from '../../src/shared/errors/ConflictError.js';
import { ForbiddenError } from '../../src/shared/errors/ForbiddenError.js';
import type { EventsService } from '../../src/modules/events/events.service.js';
import { CAST } from '../fixtures/cast.js';

describe('DriverService Unit Tests', () => {
  let mockDriverRepo: {
    findDriverById: ReturnType<typeof vi.fn>;
    findVehicleByDriverId: ReturnType<typeof vi.fn>;
    findActivePoolByDriverId: ReturnType<typeof vi.fn>;
    updateVehicleStatus: ReturnType<typeof vi.fn>;
    findOpenPoolsForDriver: ReturnType<typeof vi.fn>;
    findPoolById: ReturnType<typeof vi.fn>;
    hasDriverDeclinedPool: ReturnType<typeof vi.fn>;
    assignDriverToPool: ReturnType<typeof vi.fn>;
    findActiveMembersByPoolId: ReturnType<typeof vi.fn>;
    findDriverPoolById: ReturnType<typeof vi.fn>;
    findActiveRosterForPool: ReturnType<typeof vi.fn>;
    updatePoolStatus: ReturnType<typeof vi.fn>;
    withTransaction: ReturnType<typeof vi.fn>;
  };
  let mockEventsService: {
    logRideEvent: ReturnType<typeof vi.fn>;
  };
  let driverService: DriverService;

  beforeEach(() => {
    mockDriverRepo = {
      findDriverById: vi.fn(),
      findVehicleByDriverId: vi.fn(),
      findActivePoolByDriverId: vi.fn(),
      updateVehicleStatus: vi.fn(),
      findOpenPoolsForDriver: vi.fn(),
      findPoolById: vi.fn(),
      hasDriverDeclinedPool: vi.fn(),
      assignDriverToPool: vi.fn(),
      findActiveMembersByPoolId: vi.fn(),
      findDriverPoolById: vi.fn(),
      findActiveRosterForPool: vi.fn(),
      updatePoolStatus: vi.fn().mockResolvedValue(undefined),
      withTransaction: vi.fn((callback) => callback({})),
    };
    mockEventsService = {
      logRideEvent: vi.fn().mockResolvedValue({} as any),
    };
    driverService = new DriverService(
      mockDriverRepo as unknown as DriverRepository,
      mockEventsService as unknown as EventsService
    );
  });

  it('retrieves driver profile and vehicle overview without an active pool', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: CAST.driver.role,
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: CAST.driver.vehicle.capacity,
      status: CAST.driver.vehicle.status,
    });
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue(null);

    const result = await driverService.getDriverMe(CAST.driver.id);

    expect(result.driver).toEqual({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    expect(result.vehicle).toEqual({
      id: CAST.driver.vehicle.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'ONLINE',
    });
    expect(result.activePool).toBeNull();
  });

  it('includes active pool assignment when driver is in an ongoing ride', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: CAST.driver.vehicle.capacity,
      status: CAST.driver.vehicle.status,
    });
    const now = new Date();
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue({
      id: 'pool-123',
      pickupLocationId: 2,
      pickupLocationName: 'Banani',
      status: 'MATCHED',
      capacity: 3,
      occupiedSeats: 2,
      createdAt: now,
      updatedAt: now,
    });

    const result = await driverService.getDriverMe(CAST.driver.id);

    expect(result.activePool).not.toBeNull();
    expect(result.activePool?.id).toBe('pool-123');
    expect(result.activePool?.pickupLocationName).toBe('Banani');
    expect(result.activePool?.status).toBe('MATCHED');
    expect(result.activePool?.occupiedSeats).toBe(2);
    expect(result.activePool?.capacity).toBe(3);
  });

  it('throws NotFoundError when driver user is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue(null);

    await expect(driverService.getDriverMe('non-existent-id')).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when driver has no vehicle linked', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue(null);

    await expect(driverService.getDriverMe(CAST.driver.id)).rejects.toThrow(NotFoundError);
  });

  it('successfully updates driver vehicle status to OFFLINE', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.updateVehicleStatus.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: CAST.driver.vehicle.capacity,
      status: 'OFFLINE',
    });

    const result = await driverService.updateDriverStatus(CAST.driver.id, 'OFFLINE');

    expect(mockDriverRepo.updateVehicleStatus).toHaveBeenCalledWith(CAST.driver.id, 'OFFLINE');
    expect(result.status).toBe('OFFLINE');
    expect(result.vehicle.status).toBe('OFFLINE');
  });

  it('successfully updates driver vehicle status to ONLINE', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.updateVehicleStatus.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: CAST.driver.vehicle.capacity,
      status: 'ONLINE',
    });

    const result = await driverService.updateDriverStatus(CAST.driver.id, 'ONLINE');

    expect(mockDriverRepo.updateVehicleStatus).toHaveBeenCalledWith(CAST.driver.id, 'ONLINE');
    expect(result.status).toBe('ONLINE');
    expect(result.vehicle.status).toBe('ONLINE');
  });

  it('throws NotFoundError on updateDriverStatus when driver user is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue(null);

    await expect(
      driverService.updateDriverStatus('non-existent-id', 'ONLINE')
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError on updateDriverStatus when driver has no vehicle linked', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.updateVehicleStatus.mockResolvedValue(null);

    await expect(
      driverService.updateDriverStatus(CAST.driver.id, 'ONLINE')
    ).rejects.toThrow(NotFoundError);
  });

  it('returns open pools compatible with driver vehicle capacity', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'ONLINE',
    });
    const mockOpenPools = [
      {
        id: 'pool-1',
        pickupLocationId: 1,
        pickupLocationName: 'Gulshan-2',
        status: 'OPEN' as const,
        capacity: 3,
        occupiedSeats: 2,
        passengerCount: 2,
        destinationStops: [{ locationId: 2, locationName: 'Banani' }],
        memberRequests: [
          { passengerRideId: 'ride-1', destLocationId: 2, destLocationName: 'Banani', seats: 1 },
          { passengerRideId: 'ride-2', destLocationId: 2, destLocationName: 'Banani', seats: 1 },
        ],
        createdAt: new Date(),
      },
    ];
    mockDriverRepo.findOpenPoolsForDriver.mockResolvedValue(mockOpenPools);

    const pools = await driverService.getOpenPoolsForDriver(CAST.driver.id);

    expect(mockDriverRepo.findOpenPoolsForDriver).toHaveBeenCalledWith(CAST.driver.id, 3);
    expect(pools).toEqual(mockOpenPools);
  });

  it('returns empty list when driver vehicle is OFFLINE', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'OFFLINE',
    });

    const pools = await driverService.getOpenPoolsForDriver(CAST.driver.id);

    expect(pools).toEqual([]);
    expect(mockDriverRepo.findOpenPoolsForDriver).not.toHaveBeenCalled();
  });

  it('throws NotFoundError on getOpenPoolsForDriver when driver is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue(null);

    await expect(driverService.getOpenPoolsForDriver('unknown-id')).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError on getOpenPoolsForDriver when vehicle is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue(null);

    await expect(driverService.getOpenPoolsForDriver(CAST.driver.id)).rejects.toThrow(NotFoundError);
  });

  it('successfully declines an open pool and logs DRIVER_DECLINED event', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findPoolById.mockResolvedValue({
      id: 'pool-uuid-1',
      pickupLocationId: 1,
      capacity: 3,
      occupiedSeats: 2,
      status: 'OPEN',
      driverId: null,
      vehicleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDriverRepo.hasDriverDeclinedPool.mockResolvedValue(false);

    const result = await driverService.declinePool(CAST.driver.id, 'pool-uuid-1', {
      reason: 'Not heading in that direction',
    });

    expect(result).toEqual({
      success: true,
      poolId: 'pool-uuid-1',
    });
    expect(mockEventsService.logRideEvent).toHaveBeenCalledWith({
      event: 'DRIVER_DECLINED',
      actorType: 'DRIVER',
      actorId: CAST.driver.id,
      poolId: 'pool-uuid-1',
      fromState: 'OPEN',
      toState: 'OPEN',
      payload: { reason: 'Not heading in that direction' },
    });
  });

  it('idempotently handles decline if pool was already declined by driver', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findPoolById.mockResolvedValue({
      id: 'pool-uuid-1',
      pickupLocationId: 1,
      capacity: 3,
      occupiedSeats: 2,
      status: 'OPEN',
      driverId: null,
      vehicleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDriverRepo.hasDriverDeclinedPool.mockResolvedValue(true);

    const result = await driverService.declinePool(CAST.driver.id, 'pool-uuid-1');

    expect(result).toEqual({
      success: true,
      poolId: 'pool-uuid-1',
    });
    expect(mockEventsService.logRideEvent).not.toHaveBeenCalled();
  });

  it('throws NotFoundError on declinePool when driver is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue(null);

    await expect(driverService.declinePool('unknown-id', 'pool-uuid-1')).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError on declinePool when pool is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findPoolById.mockResolvedValue(null);

    await expect(driverService.declinePool(CAST.driver.id, 'unknown-pool')).rejects.toThrow(NotFoundError);
  });

  it('throws InvalidTransitionError on declinePool when pool status is not OPEN', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findPoolById.mockResolvedValue({
      id: 'pool-uuid-1',
      pickupLocationId: 1,
      capacity: 3,
      occupiedSeats: 2,
      status: 'MATCHED',
      driverId: 'other-driver',
      vehicleId: 'other-vehicle',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(driverService.declinePool(CAST.driver.id, 'pool-uuid-1')).rejects.toThrow(
      InvalidTransitionError
    );
  });

  it('throws InvalidTransitionError on declinePool when pool already has an assigned driver', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findPoolById.mockResolvedValue({
      id: 'pool-uuid-1',
      pickupLocationId: 1,
      capacity: 3,
      occupiedSeats: 2,
      status: 'OPEN',
      driverId: 'other-driver',
      vehicleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(driverService.declinePool(CAST.driver.id, 'pool-uuid-1')).rejects.toThrow(
      InvalidTransitionError
    );
  });

  it('throws NotFoundError on acceptPool when driver is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue(null);

    await expect(driverService.acceptPool(CAST.driver.id, 'pool-123')).rejects.toThrow(
      NotFoundError
    );
  });

  it('throws NotFoundError on acceptPool when vehicle is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue(null);

    await expect(driverService.acceptPool(CAST.driver.id, 'pool-123')).rejects.toThrow(
      NotFoundError
    );
  });

  it('throws ConflictError(DRIVER_OFFLINE) on acceptPool when driver vehicle is offline', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'OFFLINE',
    });

    await expect(driverService.acceptPool(CAST.driver.id, 'pool-123')).rejects.toThrow(
      new ConflictError('DRIVER_OFFLINE', 'Driver must be online to accept a pool')
    );
  });

  it('throws ConflictError(DRIVER_HAS_ACTIVE_POOL) on acceptPool when driver already has an active pool', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'ONLINE',
    });
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue({
      id: 'active-pool-1',
      pickupLocationId: 1,
      pickupLocationName: 'Airport',
      status: 'MATCHED',
      capacity: 3,
      occupiedSeats: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(driverService.acceptPool(CAST.driver.id, 'pool-123')).rejects.toThrow(
      new ConflictError('DRIVER_HAS_ACTIVE_POOL', 'Driver already has an active pool in progress')
    );
  });

  it('throws NotFoundError on acceptPool when pool is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'ONLINE',
    });
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue(null);
    mockDriverRepo.findPoolById.mockResolvedValue(null);

    await expect(driverService.acceptPool(CAST.driver.id, 'pool-123')).rejects.toThrow(
      NotFoundError
    );
  });

  it('throws ConflictError(POOL_ALREADY_ASSIGNED) on acceptPool when pool is not in OPEN status', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'ONLINE',
    });
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue(null);
    mockDriverRepo.findPoolById.mockResolvedValue({
      id: 'pool-123',
      pickupLocationId: 1,
      capacity: 3,
      occupiedSeats: 2,
      status: 'MATCHED',
      driverId: 'other-driver',
      vehicleId: 'other-vehicle',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(driverService.acceptPool(CAST.driver.id, 'pool-123')).rejects.toThrow(
      new ConflictError('POOL_ALREADY_ASSIGNED', 'Pool is already assigned or no longer available')
    );
  });

  it('throws ConflictError(POOL_ALREADY_ASSIGNED) on acceptPool when pool already has a driver assigned', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'ONLINE',
    });
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue(null);
    mockDriverRepo.findPoolById.mockResolvedValue({
      id: 'pool-123',
      pickupLocationId: 1,
      capacity: 3,
      occupiedSeats: 2,
      status: 'OPEN',
      driverId: 'other-driver',
      vehicleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(driverService.acceptPool(CAST.driver.id, 'pool-123')).rejects.toThrow(
      new ConflictError('POOL_ALREADY_ASSIGNED', 'Pool is already assigned or no longer available')
    );
  });

  it('throws ConflictError(VEHICLE_TOO_SMALL) on acceptPool when vehicle capacity is less than occupied seats', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 2,
      status: 'ONLINE',
    });
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue(null);
    mockDriverRepo.findPoolById.mockResolvedValue({
      id: 'pool-123',
      pickupLocationId: 1,
      capacity: 3,
      occupiedSeats: 3,
      status: 'OPEN',
      driverId: null,
      vehicleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(driverService.acceptPool(CAST.driver.id, 'pool-123')).rejects.toThrow(
      ConflictError
    );
  });

  it('successfully accepts pool, assigns driver and vehicle, sets status to MATCHED, and logs audit events', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'ONLINE',
    });
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue(null);
    const initialPool = {
      id: 'pool-123',
      pickupLocationId: 1,
      capacity: 3,
      occupiedSeats: 2,
      status: 'OPEN',
      driverId: null,
      vehicleId: null,
      createdAt: new Date('2026-09-27T10:00:00Z'),
      updatedAt: new Date('2026-09-27T10:00:00Z'),
    };
    mockDriverRepo.findPoolById.mockResolvedValue(initialPool);

    const updatedPool = {
      ...initialPool,
      driverId: CAST.driver.id,
      vehicleId: CAST.driver.vehicle.id,
      capacity: 3,
      status: 'MATCHED',
      updatedAt: new Date('2026-09-27T10:05:00Z'),
    };
    mockDriverRepo.assignDriverToPool.mockResolvedValue(updatedPool);
    mockDriverRepo.findActiveMembersByPoolId.mockResolvedValue([
      {
        id: 'ride-1',
        rideRequestId: 'req-1',
        passengerId: 'passenger-1',
      },
      {
        id: 'ride-2',
        rideRequestId: 'req-2',
        passengerId: 'passenger-2',
      },
    ]);

    const result = await driverService.acceptPool(CAST.driver.id, 'pool-123');

    expect(result.success).toBe(true);
    expect(result.pool.status).toBe('MATCHED');
    expect(result.pool.driverId).toBe(CAST.driver.id);
    expect(result.pool.vehicleId).toBe(CAST.driver.vehicle.id);
    expect(result.pool.capacity).toBe(3);

    expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'DRIVER_ACCEPTED',
        actorType: 'DRIVER',
        actorId: CAST.driver.id,
        poolId: 'pool-123',
        fromState: 'OPEN',
        toState: 'MATCHED',
      }),
      expect.anything()
    );

    expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'RIDE_MATCHED',
        actorType: 'SYSTEM',
        actorId: 'passenger-1',
        poolId: 'pool-123',
        passengerRideId: 'ride-1',
        rideRequestId: 'req-1',
        fromState: 'REQUESTED',
        toState: 'MATCHED',
      }),
      expect.anything()
    );

    expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'RIDE_MATCHED',
        actorType: 'SYSTEM',
        actorId: 'passenger-2',
        poolId: 'pool-123',
        passengerRideId: 'ride-2',
        rideRequestId: 'req-2',
        fromState: 'REQUESTED',
        toState: 'MATCHED',
      }),
      expect.anything()
    );
  });

  it('throws ConflictError(POOL_ALREADY_ASSIGNED) when atomic assignment returns null due to race condition', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'ONLINE',
    });
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue(null);
    mockDriverRepo.findPoolById.mockResolvedValue({
      id: 'pool-123',
      pickupLocationId: 1,
      capacity: 3,
      occupiedSeats: 2,
      status: 'OPEN',
      driverId: null,
      vehicleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDriverRepo.assignDriverToPool.mockResolvedValue(null);

    await expect(driverService.acceptPool(CAST.driver.id, 'pool-123')).rejects.toThrow(
      new ConflictError('POOL_ALREADY_ASSIGNED', 'Pool is already assigned or no longer available')
    );
  });

  it('translates database unique constraint violation on active pool to ConflictError(DRIVER_HAS_ACTIVE_POOL)', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'ONLINE',
    });
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue(null);
    mockDriverRepo.findPoolById.mockResolvedValue({
      id: 'pool-123',
      pickupLocationId: 1,
      capacity: 3,
      occupiedSeats: 2,
      status: 'OPEN',
      driverId: null,
      vehicleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const dbError = new Error('duplicate key value violates unique constraint "pools_driver_active_unique_idx"');
    (dbError as any).code = '23505';
    mockDriverRepo.assignDriverToPool.mockRejectedValue(dbError);

    await expect(driverService.acceptPool(CAST.driver.id, 'pool-123')).rejects.toThrow(
      new ConflictError('DRIVER_HAS_ACTIVE_POOL', 'Driver already has an active pool in progress')
    );
  });

  describe('getDriverPoolById', () => {
    it('throws NotFoundError if driver does not exist', async () => {
      mockDriverRepo.findDriverById.mockResolvedValue(null);

      await expect(driverService.getDriverPoolById('non-existent', 'pool-1')).rejects.toThrow(
        new NotFoundError('Driver profile not found')
      );
    });

    it('throws NotFoundError if pool does not exist or does not belong to driver', async () => {
      mockDriverRepo.findDriverById.mockResolvedValue({
        id: CAST.driver.id,
        name: CAST.driver.name,
        email: CAST.driver.email,
        role: 'DRIVER',
      });
      mockDriverRepo.findDriverPoolById.mockResolvedValue(null);

      await expect(driverService.getDriverPoolById(CAST.driver.id, 'pool-foreign')).rejects.toThrow(
        new NotFoundError('Pool not found')
      );
    });

    it('returns pool details with destination stops and roster', async () => {
      const now = new Date();
      mockDriverRepo.findDriverById.mockResolvedValue({
        id: CAST.driver.id,
        name: CAST.driver.name,
        email: CAST.driver.email,
        role: 'DRIVER',
      });
      mockDriverRepo.findDriverPoolById.mockResolvedValue({
        id: 'pool-1',
        pickupLocationId: 1,
        pickupLocationName: 'Gulshan 1 Circle',
        status: 'MATCHED',
        capacity: 3,
        occupiedSeats: 2,
        driverId: CAST.driver.id,
        vehicleId: CAST.driver.vehicle.id,
        createdAt: now,
        updatedAt: now,
      });
      mockDriverRepo.findActiveRosterForPool.mockResolvedValue([
        {
          id: 'ride-1',
          passengerId: 'p-1',
          passengerName: 'Nusrat Rahman',
          pickupLocationId: 1,
          pickupLocationName: 'Gulshan 1 Circle',
          destLocationId: 2,
          destLocationName: 'Banani 11',
          seats: 1,
          farePaisa: 12000,
          status: 'MATCHED',
          paymentMethod: 'CASH',
          paymentStatus: 'PENDING',
          createdAt: now,
        },
        {
          id: 'ride-2',
          passengerId: 'p-2',
          passengerName: 'Rafiqul Hasan',
          pickupLocationId: 1,
          pickupLocationName: 'Gulshan 1 Circle',
          destLocationId: 3,
          destLocationName: 'Airport Terminal 3',
          seats: 1,
          farePaisa: 24000,
          status: 'MATCHED',
          paymentMethod: 'TESLAPAY',
          paymentStatus: 'PENDING',
          createdAt: now,
        },
      ]);

      const result = await driverService.getDriverPoolById(CAST.driver.id, 'pool-1');

      expect(result.id).toBe('pool-1');
      expect(result.pickupLocationName).toBe('Gulshan 1 Circle');
      expect(result.status).toBe('MATCHED');
      expect(result.destinationStops).toEqual([
        { locationId: 2, locationName: 'Banani 11' },
        { locationId: 3, locationName: 'Airport Terminal 3' },
      ]);
      expect(result.roster).toHaveLength(2);
      expect(result.roster[0].passengerName).toBe('Nusrat Rahman');
      expect(result.roster[1].passengerName).toBe('Rafiqul Hasan');
    });
  });

  describe('Lifecycle Transitions', () => {
    const driverId = CAST.driver.id;
    const poolId = 'pool-lifecycle-1';

    beforeEach(() => {
      mockDriverRepo.findDriverById.mockResolvedValue({
        id: driverId,
        name: CAST.driver.name,
        email: CAST.driver.email,
        role: 'DRIVER',
      });
    });

    it('rejects lifecycle transition if driver does not exist', async () => {
      mockDriverRepo.findDriverById.mockResolvedValue(null);

      await expect(driverService.arrivePool('non-existent-driver', poolId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('rejects lifecycle transition if pool does not exist', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue(null);

      await expect(driverService.arrivePool(driverId, 'missing-pool')).rejects.toThrow(
        NotFoundError
      );
    });

    it('rejects lifecycle transition with ForbiddenError if calling driver is not pool owner', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue({
        id: poolId,
        driverId: 'another-driver-id',
        status: 'MATCHED',
      });

      await expect(driverService.arrivePool(driverId, poolId)).rejects.toThrow(ForbiddenError);
    });

    it('rejects lifecycle transition with ForbiddenError if pool has no assigned driver', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue({
        id: poolId,
        driverId: null,
        status: 'OPEN',
      });

      await expect(driverService.arrivePool(driverId, poolId)).rejects.toThrow(ForbiddenError);
    });

    it('successfully executes arrive transition on MATCHED pool and logs audit event', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue({
        id: poolId,
        driverId,
        status: 'MATCHED',
      });

      const response = await driverService.arrivePool(driverId, poolId);

      expect(response).toEqual({
        success: true,
        poolId,
        status: 'DRIVER_ARRIVED',
      });
      expect(mockDriverRepo.updatePoolStatus).toHaveBeenCalledWith(poolId, 'DRIVER_ARRIVED', expect.anything());
      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'DRIVER_ARRIVED',
          actorType: 'DRIVER',
          actorId: driverId,
          poolId,
          fromState: 'MATCHED',
          toState: 'DRIVER_ARRIVED',
          payload: {
            arrivedAt: expect.any(String),
          },
        },
        expect.anything()
      );
    });

    it('rejects arrive transition if pool is not in MATCHED state', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue({
        id: poolId,
        driverId,
        status: 'STARTED',
      });

      await expect(driverService.arrivePool(driverId, poolId)).rejects.toThrow(
        InvalidTransitionError
      );
    });

    it('successfully executes start transition on DRIVER_ARRIVED pool and logs audit events', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue({
        id: poolId,
        driverId,
        status: 'DRIVER_ARRIVED',
      });
      mockDriverRepo.findActiveMembersByPoolId.mockResolvedValue([
        {
          id: 'member-ride-1',
          rideRequestId: 'req-1',
          passengerId: 'p-1',
          farePaisa: 15000,
        },
      ]);

      const response = await driverService.startPool(driverId, poolId);

      expect(response).toEqual({
        success: true,
        poolId,
        status: 'STARTED',
      });
      expect(mockDriverRepo.updatePoolStatus).toHaveBeenCalledWith(poolId, 'STARTED', expect.anything());
      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'RIDE_STARTED',
          actorType: 'DRIVER',
          actorId: driverId,
          poolId,
          fromState: 'DRIVER_ARRIVED',
          toState: 'STARTED',
          payload: {
            startedAt: expect.any(String),
            memberCount: 1,
          },
        },
        expect.anything()
      );
      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'RIDE_STARTED',
          actorType: 'SYSTEM',
          actorId: 'p-1',
          poolId,
          passengerRideId: 'member-ride-1',
          rideRequestId: 'req-1',
          fromState: 'DRIVER_ARRIVED',
          toState: 'STARTED',
          payload: {
            farePaisa: 15000,
          },
        },
        expect.anything()
      );
    });

    it('successfully executes complete transition on STARTED pool', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue({
        id: poolId,
        driverId,
        status: 'STARTED',
      });

      const response = await driverService.completePool(driverId, poolId);

      expect(response).toEqual({
        success: true,
        poolId,
        status: 'COMPLETED',
      });
      expect(mockDriverRepo.updatePoolStatus).toHaveBeenCalledWith(poolId, 'COMPLETED');
    });

    it('rejects out-of-order transition (start when MATCHED) with InvalidTransitionError', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue({
        id: poolId,
        driverId,
        status: 'MATCHED',
      });

      await expect(driverService.startPool(driverId, poolId)).rejects.toThrow(
        InvalidTransitionError
      );
    });

    it('rejects start transition with ForbiddenError if calling driver is not pool owner', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue({
        id: poolId,
        driverId: 'another-driver',
        status: 'DRIVER_ARRIVED',
      });

      await expect(driverService.startPool(driverId, poolId)).rejects.toThrow(
        ForbiddenError
      );
    });

    it('rejects start transition if pool is already in STARTED state', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue({
        id: poolId,
        driverId,
        status: 'STARTED',
      });

      await expect(driverService.startPool(driverId, poolId)).rejects.toThrow(
        InvalidTransitionError
      );
    });

    it('rejects transition on terminal states (COMPLETED / CANCELLED)', async () => {
      mockDriverRepo.findPoolById.mockResolvedValue({
        id: poolId,
        driverId,
        status: 'COMPLETED',
      });

      await expect(driverService.completePool(driverId, poolId)).rejects.toThrow(
        InvalidTransitionError
      );
    });
  });
});



