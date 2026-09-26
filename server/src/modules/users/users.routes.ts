import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';

export function createUsersRouter(controller: UsersController): Router {
  const router = Router();

  router.get(
    '/me',
    authenticate,
    (req, res, next) => controller.getProfile(req, res, next)
  );

  return router;
}

export default createUsersRouter;
