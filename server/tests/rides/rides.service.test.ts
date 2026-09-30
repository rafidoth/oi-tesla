import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RidesService } from '../../src/modules/rides/rides.service.js';
import type { RidesRepository } from '../../src/modules/rides/rides.repository.js';
import type { LocationsService } from '../../src/modules/locations/locations.service.js';
import { FareCalculator } from '../../src/modules/pools/domain/FareCalculator.js';
import type { PoolsService } from '../../src/modules/pools/pools.service.js';
import type { EventsService } from '../../src/modules/events/events.service.js';
import { InvalidTransitionError } from '../../src/shared/errors/InvalidTransitionError.js';
import { ConflictError } from '../../src/shared/errors/ConflictError.js';
import { NotFoundError } from '../../src/shared/errors/NotFoundError.js';
import { ForbiddenError } from '../../src/shared/errors/ForbiddenError.js';

describe('RidesService Unit Tests', () => {
  let mockRidesRepo: {
    findActiveRideByPassengerId: ReturnType<typeof vi.fn>;
    createRideRequest: ReturnType<typeof vi.fn>;
    createPassengerRide: ReturnType<typeof vi.fn>;
    findRideForTeslaPaySettlement: ReturnType<typeof vi.fn>;
    markTeslaPayPaymentAsPaid: ReturnType<typeof vi.fn>;
    findPassengerRideHistory: ReturnType<typeof vi.fn>;
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
      findRideForTeslaPaySettlement: vi.fn(),
      markTeslaPayPaymentAsPaid: vi.fn(),
      findPassengerRideHistory: vi.fn(),
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
        soloFarePaisa: 7000,
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
        estimateFarePaisa: 7000,
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
        farePaisa: 7000,
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
          estimateFarePaisa: 7000,
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
          farePaisa: 7000,
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
            estimateFarePaisa: 7000,
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
        estimateFarePaisa: 7000,
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
        estimateFarePaisa: 7000,
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
        farePaisa: 7000,
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
            estimateFarePaisa: 7000,
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
        estimateFarePaisa: 7000,
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

  describe('payWithTeslaPay', () => {
    const passengerId = 'passenger-uuid-1';
    const rideId = 'ride-uuid-1';

    const validTeslaPayRideInfo = {
      passengerRideId: rideId,
      rideRequestId: 'request-uuid-1',
      passengerId,
      poolId: 'pool-uuid-1',
      completedAt: new Date('2026-09-28T08:00:00Z'),
      paymentId: 'pay-uuid-1',
      paymentMethod: 'TESLAPAY',
      paymentAmountPaisa: 15000,
      paymentStatus: 'PENDING',
      paymentPaidAt: null,
      paymentMarkedBy: null,
    };

    const paidPaymentRecord = {
      id: 'pay-uuid-1',
      passengerRideId: rideId,
      method: 'TESLAPAY',
      amountPaisa: 15000,
      status: 'PAID',
      paidAt: new Date('2026-09-28T08:05:00Z'),
      markedBy: passengerId,
      createdAt: new Date('2026-09-28T08:00:00Z'),
      updatedAt: new Date('2026-09-28T08:05:00Z'),
    };

    it('successfully settles pending TeslaPay payment and records audit event', async () => {
      mockRidesRepo.findRideForTeslaPaySettlement.mockResolvedValue({ ...validTeslaPayRideInfo });
      mockRidesRepo.markTeslaPayPaymentAsPaid.mockResolvedValue({ ...paidPaymentRecord });

      const result = await ridesService.payWithTeslaPay(rideId, passengerId);

      expect(result.success).toBe(true);
      expect(result.payment.status).toBe('PAID');
      expect(result.payment.markedBy).toBe(passengerId);
      expect(mockRidesRepo.markTeslaPayPaymentAsPaid).toHaveBeenCalledWith(
        'pay-uuid-1',
        passengerId,
        expect.any(Date),
        mockTx
      );
      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'PAYMENT_COMPLETED',
          actorType: 'PASSENGER',
          actorId: passengerId,
          poolId: 'pool-uuid-1',
          passengerRideId: rideId,
          rideRequestId: 'request-uuid-1',
          fromState: 'PENDING',
          toState: 'PAID',
          payload: expect.objectContaining({
            paymentId: 'pay-uuid-1',
            method: 'TESLAPAY',
            amountPaisa: 15000,
            markedBy: passengerId,
          }),
        }),
        mockTx
      );
    });

    it('throws NotFoundError when ride does not exist', async () => {
      mockRidesRepo.findRideForTeslaPaySettlement.mockResolvedValue(null);

      await expect(ridesService.payWithTeslaPay('non-existent-ride', passengerId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('throws ForbiddenError when caller is not the ride owner', async () => {
      mockRidesRepo.findRideForTeslaPaySettlement.mockResolvedValue({
        ...validTeslaPayRideInfo,
        passengerId: 'different-passenger',
      });

      await expect(ridesService.payWithTeslaPay(rideId, passengerId)).rejects.toThrow(
        ForbiddenError
      );
    });

    it('throws InvalidTransitionError when ride is not completed', async () => {
      mockRidesRepo.findRideForTeslaPaySettlement.mockResolvedValue({
        ...validTeslaPayRideInfo,
        completedAt: null,
      });

      await expect(ridesService.payWithTeslaPay(rideId, passengerId)).rejects.toThrow(
        InvalidTransitionError
      );
    });

    it('throws InvalidTransitionError when payment method is not TESLAPAY', async () => {
      mockRidesRepo.findRideForTeslaPaySettlement.mockResolvedValue({
        ...validTeslaPayRideInfo,
        paymentMethod: 'CASH',
      });

      await expect(ridesService.payWithTeslaPay(rideId, passengerId)).rejects.toThrow(
        InvalidTransitionError
      );
    });

    it('throws NotFoundError when payment record is missing', async () => {
      mockRidesRepo.findRideForTeslaPaySettlement.mockResolvedValue({
        ...validTeslaPayRideInfo,
        paymentId: null,
      });

      await expect(ridesService.payWithTeslaPay(rideId, passengerId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('throws ConflictError when payment is already paid', async () => {
      mockRidesRepo.findRideForTeslaPaySettlement.mockResolvedValue({
        ...validTeslaPayRideInfo,
        paymentStatus: 'PAID',
      });

      await expect(ridesService.payWithTeslaPay(rideId, passengerId)).rejects.toThrow(
        ConflictError
      );
    });

    it('throws InvalidTransitionError when payment status is not PENDING', async () => {
      mockRidesRepo.findRideForTeslaPaySettlement.mockResolvedValue({
        ...validTeslaPayRideInfo,
        paymentStatus: 'FAILED',
      });

      await expect(ridesService.payWithTeslaPay(rideId, passengerId)).rejects.toThrow(
        InvalidTransitionError
      );
    });

    it('throws ConflictError on concurrent update race condition', async () => {
      mockRidesRepo.findRideForTeslaPaySettlement.mockResolvedValue({ ...validTeslaPayRideInfo });
      mockRidesRepo.markTeslaPayPaymentAsPaid.mockResolvedValue(null);

      await expect(ridesService.payWithTeslaPay(rideId, passengerId)).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('getPassengerRideHistory', () => {
    const passengerId = 'passenger-uuid-1';
    const baseRecord = {
      id: 'ride-uuid-1',
      rideRequestId: 'req-uuid-1',
      passengerId,
      poolId: 'pool-uuid-1',
      seats: 2,
      farePaisa: 28000,
      cancelledAt: null,
      cancelReason: null,
      completedAt: new Date('2026-09-28T10:30:00Z'),
      createdAt: new Date('2026-09-28T10:00:00Z'),
      updatedAt: new Date('2026-09-28T10:30:00Z'),
      originalEstimateFarePaisa: 30000,
      paymentMethod: 'TESLAPAY',
      paymentStatus: 'PAID',
      pickupLocation: {
        id: 1,
        name: 'Airport Terminal 3',
        lat: '23.8500',
        lng: '90.4000',
      },
      destLocation: {
        id: 3,
        name: 'Gulshan 2 Circle',
        lat: '23.7900',
        lng: '90.4100',
      },
      driver: { name: 'Karim Ullah' },
      vehicle: { name: 'Tesla Model Y', regNo: 'DHA-LA-5544' },
    };

    it('maps completed ride history records correctly', async () => {
      mockRidesRepo.findPassengerRideHistory.mockResolvedValue([baseRecord]);

      const result = await ridesService.getPassengerRideHistory(passengerId, {
        status: 'COMPLETED',
      });

      expect(mockRidesRepo.findPassengerRideHistory).toHaveBeenCalledWith(passengerId, {
        status: 'COMPLETED',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'ride-uuid-1',
        rideRequestId: 'req-uuid-1',
        poolId: 'pool-uuid-1',
        status: 'COMPLETED',
        seats: 2,
        farePaisa: 28000,
        paymentMethod: 'TESLAPAY',
        paymentStatus: 'PAID',
        pickupLocation: {
          id: 1,
          name: 'Airport Terminal 3',
          lat: 23.85,
          lng: 90.4,
        },
        destLocation: {
          id: 3,
          name: 'Gulshan 2 Circle',
          lat: 23.79,
          lng: 90.41,
        },
        driver: { name: 'Karim Ullah' },
        vehicle: { name: 'Tesla Model Y', regNo: 'DHA-LA-5544' },
        createdAt: '2026-09-28T10:00:00.000Z',
        completedAt: '2026-09-28T10:30:00.000Z',
        cancelledAt: null,
        cancelReason: null,
      });
    });

    it('derives CANCELLED status and falls back to estimate fare when farePaisa is null', async () => {
      const cancelledRecord = {
        ...baseRecord,
        id: 'ride-uuid-2',
        farePaisa: null,
        completedAt: null,
        cancelledAt: new Date('2026-09-28T10:05:00Z'),
        cancelReason: 'Driver took too long',
        paymentStatus: null,
        driver: null,
        vehicle: null,
      };
      mockRidesRepo.findPassengerRideHistory.mockResolvedValue([cancelledRecord]);

      const result = await ridesService.getPassengerRideHistory(passengerId);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('CANCELLED');
      expect(result[0].farePaisa).toBe(30000);
      expect(result[0].cancelledAt).toBe('2026-09-28T10:05:00.000Z');
      expect(result[0].cancelReason).toBe('Driver took too long');
      expect(result[0].completedAt).toBeNull();
      expect(result[0].paymentStatus).toBeNull();
      expect(result[0].driver).toBeNull();
      expect(result[0].vehicle).toBeNull();
    });

    it('returns empty array when passenger has no history', async () => {
      mockRidesRepo.findPassengerRideHistory.mockResolvedValue([]);

      const result = await ridesService.getPassengerRideHistory(passengerId);

      expect(result).toEqual([]);
    });
  });
});
