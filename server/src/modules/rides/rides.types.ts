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
