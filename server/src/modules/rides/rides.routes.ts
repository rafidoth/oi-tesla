import { Router } from 'express';
import type { RidesController } from './rides.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { requestRideSchema } from './rides.schema.js';

export function createRidesRouter(controller: RidesController): Router {
  const router = Router();

  router.post(
    '/estimate',
    validate(requestRideSchema),
    (req, res, next) => controller.calculateEstimate(req, res, next)
  );

  return router;
}

export default createRidesRouter;
