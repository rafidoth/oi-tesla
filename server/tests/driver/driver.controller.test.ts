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
  };
  let controller: DriverController;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockDriverService = {
      getDriverMe: vi.fn(),
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
});
