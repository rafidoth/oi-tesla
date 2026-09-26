export type ActorType = 'PASSENGER' | 'DRIVER' | 'SYSTEM';

export interface LogRideEventInput {
  event: string;
  actorType: ActorType;
  actorId?: string;
  poolId?: string;
  passengerRideId?: string;
  rideRequestId?: string;
  fromState?: string;
  toState?: string;
  payload?: Record<string, any>;
}
