import pino from 'pino';
import { PoolsRepository } from './pools.repository.js';
import { LocationsRepository } from '../locations/locations.repository.js';
import { LocationsService } from '../locations/locations.service.js';
import { MatchingEngine, type MatchRequest } from './domain/MatchingEngine.js';
import { Pool } from './domain/Pool.js';
import { SeatGuard } from './domain/SeatGuard.js';
import { FareCalculator } from './domain/FareCalculator.js';
import type { EventsService } from '../events/events.service.js';
import { ConflictError } from '../../shared/errors/ConflictError.js';

const logger = pino();

export interface FindOrCreatePoolResult {
  pool: Pool;
  isNew: boolean;
}

export interface JoinPoolResult {
  poolId: string;
  isNew: boolean;
}

export class PoolsService {
  private readonly seatGuard: SeatGuard;
  private readonly locationsService: LocationsService;
  private readonly fareCalculator: FareCalculator;

  constructor(
    private readonly poolsRepo: PoolsRepository,
    private readonly locationsRepo: LocationsRepository,
    seatGuard?: SeatGuard,
    locationsService?: LocationsService,
    private readonly eventsService?: EventsService,
    fareCalculator?: FareCalculator
  ) {
    this.seatGuard = seatGuard ?? new SeatGuard(poolsRepo);
    this.locationsService = locationsService ?? new LocationsService(locationsRepo);
    this.fareCalculator = fareCalculator ?? new FareCalculator();
  }

  /**
   * Finds an existing compatible pool or creates a new one deterministically.
   */
  async findOrCreatePool(request: MatchRequest): Promise<FindOrCreatePoolResult> {
    const routes = await this.locationsRepo.findAllRoutesWithStops();
    const matchingEngine = new MatchingEngine(routes);

    const candidates = await this.poolsRepo.findCandidatePools(
      request.pickupLocationId,
      request.seats
    );

    const compatiblePool = matchingEngine.findCompatiblePool(candidates, request);

    if (compatiblePool) {
      return {
        pool: new Pool(compatiblePool),
        isNew: false,
      };
    }

    const createdPool = await this.poolsRepo.createPool({
      pickupLocationId: request.pickupLocationId,
    });

    return {
      pool: new Pool(createdPool),
      isNew: true,
    };
  }

  /**
   * Concurrency-safe pool join with reservation and fallback.
   * Attempts to reserve seats on compatible candidates in priority order.
   * If a candidate pool fills up concurrently (POOL_FULL), falls back to the next candidate.
   * If no candidate succeeds, creates a new pool and reserves seats on it.
   */
  async joinPoolWithFallback(
    request: { pickupLocationId: number; destLocationId: number; seats: number },
    tx?: any
  ): Promise<JoinPoolResult> {
    const routes = await this.locationsRepo.findAllRoutesWithStops();
    const matchingEngine = new MatchingEngine(routes);

    const candidates = await this.poolsRepo.findCandidatePools(
      request.pickupLocationId,
      request.seats,
      tx
    );

    const compatibleCandidates = matchingEngine.findCompatiblePools(candidates, request);

    for (const candidate of compatibleCandidates) {
      try {
        await this.seatGuard.reserveSeats(candidate.id, request.seats, tx);
        return {
          poolId: candidate.id,
          isNew: false,
        };
      } catch (err) {
        if (err instanceof ConflictError && err.code === 'POOL_FULL') {
          logger.warn(
            { poolId: candidate.id, requestedSeats: request.seats, err },
            'Candidate pool became full during seat reservation race, attempting next candidate'
          );
          continue;
        }
        throw err;
      }
    }

    const createdPool = await this.poolsRepo.createPool(
      {
        pickupLocationId: request.pickupLocationId,
      },
      tx
    );

    await this.seatGuard.reserveSeats(createdPool.id, request.seats, tx);

    return {
      poolId: createdPool.id,
      isNew: true,
    };
  }

  /**
   * Recalculates proportional pool shares for all active members based on largest-remainder integer math.
   * Updates passenger_rides in the database and logs a FARE_RECALCULATED event.
   */
  async recalculatePoolFares(poolId: string, tx?: any): Promise<Map<string, number>> {
    // 1. activeMembers = await poolsRepo.findActiveMembersWithLegLocations(poolId, tx)
    const activeMembers = await this.poolsRepo.findActiveMembersWithLegLocations(poolId, tx);

    // 2. If empty, return new Map()
    if (activeMembers.length === 0) {
      return new Map();
    }

    // 3. For each member, compute legDistanceM = await locationsService.getDistance(member.pickupLocationId, member.destLocationId)
    const membersWithLegs = await Promise.all(
      activeMembers.map(async (member) => {
        const legDistanceM = await this.locationsService.getDistance(
          member.pickupLocationId,
          member.destLocationId
        );
        return {
          id: member.passengerRideId,
          legDistanceM,
          createdAt: member.createdAt,
        };
      })
    );

    // 4. maxLeg = Math.max(...legs)
    const legs = membersWithLegs.map((m) => m.legDistanceM);
    const maxLeg = Math.max(...legs);

    // 5. poolTotal = fareCalculator.computePoolTotal(maxLeg)
    const poolTotal = this.fareCalculator.computePoolTotal(maxLeg);

    // 6. shares = fareCalculator.splitFares(membersWithLegs, poolTotal)
    const shares = this.fareCalculator.splitFares(membersWithLegs, poolTotal);

    // 7. updates = Array.from(shares.entries()).map(([passengerRideId, farePaisa]) => ({ passengerRideId, farePaisa }))
    const updates = Array.from(shares.entries()).map(([passengerRideId, farePaisa]) => ({
      passengerRideId,
      farePaisa,
    }));

    // 8. await poolsRepo.updateMemberFares(updates, tx)
    await this.poolsRepo.updateMemberFares(updates, tx);

    // 9. await eventsService.logRideEvent({ event: 'FARE_RECALCULATED', actorType: 'SYSTEM', poolId, payload: { poolTotal, memberFares: Object.fromEntries(shares) } }, tx)
    if (this.eventsService) {
      await this.eventsService.logRideEvent(
        {
          event: 'FARE_RECALCULATED',
          actorType: 'SYSTEM',
          poolId,
          payload: {
            poolTotal,
            memberFares: Object.fromEntries(shares),
          },
        },
        tx
      );
    }

    // 10. Return shares
    return shares;
  }
}

export default PoolsService;
