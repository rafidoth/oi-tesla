import { FARE_BASE_PAISA, FARE_PER_KM_PAISA } from '../../../config/constants.js';

export interface FareConfig {
  baseFarePaisa: number;
  perKmFarePaisa: number;
}

export interface PoolMemberFareInput {
  id: string;
  legDistanceM: number;
  createdAt: Date;
}

export class FareCalculator {
  constructor(
    private readonly config: FareConfig = {
      baseFarePaisa: FARE_BASE_PAISA,
      perKmFarePaisa: FARE_PER_KM_PAISA,
    }
  ) {}

  calculateSoloFare(distanceM: number): number {
    return this.computePoolTotal(distanceM);
  }

  computePoolTotal(maxLegDistanceM: number): number {
    if (maxLegDistanceM < 0) {
      throw new Error('Distance cannot be negative');
    }
    return (
      this.config.baseFarePaisa +
      Math.round((maxLegDistanceM * this.config.perKmFarePaisa) / 1000)
    );
  }

  splitFares(
    members: Array<PoolMemberFareInput>,
    poolTotal: number
  ): Map<string, number> {
    if (poolTotal < 0) {
      throw new Error('Pool total cannot be negative');
    }
    if (members.length === 0) {
      return new Map();
    }
    if (members.length === 1) {
      const single = new Map<string, number>();
      single.set(members[0].id, poolTotal);
      return single;
    }

    const sumLegs = members.reduce((acc, m) => acc + m.legDistanceM, 0);

    const memberShares: Array<{
      id: string;
      createdAt: Date;
      floorShare: number;
      remainder: number;
    }> = [];

    if (sumLegs === 0) {
      const n = members.length;
      const floorShare = Math.floor(poolTotal / n);
      const remainder = poolTotal % n;
      for (const m of members) {
        memberShares.push({
          id: m.id,
          createdAt: m.createdAt,
          floorShare,
          remainder,
        });
      }
    } else {
      for (const m of members) {
        const product = poolTotal * m.legDistanceM;
        const floorShare = Math.floor(product / sumLegs);
        const remainder = product % sumLegs;
        memberShares.push({
          id: m.id,
          createdAt: m.createdAt,
          floorShare,
          remainder,
        });
      }
    }

    const allocated = memberShares.reduce((acc, m) => acc + m.floorShare, 0);
    const leftoverPaisa = poolTotal - allocated;

    // Sort by remainder DESC, then by createdAt ASC (earliest joined gets remainder), then id ASC
    const sorted = [...memberShares].sort((a, b) => {
      if (b.remainder !== a.remainder) {
        return b.remainder - a.remainder;
      }
      const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
      if (timeDiff !== 0) {
        return timeDiff;
      }
      return a.id.localeCompare(b.id);
    });

    const finalShares = new Map<string, number>();
    for (let i = 0; i < sorted.length; i++) {
      const bonus = i < leftoverPaisa ? 1 : 0;
      finalShares.set(sorted[i].id, sorted[i].floorShare + bonus);
    }

    const result = new Map<string, number>();
    let totalAssigned = 0;
    for (const m of members) {
      const share = finalShares.get(m.id)!;
      result.set(m.id, share);
      totalAssigned += share;
    }

    if (totalAssigned !== poolTotal) {
      throw new Error(
        `Invariant violation: sum of split fares (${totalAssigned}) does not match poolTotal (${poolTotal})`
      );
    }

    return result;
  }
}

export default FareCalculator;
