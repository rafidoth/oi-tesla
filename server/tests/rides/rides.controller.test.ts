import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { RidesController } from '../../src/modules/rides/rides.controller.js';
import type { RidesService } from '../../src/modules/rides/rides.service.js';
import type { EstimateResponseDto } from '../../src/modules/rides/rides.types.js';

describe('RidesController Unit Tests', () => {
  let mockRidesService: Partial<RidesService>;
  let controller: RidesController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockRidesService = {
      calculateEstimate: vi.fn(),
    };
    controller = new RidesController(mockRidesService as RidesService);
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it('responds with 200 and estimate data', async () => {
    const mockEstimate: EstimateResponseDto = {
      pickupLocationId: 2,
      destLocationId: 4,
      distanceM: 5000,
      seats: 1,
      soloFarePaisa: 15000,
      currency: 'BDT',
    };
    vi.mocked(mockRidesService.calculateEstimate!).mockResolvedValue(mockEstimate);

    req = {
      body: {
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
      },
    };

    await controller.calculateEstimate(req as Request, res as Response, next);

    expect(mockRidesService.calculateEstimate).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockEstimate);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next(err) if ridesService throws an error', async () => {
    const error = new Error('Service failure');
    vi.mocked(mockRidesService.calculateEstimate!).mockRejectedValue(error);

    req = {
      body: {
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
      },
    };

    await controller.calculateEstimate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  describe('requestRide', () => {
    it('responds with 201 and ride booking snapshot', async () => {
      mockRidesService.requestRide = vi.fn();
      const mockResult = {
        rideId: 'ride-uuid-1',
        rideRequestId: 'request-uuid-1',
        poolId: 'pool-uuid-1',
        status: 'OPEN',
        seats: 1,
        estimateFarePaisa: 15000,
        paymentMethod: 'CASH',
        isNewPool: true,
      };
      vi.mocked(mockRidesService.requestRide).mockResolvedValue(mockResult);

      const authReq: any = {
        user: {
          id: 'user-uuid-1',
          sub: 'user-uuid-1',
          email: 'passenger@example.com',
          role: 'PASSENGER',
        },
        body: {
          pickupLocationId: 2,
          destLocationId: 4,
          seats: 1,
          paymentMethod: 'CASH',
        },
      };

      await controller.requestRide(authReq, res as Response, next);

      expect(mockRidesService.requestRide).toHaveBeenCalledWith('user-uuid-1', authReq.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next(err) if user is unauthenticated', async () => {
      const unauthReq: any = {
        body: {
          pickupLocationId: 2,
          destLocationId: 4,
          seats: 1,
          paymentMethod: 'CASH',
        },
      };

      await controller.requestRide(unauthReq, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('calls next(err) if ridesService.requestRide throws an error', async () => {
      mockRidesService.requestRide = vi.fn();
      const error = new Error('Booking failed');
      vi.mocked(mockRidesService.requestRide).mockRejectedValue(error);

      const authReq: any = {
        user: {
          id: 'user-uuid-1',
          sub: 'user-uuid-1',
          email: 'passenger@example.com',
          role: 'PASSENGER',
        },
        body: {
          pickupLocationId: 2,
          destLocationId: 4,
          seats: 1,
          paymentMethod: 'CASH',
        },
      };

      await controller.requestRide(authReq, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getActiveRide', () => {
    it('responds with 200 and active ride data', async () => {
      const mockActiveRide: any = {
        id: 'ride-1',
        passengerId: 'user-uuid-1',
        status: 'REQUESTED',
        seats: 1,
      };
      mockRidesService.getActiveRide = vi.fn().mockResolvedValue(mockActiveRide);

      const authReq: any = {
        user: { sub: 'user-uuid-1', role: 'PASSENGER' },
      };

      await controller.getActiveRide(authReq, res as Response, next);

      expect(mockRidesService.getActiveRide).toHaveBeenCalledWith('user-uuid-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockActiveRide);
      expect(next).not.toHaveBeenCalled();
    });

    it('responds with 200 and null if no active ride exists', async () => {
      mockRidesService.getActiveRide = vi.fn().mockResolvedValue(null);

      const authReq: any = {
        user: { sub: 'user-uuid-1', role: 'PASSENGER' },
      };

      await controller.getActiveRide(authReq, res as Response, next);

      expect(mockRidesService.getActiveRide).toHaveBeenCalledWith('user-uuid-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(null);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next(err) if unauthenticated', async () => {
      const unauthReq: any = {};
      await controller.getActiveRide(unauthReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getRideById', () => {
    it('responds with 200 and ride details', async () => {
      const mockRide: any = {
        id: 'ride-1',
        passengerId: 'user-uuid-1',
        status: 'MATCHED',
      };
      mockRidesService.getRideById = vi.fn().mockResolvedValue(mockRide);

      const authReq: any = {
        params: { id: 'ride-1' },
        user: { sub: 'user-uuid-1', role: 'PASSENGER' },
      };

      await controller.getRideById(authReq, res as Response, next);

      expect(mockRidesService.getRideById).toHaveBeenCalledWith('ride-1', 'user-uuid-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRide);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next(err) if unauthenticated', async () => {
      const unauthReq: any = { params: { id: 'ride-1' } };
      await controller.getRideById(unauthReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('cancelRide', () => {
    it('responds with 200 and CancelRideResponseDto', async () => {
      const mockResult: any = {
        rideId: 'ride-1',
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Traffic',
        seatsReleased: 1,
        poolRemainingMembers: 0,
        poolStatus: 'CANCELLED',
      };
      mockRidesService.cancelRide = vi.fn().mockResolvedValue(mockResult);

      const authReq: any = {
        params: { id: 'ride-1' },
        user: { sub: 'user-uuid-1', role: 'PASSENGER' },
        body: { reason: 'Traffic' },
      };

      await controller.cancelRide(authReq, res as Response, next);

      expect(mockRidesService.cancelRide).toHaveBeenCalledWith('ride-1', 'user-uuid-1', {
        reason: 'Traffic',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next(err) if unauthenticated', async () => {
      const unauthReq: any = { params: { id: 'ride-1' }, body: {} };
      await controller.cancelRide(unauthReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('calls next(err) if cancelRide throws', async () => {
      const error = new Error('Cancellation rejected');
      mockRidesService.cancelRide = vi.fn().mockRejectedValue(error);

      const authReq: any = {
        params: { id: 'ride-1' },
        user: { sub: 'user-uuid-1', role: 'PASSENGER' },
        body: {},
      };

      await controller.cancelRide(authReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('payRide', () => {
    it('responds with 200 and payment details', async () => {
      const mockResult: any = {
        success: true,
        payment: {
          id: 'pay-1',
          passengerRideId: 'ride-1',
          method: 'TESLAPAY',
          amountPaisa: 15000,
          status: 'PAID',
          paidAt: new Date(),
          markedBy: 'user-uuid-1',
        },
      };
      mockRidesService.payWithTeslaPay = vi.fn().mockResolvedValue(mockResult);

      const authReq: any = {
        params: { id: 'ride-1' },
        user: { sub: 'user-uuid-1', role: 'PASSENGER' },
      };

      await controller.payRide(authReq, res as Response, next);

      expect(mockRidesService.payWithTeslaPay).toHaveBeenCalledWith('ride-1', 'user-uuid-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next(err) if unauthenticated', async () => {
      const unauthReq: any = { params: { id: 'ride-1' } };
      await controller.payRide(unauthReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('calls next(err) if payWithTeslaPay throws', async () => {
      const error = new Error('Payment rejected');
      mockRidesService.payWithTeslaPay = vi.fn().mockRejectedValue(error);

      const authReq: any = {
        params: { id: 'ride-1' },
        user: { sub: 'user-uuid-1', role: 'PASSENGER' },
      };

      await controller.payRide(authReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPassengerRides', () => {
    it('responds with 200 and ride history list', async () => {
      const mockHistory: any = [
        {
          id: 'ride-1',
          rideRequestId: 'req-1',
          poolId: 'pool-1',
          status: 'COMPLETED',
          seats: 1,
          farePaisa: 15000,
          paymentMethod: 'TESLAPAY',
          paymentStatus: 'PAID',
          pickupLocation: { id: 1, name: 'Airport', lat: 23.85, lng: 90.4 },
          destLocation: { id: 2, name: 'Gulshan', lat: 23.79, lng: 90.41 },
          driver: { name: 'Rahim' },
          vehicle: { name: 'Model 3', regNo: 'DHA-1234' },
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          cancelledAt: null,
          cancelReason: null,
        },
      ];
      mockRidesService.getPassengerRideHistory = vi.fn().mockResolvedValue(mockHistory);

      const authReq: any = {
        query: { status: 'COMPLETED' },
        user: { sub: 'user-uuid-1', role: 'PASSENGER' },
      };

      await controller.getPassengerRides(authReq, res as Response, next);

      expect(mockRidesService.getPassengerRideHistory).toHaveBeenCalledWith('user-uuid-1', {
        status: 'COMPLETED',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockHistory);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next(err) if unauthenticated', async () => {
      const unauthReq: any = { query: {} };
      await controller.getPassengerRides(unauthReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('calls next(err) if getPassengerRideHistory throws', async () => {
      const error = new Error('Database query failure');
      mockRidesService.getPassengerRideHistory = vi.fn().mockRejectedValue(error);

      const authReq: any = {
        query: {},
        user: { sub: 'user-uuid-1', role: 'PASSENGER' },
      };

      await controller.getPassengerRides(authReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
