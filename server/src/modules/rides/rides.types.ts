import type { DerivedRideStatus } from './domain/Ride.js';

export interface RequestRideDto {
  pickupLocationId: number;
  destLocationId: number;
  seats: number;
  paymentMethod?: 'CASH' | 'TESLAPAY';
}

export interface EstimateResponseDto {
  pickupLocationId: number;
  destLocationId: number;
  distanceM: number;
  seats: number;
  soloFarePaisa: number;
  currency: 'BDT';
}

export interface RideBookingResponseDto {
  rideId: string;
  rideRequestId: string;
  poolId: string;
  status: 'OPEN' | 'MATCHED' | string;
  seats: number;
  estimateFarePaisa: number;
  paymentMethod: string;
  isNewPool: boolean;
}

export interface LocationSummaryDto {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

/**
 * Sanitized co-passenger summary visible to fellow pool passengers (D16).
 * Exposes only first name, destination location, and seats — no fares, IDs, or payment info.
 */
export interface CoPassengerSummary {
  name: string;
  destLocationName: string;
  seats: number;
}

export interface ActiveRideDetailsDto {
  id: string;
  rideRequestId: string;
  passengerId: string;
  status: DerivedRideStatus;
  seats: number;
  farePaisa: number;
  originalEstimateFarePaisa: number;
  paymentMethod: string;
  paymentStatus?: string | null;
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
    coPassengers: CoPassengerSummary[];
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
  createdAt: Date | string;
  cancelledAt?: Date | string | null;
  completedAt?: Date | string | null;
}

export interface CancelRideResponseDto {
  rideId: string;
  status: 'CANCELLED';
  cancelledAt: string | Date;
  cancelReason?: string | null;
  seatsReleased: number;
  poolRemainingMembers: number;
  poolStatus: string;
}

export interface PayRideResponseDto {
  success: boolean;
  payment: {
    id: string;
    passengerRideId: string;
    method: string;
    amountPaisa: number;
    status: string;
    paidAt: Date | string | null;
    markedBy: string | null;
  };
}

export interface PassengerRideHistoryItemDto {
  id: string;
  rideRequestId: string;
  poolId: string;
  status: 'COMPLETED' | 'CANCELLED';
  seats: number;
  farePaisa: number;
  paymentMethod: string;
  paymentStatus: string | null;
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
  driver: {
    name: string;
  } | null;
  vehicle: {
    name: string;
    regNo: string;
  } | null;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}
