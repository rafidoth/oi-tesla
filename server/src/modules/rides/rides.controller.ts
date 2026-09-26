import type { Request, Response, NextFunction } from 'express';
import type { RidesService } from './rides.service.js';
import type { RequestRideInput } from './rides.schema.js';

export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  async calculateEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as RequestRideInput;
      const estimated = await this.ridesService.calculateEstimate(dto);
      res.status(200).json(estimated);
    } catch (err) {
      next(err);
    }
  }
}

export default RidesController;
