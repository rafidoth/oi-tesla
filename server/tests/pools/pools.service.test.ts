import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoolsService } from '../../src/modules/pools/pools.service.js';
import type { PoolsRepository } from '../../src/modules/pools/pools.repository.js';
import type { LocationsRepository, RouteWithStops } from '../../src/modules/locations/locations.repository.js';
import type { LocationsService } from '../../src/modules/locations/locations.service.js';
import type { EventsService } from '../../src/modules/events/events.service.js';
import { FareCalculator } from '../../src/modules/pools/domain/FareCalculator.js';
import type { CandidatePoolData } from '../../src/modules/pools/domain/MatchingEngine.js';
import type { PoolRow } from '../../src/modules/pools/pools.repository.js';
import type { SeatGuard } from '../../src/modules/pools/domain/SeatGuard.js';
import { ConflictError } from '../../src/shared/errors/ConflictError.js';
import { NotFoundError } from '../../src/shared/errors/NotFoundError.js';
import { ForbiddenError } from '../../src/shared/errors/ForbiddenError.js';
import { InvalidTransitionError } from '../../src/shared/errors/InvalidTransitionError.js';

describe('PoolsService Unit Tests', () => {
  let mockPoolsRepo: Partial<PoolsRepository>;
  let mockLocationsRepo: Partial<LocationsRepository>;
  let poolsService: PoolsService;

  const mockRoutes: RouteWithStops[] = [
    {
      id: 1,
      code: 'banani-south',
      name: 'Banani to Mohakhali via Gulshan',
      stops: [
        { id: 1, routeId: 1, locationId: 2, position: 1 },
        { id: 2, routeId: 1, locationId: 3, position: 2 },
        { id: 3, routeId: 1, locationId: 4, position: 3 },
      ],
    },
  ];

  beforeEach(() => {
    mockLocationsRepo = {
      findAllRoutesWithStops: vi.fn().mockResolvedValue(mockRoutes),
    };
  });

  it('returns existing compatible pool with isNew: false when a compatible candidate is found', async () => {
    const existingCandidate: CandidatePoolData = {
      id: 'pool-existing-1',
      pickupLocationId: 2,
      occupiedSeats: 1,
      capacity: 3,
      status: 'OPEN',
      memberDestLocationIds: [3], // Gulshan
      createdAt: new Date('2026-09-26T10:00:00Z'),
    };

    mockPoolsRepo = {
      findCandidatePools: vi.fn().mockResolvedValue([existingCandidate]),
      createPool: vi.fn(),
    };

    poolsService = new PoolsService(
      mockPoolsRepo as PoolsRepository,
      mockLocationsRepo as LocationsRepository
    );

    const result = await poolsService.findOrCreatePool({
      pickupLocationId: 2,
      destLocationId: 4, // Mohakhali (compatible on C1)
      seats: 1,
    });

    expect(result.isNew).toBe(false);
    expect(result.pool.id).toBe('pool-existing-1');
    expect(mockPoolsRepo.createPool).not.toHaveBeenCalled();
  });

  it('creates a new pool with isNew: true when no candidate pools exist', async () => {
    const createdRow: PoolRow = {
      id: 'pool-new-1',
      pickupLocationId: 2,
      status: 'OPEN',
      driverId: null,
      vehicleId: null,
      capacity: 3,
      occupiedSeats: 0,
      createdAt: new Date('2026-09-26T10:00:00Z'),
      updatedAt: new Date('2026-09-26T10:00:00Z'),
    };

    mockPoolsRepo = {
      findCandidatePools: vi.fn().mockResolvedValue([]),
      createPool: vi.fn().mockResolvedValue(createdRow),
    };

    poolsService = new PoolsService(
      mockPoolsRepo as PoolsRepository,
      mockLocationsRepo as LocationsRepository
    );

    const result = await poolsService.findOrCreatePool({
      pickupLocationId: 2,
      destLocationId: 3,
      seats: 1,
    });

    expect(result.isNew).toBe(true);
    expect(result.pool.id).toBe('pool-new-1');
    expect(mockPoolsRepo.createPool).toHaveBeenCalledWith({
      pickupLocationId: 2,
    });
  });

  it('creates a new pool with isNew: true when existing candidates are not compatible', async () => {
    const incompatibleCandidate: CandidatePoolData = {
      id: 'pool-full',
      pickupLocationId: 2,
      occupiedSeats: 3,
      capacity: 3,
      status: 'OPEN',
      memberDestLocationIds: [3],
      createdAt: new Date('2026-09-26T10:00:00Z'),
    };

    const createdRow: PoolRow = {
      id: 'pool-new-2',
      pickupLocationId: 2,
      status: 'OPEN',
      driverId: null,
      vehicleId: null,
      capacity: 3,
      occupiedSeats: 0,
      createdAt: new Date('2026-09-26T10:01:00Z'),
      updatedAt: new Date('2026-09-26T10:01:00Z'),
    };

    mockPoolsRepo = {
      findCandidatePools: vi.fn().mockResolvedValue([incompatibleCandidate]),
      createPool: vi.fn().mockResolvedValue(createdRow),
    };

    poolsService = new PoolsService(
      mockPoolsRepo as PoolsRepository,
      mockLocationsRepo as LocationsRepository
    );

    const result = await poolsService.findOrCreatePool({
      pickupLocationId: 2,
      destLocationId: 3,
      seats: 1,
    });

    expect(result.isNew).toBe(true);
    expect(result.pool.id).toBe('pool-new-2');
    expect(mockPoolsRepo.createPool).toHaveBeenCalledWith({
      pickupLocationId: 2,
    });
  });

  describe('joinPoolWithFallback', () => {
    it('reserves seats on first compatible candidate when available and returns isNew: false', async () => {
      const candidate: CandidatePoolData = {
        id: 'pool-cand-1',
        pickupLocationId: 2,
        occupiedSeats: 1,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const mockSeatGuard = {
        reserveSeats: vi.fn().mockResolvedValue(undefined),
        releaseSeats: vi.fn(),
      };

      mockPoolsRepo = {
        findCandidatePools: vi.fn().mockResolvedValue([candidate]),
        createPool: vi.fn(),
      };

      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository,
        mockSeatGuard as unknown as SeatGuard
      );

      const result = await poolsService.joinPoolWithFallback({
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
      });

      expect(result.isNew).toBe(false);
      expect(result.poolId).toBe('pool-cand-1');
      expect(mockSeatGuard.reserveSeats).toHaveBeenCalledWith('pool-cand-1', 1, undefined);
      expect(mockPoolsRepo.createPool).not.toHaveBeenCalled();
    });

    it('falls back to next compatible candidate when the first candidate experiences a race condition (POOL_FULL)', async () => {
      const candidate1: CandidatePoolData = {
        id: 'pool-cand-1',
        pickupLocationId: 2,
        occupiedSeats: 2,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const candidate2: CandidatePoolData = {
        id: 'pool-cand-2',
        pickupLocationId: 2,
        occupiedSeats: 1,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:01:00Z'),
      };

      const mockSeatGuard = {
        reserveSeats: vi
          .fn()
          .mockRejectedValueOnce(
            new ConflictError('POOL_FULL', 'Pool has no free seats', {
              poolId: 'pool-cand-1',
              requestedSeats: 1,
            })
          )
          .mockResolvedValueOnce(undefined),
        releaseSeats: vi.fn(),
      };

      mockPoolsRepo = {
        findCandidatePools: vi.fn().mockResolvedValue([candidate1, candidate2]),
        createPool: vi.fn(),
      };

      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository,
        mockSeatGuard as unknown as SeatGuard
      );

      const result = await poolsService.joinPoolWithFallback({
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
      });

      expect(result.isNew).toBe(false);
      expect(result.poolId).toBe('pool-cand-2');
      expect(mockSeatGuard.reserveSeats).toHaveBeenCalledTimes(2);
      expect(mockSeatGuard.reserveSeats).toHaveBeenNthCalledWith(1, 'pool-cand-1', 1, undefined);
      expect(mockSeatGuard.reserveSeats).toHaveBeenNthCalledWith(2, 'pool-cand-2', 1, undefined);
      expect(mockPoolsRepo.createPool).not.toHaveBeenCalled();
    });

    it('creates a new pool and reserves seats when all compatible candidates fail due to race conditions (POOL_FULL)', async () => {
      const candidate1: CandidatePoolData = {
        id: 'pool-cand-1',
        pickupLocationId: 2,
        occupiedSeats: 2,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const createdRow: PoolRow = {
        id: 'pool-fallback-new',
        pickupLocationId: 2,
        status: 'OPEN',
        driverId: null,
        vehicleId: null,
        capacity: 3,
        occupiedSeats: 0,
        createdAt: new Date('2026-09-26T10:02:00Z'),
        updatedAt: new Date('2026-09-26T10:02:00Z'),
      };

      const mockSeatGuard = {
        reserveSeats: vi
          .fn()
          .mockRejectedValueOnce(
            new ConflictError('POOL_FULL', 'Pool has no free seats', {
              poolId: 'pool-cand-1',
              requestedSeats: 1,
            })
          )
          .mockResolvedValueOnce(undefined), // For the newly created pool
        releaseSeats: vi.fn(),
      };

      mockPoolsRepo = {
        findCandidatePools: vi.fn().mockResolvedValue([candidate1]),
        createPool: vi.fn().mockResolvedValue(createdRow),
      };

      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository,
        mockSeatGuard as unknown as SeatGuard
      );

      const result = await poolsService.joinPoolWithFallback({
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
      });

      expect(result.isNew).toBe(true);
      expect(result.poolId).toBe('pool-fallback-new');
      expect(mockPoolsRepo.createPool).toHaveBeenCalledWith({
        pickupLocationId: 2,
      }, undefined);
      expect(mockSeatGuard.reserveSeats).toHaveBeenNthCalledWith(
        2,
        'pool-fallback-new',
        1,
        undefined
      );
    });

    it('creates a new pool and reserves seats when no candidates exist', async () => {
      const createdRow: PoolRow = {
        id: 'pool-first-ever',
        pickupLocationId: 2,
        status: 'OPEN',
        driverId: null,
        vehicleId: null,
        capacity: 3,
        occupiedSeats: 0,
        createdAt: new Date('2026-09-26T10:00:00Z'),
        updatedAt: new Date('2026-09-26T10:00:00Z'),
      };

      const mockSeatGuard = {
        reserveSeats: vi.fn().mockResolvedValue(undefined),
        releaseSeats: vi.fn(),
      };

      mockPoolsRepo = {
        findCandidatePools: vi.fn().mockResolvedValue([]),
        createPool: vi.fn().mockResolvedValue(createdRow),
      };

      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository,
        mockSeatGuard as unknown as SeatGuard
      );

      const result = await poolsService.joinPoolWithFallback({
        pickupLocationId: 2,
        destLocationId: 3,
        seats: 2,
      });

      expect(result.isNew).toBe(true);
      expect(result.poolId).toBe('pool-first-ever');
      expect(mockPoolsRepo.createPool).toHaveBeenCalledWith({
        pickupLocationId: 2,
      }, undefined);
      expect(mockSeatGuard.reserveSeats).toHaveBeenCalledWith('pool-first-ever', 2, undefined);
    });

    it('rethrows unexpected non-ConflictError without suppressing it', async () => {
      const candidate: CandidatePoolData = {
        id: 'pool-cand-1',
        pickupLocationId: 2,
        occupiedSeats: 1,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const mockSeatGuard = {
        reserveSeats: vi.fn().mockRejectedValue(new Error('Database connection lost')),
        releaseSeats: vi.fn(),
      };

      mockPoolsRepo = {
        findCandidatePools: vi.fn().mockResolvedValue([candidate]),
        createPool: vi.fn(),
      };

      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository,
        mockSeatGuard as unknown as SeatGuard
      );

      await expect(
        poolsService.joinPoolWithFallback({
          pickupLocationId: 2,
          destLocationId: 4,
          seats: 1,
        })
      ).rejects.toThrow('Database connection lost');

      expect(mockPoolsRepo.createPool).not.toHaveBeenCalled();
    });
  });

  describe('recalculatePoolFares', () => {
    let mockLocationsService: { getDistance: ReturnType<typeof vi.fn> };
    let mockEventsService: { logRideEvent: ReturnType<typeof vi.fn> };
    const t1 = new Date('2026-09-26T08:00:00Z');
    const t2 = new Date('2026-09-26T08:01:00Z');
    const t3 = new Date('2026-09-26T08:02:00Z');

    beforeEach(() => {
      mockLocationsService = {
        getDistance: vi.fn(),
      };
      mockEventsService = {
        logRideEvent: vi.fn().mockResolvedValue({} as any),
      };
    });

    it('returns empty Map when active members is empty', async () => {
      mockPoolsRepo = {
        findActiveMembersWithLegLocations: vi.fn().mockResolvedValue([]),
        updateMemberFares: vi.fn(),
      };

      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository,
        undefined,
        mockLocationsService as unknown as LocationsService,
        mockEventsService as unknown as EventsService
      );

      const shares = await poolsService.recalculatePoolFares('pool-empty-1');

      expect(shares.size).toBe(0);
      expect(mockPoolsRepo.updateMemberFares).not.toHaveBeenCalled();
      expect(mockEventsService.logRideEvent).not.toHaveBeenCalled();
    });

    it('calculates solo fare for single member and persists update and event', async () => {
      const activeMembers = [
        {
          passengerRideId: 'ride-nusrat',
          passengerId: 'p-nusrat',
          pickupLocationId: 2, // Banani
          destLocationId: 4,   // Mohakhali
          createdAt: t1,
          currentFarePaisa: null,
        },
      ];

      mockPoolsRepo = {
        findActiveMembersWithLegLocations: vi.fn().mockResolvedValue(activeMembers),
        updateMemberFares: vi.fn().mockResolvedValue(undefined),
      };

      mockLocationsService.getDistance.mockResolvedValue(5000); // 5000m

      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository,
        undefined,
        mockLocationsService as unknown as LocationsService,
        mockEventsService as unknown as EventsService
      );

      const mockTx = { txId: 'test-tx' };
      const shares = await poolsService.recalculatePoolFares('pool-1', mockTx);

      expect(mockPoolsRepo.findActiveMembersWithLegLocations).toHaveBeenCalledWith('pool-1', mockTx);
      expect(mockLocationsService.getDistance).toHaveBeenCalledWith(2, 4);
      expect(shares.get('ride-nusrat')).toBe(15000);
      expect(mockPoolsRepo.updateMemberFares).toHaveBeenCalledWith(
        [{ passengerRideId: 'ride-nusrat', farePaisa: 15000 }],
        mockTx
      );
      expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
        {
          event: 'FARE_RECALCULATED',
          actorType: 'SYSTEM',
          poolId: 'pool-1',
          payload: {
            poolTotal: 15000,
            memberFares: { 'ride-nusrat': 15000 },
          },
        },
        mockTx
      );
    });

    it('correctly executes PRD Section 18 3-passenger sequential pooling scenario', async () => {
      // 1. Nusrat: Banani -> Mohakhali (5000m)
      // 2. Rafiq: Banani -> Gulshan (2000m)
      // 3. Shirin: Banani -> Gulshan (2000m)
      const member1 = {
        passengerRideId: 'ride-nusrat',
        passengerId: 'p-nusrat',
        pickupLocationId: 2,
        destLocationId: 4,
        createdAt: t1,
        currentFarePaisa: null,
      };
      const member2 = {
        passengerRideId: 'ride-rafiq',
        passengerId: 'p-rafiq',
        pickupLocationId: 2,
        destLocationId: 3,
        createdAt: t2,
        currentFarePaisa: null,
      };
      const member3 = {
        passengerRideId: 'ride-shirin',
        passengerId: 'p-shirin',
        pickupLocationId: 2,
        destLocationId: 3,
        createdAt: t3,
        currentFarePaisa: null,
      };

      mockLocationsService.getDistance.mockImplementation(async (_from, to) => {
        if (to === 4) return 5000;
        if (to === 3) return 2000;
        return 0;
      });

      // --- Stage 1: Nusrat solo ---
      mockPoolsRepo = {
        findActiveMembersWithLegLocations: vi.fn().mockResolvedValue([member1]),
        updateMemberFares: vi.fn().mockResolvedValue(undefined),
      };
      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository,
        undefined,
        mockLocationsService as unknown as LocationsService,
        mockEventsService as unknown as EventsService
      );
      const stage1Shares = await poolsService.recalculatePoolFares('pool-rush-hour');
      expect(stage1Shares.get('ride-nusrat')).toBe(15000);

      // --- Stage 2: Rafiq joins ---
      mockPoolsRepo.findActiveMembersWithLegLocations = vi.fn().mockResolvedValue([member1, member2]);
      const stage2Shares = await poolsService.recalculatePoolFares('pool-rush-hour');
      expect(stage2Shares.get('ride-nusrat')).toBe(10714);
      expect(stage2Shares.get('ride-rafiq')).toBe(4286);
      expect(stage2Shares.get('ride-nusrat')! + stage2Shares.get('ride-rafiq')!).toBe(15000);
      expect(mockPoolsRepo.updateMemberFares).toHaveBeenCalledWith(
        [
          { passengerRideId: 'ride-nusrat', farePaisa: 10714 },
          { passengerRideId: 'ride-rafiq', farePaisa: 4286 },
        ],
        undefined
      );

      // --- Stage 3: Shirin joins ---
      mockPoolsRepo.findActiveMembersWithLegLocations = vi.fn().mockResolvedValue([member1, member2, member3]);
      const stage3Shares = await poolsService.recalculatePoolFares('pool-rush-hour');
      expect(stage3Shares.get('ride-nusrat')).toBe(8334);
      expect(stage3Shares.get('ride-rafiq')).toBe(3333);
      expect(stage3Shares.get('ride-shirin')).toBe(3333);
      expect(
        stage3Shares.get('ride-nusrat')! +
        stage3Shares.get('ride-rafiq')! +
        stage3Shares.get('ride-shirin')!
      ).toBe(15000);
    });
  });

  describe('transitionPool', () => {
    it('throws NotFoundError if pool does not exist', async () => {
      mockPoolsRepo = {
        findPoolById: vi.fn().mockResolvedValue(null),
      };
      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository
      );

      await expect(
        poolsService.transitionPool('missing-id', 'arrive', { id: 'd-1', role: 'DRIVER' })
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError if actor is DRIVER but driverId does not match pool.driverId', async () => {
      mockPoolsRepo = {
        findPoolById: vi.fn().mockResolvedValue({
          id: 'pool-1',
          driverId: 'assigned-driver-id',
          status: 'MATCHED',
        }),
      };
      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository
      );

      await expect(
        poolsService.transitionPool('pool-1', 'arrive', { id: 'foreign-driver-id', role: 'DRIVER' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws ForbiddenError if actor is DRIVER and pool.driverId is null', async () => {
      mockPoolsRepo = {
        findPoolById: vi.fn().mockResolvedValue({
          id: 'pool-1',
          driverId: null,
          status: 'OPEN',
        }),
      };
      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository
      );

      await expect(
        poolsService.transitionPool('pool-1', 'arrive', { id: 'driver-id', role: 'DRIVER' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws InvalidTransitionError on invalid transition attempt', async () => {
      mockPoolsRepo = {
        findPoolById: vi.fn().mockResolvedValue({
          id: 'pool-1',
          driverId: 'driver-1',
          status: 'MATCHED',
        }),
      };
      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository
      );

      await expect(
        poolsService.transitionPool('pool-1', 'start', { id: 'driver-1', role: 'DRIVER' })
      ).rejects.toThrow(InvalidTransitionError);
    });

    it('successfully transitions pool status and updates repository', async () => {
      mockPoolsRepo = {
        findPoolById: vi.fn().mockResolvedValue({
          id: 'pool-1',
          driverId: 'driver-1',
          status: 'MATCHED',
        }),
        updatePoolStatus: vi.fn().mockResolvedValue(undefined),
      };
      poolsService = new PoolsService(
        mockPoolsRepo as PoolsRepository,
        mockLocationsRepo as LocationsRepository
      );

      const result = await poolsService.transitionPool('pool-1', 'arrive', {
        id: 'driver-1',
        role: 'DRIVER',
      });

      expect(result).toEqual({
        poolId: 'pool-1',
        previousStatus: 'MATCHED',
        newStatus: 'DRIVER_ARRIVED',
        action: 'arrive',
      });
      expect(mockPoolsRepo.updatePoolStatus).toHaveBeenCalledWith('pool-1', 'DRIVER_ARRIVED', undefined);
    });
  });
});
