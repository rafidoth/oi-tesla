import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RidesService } from '../../src/modules/rides/rides.service.js';
import type { RidesRepository } from '../../src/modules/rides/rides.repository.js';
import type { PoolsRepository } from '../../src/modules/pools/pools.repository.js';
import type { LocationsService } from '../../src/modules/locations/locations.service.js';
import { FareCalculator } from '../../src/modules/pools/domain/FareCalculator.js';
import type { PoolsService } from '../../src/modules/pools/pools.service.js';
import type { EventsService } from '../../src/modules/events/events.service.js';
import { InvalidTransitionError } from '../../src/shared/errors/InvalidTransitionError.js';
import { NotFoundError } from '../../src/shared/errors/NotFoundError.js';

describe('RidesService - cancelRide Unit Tests', () => {
  let mockRidesRepo: {
    findRideForCancellation: ReturnType<typeof vi.fn>;
    markRideCancelled: ReturnType<typeof vi.fn>;
    countActivePoolMembers: ReturnType<typeof vi.fn>;
  };
  let mockPoolsRepo: {
    decrementSeatsGuarded: ReturnType<typeof vi.fn>;
    updatePoolStatus: ReturnType<typeof vi.fn>;
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
      findRideForCancellation: vi.fn(),
      markRideCancelled: vi.fn(),
      countActivePoolMembers: vi.fn(),
    };
    mockPoolsRepo = {
      decrementSeatsGuarded: vi.fn().mockResolvedValue(true),
      updatePoolStatus: vi.fn().mockResolvedValue(undefined),
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
      logRideEvent: vi.fn().mockResolvedValue({} as any),
    };
    mockTx = { id: 'mock-cancellation-tx' };
    mockDb = {
      transaction: vi.fn(async (callback) => callback(mockTx)),
    };

    ridesService = new RidesService(
      mockRidesRepo as unknown as RidesRepository,
      mockLocationsService as unknown as LocationsService,
      fareCalculator,
      mockPoolsService as unknown as PoolsService,
      mockEventsService as unknown as EventsService,
      mockDb as any,
      mockPoolsRepo as unknown as PoolsRepository
    );
  });

  describe('Solo rider cancellation in OPEN pool (last member out)', () => {
    it('successfully cancels ride, decrements seats, soft-cancels pool, and logs POOL_CANCELLED and RIDE_CANCELLED', async () => {
      const rideId = 'ride-solo-1';
      const passengerId = 'passenger-1';
      const poolId = 'pool-1';

      mockRidesRepo.findRideForCancellation.mockResolvedValue({
        id: rideId,
        passengerId,
        poolId,
        seats: 1,
        cancelledAt: null,
        poolStatus: 'OPEN',
      });
      mockRidesRepo.countActivePoolMembers.mockResolvedValue(0);

      const result = await ridesService.cancelRide(rideId, passengerId, {
        reason: 'Change of travel plans',
      });

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockRidesRepo.findRideForCancellation).toHaveBeenCalledWith(rideId, passengerId, mockTx);
      expect(mockRidesRepo.markRideCancelled).toHaveBeenCalledWith(
        rideId,
        'Change of travel plans',
        mockTx
      );
      expect(mockPoolsRepo.decrementSeatsGuarded).toHaveBeenCalledWith(poolId, 1, mockTx);
      expect(mockRidesRepo.countActivePoolMembers).toHaveBeenCalledWith(poolId, mockTx);

      // Last member out: soft-cancel pool & POOL_CANCELLED event
      expect(mockPoolsRepo.updatePoolStatus).toHaveBeenCalledWith(poolId, 'CANCELLED', mockTx);
      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'POOL_CANCELLED',
          actorType: 'PASSENGER',
          actorId: passengerId,
          poolId,
          toState: 'CANCELLED',
          payload: { reason: 'Change of travel plans', lastMemberRideId: rideId },
        },
        mockTx
      );

      // Remaining member fare recalculation should NOT be called since pool is empty
      expect(mockPoolsService.recalculatePoolFares).not.toHaveBeenCalled();

      // Audit event for ride cancellation
      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'RIDE_CANCELLED',
          actorType: 'PASSENGER',
          actorId: passengerId,
          passengerRideId: rideId,
          poolId,
          toState: 'CANCELLED',
          payload: { reason: 'Change of travel plans', seatsReleased: 1 },
        },
        mockTx
      );

      expect(result).toEqual({
        rideId,
        status: 'CANCELLED',
        cancelledAt: expect.any(Date),
        cancelReason: 'Change of travel plans',
        seatsReleased: 1,
        poolRemainingMembers: 0,
        poolStatus: 'CANCELLED',
      });
    });

    it('works without optional reason supplied', async () => {
      const rideId = 'ride-solo-2';
      const passengerId = 'passenger-2';
      const poolId = 'pool-2';

      mockRidesRepo.findRideForCancellation.mockResolvedValue({
        id: rideId,
        passengerId,
        poolId,
        seats: 2,
        cancelledAt: null,
        poolStatus: 'OPEN',
      });
      mockRidesRepo.countActivePoolMembers.mockResolvedValue(0);

      const result = await ridesService.cancelRide(rideId, passengerId);

      expect(mockRidesRepo.markRideCancelled).toHaveBeenCalledWith(rideId, undefined, mockTx);
      expect(mockPoolsRepo.decrementSeatsGuarded).toHaveBeenCalledWith(poolId, 2, mockTx);
      expect(result.cancelReason).toBeNull();
      expect(result.seatsReleased).toBe(2);
      expect(result.poolRemainingMembers).toBe(0);
      expect(result.poolStatus).toBe('CANCELLED');
    });
  });

  describe('Multi-rider cancellation in MATCHED pool', () => {
    it('successfully cancels ride, decrements seats, keeps pool MATCHED, and recalculates remaining member fares', async () => {
      const rideId = 'ride-member-2';
      const passengerId = 'passenger-shirin';
      const poolId = 'pool-matched-1';

      mockRidesRepo.findRideForCancellation.mockResolvedValue({
        id: rideId,
        passengerId,
        poolId,
        seats: 1,
        cancelledAt: null,
        poolStatus: 'MATCHED',
      });
      // 2 remaining active members (e.g. Nusrat and Rafiq)
      mockRidesRepo.countActivePoolMembers.mockResolvedValue(2);

      const result = await ridesService.cancelRide(rideId, passengerId, {
        reason: 'Driver is taking too long',
      });

      expect(mockRidesRepo.markRideCancelled).toHaveBeenCalledWith(
        rideId,
        'Driver is taking too long',
        mockTx
      );
      expect(mockPoolsRepo.decrementSeatsGuarded).toHaveBeenCalledWith(poolId, 1, mockTx);
      expect(mockRidesRepo.countActivePoolMembers).toHaveBeenCalledWith(poolId, mockTx);

      // Pool should NOT be cancelled
      expect(mockPoolsRepo.updatePoolStatus).not.toHaveBeenCalled();

      // Remaining member fares MUST be recalculated
      expect(mockPoolsService.recalculatePoolFares).toHaveBeenCalledWith(poolId, mockTx);

      // Audit event for ride cancellation
      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'RIDE_CANCELLED',
          actorType: 'PASSENGER',
          actorId: passengerId,
          passengerRideId: rideId,
          poolId,
          toState: 'CANCELLED',
          payload: { reason: 'Driver is taking too long', seatsReleased: 1 },
        },
        mockTx
      );

      // POOL_CANCELLED should NOT be logged
      expect(mockEventsService.logRideEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ event: 'POOL_CANCELLED' }),
        expect.anything()
      );

      expect(result).toEqual({
        rideId,
        status: 'CANCELLED',
        cancelledAt: expect.any(Date),
        cancelReason: 'Driver is taking too long',
        seatsReleased: 1,
        poolRemainingMembers: 2,
        poolStatus: 'MATCHED',
      });
    });
  });

  describe('Rejection rules (pre-driver arrival guard & existence)', () => {
    it.each(['DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED'])(
      'rejects cancellation when pool status is %s with 422 CANCEL_NOT_PERMITTED',
      async (poolStatus) => {
        const rideId = 'ride-non-cancellable';
        const passengerId = 'passenger-1';

        mockRidesRepo.findRideForCancellation.mockResolvedValue({
          id: rideId,
          passengerId,
          poolId: 'pool-active',
          seats: 1,
          cancelledAt: null,
          poolStatus,
        });

        await expect(ridesService.cancelRide(rideId, passengerId)).rejects.toThrow(
          InvalidTransitionError
        );

        try {
          await ridesService.cancelRide(rideId, passengerId);
        } catch (err) {
          expect(err).toBeInstanceOf(InvalidTransitionError);
          const error = err as InvalidTransitionError;
          expect(error.statusCode).toBe(422);
          expect(error.code).toBe('CANCEL_NOT_PERMITTED');
          expect(error.message).toBe('Ride cannot be cancelled after driver has arrived');
        }

        expect(mockRidesRepo.markRideCancelled).not.toHaveBeenCalled();
        expect(mockPoolsRepo.decrementSeatsGuarded).not.toHaveBeenCalled();
      }
    );

    it('rejects cancellation when ride is already cancelled with 422 CANCEL_NOT_PERMITTED', async () => {
      const rideId = 'ride-already-cancelled';
      const passengerId = 'passenger-1';

      mockRidesRepo.findRideForCancellation.mockResolvedValue({
        id: rideId,
        passengerId,
        poolId: 'pool-open',
        seats: 1,
        cancelledAt: new Date('2026-09-26T12:00:00Z'),
        poolStatus: 'OPEN',
      });

      await expect(ridesService.cancelRide(rideId, passengerId)).rejects.toThrow(
        InvalidTransitionError
      );

      try {
        await ridesService.cancelRide(rideId, passengerId);
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidTransitionError);
        const error = err as InvalidTransitionError;
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe('CANCEL_NOT_PERMITTED');
        expect(error.message).toBe('Ride is already cancelled');
      }

      expect(mockRidesRepo.markRideCancelled).not.toHaveBeenCalled();
      expect(mockPoolsRepo.decrementSeatsGuarded).not.toHaveBeenCalled();
    });

    it('rejects cancellation when ride does not exist or belongs to another passenger with 404 RIDE_NOT_FOUND', async () => {
      const rideId = 'ride-unknown';
      const passengerId = 'passenger-1';

      mockRidesRepo.findRideForCancellation.mockResolvedValue(null);

      await expect(ridesService.cancelRide(rideId, passengerId)).rejects.toThrow(NotFoundError);

      try {
        await ridesService.cancelRide(rideId, passengerId);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundError);
        const error = err as NotFoundError;
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('RIDE_NOT_FOUND');
        expect(error.message).toBe('Ride not found');
      }

      expect(mockRidesRepo.markRideCancelled).not.toHaveBeenCalled();
      expect(mockPoolsRepo.decrementSeatsGuarded).not.toHaveBeenCalled();
    });
  });
});
