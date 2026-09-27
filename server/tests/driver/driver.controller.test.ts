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
});


