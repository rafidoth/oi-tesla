import { describe, it, expect } from 'vitest';
import { FareCalculator } from '../../src/modules/pools/domain/FareCalculator.js';
import { FARE_BASE_PAISA, FARE_PER_KM_PAISA } from '../../src/config/constants.js';

describe('FareCalculator Unit Tests', () => {
  describe('calculateSoloFare with default config', () => {
    const calculator = new FareCalculator();

    it('calculates solo fare for Banani -> Mohakhali (5000m) to be 15000 paisa', () => {
      // 5000 + (5000 * 2000) / 1000 = 15000
      const fare = calculator.calculateSoloFare(5000);
      expect(fare).toBe(15000);
    });

    it('calculates solo fare for short distance Banani -> Gulshan (2000m) to be 9000 paisa', () => {
      // 5000 + (2000 * 2000) / 1000 = 9000
      const fare = calculator.calculateSoloFare(2000);
      expect(fare).toBe(9000);
    });

    it('calculates solo fare for 0m to be base fare (5000 paisa)', () => {
      const fare = calculator.calculateSoloFare(0);
      expect(fare).toBe(FARE_BASE_PAISA);
    });

    it('rounds correctly for non-multiple distances', () => {
      // 2555m: 5000 + round(2555 * 2000 / 1000) = 5000 + round(5110) = 10110
      const fare = calculator.calculateSoloFare(2555);
      expect(fare).toBe(10110);
    });

    it('calculates solo fare for long trip (10000m / 10km)', () => {
      // 5000 + (10000 * 2000) / 1000 = 25000 paisa
      const fare = calculator.calculateSoloFare(10000);
      expect(fare).toBe(25000);
    });

    it('throws error for negative distance', () => {
      expect(() => calculator.calculateSoloFare(-100)).toThrow('Distance cannot be negative');
    });
  });

  describe('computePoolTotal', () => {
    const calculator = new FareCalculator();

    it('computes pool total for Banani -> Mohakhali (5000m) to be 15000 paisa', () => {
      expect(calculator.computePoolTotal(5000)).toBe(15000);
    });

    it('computes pool total for Banani -> Gulshan (2000m) to be 9000 paisa', () => {
      expect(calculator.computePoolTotal(2000)).toBe(9000);
    });

    it('computes pool total for 0m to be base fare (5000 paisa)', () => {
      expect(calculator.computePoolTotal(0)).toBe(5000);
    });

    it('throws error for negative max leg distance', () => {
      expect(() => calculator.computePoolTotal(-500)).toThrow('Distance cannot be negative');
    });
  });

  describe('splitFares — PRD Section 18 Sequence', () => {
    const calculator = new FareCalculator();
    const t1 = new Date('2026-09-26T08:00:00Z');
    const t2 = new Date('2026-09-26T08:01:00Z');
    const t3 = new Date('2026-09-26T08:02:00Z');

    it('Step 1: Nusrat solo B->M (5000m) pays full pool total (15000 paisa)', () => {
      const poolTotal = calculator.computePoolTotal(5000); // 15000
      const members = [{ id: 'nusrat', legDistanceM: 5000, createdAt: t1 }];

      const shares = calculator.splitFares(members, poolTotal);

      expect(shares.size).toBe(1);
      expect(shares.get('nusrat')).toBe(15000);
      expect(Array.from(shares.values()).reduce((a, b) => a + b, 0)).toBe(poolTotal);
    });

    it('Step 2: Rafiq joins B->G (2000m) — Nusrat gets 10714, Rafiq gets 4286 (sum = 15000)', () => {
      // Max leg is 5000m -> poolTotal = 15000 paisa
      // Σlegs = 5000 + 2000 = 7000m
      // Nusrat: raw = 15000 * 5000 / 7000 = 10714.2857 -> floor 10714, rem 2000
      // Rafiq: raw = 15000 * 2000 / 7000 = 4285.7142 -> floor 4285, rem 5000
      // Rafiq has largest remainder, gets +1 paisa
      const poolTotal = 15000;
      const members = [
        { id: 'nusrat', legDistanceM: 5000, createdAt: t1 },
        { id: 'rafiq', legDistanceM: 2000, createdAt: t2 },
      ];

      const shares = calculator.splitFares(members, poolTotal);

      expect(shares.size).toBe(2);
      expect(shares.get('nusrat')).toBe(10714);
      expect(shares.get('rafiq')).toBe(4286);
      expect(shares.get('nusrat')! + shares.get('rafiq')!).toBe(15000);
    });

    it('Step 3: Shirin joins B->G (2000m) — Nusrat gets 8334, Rafiq gets 3333, Shirin gets 3333 (sum = 15000, tie breaker to Nusrat)', () => {
      // Max leg is 5000m -> poolTotal = 15000 paisa
      // Σlegs = 5000 + 2000 + 2000 = 9000m
      // Nusrat: raw = 15000 * 5000 / 9000 = 8333.333 -> floor 8333, rem 3000
      // Rafiq: raw = 15000 * 2000 / 9000 = 3333.333 -> floor 3333, rem 3000
      // Shirin: raw = 15000 * 2000 / 9000 = 3333.333 -> floor 3333, rem 3000
      // All remainders tied at 3000. Earliest createdAt (Nusrat t1) gets +1 paisa.
      const poolTotal = 15000;
      const members = [
        { id: 'nusrat', legDistanceM: 5000, createdAt: t1 },
        { id: 'rafiq', legDistanceM: 2000, createdAt: t2 },
        { id: 'shirin', legDistanceM: 2000, createdAt: t3 },
      ];

      const shares = calculator.splitFares(members, poolTotal);

      expect(shares.size).toBe(3);
      expect(shares.get('nusrat')).toBe(8334);
      expect(shares.get('rafiq')).toBe(3333);
      expect(shares.get('shirin')).toBe(3333);
      expect(shares.get('nusrat')! + shares.get('rafiq')! + shares.get('shirin')!).toBe(15000);
    });
  });

  describe('splitFares — edge cases and invariant balance', () => {
    const calculator = new FareCalculator();
    const t1 = new Date('2026-09-26T08:00:00Z');
    const t2 = new Date('2026-09-26T08:01:00Z');
    const t3 = new Date('2026-09-26T08:02:00Z');
    const t4 = new Date('2026-09-26T08:03:00Z');

    it('returns empty Map when members array is empty', () => {
      const shares = calculator.splitFares([], 15000);
      expect(shares.size).toBe(0);
    });

    it('handles poolTotal of 0 correctly', () => {
      const members = [
        { id: 'm1', legDistanceM: 2000, createdAt: t1 },
        { id: 'm2', legDistanceM: 3000, createdAt: t2 },
      ];
      const shares = calculator.splitFares(members, 0);
      expect(shares.get('m1')).toBe(0);
      expect(shares.get('m2')).toBe(0);
    });

    it('throws error for negative poolTotal', () => {
      const members = [{ id: 'm1', legDistanceM: 2000, createdAt: t1 }];
      expect(() => calculator.splitFares(members, -100)).toThrow('Pool total cannot be negative');
    });

    it('handles all zero leg distances evenly with largest-remainder', () => {
      // 3 members, legDistanceM = 0, poolTotal = 5000
      // 5000 / 3 = 1666.666 -> floor 1666, leftover 2 paisa
      // m1 (t1) and m2 (t2) get 1667, m3 (t3) gets 1666
      const members = [
        { id: 'm1', legDistanceM: 0, createdAt: t1 },
        { id: 'm2', legDistanceM: 0, createdAt: t2 },
        { id: 'm3', legDistanceM: 0, createdAt: t3 },
      ];

      const shares = calculator.splitFares(members, 5000);

      expect(shares.get('m1')).toBe(1667);
      expect(shares.get('m2')).toBe(1667);
      expect(shares.get('m3')).toBe(1666);
      expect(shares.get('m1')! + shares.get('m2')! + shares.get('m3')!).toBe(5000);
    });

    it('maintains exact paisa balance on adversarial non-divisible numbers', () => {
      const testCases = [
        { poolTotal: 10001, legs: [333, 777, 1234] },
        { poolTotal: 17, legs: [1000, 1000, 1000] },
        { poolTotal: 9999999, legs: [1111, 2222, 3333, 4444] },
        { poolTotal: 1, legs: [100, 200, 300] },
        { poolTotal: 2, legs: [100, 100, 100] },
        { poolTotal: 876543, legs: [12345, 67890, 23456, 78901] },
      ];

      const timestamps = [t1, t2, t3, t4];

      for (const tc of testCases) {
        const members = tc.legs.map((leg, idx) => ({
          id: `member-${idx}`,
          legDistanceM: leg,
          createdAt: timestamps[idx],
        }));

        const shares = calculator.splitFares(members, tc.poolTotal);
        const sum = Array.from(shares.values()).reduce((acc, val) => acc + val, 0);

        expect(sum).toBe(tc.poolTotal);
      }
    });

    it('breaks ties deterministically using createdAt ASC', () => {
      // 2 members with equal distance and odd poolTotal
      // poolTotal = 10001 -> 5000 each, 1 remainder paisa
      // m1 (t1) is earlier than m2 (t2) -> m1 gets 5001, m2 gets 5000
      const members = [
        { id: 'm2', legDistanceM: 2000, createdAt: t2 },
        { id: 'm1', legDistanceM: 2000, createdAt: t1 },
      ];

      const shares = calculator.splitFares(members, 10001);

      expect(shares.get('m1')).toBe(5001);
      expect(shares.get('m2')).toBe(5000);
      expect(shares.get('m1')! + shares.get('m2')!).toBe(10001);
    });
  });
});
