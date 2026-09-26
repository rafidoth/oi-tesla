import { db } from '../../db/client.js';
import { PoolsRepository } from './pools.repository.js';
import { PoolsService } from './pools.service.js';
import { locationsRepository, locationsService } from '../locations/locations.module.js';
import { eventsService } from '../events/events.module.js';
import { FareCalculator } from './domain/FareCalculator.js';

export const poolsRepository = new PoolsRepository(db);
export const fareCalculator = new FareCalculator();
export const poolsService = new PoolsService(
  poolsRepository,
  locationsRepository,
  undefined,
  locationsService,
  eventsService,
  fareCalculator
);

export default poolsService;
