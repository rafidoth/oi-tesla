import { db } from '../../db/client.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { createUsersRouter } from './users.routes.js';

const usersRepository = new UsersRepository(db);
const usersService = new UsersService(usersRepository);
const usersController = new UsersController(usersService);

export const usersRouter = createUsersRouter(usersController);
export default usersRouter;
