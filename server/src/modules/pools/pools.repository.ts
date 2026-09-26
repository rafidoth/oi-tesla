import { and, asc, eq, inArray, isNull, lte, sql } from 'drizzle-orm';
import type { db } from '../../db/client.js';
import {
  pools,
  passengerRides,
  rideRequests,
  type Pool as PoolRow,
} from '../../db/schema/index.js';
import { NOMINAL_POOL_CAPACITY } from '../../config/constants.js';
import type { CandidatePoolData } from './domain/MatchingEngine.js';

export type { PoolRow };

type DbType = typeof db;

export class PoolsRepository {
  constructor(private readonly db: DbType) {}

  /**
   * Finds candidate OPEN or MATCHED pools at the specified pickup location
   * with sufficient remaining capacity, ordered deterministically by createdAt ASC, id ASC.
   * Includes active member destination location IDs.
   */
  async findCandidatePools(
    pickupLocationId: number,
    requiredSeats: number,
    tx?: any
  ): Promise<CandidatePoolData[]> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const candidatePoolRows = await executor
      .select()
      .from(pools)
      .where(
        and(
          inArray(pools.status, ['OPEN', 'MATCHED']),
          eq(pools.pickupLocationId, pickupLocationId),
          lte(sql`${pools.occupiedSeats} + ${requiredSeats}`, pools.capacity)
        )
      )
      .orderBy(asc(pools.createdAt), asc(pools.id));

    if (candidatePoolRows.length === 0) {
      return [];
    }

    const poolIds = candidatePoolRows.map((p) => p.id);

    const activeMembers = await executor
      .select({
        poolId: passengerRides.poolId,
        destLocationId: rideRequests.destLocationId,
      })
      .from(passengerRides)
      .innerJoin(rideRequests, eq(passengerRides.rideRequestId, rideRequests.id))
      .where(
        and(
          inArray(passengerRides.poolId, poolIds),
          isNull(passengerRides.cancelledAt)
        )
      );

    const destsByPoolId = new Map<string, number[]>();
    for (const member of activeMembers) {
      const list = destsByPoolId.get(member.poolId) ?? [];
      list.push(member.destLocationId);
      destsByPoolId.set(member.poolId, list);
    }

    return candidatePoolRows.map((p) => ({
      id: p.id,
      pickupLocationId: p.pickupLocationId,
      occupiedSeats: p.occupiedSeats,
      capacity: p.capacity,
      status: p.status,
      driverId: p.driverId,
      vehicleId: p.vehicleId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      memberDestLocationIds: destsByPoolId.get(p.id) ?? [],
    }));
  }

  /**
   * Atomically increments occupied_seats in a pool if and only if
   * status is OPEN or MATCHED and capacity would not be exceeded.
   * Returns true if the row was updated, false otherwise.
   */
  async incrementSeatsGuarded(
    poolId: string,
    seats: number,
    tx?: any
  ): Promise<boolean> {
    const executor = tx || this.db;
    const result = await executor.execute(sql`
      UPDATE pools
      SET occupied_seats = occupied_seats + ${seats}, updated_at = now()
      WHERE id = ${poolId}
        AND status IN ('OPEN', 'MATCHED')
        AND occupied_seats + ${seats} <= capacity
      RETURNING id
    `);

    return (
      (Array.isArray(result) && result.length > 0) ||
      (Array.isArray((result as any)?.rows) && (result as any).rows.length > 0) ||
      Boolean(result && ((result as any).rowCount > 0 || (result as any).count > 0))
    );
  }

  /**
   * Atomically decrements occupied_seats in a pool if and only if
   * occupied_seats - seats >= 0.
   * Returns true if the row was updated, false otherwise.
   */
  async decrementSeatsGuarded(
    poolId: string,
    seats: number,
    tx?: any
  ): Promise<boolean> {
    const executor = tx || this.db;
    const result = await executor.execute(sql`
      UPDATE pools
      SET occupied_seats = occupied_seats - ${seats}, updated_at = now()
      WHERE id = ${poolId}
        AND occupied_seats - ${seats} >= 0
      RETURNING id
    `);

    return (
      (Array.isArray(result) && result.length > 0) ||
      (Array.isArray((result as any)?.rows) && (result as any).rows.length > 0) ||
      Boolean(result && ((result as any).rowCount > 0 || (result as any).count > 0))
    );
  }

  /**
   * Inserts a new pool into the pools table with default status OPEN and occupiedSeats = 0.
   */
  async createPool(
    data: {
      pickupLocationId: number;
      capacity?: number;
    },
    tx?: any
  ): Promise<PoolRow> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const [created] = await executor
      .insert(pools)
      .values({
        pickupLocationId: data.pickupLocationId,
        capacity: data.capacity ?? NOMINAL_POOL_CAPACITY,
        status: 'OPEN',
        occupiedSeats: 0,
      })
      .returning();

    return created;
  }

  /**
   * Finds a pool by its primary key UUID.
   */
  async findPoolById(id: string, tx?: any): Promise<PoolRow | null> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const [pool] = await executor
      .select()
      .from(pools)
      .where(eq(pools.id, id))
      .limit(1);

    return pool ?? null;
  }

  /**
   * Finds all active (non-cancelled) members in a pool joined with their ride requests,
   * returning their leg pickup and destination location IDs.
   */
  async findActiveMembersWithLegLocations(
    poolId: string,
    tx?: any
  ): Promise<ActiveMemberLegLocation[]> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const rows = await executor
      .select({
        passengerRideId: passengerRides.id,
        passengerId: passengerRides.passengerId,
        pickupLocationId: rideRequests.pickupLocationId,
        destLocationId: rideRequests.destLocationId,
        createdAt: passengerRides.createdAt,
        currentFarePaisa: passengerRides.farePaisa,
      })
      .from(passengerRides)
      .innerJoin(rideRequests, eq(passengerRides.rideRequestId, rideRequests.id))
      .where(
        and(
          eq(passengerRides.poolId, poolId),
          isNull(passengerRides.cancelledAt)
        )
      )
      .orderBy(asc(passengerRides.createdAt), asc(passengerRides.id));

    return rows;
  }

  /**
   * Updates each passenger_ride row's fare_paisa within tx or db.
   */
  async updateMemberFares(
    updates: Array<{ passengerRideId: string; farePaisa: number }>,
    tx?: any
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }
    const executor: DbType = tx ? (tx as DbType) : this.db;
    for (const update of updates) {
      await executor
        .update(passengerRides)
        .set({
          farePaisa: update.farePaisa,
          updatedAt: sql`now()`,
        })
        .where(eq(passengerRides.id, update.passengerRideId));
    }
  }

  /**
   * Updates the lifecycle status of a pool.
   */
  async updatePoolStatus(poolId: string, status: string, tx?: any): Promise<void> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    await executor
      .update(pools)
      .set({
        status,
        updatedAt: sql`now()`,
      })
      .where(eq(pools.id, poolId));
  }
}

export interface ActiveMemberLegLocation {
  passengerRideId: string;
  passengerId: string;
  pickupLocationId: number;
  destLocationId: number;
  createdAt: Date;
  currentFarePaisa: number | null;
}

export default PoolsRepository;
