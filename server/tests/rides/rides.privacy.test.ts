import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ride } from '../../src/modules/rides/domain/Ride.js';
import { RidesService } from '../../src/modules/rides/rides.service.js';
import type { RidesRepository, ActiveRideRecord } from '../../src/modules/rides/rides.repository.js';
import type { LocationsService } from '../../src/modules/locations/locations.service.js';
import { FareCalculator } from '../../src/modules/pools/domain/FareCalculator.js';
import type { PoolsService } from '../../src/modules/pools/pools.service.js';
import type { EventsService } from '../../src/modules/events/events.service.js';
import { NotFoundError } from '../../src/shared/errors/NotFoundError.js';

describe('Ride Domain Entity - Derived Status & Cancellability', () => {
  const baseRideProps = {
    id: 'ride-uuid-1',
    rideRequestId: 'req-uuid-1',
    passengerId: 'passenger-uuid-1',
    poolId: 'pool-uuid-1',
    seats: 1,
    farePaisa: 15000,
    cancelledAt: null,
    cancelReason: null,
    completedAt: null,
    createdAt: new Date('2026-09-26T10:00:00Z'),
    updatedAt: new Date('2026-09-26T10:00:00Z'),
  };

  it('derives REQUESTED status and is cancellable when pool is OPEN', () => {
    const ride = new Ride({ ...baseRideProps, poolStatus: 'OPEN' });
    expect(ride.status).toBe('REQUESTED');
    expect(ride.isCancellable).toBe(true);
  });

  it('derives MATCHED status and is cancellable when pool is MATCHED', () => {
    const ride = new Ride({ ...baseRideProps, poolStatus: 'MATCHED' });
    expect(ride.status).toBe('MATCHED');
    expect(ride.isCancellable).toBe(true);
  });

  it('derives DRIVER_ARRIVED status and is NOT cancellable when driver has arrived (ADR D10)', () => {
    const ride = new Ride({ ...baseRideProps, poolStatus: 'DRIVER_ARRIVED' });
    expect(ride.status).toBe('DRIVER_ARRIVED');
    expect(ride.isCancellable).toBe(false);
  });

  it('derives STARTED status and is NOT cancellable when ride has started', () => {
    const ride = new Ride({ ...baseRideProps, poolStatus: 'STARTED' });
    expect(ride.status).toBe('STARTED');
    expect(ride.isCancellable).toBe(false);
  });

  it('derives COMPLETED status and is NOT cancellable when ride is completed', () => {
    const ride = new Ride({ ...baseRideProps, poolStatus: 'COMPLETED' });
    expect(ride.status).toBe('COMPLETED');
    expect(ride.isCancellable).toBe(false);
  });

  it('derives CANCELLED status when pool status is CANCELLED', () => {
    const ride = new Ride({ ...baseRideProps, poolStatus: 'CANCELLED' });
    expect(ride.status).toBe('CANCELLED');
    expect(ride.isCancellable).toBe(false);
  });

  it('derives CANCELLED status immediately if passenger has cancelledAt set, regardless of pool status', () => {
    const cancelledRide1 = new Ride({
      ...baseRideProps,
      poolStatus: 'OPEN',
      cancelledAt: new Date('2026-09-26T10:05:00Z'),
      cancelReason: 'Changed mind',
    });
    expect(cancelledRide1.status).toBe('CANCELLED');
    expect(cancelledRide1.isCancellable).toBe(false);

    const cancelledRide2 = new Ride({
      ...baseRideProps,
      poolStatus: 'MATCHED',
      cancelledAt: new Date('2026-09-26T10:05:00Z'),
    });
    expect(cancelledRide2.status).toBe('CANCELLED');
    expect(cancelledRide2.isCancellable).toBe(false);

    const cancelledRide3 = new Ride({
      ...baseRideProps,
      poolStatus: 'STARTED',
      cancelledAt: new Date('2026-09-26T10:05:00Z'),
    });
    expect(cancelledRide3.status).toBe('CANCELLED');
    expect(cancelledRide3.isCancellable).toBe(false);
  });

  it('exposes all domain properties via getters', () => {
    const ride = new Ride({ ...baseRideProps, poolStatus: 'MATCHED' });
    expect(ride.id).toBe(baseRideProps.id);
    expect(ride.rideRequestId).toBe(baseRideProps.rideRequestId);
    expect(ride.passengerId).toBe(baseRideProps.passengerId);
    expect(ride.poolId).toBe(baseRideProps.poolId);
    expect(ride.seats).toBe(baseRideProps.seats);
    expect(ride.farePaisa).toBe(baseRideProps.farePaisa);
    expect(ride.cancelledAt).toBeNull();
    expect(ride.cancelReason).toBeNull();
    expect(ride.completedAt).toBeNull();
    expect(ride.createdAt).toBe(baseRideProps.createdAt);
    expect(ride.updatedAt).toBe(baseRideProps.updatedAt);
    expect(ride.poolStatus).toBe('MATCHED');
  });
});

