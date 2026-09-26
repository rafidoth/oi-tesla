import { db } from '../../db/client.js';
import { RidesRepository } from './rides.repository.js';
import { RidesService } from './rides.service.js';
import { RidesController } from './rides.controller.js';
import { createRidesRouter } from './rides.routes.js';
import { locationsService } from '../locations/locations.module.js';
import { FareCalculator } from '../pools/domain/FareCalculator.js';

export const ridesRepository = new RidesRepository(db);
export const fareCalculator = new FareCalculator();
export const ridesService = new RidesService(ridesRepository, locationsService, fareCalculator);
export const ridesController = new RidesController(ridesService);

export const ridesRouter = createRidesRouter(ridesController);
export default ridesRouter;
