import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import { DriverController } from '../../src/modules/driver/driver.controller.js';
import type { DriverService } from '../../src/modules/driver/driver.service.js';
import type { AuthenticatedRequest } from '../../src/shared/types/AuthenticatedRequest.js';
import { UnauthorizedError } from '../../src/shared/errors/UnauthorizedError.js';
import { CAST } from '../fixtures/cast.js';

describe('DriverController Unit Tests', () => {
  let mockDriverService: {
    getDriverMe: ReturnType<typeof vi.fn>;
    updateDriverStatus: ReturnType<typeof vi.fn>;
    getOpenPoolsForDriver: ReturnType<typeof vi.fn>;
    declinePool: ReturnType<typeof vi.fn>;
    acceptPool: ReturnType<typeof vi.fn>;
    getDriverPoolById: ReturnType<typeof vi.fn>;
    getDriverPoolRoster: ReturnType<typeof vi.fn>;
    arrivePool: ReturnType<typeof vi.fn>;
    startPool: ReturnType<typeof vi.fn>;
    completePool: ReturnType<typeof vi.fn>;
    markCashReceived: ReturnType<typeof vi.fn>;
    getDriverPoolHistory: ReturnType<typeof vi.fn>;
  };
  let controller: DriverController;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockDriverService = {
      getDriverMe: vi.fn(),
      updateDriverStatus: vi.fn(),
      getOpenPoolsForDriver: vi.fn(),
      declinePool: vi.fn(),
      acceptPool: vi.fn(),
      getDriverPoolById: vi.fn(),
      getDriverPoolRoster: vi.fn(),
      arrivePool: vi.fn(),
      startPool: vi.fn(),
      completePool: vi.fn(),
      markCashReceived: vi.fn(),
      getDriverPoolHistory: vi.fn(),
    };
    controller = new DriverController(mockDriverService as unknown as DriverService);

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it('successfully returns 200 with driver profile and vehicle overview', async () => {
    const expectedData = {
      driver: {
        id: CAST.driver.id,
        name: CAST.driver.name,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      vehicle: {
        id: CAST.driver.vehicle.id,
        name: CAST.driver.vehicle.name,
        regNo: CAST.driver.vehicle.regNo,
        capacity: 3,
        status: 'ONLINE' as const,
      },
      activePool: null,
    };
    mockDriverService.getDriverMe.mockResolvedValue(expectedData);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
    } as AuthenticatedRequest;

    await controller.getDriverMe(req, res as Response, next);

    expect(mockDriverService.getDriverMe).toHaveBeenCalledWith(CAST.driver.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedData);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes UnauthorizedError to next if user is unauthenticated', async () => {
    const req = {} as AuthenticatedRequest;

    await controller.getDriverMe(req, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('delegates service errors to next function', async () => {
    const error = new Error('Service failure');
    mockDriverService.getDriverMe.mockRejectedValue(error);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
    } as AuthenticatedRequest;

    await controller.getDriverMe(req, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('successfully updates driver status and returns 200', async () => {
    const expectedData = {
      status: 'ONLINE' as const,
      vehicle: {
        id: CAST.driver.vehicle.id,
        name: CAST.driver.vehicle.name,
        regNo: CAST.driver.vehicle.regNo,
        capacity: 3,
        status: 'ONLINE' as const,
      },
    };
    mockDriverService.updateDriverStatus.mockResolvedValue(expectedData);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      body: {
        status: 'ONLINE',
      },
    } as AuthenticatedRequest;

    await controller.updateDriverStatus(req, res as Response, next);

    expect(mockDriverService.updateDriverStatus).toHaveBeenCalledWith(CAST.driver.id, 'ONLINE');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedData);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes UnauthorizedError to next on updateDriverStatus if unauthenticated', async () => {
    const req = {
      body: {
        status: 'ONLINE',
      },
    } as AuthenticatedRequest;

    await controller.updateDriverStatus(req, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('delegates service errors to next on updateDriverStatus', async () => {
    const error = new Error('Database error');
    mockDriverService.updateDriverStatus.mockRejectedValue(error);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      body: {
        status: 'OFFLINE',
      },
    } as AuthenticatedRequest;

    await controller.updateDriverStatus(req, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('successfully returns 200 with open pools for driver', async () => {
    const mockPools = [
      {
        id: 'pool-1',
        pickupLocationId: 1,
        pickupLocationName: 'Gulshan-2',
        status: 'OPEN' as const,
        capacity: 3,
        occupiedSeats: 1,
        passengerCount: 1,
        destinationStops: [{ locationId: 2, locationName: 'Banani' }],
        memberRequests: [
          { passengerRideId: 'ride-1', destLocationId: 2, destLocationName: 'Banani', seats: 1 },
        ],
        createdAt: new Date(),
      },
    ];
    mockDriverService.getOpenPoolsForDriver.mockResolvedValue(mockPools);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      query: {
        status: 'OPEN',
      },
    } as unknown as AuthenticatedRequest;

    await controller.getDriverPools(req, res as Response, next);

    expect(mockDriverService.getOpenPoolsForDriver).toHaveBeenCalledWith(CAST.driver.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockPools);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes UnauthorizedError to next on getDriverPools if unauthenticated', async () => {
    const req = {
      query: {
        status: 'OPEN',
      },
    } as unknown as AuthenticatedRequest;

    await controller.getDriverPools(req, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('delegates service errors to next on getDriverPools', async () => {
    const error = new Error('Service error');
    mockDriverService.getOpenPoolsForDriver.mockRejectedValue(error);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      query: {
        status: 'OPEN',
      },
    } as unknown as AuthenticatedRequest;

    await controller.getDriverPools(req, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('returns driver pool history when status is not OPEN', async () => {
    const mockHistory = [
      {
        id: 'pool-completed-1',
        pickupLocationId: 2,
        pickupLocationName: 'Banani',
        status: 'COMPLETED',
        capacity: 3,
        occupiedSeats: 2,
        passengerCount: 2,
        totalEarningsPaisa: 70000,
        destinationStops: [{ locationId: 3, locationName: 'Gulshan' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockDriverService.getDriverPoolHistory.mockResolvedValue(mockHistory);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      query: {
        status: 'COMPLETED',
      },
    } as unknown as AuthenticatedRequest;

    await controller.getDriverPools(req, res as Response, next);

    expect(mockDriverService.getDriverPoolHistory).toHaveBeenCalledWith(
      CAST.driver.id,
      'COMPLETED'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockHistory);
  });

  it('fetches driver pool history for status=ALL and returns 200', async () => {
    const mockHistory = [
      {
        id: 'pool-uuid-1',
        pickupLocationId: 1,
        pickupLocationName: 'Uttara',
        status: 'COMPLETED',
        capacity: 4,
        occupiedSeats: 2,
        passengerCount: 2,
        totalEarningsPaisa: 70000,
        destinationStops: [{ locationId: 3, locationName: 'Gulshan' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockDriverService.getDriverPoolHistory.mockResolvedValue(mockHistory);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      query: {
        status: 'ALL',
      },
    } as unknown as AuthenticatedRequest;

    await controller.getDriverPools(req, res as Response, next);

    expect(mockDriverService.getDriverPoolHistory).toHaveBeenCalledWith(
      CAST.driver.id,
      undefined
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockHistory);
  });

  it('successfully declines a pool and returns 200', async () => {
    const expectedData = {
      success: true,
      poolId: 'pool-uuid-1',
    };
    mockDriverService.declinePool.mockResolvedValue(expectedData);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      params: {
        id: 'pool-uuid-1',
      },
      body: {
        reason: 'Too far away',
      },
    } as unknown as AuthenticatedRequest;

    await controller.declinePool(req, res as Response, next);

    expect(mockDriverService.declinePool).toHaveBeenCalledWith(
      CAST.driver.id,
      'pool-uuid-1',
      { reason: 'Too far away' }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedData);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes UnauthorizedError to next on declinePool if unauthenticated', async () => {
    const req = {
      params: {
        id: 'pool-uuid-1',
      },
      body: {},
    } as unknown as AuthenticatedRequest;

    await controller.declinePool(req, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('delegates service errors to next on declinePool', async () => {
    const error = new Error('Pool decline failed');
    mockDriverService.declinePool.mockRejectedValue(error);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      params: {
        id: 'pool-uuid-1',
      },
      body: {},
    } as unknown as AuthenticatedRequest;

    await controller.declinePool(req, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('successfully accepts pool and returns 200 with result', async () => {
    const expectedResponse = {
      success: true,
      pool: {
        id: 'pool-uuid-1',
        pickupLocationId: 1,
        status: 'MATCHED',
        capacity: 3,
        occupiedSeats: 2,
        driverId: CAST.driver.id,
        vehicleId: CAST.driver.vehicle.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    mockDriverService.acceptPool.mockResolvedValue(expectedResponse);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      params: {
        id: 'pool-uuid-1',
      },
    } as unknown as AuthenticatedRequest;

    await controller.acceptPool(req, res as Response, next);

    expect(mockDriverService.acceptPool).toHaveBeenCalledWith(CAST.driver.id, 'pool-uuid-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedResponse);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes UnauthorizedError to next on acceptPool if unauthenticated', async () => {
    const req = {
      params: {
        id: 'pool-uuid-1',
      },
    } as unknown as AuthenticatedRequest;

    await controller.acceptPool(req, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('delegates service errors to next on acceptPool', async () => {
    const error = new Error('Pool accept failed');
    mockDriverService.acceptPool.mockRejectedValue(error);

    const req = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      params: {
        id: 'pool-uuid-1',
      },
    } as unknown as AuthenticatedRequest;

    await controller.acceptPool(req, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  describe('getDriverPoolById', () => {
    it('successfully returns 200 with driver pool details', async () => {
      const expectedPool = {
        id: 'pool-uuid-1',
        pickupLocationId: 1,
        pickupLocationName: 'Gulshan 1 Circle',
        status: 'MATCHED',
        capacity: 3,
        occupiedSeats: 2,
        driverId: CAST.driver.id,
        vehicleId: CAST.driver.vehicle.id,
        destinationStops: [{ locationId: 2, locationName: 'Banani 11' }],
        roster: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDriverService.getDriverPoolById.mockResolvedValue(expectedPool);

      const req = {
        user: {
          id: CAST.driver.id,
          sub: CAST.driver.id,
          email: CAST.driver.email,
          role: 'DRIVER' as const,
        },
        params: {
          id: 'pool-uuid-1',
        },
      } as unknown as AuthenticatedRequest;

      await controller.getDriverPoolById(req, res as Response, next);

      expect(mockDriverService.getDriverPoolById).toHaveBeenCalledWith(CAST.driver.id, 'pool-uuid-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedPool);
    });

    it('delegates UnauthorizedError to next when user is unauthenticated', async () => {
      const req = {
        params: { id: 'pool-uuid-1' },
      } as unknown as AuthenticatedRequest;

      await controller.getDriverPoolById(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('delegates service errors to next on getDriverPoolById', async () => {
      const error = new Error('Pool not found');
      mockDriverService.getDriverPoolById.mockRejectedValue(error);

      const req = {
        user: {
          id: CAST.driver.id,
          sub: CAST.driver.id,
          email: CAST.driver.email,
          role: 'DRIVER' as const,
        },
        params: {
          id: 'pool-uuid-1',
        },
      } as unknown as AuthenticatedRequest;

      await controller.getDriverPoolById(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getDriverPoolRoster', () => {
    it('successfully returns 200 with driver pool roster', async () => {
      const expectedRoster = [
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
          createdAt: new Date(),
        },
      ];
      mockDriverService.getDriverPoolRoster.mockResolvedValue(expectedRoster);

      const req = {
        user: {
          id: CAST.driver.id,
          sub: CAST.driver.id,
          email: CAST.driver.email,
          role: 'DRIVER' as const,
        },
        params: {
          id: 'pool-uuid-1',
        },
      } as unknown as AuthenticatedRequest;

      await controller.getDriverPoolRoster(req, res as Response, next);

      expect(mockDriverService.getDriverPoolRoster).toHaveBeenCalledWith(CAST.driver.id, 'pool-uuid-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedRoster);
    });

    it('delegates UnauthorizedError to next when user is unauthenticated', async () => {
      const req = {
        params: { id: 'pool-uuid-1' },
      } as unknown as AuthenticatedRequest;

      await controller.getDriverPoolRoster(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('delegates service errors to next on getDriverPoolRoster', async () => {
      const error = new Error('Pool not found');
      mockDriverService.getDriverPoolRoster.mockRejectedValue(error);

      const req = {
        user: {
          id: CAST.driver.id,
          sub: CAST.driver.id,
          email: CAST.driver.email,
          role: 'DRIVER' as const,
        },
        params: {
          id: 'pool-uuid-1',
        },
      } as unknown as AuthenticatedRequest;

      await controller.getDriverPoolRoster(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('Lifecycle Transition Endpoints', () => {
    const authReq = {
      user: {
        id: CAST.driver.id,
        sub: CAST.driver.id,
        email: CAST.driver.email,
        role: 'DRIVER' as const,
      },
      params: { id: 'pool-uuid-1' },
    } as unknown as AuthenticatedRequest;

    const unauthReq = {
      params: { id: 'pool-uuid-1' },
    } as unknown as AuthenticatedRequest;

    it('arrivePool returns 200 on success', async () => {
      mockDriverService.arrivePool.mockResolvedValue({
        success: true,
        poolId: 'pool-uuid-1',
        status: 'DRIVER_ARRIVED',
      });

      await controller.arrivePool(authReq, res as Response, next);

      expect(mockDriverService.arrivePool).toHaveBeenCalledWith(CAST.driver.id, 'pool-uuid-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        poolId: 'pool-uuid-1',
        status: 'DRIVER_ARRIVED',
      });
    });

    it('arrivePool delegates UnauthorizedError when unauthenticated', async () => {
      await controller.arrivePool(unauthReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('startPool returns 200 on success', async () => {
      mockDriverService.startPool.mockResolvedValue({
        success: true,
        poolId: 'pool-uuid-1',
        status: 'STARTED',
      });

      await controller.startPool(authReq, res as Response, next);

      expect(mockDriverService.startPool).toHaveBeenCalledWith(CAST.driver.id, 'pool-uuid-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        poolId: 'pool-uuid-1',
        status: 'STARTED',
      });
    });

    it('startPool delegates UnauthorizedError when unauthenticated', async () => {
      await controller.startPool(unauthReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('completePool returns 200 on success', async () => {
      mockDriverService.completePool.mockResolvedValue({
        success: true,
        poolId: 'pool-uuid-1',
        status: 'COMPLETED',
      });

      await controller.completePool(authReq, res as Response, next);

      expect(mockDriverService.completePool).toHaveBeenCalledWith(CAST.driver.id, 'pool-uuid-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        poolId: 'pool-uuid-1',
        status: 'COMPLETED',
      });
    });

    it('completePool delegates UnauthorizedError when unauthenticated', async () => {
      await controller.completePool(unauthReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('markCashReceived returns 200 on success', async () => {
      const mockResult = {
        success: true,
        payment: {
          id: 'pay-uuid-1',
          passengerRideId: 'ride-uuid-1',
          method: 'CASH',
          amountPaisa: 35000,
          status: 'PAID',
          paidAt: new Date(),
          markedBy: CAST.driver.id,
        },
      };
      mockDriverService.markCashReceived.mockResolvedValue(mockResult);

      const cashReq = {
        params: { id: 'ride-uuid-1' },
        user: { id: CAST.driver.id, role: 'DRIVER' },
      } as unknown as AuthenticatedRequest;

      await controller.markCashReceived(cashReq, res as Response, next);

      expect(mockDriverService.markCashReceived).toHaveBeenCalledWith(CAST.driver.id, 'ride-uuid-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('markCashReceived delegates UnauthorizedError when unauthenticated', async () => {
      await controller.markCashReceived(unauthReq, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('markCashReceived delegates error to next when service fails', async () => {
      const error = new Error('Payment error');
      mockDriverService.markCashReceived.mockRejectedValue(error);

      const cashReq = {
        params: { id: 'ride-uuid-1' },
        user: { id: CAST.driver.id, role: 'DRIVER' },
      } as unknown as AuthenticatedRequest;

      await controller.markCashReceived(cashReq, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});