describe('RidesService Privacy & Active Ride Queries', () => {
  let mockRidesRepo: {
    findActiveRideByPassengerId: ReturnType<typeof vi.fn>;
    findActiveRideDetailsByPassengerId: ReturnType<typeof vi.fn>;
    findRideDetailsById: ReturnType<typeof vi.fn>;
    createRideRequest: ReturnType<typeof vi.fn>;
    createPassengerRide: ReturnType<typeof vi.fn>;
    findCoPassengersByPoolId: ReturnType<typeof vi.fn>;
  };
  let mockLocationsService: {
    getDistance: ReturnType<typeof vi.fn>;
  };
  let fareCalculator: FareCalculator;
  let mockPoolsService: {
    joinPoolWithFallback: ReturnType<typeof vi.fn>;
    recalculatePoolFares: ReturnType<typeof vi.fn>;
  };
  let mockEventsService: {
    logRideEvent: ReturnType<typeof vi.fn>;
  };
  let mockDb: any;
  let ridesService: RidesService;

  const mockActiveRecord: ActiveRideRecord = {
    id: 'ride-uuid-nusrat',
    rideRequestId: 'req-uuid-nusrat',
    passengerId: 'passenger-uuid-nusrat',
    poolId: 'pool-uuid-1',
    seats: 1,
    farePaisa: 10714,
    cancelledAt: null,
    cancelReason: null,
    completedAt: null,
    createdAt: new Date('2026-09-26T10:00:00Z'),
    updatedAt: new Date('2026-09-26T10:02:00Z'),
    originalEstimateFarePaisa: 15000,
    paymentMethod: 'CASH',
    pickupLocation: {
      id: 2,
      name: 'Banani',
      lat: '23.792500',
      lng: '90.407800',
    },
    destLocation: {
      id: 4,
      name: 'Mohakhali',
      lat: '23.777600',
      lng: '90.399500',
    },
    pool: {
      id: 'pool-uuid-1',
      status: 'MATCHED',
      capacity: 3,
      occupiedSeats: 2,
    },
    driver: {
      name: 'Jashim Uddin',
    },
    vehicle: {
      name: 'Bullet',
      regNo: 'DHK-MET-1122',
      capacity: 3,
    },
  };

  beforeEach(() => {
    mockRidesRepo = {
      findActiveRideByPassengerId: vi.fn(),
      findActiveRideDetailsByPassengerId: vi.fn(),
      findRideDetailsById: vi.fn(),
      createRideRequest: vi.fn(),
      createPassengerRide: vi.fn(),
      findCoPassengersByPoolId: vi.fn().mockResolvedValue([
        { name: 'Rafiq Ahmed', destLocationName: 'Gulshan', seats: 1 },
      ]),
    };
    mockLocationsService = {
      getDistance: vi.fn(),
    };
    fareCalculator = new FareCalculator();
    mockPoolsService = {
      joinPoolWithFallback: vi.fn(),
      recalculatePoolFares: vi.fn(),
    };
    mockEventsService = {
      logRideEvent: vi.fn(),
    };
    mockDb = {
      transaction: vi.fn(),
    };

    ridesService = new RidesService(
      mockRidesRepo as unknown as RidesRepository,
      mockLocationsService as unknown as LocationsService,
      fareCalculator,
      mockPoolsService as unknown as PoolsService,
      mockEventsService as unknown as EventsService,
      mockDb
    );
  });

  describe('getActiveRide', () => {
    it('returns null if passenger has no active ride', async () => {
      mockRidesRepo.findActiveRideDetailsByPassengerId.mockResolvedValue(null);

      const result = await ridesService.getActiveRide('passenger-uuid-nusrat');

      expect(mockRidesRepo.findActiveRideDetailsByPassengerId).toHaveBeenCalledWith(
        'passenger-uuid-nusrat'
      );
      expect(result).toBeNull();
    });

    it('returns sanitized active ride details with co-passenger names and destinations (D16)', async () => {
      mockRidesRepo.findActiveRideDetailsByPassengerId.mockResolvedValue(mockActiveRecord);

      const result = await ridesService.getActiveRide('passenger-uuid-nusrat');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('ride-uuid-nusrat');
      expect(result!.passengerId).toBe('passenger-uuid-nusrat');
      expect(result!.status).toBe('MATCHED');
      expect(result!.isCancellable).toBe(true);
      expect(result!.farePaisa).toBe(10714);
      expect(result!.originalEstimateFarePaisa).toBe(15000);
      expect(result!.pickupLocation).toEqual({
        id: 2,
        name: 'Banani',
        lat: 23.7925,
        lng: 90.4078,
      });
      expect(result!.destLocation).toEqual({
        id: 4,
        name: 'Mohakhali',
        lat: 23.7776,
        lng: 90.3995,
      });
      expect(result!.pool).toEqual({
        id: 'pool-uuid-1',
        status: 'MATCHED',
        capacity: 3,
        occupiedSeats: 2,
        coPassengers: [
          { name: 'Rafiq Ahmed', destLocationName: 'Gulshan', seats: 1 },
        ],
        driver: { name: 'Jashim Uddin' },
        vehicle: {
          name: 'Bullet',
          regNo: 'DHK-MET-1122',
          capacity: 3,
        },
      });

      // D16 PRIVACY ASSERTIONS: co-passengers expose name + destination only.
      // Must NOT leak fares, passenger IDs, payment info, or full rosters at the top level.
      const rawResult = result as Record<string, unknown>;
      expect(rawResult).not.toHaveProperty('passengers');
      expect(rawResult).not.toHaveProperty('co_passengers');
      expect(rawResult).not.toHaveProperty('members');
      expect(rawResult).not.toHaveProperty('roster');
      expect(rawResult).not.toHaveProperty('otherPassengers');

      const poolObj = result!.pool as Record<string, unknown>;
      expect(poolObj).not.toHaveProperty('passengers');
      expect(poolObj).not.toHaveProperty('members');
      expect(poolObj).not.toHaveProperty('roster');

      // Verify co-passenger entries contain ONLY allowed fields (no fares, IDs, payment info)
      const coPassenger = result!.pool.coPassengers[0] as Record<string, unknown>;
      expect(Object.keys(coPassenger).sort()).toEqual(['destLocationName', 'name', 'seats']);
      expect(coPassenger).not.toHaveProperty('id');
      expect(coPassenger).not.toHaveProperty('passengerId');
      expect(coPassenger).not.toHaveProperty('farePaisa');
      expect(coPassenger).not.toHaveProperty('fare');
      expect(coPassenger).not.toHaveProperty('paymentMethod');
      expect(coPassenger).not.toHaveProperty('paymentStatus');
    });

    it('falls back to original estimate if passenger farePaisa is null', async () => {
      mockRidesRepo.findActiveRideDetailsByPassengerId.mockResolvedValue({
        ...mockActiveRecord,
        farePaisa: null,
      });

      const result = await ridesService.getActiveRide('passenger-uuid-nusrat');

      expect(result).not.toBeNull();
      expect(result!.farePaisa).toBe(15000);
    });

    it('handles pool without assigned driver or vehicle cleanly', async () => {
      mockRidesRepo.findActiveRideDetailsByPassengerId.mockResolvedValue({
        ...mockActiveRecord,
        pool: {
          id: 'pool-uuid-1',
          status: 'OPEN',
          capacity: 3,
          occupiedSeats: 1,
        },
        driver: null,
        vehicle: null,
      });

      const result = await ridesService.getActiveRide('passenger-uuid-nusrat');

      expect(result!.status).toBe('REQUESTED');
      expect(result!.isCancellable).toBe(true);
      expect(result!.pool.driver).toBeNull();
      expect(result!.pool.vehicle).toBeNull();
    });
    it('invokes findCoPassengersByPoolId with poolId and passengerId to exclude requester', async () => {
      mockRidesRepo.findActiveRideDetailsByPassengerId.mockResolvedValue(mockActiveRecord);
      mockRidesRepo.findCoPassengersByPoolId.mockResolvedValue([
        { name: 'Rafiq', destLocationName: 'Gulshan', seats: 1 },
        { name: 'Shirin', destLocationName: 'Mohakhali', seats: 1 },
      ]);

      const result = await ridesService.getActiveRide('passenger-uuid-nusrat');

      expect(mockRidesRepo.findCoPassengersByPoolId).toHaveBeenCalledWith(
        'pool-uuid-1',
        'passenger-uuid-nusrat'
      );
      expect(result!.pool.coPassengers).toEqual([
        { name: 'Rafiq', destLocationName: 'Gulshan', seats: 1 },
        { name: 'Shirin', destLocationName: 'Mohakhali', seats: 1 },
      ]);
    });
  });

  describe('getRideById', () => {
    it('returns ride details for the owner passenger including co-passengers', async () => {
      mockRidesRepo.findRideDetailsById.mockResolvedValue(mockActiveRecord);
      mockRidesRepo.findCoPassengersByPoolId.mockResolvedValue([
        { name: 'Rafiq', destLocationName: 'Gulshan', seats: 1 },
      ]);

      const result = await ridesService.getRideById('ride-uuid-nusrat', 'passenger-uuid-nusrat');

      expect(mockRidesRepo.findRideDetailsById).toHaveBeenCalledWith(
        'ride-uuid-nusrat',
        'passenger-uuid-nusrat'
      );
      expect(mockRidesRepo.findCoPassengersByPoolId).toHaveBeenCalledWith(
        'pool-uuid-1',
        'passenger-uuid-nusrat'
      );
      expect(result.id).toBe('ride-uuid-nusrat');
      expect(result.passengerId).toBe('passenger-uuid-nusrat');
      expect(result.pool.coPassengers).toEqual([
        { name: 'Rafiq', destLocationName: 'Gulshan', seats: 1 },
      ]);
    });

    it('throws NotFoundError when querying another passenger ride ID (preventing resource existence leaks)', async () => {
      // Query scoped by passengerId returns null when foreign ride ID is passed
      mockRidesRepo.findRideDetailsById.mockResolvedValue(null);

      await expect(
        ridesService.getRideById('foreign-ride-uuid', 'passenger-uuid-nusrat')
      ).rejects.toThrow(NotFoundError);

      await expect(
        ridesService.getRideById('foreign-ride-uuid', 'passenger-uuid-nusrat')
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'RIDE_NOT_FOUND',
        message: 'Ride not found',
      });
    });
  });
});
