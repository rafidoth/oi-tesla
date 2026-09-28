export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  role: 'DRIVER';
}

export interface DriverVehicle {
  id: string;
  name: string;
  regNo: string;
  capacity: number;
  status: 'ONLINE' | 'OFFLINE';
}

export interface DriverActivePool {
  id: string;
  pickupLocationId: number;
  pickupLocationName?: string;
  status: string;
  capacity: number;
  occupiedSeats: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverMeResponse {
  driver: DriverProfile;
  vehicle: DriverVehicle;
  activePool: DriverActivePool | null;
}

export interface UpdateDriverStatusInput {
  status: 'ONLINE' | 'OFFLINE';
}

export interface UpdateDriverStatusResponse {
  status: 'ONLINE' | 'OFFLINE';
  vehicle: DriverVehicle;
}

export interface OpenPoolMemberRequest {
  passengerRideId: string;
  destLocationId: number;
  destLocationName: string;
  seats: number;
}

export interface OpenPoolDestinationStop {
  locationId: number;
  locationName: string;
}

export interface OpenPoolItem {
  id: string;
  pickupLocationId: number;
  pickupLocationName: string;
  status: 'OPEN';
  capacity: number;
  occupiedSeats: number;
  passengerCount: number;
  destinationStops: OpenPoolDestinationStop[];
  memberRequests: OpenPoolMemberRequest[];
  createdAt: string;
}

export interface AcceptPoolResponse {
  success: boolean;
  pool: {
    id: string;
    pickupLocationId: number;
    status: string;
    capacity: number;
    occupiedSeats: number;
    driverId: string;
    vehicleId: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface DriverPoolRosterMember {
  id: string;
  passengerId: string;
  passengerName: string;
  pickupLocationId: number;
  pickupLocationName: string;
  destLocationId: number;
  destLocationName: string;
  seats: number;
  farePaisa: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string | null;
  createdAt: string;
}

export interface DriverPoolDetailsResponse {
  id: string;
  pickupLocationId: number;
  pickupLocationName: string;
  status: string;
  capacity: number;
  occupiedSeats: number;
  driverId: string;
  vehicleId: string;
  destinationStops: OpenPoolDestinationStop[];
  roster: DriverPoolRosterMember[];
  createdAt: string;
  updatedAt: string;
}

export type PoolLifecycleAction = 'arrive' | 'start' | 'complete';

export interface TransitionPoolResponse {
  success: boolean;
  poolId: string;
  status: string;
}

export interface MarkCashReceivedResponse {
  success: boolean;
  payment: {
    id: string;
    passengerRideId: string;
    method: string;
    amountPaisa: number;
    status: string;
    paidAt: string | null;
    markedBy: string | null;
  };
}

export interface DriverPoolHistoryItem {
  id: string;
  pickupLocationId: number;
  pickupLocationName: string;
  status: string;
  capacity: number;
  occupiedSeats: number;
  passengerCount: number;
  totalEarningsPaisa: number;
  destinationStops: OpenPoolDestinationStop[];
  createdAt: string;
  updatedAt: string;
}

