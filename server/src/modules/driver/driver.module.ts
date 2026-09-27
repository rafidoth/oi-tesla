import { db } from '../../db/client.js';
import { DriverRepository } from './driver.repository.js';
import { DriverService } from './driver.service.js';
import { DriverController } from './driver.controller.js';
import { createDriverRouter } from './driver.routes.js';

export const driverRepository = new DriverRepository(db);
export const driverService = new DriverService(driverRepository);
export const driverController = new DriverController(driverService);
export const driverRouter = createDriverRouter(driverController);

export default driverRouter;
