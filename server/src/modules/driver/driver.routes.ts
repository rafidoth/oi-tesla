import { Router } from 'express';
import { DriverController } from './driver.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  updateDriverStatusSchema,
  getDriverPoolsQuerySchema,
  poolIdParamsSchema,
  declinePoolSchema,
} from './driver.schema.js';

export function createDriverRouter(controller: DriverController): Router {
  const router = Router();

  router.get('/me', authenticate, authorize('DRIVER'), (req, res, next) =>
    controller.getDriverMe(req, res, next)
  );

  router.patch(
    '/status',
    authenticate,
    authorize('DRIVER'),
    validate(updateDriverStatusSchema, 'body'),
    (req, res, next) => controller.updateDriverStatus(req, res, next)
  );

  router.get(
    '/pools',
    authenticate,
    authorize('DRIVER'),
    validate(getDriverPoolsQuerySchema, 'query'),
    (req, res, next) => controller.getDriverPools(req, res, next)
  );

  router.post(
    '/pools/:id/decline',
    authenticate,
    authorize('DRIVER'),
    validate(poolIdParamsSchema, 'params'),
    validate(declinePoolSchema, 'body'),
    (req, res, next) => controller.declinePool(req, res, next)
  );

  return router;
}

export default createDriverRouter;

