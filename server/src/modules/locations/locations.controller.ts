import type { Request, Response, NextFunction } from 'express';
import { LocationsService } from './locations.service.js';

export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  async getLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const catalog = await this.locationsService.getLocationsCatalog();
      res.status(200).json(catalog);
    } catch (err) {
      next(err);
    }
  }
}

export default LocationsController;
