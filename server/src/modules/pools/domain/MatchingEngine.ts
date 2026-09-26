export interface RouteStopData {
  locationId: number;
  position: number;
}

export interface RouteData {
  id: number;
  code: string;
  stops: RouteStopData[];
}

export interface CandidatePoolData {
  id: string;
  pickupLocationId: number;
  occupiedSeats: number;
  capacity: number;
  status: string;
  memberDestLocationIds: number[];
  createdAt: Date;
  driverId?: string | null;
  vehicleId?: string | null;
  updatedAt?: Date;
}

export interface MatchRequest {
  pickupLocationId: number;
  destLocationId: number;
  seats: number;
}

export class MatchingEngine {
  constructor(private readonly routes: RouteData[]) {}

  /**
   * Finds all compatible pools from candidates for the match request,
   * maintaining their original priority order.
   */
  findCompatiblePools(
    candidates: CandidatePoolData[],
    request: MatchRequest
  ): CandidatePoolData[] {
    return candidates.filter((candidate) => this.isCandidateCompatible(candidate, request));
  }

  /**
   * Finds the first compatible pool from candidates for the match request.
   * Candidates must be provided in deterministic priority order (createdAt ASC, id ASC).
   */
  findCompatiblePool(
    candidates: CandidatePoolData[],
    request: MatchRequest
  ): CandidatePoolData | null {
    return this.findCompatiblePools(candidates, request)[0] ?? null;
  }

  private isCandidateCompatible(
    candidate: CandidatePoolData,
    request: MatchRequest
  ): boolean {
    // 1. Same pickup location (D11 - no mid-chain pickups)
    if (candidate.pickupLocationId !== request.pickupLocationId) {
      return false;
    }

    // 2. Pool status allows joining (D3: OPEN or MATCHED)
    if (!['OPEN', 'MATCHED'].includes(candidate.status)) {
      return false;
    }

    // 3. Capacity guard: occupiedSeats + request.seats <= capacity
    if (candidate.occupiedSeats + request.seats > candidate.capacity) {
      return false;
    }

    // 4. All-Pairs Compatibility:
    // Finds if there exists a single route R containing pickupLocationId such that:
    // - request.destLocationId is on R and destStop.position > pickupStop.position
    // - AND for EVERY memberDestId in candidate.memberDestLocationIds:
    //   memberDestId is on R and memberDestStop.position > pickupStop.position
    return this.hasCompatibleRoute(
      request.pickupLocationId,
      request.destLocationId,
      candidate.memberDestLocationIds
    );
  }

  private hasCompatibleRoute(
    pickupLocationId: number,
    destLocationId: number,
    memberDestLocationIds: number[]
  ): boolean {
    return this.routes.some((route) => {
      const pickupStop = route.stops.find((s) => s.locationId === pickupLocationId);
      if (!pickupStop) {
        return false;
      }

      const destStop = route.stops.find((s) => s.locationId === destLocationId);
      if (!destStop || destStop.position <= pickupStop.position) {
        return false;
      }

      for (const memberDestId of memberDestLocationIds) {
        const memberStop = route.stops.find((s) => s.locationId === memberDestId);
        if (!memberStop || memberStop.position <= pickupStop.position) {
          return false;
        }
      }

      return true;
    });
  }
}

export default MatchingEngine;
