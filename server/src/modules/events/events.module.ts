import { db } from '../../db/client.js';
import { EventsRepository } from './events.repository.js';
import { EventsService } from './events.service.js';

export const eventsRepository = new EventsRepository(db);
export const eventsService = new EventsService(eventsRepository);

export default eventsService;
