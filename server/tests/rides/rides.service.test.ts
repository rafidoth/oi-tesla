import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RidesService } from '../../src/modules/rides/rides.service.js';
import type { RidesRepository } from '../../src/modules/rides/rides.repository.js';
import type { LocationsService } from '../../src/modules/locations/locations.service.js';
import { FareCalculator } from '../../src/modules/pools/domain/FareCalculator.js';
import type { PoolsService } from '../../src/modules/pools/pools.service.js';
import type { EventsService } from '../../src/modules/events/events.service.js';
import { InvalidTransitionError } from '../../src/shared/errors/InvalidTransitionError.js';
import { ConflictError } from '../../src/shared/errors/ConflictError.js';

describe('RidesService Unit Tests', () => {
  let mockRidesRepo: {
    findActiveRideByPassengerId: ReturnType<typeof vi.fn>;
    createRideRequest: ReturnType<typeof vi.fn>;
    createPassengerRide: ReturnType<typeof vi.fn>;
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
  let mockTx: Record<string, unknown>;
  let mockDb: {
    transaction: ReturnType<typeof vi.fn>;
  };
  let ridesService: RidesService;

  beforeEach(() => {
    mockRidesRepo = {
      findActiveRideByPassengerId: vi.fn(),
      createRideRequest: vi.fn(),
      createPassengerRide: vi.fn(),
    };
    mockLocationsService = {
      getDistance: vi.fn(),
    };
    fareCalculator = new FareCalculator();
    mockPoolsService = {
      joinPoolWithFallback: vi.fn(),
      recalculatePoolFares: vi.fn().mockResolvedValue(new Map()),
    };
    mockEventsService = {
      logRideEvent: vi.fn(),
    };
    mockTx = { id: 'mock-tx' };
    mockDb = {
      transaction: vi.fn(async (callback) => callback(mockTx)),
    };

    ridesService = new RidesService(
      mockRidesRepo as unknown as RidesRepository,
      mockLocationsService as unknown as LocationsService,
      fareCalculator,
      mockPoolsService as unknown as PoolsService,
      mockEventsService as unknown as EventsService,
      mockDb as any
    );
  });

  describe('calculateEstimate', () => {
    it('returns valid estimate response for served route', async () => {
      mockLocationsService.getDistance.mockResolvedValue(5000);

      const result = await ridesService.calculateEstimate({
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
      });

      expect(mockLocationsService.getDistance).toHaveBeenCalledWith(2, 4);
      expect(result).toEqual({
        pickupLocationId: 2,
        destLocationId: 4,
        distanceM: 5000,
        seats: 1,
        soloFarePaisa: 15000,
        currency: 'BDT',
      });
    });

    it('propagates ROUTE_NOT_SERVED error when route is not served', async () => {
      mockLocationsService.getDistance.mockRejectedValue(
        new InvalidTransitionError('ROUTE_NOT_SERVED', 'The requested route is not served')
      );

      await expect(
        ridesService.calculateEstimate({
          pickupLocationId: 4,
          destLocationId: 2,
          seats: 1,
        })
      ).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe('requestRide', () => {
    const passengerId = 'passenger-uuid-1';
    const input = {
      pickupLocationId: 2,
      destLocationId: 4,
      seats: 1,
      paymentMethod: 'CASH' as const,
    };

    it('successfully books into a new pool when isNew: true', async () => {
      mockRidesRepo.findActiveRideByPassengerId.mockResolvedValue(null);
      mockLocationsService.getDistance.mockResolvedValue(5000);
      mockRidesRepo.createRideRequest.mockResolvedValue({
        id: 'request-uuid-1',
        passengerId,
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
        paymentMethod: 'CASH',
        estimateFarePaisa: 15000,
      });
      mockPoolsService.joinPoolWithFallback.mockResolvedValue({
        poolId: 'pool-uuid-1',
        isNew: true,
      });
      mockRidesRepo.createPassengerRide.mockResolvedValue({
        id: 'ride-uuid-1',
        rideRequestId: 'request-uuid-1',
        passengerId,
        poolId: 'pool-uuid-1',
        seats: 1,
        farePaisa: 15000,
      });
      mockEventsService.logRideEvent.mockResolvedValue({} as any);

      const result = await ridesService.requestRide(passengerId, input);

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockRidesRepo.findActiveRideByPassengerId).toHaveBeenCalledWith(passengerId, mockTx);
      expect(mockLocationsService.getDistance).toHaveBeenCalledWith(2, 4);
      expect(mockRidesRepo.createRideRequest).toHaveBeenCalledWith(
        {
          passengerId,
          pickupLocationId: 2,
          destLocationId: 4,
          seats: 1,
          paymentMethod: 'CASH',
          estimateFarePaisa: 15000,
        },
        mockTx
      );
      expect(mockPoolsService.joinPoolWithFallback).toHaveBeenCalledWith(
        {
          pickupLocationId: 2,
          destLocationId: 4,
          seats: 1,
        },
        mockTx
      );
      expect(mockRidesRepo.createPassengerRide).toHaveBeenCalledWith(
        {
          rideRequestId: 'request-uuid-1',
          passengerId,
          poolId: 'pool-uuid-1',
          seats: 1,
          farePaisa: 15000,
        },
        mockTx
      );
      expect(mockPoolsService.recalculatePoolFares).toHaveBeenCalledWith('pool-uuid-1', mockTx);

      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'REQUEST_CREATED',
          actorType: 'PASSENGER',
          actorId: passengerId,
          rideRequestId: 'request-uuid-1',
          toState: 'REQUESTED',
          payload: {
            seats: 1,
            pickupLocationId: 2,
            destLocationId: 4,
            estimateFarePaisa: 15000,
          },
        },
        mockTx
      );
      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'POOL_CREATED',
          actorType: 'SYSTEM',
          poolId: 'pool-uuid-1',
          toState: 'OPEN',
          payload: {
            capacity: 3,
            pickupLocationId: 2,
          },
        },
        mockTx
      );

      expect(result).toEqual({
        rideId: 'ride-uuid-1',
        rideRequestId: 'request-uuid-1',
        poolId: 'pool-uuid-1',
        status: 'OPEN',
        seats: 1,
        estimateFarePaisa: 15000,
        paymentMethod: 'CASH',
        isNewPool: true,
      });
    });

    it('successfully books into an existing pool when isNew: false', async () => {
      mockRidesRepo.findActiveRideByPassengerId.mockResolvedValue(null);
      mockLocationsService.getDistance.mockResolvedValue(5000);
      mockRidesRepo.createRideRequest.mockResolvedValue({
        id: 'request-uuid-2',
        passengerId,
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
        paymentMethod: 'CASH',
        estimateFarePaisa: 15000,
      });
      mockPoolsService.joinPoolWithFallback.mockResolvedValue({
        poolId: 'pool-uuid-existing',
        isNew: false,
      });
      mockRidesRepo.createPassengerRide.mockResolvedValue({
        id: 'ride-uuid-2',
        rideRequestId: 'request-uuid-2',
        passengerId,
        poolId: 'pool-uuid-existing',
        seats: 1,
        farePaisa: 15000,
      });
      mockEventsService.logRideEvent.mockResolvedValue({} as any);

      const result = await ridesService.requestRide(passengerId, input);

      expect(mockPoolsService.recalculatePoolFares).toHaveBeenCalledWith('pool-uuid-existing', mockTx);

      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'REQUEST_CREATED',
          actorType: 'PASSENGER',
          actorId: passengerId,
          rideRequestId: 'request-uuid-2',
          toState: 'REQUESTED',
          payload: {
            seats: 1,
            pickupLocationId: 2,
            destLocationId: 4,
            estimateFarePaisa: 15000,
          },
        },
        mockTx
      );
      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'RIDE_MATCHED',
          actorType: 'SYSTEM',
          poolId: 'pool-uuid-existing',
          passengerRideId: 'ride-uuid-2',
          toState: 'MATCHED',
        },
        mockTx
      );

      expect(result).toEqual({
        rideId: 'ride-uuid-2',
        rideRequestId: 'request-uuid-2',
        poolId: 'pool-uuid-existing',
        status: 'MATCHED',
        seats: 1,
        estimateFarePaisa: 15000,
        paymentMethod: 'CASH',
        isNewPool: false,
      });
    });

    it('throws 409 ConflictError(ACTIVE_RIDE_EXISTS) if passenger has an active ride', async () => {
      mockRidesRepo.findActiveRideByPassengerId.mockResolvedValue({
        id: 'existing-ride-id',
        poolId: 'existing-pool-id',
        status: 'OPEN',
      });

      await expect(ridesService.requestRide(passengerId, input)).rejects.toThrow(ConflictError);

      try {
        await ridesService.requestRide(passengerId, input);
      } catch (err) {
        expect(err).toBeInstanceOf(ConflictError);
        const conflictErr = err as ConflictError;
        expect(conflictErr.statusCode).toBe(409);
        expect(conflictErr.code).toBe('ACTIVE_RIDE_EXISTS');
        expect(conflictErr.message).toBe('Passenger already has an active ride');
      }

      expect(mockLocationsService.getDistance).not.toHaveBeenCalled();
      expect(mockPoolsService.joinPoolWithFallback).not.toHaveBeenCalled();
      expect(mockRidesRepo.createRideRequest).not.toHaveBeenCalled();
    });

    it('throws 422 InvalidTransitionError(ROUTE_NOT_SERVED) when route is not served', async () => {
      mockRidesRepo.findActiveRideByPassengerId.mockResolvedValue(null);
      mockLocationsService.getDistance.mockRejectedValue(
        new InvalidTransitionError('ROUTE_NOT_SERVED', 'The requested route is not served')
      );

      await expect(ridesService.requestRide(passengerId, input)).rejects.toThrow(
        InvalidTransitionError
      );

      try {
        await ridesService.requestRide(passengerId, input);
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidTransitionError);
        const transErr = err as InvalidTransitionError;
        expect(transErr.statusCode).toBe(422);
        expect(transErr.code).toBe('ROUTE_NOT_SERVED');
      }

      expect(mockPoolsService.joinPoolWithFallback).not.toHaveBeenCalled();
      expect(mockRidesRepo.createRideRequest).not.toHaveBeenCalled();
    });
  });
});
