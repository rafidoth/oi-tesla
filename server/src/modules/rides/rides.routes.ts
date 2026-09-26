import { Router } from 'express';
import type { RidesController } from './rides.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { createRideSchema, requestRideSchema, cancelRideSchema } from './rides.schema.js';
import type { AuthenticatedRequest } from '../../shared/types/AuthenticatedRequest.js';

export function createRidesRouter(controller: RidesController): Router {
  const router = Router();

  router.post(
    '/',
    authenticate,
    authorize('PASSENGER'),
    validate(createRideSchema),
    (req, res, next) => controller.requestRide(req as AuthenticatedRequest, res, next)
  );

  router.post(
    '/estimate',
    validate(requestRideSchema),
    (req, res, next) => controller.calculateEstimate(req, res, next)
  );

  router.get(
    '/active',
    authenticate,
    authorize('PASSENGER'),
    (req, res, next) => controller.getActiveRide(req as AuthenticatedRequest, res, next)
  );

  router.get(
    '/:id',
    authenticate,
    authorize('PASSENGER'),
    (req, res, next) => controller.getRideById(req as AuthenticatedRequest, res, next)
  );

  router.post(
    '/:id/cancel',
    authenticate,
    authorize('PASSENGER'),
    validate(cancelRideSchema),
    (req, res, next) => controller.cancelRide(req as AuthenticatedRequest, res, next)
  );

  return router;
}

export default createRidesRouter;

