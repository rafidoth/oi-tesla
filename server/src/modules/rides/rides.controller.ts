import type { Request, Response, NextFunction } from 'express';
import type { RidesService } from './rides.service.js';
import type {
  RequestRideInput,
  CreateRideInput,
  CancelRideInput,
  GetPassengerRidesQueryInput,
} from './rides.schema.js';
import type { AuthenticatedRequest } from '../../shared/types/AuthenticatedRequest.js';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError.js';

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

  async requestRide(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const passengerId = this.extractPassengerId(req);
      const dto = req.body as CreateRideInput;
      const booking = await this.ridesService.requestRide(passengerId, dto);
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  }

  async getActiveRide(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const passengerId = this.extractPassengerId(req);
      const activeRide = await this.ridesService.getActiveRide(passengerId);
      res.status(200).json(activeRide);
    } catch (err) {
      next(err);
    }
  }

  async getPassengerRides(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const passengerId = this.extractPassengerId(req);
      const query = req.query as GetPassengerRidesQueryInput;
      const history = await this.ridesService.getPassengerRideHistory(passengerId, query);
      res.status(200).json(history);
    } catch (err) {
      next(err);
    }
  }

  async getRideById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const passengerId = this.extractPassengerId(req);
      const ride = await this.ridesService.getRideById(req.params.id, passengerId);
      res.status(200).json(ride);
    } catch (err) {
      next(err);
    }
  }

  async cancelRide(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const passengerId = this.extractPassengerId(req);
      const input = req.body as CancelRideInput;
      const result = await this.ridesService.cancelRide(req.params.id, passengerId, input);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async payRide(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const passengerId = this.extractPassengerId(req);
      const result = await this.ridesService.payWithTeslaPay(req.params.id, passengerId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  private extractPassengerId(req: AuthenticatedRequest): string {
    const passengerId = req.user?.sub || req.user?.id;
    if (!passengerId) {
      throw new UnauthorizedError('UNAUTHENTICATED', 'User is not authenticated');
    }
    return passengerId;
  }
}

export default RidesController;

