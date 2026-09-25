import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { registerSchema, loginSchema } from './auth.schema.js';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post(
    '/register',
    validate(registerSchema),
    (req, res, next) => controller.register(req, res, next)
  );

  router.post(
    '/login',
    validate(loginSchema),
    (req, res, next) => controller.login(req, res, next)
  );

  return router;
}

export default createAuthRouter;
