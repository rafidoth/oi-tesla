import { Router } from 'express';
import { LocationsController } from './locations.controller.js';

export function createLocationsRouter(controller: LocationsController): Router {
  const router = Router();

  router.get('/', (req, res, next) => controller.getLocations(req, res, next));

  return router;
}

export default createLocationsRouter;
