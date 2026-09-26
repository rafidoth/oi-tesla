import type { db } from '../../db/client.js';
import { rideEvents, type RideEvent, type NewRideEvent } from '../../db/schema/events.js';

type DbType = typeof db;

export class EventsRepository {
  constructor(private readonly db: DbType) {}

  async createEvent(data: NewRideEvent, tx?: any): Promise<RideEvent> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const [event] = await executor
      .insert(rideEvents)
      .values(data)
      .returning();
    return event;
  }
}

export default EventsRepository;
