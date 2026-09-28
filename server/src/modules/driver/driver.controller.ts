import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/AuthenticatedRequest.js';
import { DriverService } from './driver.service.js';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError.js';
import type { UpdateDriverStatusInput, DeclinePoolInput } from './driver.schema.js';

export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  async getDriverMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.sub || req.user?.id;
      if (!driverId) {
        throw new UnauthorizedError('UNAUTHENTICATED', 'User is not authenticated');
      }

      const response = await this.driverService.getDriverMe(driverId);
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateDriverStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.sub || req.user?.id;
      if (!driverId) {
        throw new UnauthorizedError('UNAUTHENTICATED', 'User is not authenticated');
      }

      const { status } = req.body as UpdateDriverStatusInput;
      const response = await this.driverService.updateDriverStatus(driverId, status);
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getDriverPools(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.sub || req.user?.id;
      if (!driverId) {
        throw new UnauthorizedError('UNAUTHENTICATED', 'User is not authenticated');
      }

      const status = req.query.status as string | undefined;
      if (!status || status === 'OPEN') {
        const pools = await this.driverService.getOpenPoolsForDriver(driverId);
        res.status(200).json(pools);
        return;
      }

      res.status(200).json([]);
    } catch (err) {
      next(err);
    }
  }

  async declinePool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.sub || req.user?.id;
      if (!driverId) {
        throw new UnauthorizedError('UNAUTHENTICATED', 'User is not authenticated');
      }

      const poolId = req.params.id;
      const input = req.body as DeclinePoolInput;
      const response = await this.driverService.declinePool(driverId, poolId, input);
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async acceptPool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.sub || req.user?.id;
      if (!driverId) {
        throw new UnauthorizedError('UNAUTHENTICATED', 'User is not authenticated');
      }

      const poolId = req.params.id;
      const response = await this.driverService.acceptPool(driverId, poolId);
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getDriverPoolById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.sub || req.user?.id;
      if (!driverId) {
        throw new UnauthorizedError('UNAUTHENTICATED', 'User is not authenticated');
      }

      const poolId = req.params.id;
      const response = await this.driverService.getDriverPoolById(driverId, poolId);
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getDriverPoolRoster(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = this.extractDriverId(req);
      const response = await this.driverService.getDriverPoolRoster(driverId, req.params.id);
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async arrivePool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = this.extractDriverId(req);
      const response = await this.driverService.arrivePool(driverId, req.params.id);
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async startPool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = this.extractDriverId(req);
      const response = await this.driverService.startPool(driverId, req.params.id);
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async completePool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = this.extractDriverId(req);
      const response = await this.driverService.completePool(driverId, req.params.id);
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  private extractDriverId(req: AuthenticatedRequest): string {
    const driverId = req.user?.sub || req.user?.id;
    if (!driverId) {
      throw new UnauthorizedError('UNAUTHENTICATED', 'User is not authenticated');
    }
    return driverId;
  }
}

export default DriverController;


