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
  pickupLocationName: string;
  status: string;
  capacity: number;
  occupiedSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverMeResponse {
  driver: DriverProfile;
  vehicle: DriverVehicle;
  activePool: DriverActivePool | null;
}
