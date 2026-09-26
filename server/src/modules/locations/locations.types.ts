export interface LocationDto {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface RouteStopDto {
  locationId: number;
  position: number;
}

export interface RouteDto {
  id: number;
  code: string;
  name: string;
  stops: RouteStopDto[];
}

export interface ServedPairDto {
  pickupLocationId: number;
  destLocationId: number;
  distanceM: number;
  routeIds: number[];
}

export interface LocationsCatalogResponse {
  locations: LocationDto[];
  routes: RouteDto[];
  servedPairs: ServedPairDto[];
}

export interface RoutePairValidationResult {
  isServed: boolean;
  distanceM: number;
  routeId: number;
}
