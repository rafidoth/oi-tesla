import type { EventsRepository } from './events.repository.js';
import type { RideEvent, NewRideEvent } from '../../db/schema/events.js';
import type { LogRideEventInput } from './events.types.js';

export class EventsService {
  constructor(private readonly eventsRepo: EventsRepository) {}

  async logRideEvent(
    event: LogRideEventInput,
    tx?: any
  ): Promise<RideEvent> {
    const newEvent: NewRideEvent = {
      event: event.event,
      actorType: event.actorType,
      actorId: event.actorId,
      poolId: event.poolId,
      passengerRideId: event.passengerRideId,
      rideRequestId: event.rideRequestId,
      fromState: event.fromState,
      toState: event.toState,
      payload: event.payload,
    };

    return this.eventsRepo.createEvent(newEvent, tx);
  }
}

export default EventsService;
