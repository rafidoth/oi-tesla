/**
 * Request payload for requesting a ride / fare estimate.
 */
export interface RequestRideDto {
  pickupLocationId: number;
  destLocationId: number;
  seats: number;
  paymentMethod?: "CASH" | "TESLAPAY";
}

export type RequestRidePayload = RequestRideDto;

/**
 * Payload for creating / requesting a ride.
 */
export interface CreateRideDto {
  pickupLocationId: number;
  destLocationId: number;
  seats: number;
  paymentMethod: PaymentMethod;
}

export type CreateRidePayload = CreateRideDto;

/**
 * Response returned by POST /rides upon successful pool assignment and ride creation.
 */
export interface RideBookingResponseDto {
  rideId: string;
  rideRequestId: string;
  poolId: string;
  status: PoolStatus | string;
  seats: number;
  estimateFarePaisa: number;
  paymentMethod: PaymentMethod;
  isNewPool: boolean;
  occupiedSeats?: number;
  capacity?: number;
  driverId?: string | null;
  vehicleId?: string | null;
}

/**
 * Response returned by the upfront fare calculation endpoint.
 */
export interface EstimateResponseDto {
  pickupLocationId: number;
  destLocationId: number;
  distanceM: number;
  seats: number;
  soloFarePaisa: number;
  currency: string;
}

/**
 * Pool lifecycle status.
 */
export type PoolStatus =
  | "OPEN"
  | "MATCHED"
  | "DRIVER_ARRIVED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

/**
 * Supported payment methods.
 */
export type PaymentMethod = "CASH" | "TESLAPAY";

/**
 * Client-side pool assignment response DTO returned during matching or ride creation.
 */
export interface PoolAssignmentDto {
  poolId: string;
  status:
    | "OPEN"
    | "MATCHED"
    | "DRIVER_ARRIVED"
    | "STARTED"
    | "COMPLETED"
    | "CANCELLED";
  occupiedSeats: number;
  capacity: number;
  isNewPool: boolean;
  driverId?: string | null;
  vehicleId?: string | null;
}

/**
 * Draft state for passenger ride booking.
 */
export interface RideBookingDraft {
  pickupLocationId: number | null;
  destLocationId: number | null;
  seats: number;
  paymentMethod: "CASH" | "TESLAPAY";
  activeRideId: string | null;
  poolAssignment: PoolAssignmentDto | null;
}

/**
 * Derived ride status from passenger perspective based on pool status and ride flags.
 */
export type DerivedRideStatus =
  | "REQUESTED"
  | "MATCHED"
  | "DRIVER_ARRIVED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

/**
 * Sanitized active ride details matching backend response with co-passenger privacy protected.
 */
export interface ActiveRideDetailsDto {
  id: string;
  rideRequestId: string;
  passengerId: string;
  status: DerivedRideStatus;
  seats: number;
  farePaisa: number;
  originalEstimateFarePaisa: number;
  paymentMethod: string;
  pickupLocation: {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };
  destLocation: {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };
  pool: {
    id: string;
    status: string;
    capacity: number;
    occupiedSeats: number;
    driver?: {
      name: string;
    } | null;
    vehicle?: {
      name: string;
      regNo: string;
      capacity: number;
    } | null;
  };
  isCancellable: boolean;
  createdAt: string;
  cancelledAt?: string | null;
  completedAt?: string | null;
}

/**
 * Request payload for cancelling an active passenger ride.
 */
export interface CancelRideDto {
  reason?: string;
}

/**
 * Response returned by POST /rides/:id/cancel upon successful cancellation.
 */
export interface CancelRideResponseDto {
  rideId: string;
  status: "CANCELLED";
  cancelledAt: string;
  cancelReason?: string | null;
  seatsReleased: number;
  poolRemainingMembers: number;
  poolStatus: string;
}

