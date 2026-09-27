import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/AuthenticatedRequest.js';
import { DriverService } from './driver.service.js';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError.js';

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
}

export default DriverController;
