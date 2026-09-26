import { db } from '../../db/client.js';
import { LocationsRepository } from './locations.repository.js';
import { LocationsService } from './locations.service.js';
import { LocationsController } from './locations.controller.js';
import { createLocationsRouter } from './locations.routes.js';

export const locationsRepository = new LocationsRepository(db);
export const locationsService = new LocationsService(locationsRepository);
export const locationsController = new LocationsController(locationsService);

export const locationsRouter = createLocationsRouter(locationsController);
export default locationsRouter;
