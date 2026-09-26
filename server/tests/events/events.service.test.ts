import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventsService } from '../../src/modules/events/events.service.js';
import type { EventsRepository } from '../../src/modules/events/events.repository.js';
import type { LogRideEventInput } from '../../src/modules/events/events.types.js';

describe('EventsService Unit Tests', () => {
  let mockEventsRepo: {
    createEvent: ReturnType<typeof vi.fn>;
  };
  let eventsService: EventsService;

  beforeEach(() => {
    mockEventsRepo = {
      createEvent: vi.fn(),
    };
    eventsService = new EventsService(mockEventsRepo as unknown as EventsRepository);
  });

  it('delegates to eventsRepository.createEvent with the given event payload', async () => {
    const eventInput: LogRideEventInput = {
      event: 'REQUEST_CREATED',
      actorType: 'PASSENGER',
      actorId: 'passenger-1',
      rideRequestId: 'request-1',
      toState: 'REQUESTED',
      payload: { seats: 1, estimateFarePaisa: 15000 },
    };

    const mockCreatedEvent = {
      id: 101,
      ...eventInput,
      occurredAt: new Date(),
    };

    mockEventsRepo.createEvent.mockResolvedValue(mockCreatedEvent);

    const mockTx = { txId: 'tx-1' };
    const result = await eventsService.logRideEvent(eventInput, mockTx);

    expect(mockEventsRepo.createEvent).toHaveBeenCalledWith(
      {
        event: 'REQUEST_CREATED',
        actorType: 'PASSENGER',
        actorId: 'passenger-1',
        poolId: undefined,
        passengerRideId: undefined,
        rideRequestId: 'request-1',
        fromState: undefined,
        toState: 'REQUESTED',
        payload: { seats: 1, estimateFarePaisa: 15000 },
      },
      mockTx
    );

    expect(result).toEqual(mockCreatedEvent);
  });
});
