import { db } from '../../db/client.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { createAuthRouter } from './auth.routes.js';

const authRepository = new AuthRepository(db);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export const authRouter = createAuthRouter(authController);
export default authRouter;
