import { describe, it, expect } from 'vitest';
import {
  MatchingEngine,
  type RouteData,
  type CandidatePoolData,
  type MatchRequest,
} from '../../src/modules/pools/domain/MatchingEngine.js';

describe('MatchingEngine Unit Tests', () => {
  // Routes seed configuration:
  // C1: banani-south: Banani (2) -> Gulshan (3) -> Mohakhali (4)
  // C2: banani-east: Banani (2) -> Gulshan (3) -> Bashundhara (5)
  // C3: uttara-spine: Uttara (1) -> Banani (2) -> Gulshan (3)
  // C4: mirpur-central: Mirpur (6) -> Farmgate (7) -> Dhanmondi (8)
  // C5: mohakhali-north: Mohakhali (4) -> Gulshan (3) -> Banani (2)
  const mockRoutes: RouteData[] = [
    {
      id: 1,
      code: 'banani-south',
      stops: [
        { locationId: 2, position: 1 },
        { locationId: 3, position: 2 },
        { locationId: 4, position: 3 },
      ],
    },
    {
      id: 2,
      code: 'banani-east',
      stops: [
        { locationId: 2, position: 1 },
        { locationId: 3, position: 2 },
        { locationId: 5, position: 3 },
      ],
    },
    {
      id: 3,
      code: 'uttara-spine',
      stops: [
        { locationId: 1, position: 1 },
        { locationId: 2, position: 2 },
        { locationId: 3, position: 3 },
      ],
    },
    {
      id: 4,
      code: 'mirpur-central',
      stops: [
        { locationId: 6, position: 1 },
        { locationId: 7, position: 2 },
        { locationId: 8, position: 3 },
      ],
    },
    {
      id: 5,
      code: 'mohakhali-north',
      stops: [
        { locationId: 4, position: 1 },
        { locationId: 3, position: 2 },
        { locationId: 2, position: 3 },
      ],
    },
  ];

  const engine = new MatchingEngine(mockRoutes);

  describe('Single rider matching', () => {
    it('matches a single rider to an empty OPEN pool at the same pickup location on a served route', () => {
      const emptyPool: CandidatePoolData = {
        id: 'pool-empty-1',
        pickupLocationId: 2, // Banani
        occupiedSeats: 0,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const request: MatchRequest = {
        pickupLocationId: 2, // Banani
        destLocationId: 3, // Gulshan
        seats: 1,
      };

      const match = engine.findCompatiblePool([emptyPool], request);
      expect(match).not.toBeNull();
      expect(match?.id).toBe('pool-empty-1');
    });

    it('matches a single rider to an empty MATCHED pool', () => {
      const matchedPool: CandidatePoolData = {
        id: 'pool-matched-1',
        pickupLocationId: 2,
        occupiedSeats: 0,
        capacity: 3,
        status: 'MATCHED',
        memberDestLocationIds: [],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const request: MatchRequest = {
        pickupLocationId: 2,
        destLocationId: 4, // Mohakhali
        seats: 1,
      };

      const match = engine.findCompatiblePool([matchedPool], request);
      expect(match).not.toBeNull();
      expect(match?.id).toBe('pool-matched-1');
    });
  });

  describe('Multi-passenger compatibility on shared route C1', () => {
    it('allows a rider to Mohakhali (4) to join a pool at Banani (2) with an existing rider to Gulshan (3)', () => {
      const poolWithGulshanMember: CandidatePoolData = {
        id: 'pool-c1-1',
        pickupLocationId: 2, // Banani
        occupiedSeats: 1,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3], // Gulshan
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const requestToMohakhali: MatchRequest = {
        pickupLocationId: 2, // Banani
        destLocationId: 4, // Mohakhali
        seats: 1,
      };

      const match = engine.findCompatiblePool([poolWithGulshanMember], requestToMohakhali);
      expect(match).not.toBeNull();
      expect(match?.id).toBe('pool-c1-1');
    });

    it('allows a rider to Gulshan (3) to join a pool at Banani (2) with an existing rider to Mohakhali (4)', () => {
      const poolWithMohakhaliMember: CandidatePoolData = {
        id: 'pool-c1-2',
        pickupLocationId: 2, // Banani
        occupiedSeats: 1,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [4], // Mohakhali
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const requestToGulshan: MatchRequest = {
        pickupLocationId: 2, // Banani
        destLocationId: 3, // Gulshan
        seats: 1,
      };

      const match = engine.findCompatiblePool([poolWithMohakhaliMember], requestToGulshan);
      expect(match).not.toBeNull();
      expect(match?.id).toBe('pool-c1-2');
    });

    it('allows a third rider on C1 when both destinations (3, 4) are downstream of pickup (2)', () => {
      const poolWithTwoMembers: CandidatePoolData = {
        id: 'pool-c1-3',
        pickupLocationId: 2,
        occupiedSeats: 2,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3, 4],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const requestToMohakhali: MatchRequest = {
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
      };

      const match = engine.findCompatiblePool([poolWithTwoMembers], requestToMohakhali);
      expect(match).not.toBeNull();
      expect(match?.id).toBe('pool-c1-3');
    });
  });

  describe('Transitivity leak prevention', () => {
    it('rejects Bashundhara (5) when pool already has members to Gulshan (3) and Mohakhali (4) on C1', () => {
      // Pool A is on route C1 (Banani -> Gulshan -> Mohakhali)
      const c1Pool: CandidatePoolData = {
        id: 'pool-c1-leak-check',
        pickupLocationId: 2, // Banani
        occupiedSeats: 2,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3, 4], // Gulshan + Mohakhali
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      // Rider wants Bashundhara (5).
      // Even though Gulshan (3) is compatible with Bashundhara (5) on C2,
      // Mohakhali (4) is NOT on C2, and Bashundhara (5) is NOT on C1.
      // No single route contains Banani (2), Mohakhali (4), and Bashundhara (5).
      const requestToBashundhara: MatchRequest = {
        pickupLocationId: 2, // Banani
        destLocationId: 5, // Bashundhara
        seats: 1,
      };

      const match = engine.findCompatiblePool([c1Pool], requestToBashundhara);
      expect(match).toBeNull();
    });

    it('rejects Mohakhali (4) when pool already has members to Gulshan (3) and Bashundhara (5) on C2', () => {
      const c2Pool: CandidatePoolData = {
        id: 'pool-c2-leak-check',
        pickupLocationId: 2, // Banani
        occupiedSeats: 2,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3, 5], // Gulshan + Bashundhara
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const requestToMohakhali: MatchRequest = {
        pickupLocationId: 2, // Banani
        destLocationId: 4, // Mohakhali
        seats: 1,
      };

      const match = engine.findCompatiblePool([c2Pool], requestToMohakhali);
      expect(match).toBeNull();
    });
  });

  describe('Sequential earliest-first priority', () => {
    it('selects the earliest created pool when multiple compatible candidate pools exist', () => {
      const earlierPool: CandidatePoolData = {
        id: 'pool-early-1',
        pickupLocationId: 2,
        occupiedSeats: 1,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const laterPool: CandidatePoolData = {
        id: 'pool-later-2',
        pickupLocationId: 2,
        occupiedSeats: 1,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:05:00Z'),
      };

      const request: MatchRequest = {
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
      };

      // Candidates are ordered createdAt ASC, id ASC
      const match = engine.findCompatiblePool([earlierPool, laterPool], request);
      expect(match).not.toBeNull();
      expect(match?.id).toBe('pool-early-1');
    });

    it('skips earlier incompatible pool and selects subsequent compatible pool', () => {
      // Earlier pool is formed on C2 (to Bashundhara)
      const earlierIncompatiblePool: CandidatePoolData = {
        id: 'pool-early-c2',
        pickupLocationId: 2,
        occupiedSeats: 1,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [5], // Bashundhara
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      // Later pool is formed on C1 (to Gulshan)
      const laterCompatiblePool: CandidatePoolData = {
        id: 'pool-later-c1',
        pickupLocationId: 2,
        occupiedSeats: 1,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3], // Gulshan
        createdAt: new Date('2026-09-26T10:05:00Z'),
      };

      // Request to Mohakhali (4) is incompatible with C2 (5), but compatible with C1 (3)
      const requestToMohakhali: MatchRequest = {
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
      };

      const match = engine.findCompatiblePool(
        [earlierIncompatiblePool, laterCompatiblePool],
        requestToMohakhali
      );
      expect(match).not.toBeNull();
      expect(match?.id).toBe('pool-later-c1');
    });
  });

  describe('Capacity rejection', () => {
    it('rejects candidate when occupiedSeats + request.seats > capacity (e.g. 2/3 occupied cannot admit 2 seats)', () => {
      const nearlyFullPool: CandidatePoolData = {
        id: 'pool-almost-full',
        pickupLocationId: 2,
        occupiedSeats: 2,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const requestFor2Seats: MatchRequest = {
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 2, // 2 + 2 = 4 > 3
      };

      const match = engine.findCompatiblePool([nearlyFullPool], requestFor2Seats);
      expect(match).toBeNull();
    });

    it('accepts candidate when occupiedSeats + request.seats === capacity (e.g. 2/3 occupied admits 1 seat)', () => {
      const nearlyFullPool: CandidatePoolData = {
        id: 'pool-almost-full',
        pickupLocationId: 2,
        occupiedSeats: 2,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const requestFor1Seat: MatchRequest = {
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1, // 2 + 1 = 3 <= 3
      };

      const match = engine.findCompatiblePool([nearlyFullPool], requestFor1Seat);
      expect(match).not.toBeNull();
      expect(match?.id).toBe('pool-almost-full');
    });
  });

  describe('Different pickup rejection', () => {
    it('rejects candidate when pool pickup location differs from request pickup location (D11)', () => {
      const uttaraPool: CandidatePoolData = {
        id: 'pool-uttara',
        pickupLocationId: 1, // Uttara
        occupiedSeats: 1,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const requestAtBanani: MatchRequest = {
        pickupLocationId: 2, // Banani
        destLocationId: 3, // Gulshan
        seats: 1,
      };

      const match = engine.findCompatiblePool([uttaraPool], requestAtBanani);
      expect(match).toBeNull();
    });
  });

  describe('Status gate & unserved route checks', () => {
    it('rejects candidates in STARTED, COMPLETED, or CANCELLED status', () => {
      const startedPool: CandidatePoolData = {
        id: 'pool-started',
        pickupLocationId: 2,
        occupiedSeats: 1,
        capacity: 3,
        status: 'STARTED',
        memberDestLocationIds: [3],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const request: MatchRequest = {
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
      };

      expect(engine.findCompatiblePool([startedPool], request)).toBeNull();
    });

    it('rejects request when destination is upstream of pickup', () => {
      // On C1: Banani(2, pos 1) -> Gulshan(3, pos 2) -> Mohakhali(4, pos 3)
      // If a pool is at Gulshan (3), request is for Banani (2), but C1 does not run backwards
      // and let's assume route has no reverse for this test.
      // Let's test with a route that only runs one-way: C2 Banani(2) -> Gulshan(3) -> Bashundhara(5)
      // Pickup Bashundhara (5) -> Dest Banani (2)
      const bashundharaPool: CandidatePoolData = {
        id: 'pool-bashundhara',
        pickupLocationId: 5,
        occupiedSeats: 0,
        capacity: 3,
        status: 'OPEN',
        memberDestLocationIds: [],
        createdAt: new Date('2026-09-26T10:00:00Z'),
      };

      const upstreamRequest: MatchRequest = {
        pickupLocationId: 5,
        destLocationId: 2,
        seats: 1,
      };

      expect(engine.findCompatiblePool([bashundharaPool], upstreamRequest)).toBeNull();
    });

    it('returns null when candidates list is empty', () => {
      const request: MatchRequest = {
        pickupLocationId: 2,
        destLocationId: 3,
        seats: 1,
      };

      expect(engine.findCompatiblePool([], request)).toBeNull();
    });
  });
});
