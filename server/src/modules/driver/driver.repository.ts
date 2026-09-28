import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, lte, notInArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { db } from '../../db/client.js';
import {
  users,
  vehicles,
  pools,
  locations,
  passengerRides,
  rideRequests,
  rideEvents,
  payments,
  type User,
  type Vehicle,
  type Pool,
  type Payment,
  type NewPayment,
} from '../../db/schema/index.js';
import { Ride } from '../rides/domain/Ride.js';
import type {
  DriverActivePool,
  OpenPoolItem,
  OpenPoolMemberRequest,
  OpenPoolDestinationStop,
  DriverPoolRosterMember,
  PassengerRideCashSettlementInfo,
  DriverPoolHistoryItem,
} from './driver.types.js';


export class DriverRepository {
  constructor(private readonly dbClient: typeof db) {}

  async findDriverById(driverId: string): Promise<User | null> {
    const [driver] = await this.dbClient
      .select()
      .from(users)
      .where(and(eq(users.id, driverId), eq(users.role, 'DRIVER')))
      .limit(1);

    return driver ?? null;
  }

  async findVehicleByDriverId(driverId: string): Promise<Vehicle | null> {
    const [vehicle] = await this.dbClient
      .select()
      .from(vehicles)
      .where(eq(vehicles.driverId, driverId))
      .limit(1);

    return vehicle ?? null;
  }

  async findActivePoolByDriverId(driverId: string, tx?: any): Promise<DriverActivePool | null> {
    const client = tx ?? this.dbClient;
    const [row] = await client
      .select({
        id: pools.id,
        pickupLocationId: pools.pickupLocationId,
        pickupLocationName: locations.name,
        status: pools.status,
        capacity: pools.capacity,
        occupiedSeats: pools.occupiedSeats,
        createdAt: pools.createdAt,
        updatedAt: pools.updatedAt,
      })
      .from(pools)
      .innerJoin(locations, eq(pools.pickupLocationId, locations.id))
      .where(
        and(
          eq(pools.driverId, driverId),
          inArray(pools.status, ['MATCHED', 'DRIVER_ARRIVED', 'STARTED'])
        )
      )
      .limit(1);

    return row ?? null;
  }

  async updateVehicleStatus(driverId: string, status: 'ONLINE' | 'OFFLINE'): Promise<Vehicle | null> {
    const [updatedVehicle] = await this.dbClient
      .update(vehicles)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.driverId, driverId))
      .returning();

    return updatedVehicle ?? null;
  }

  async findDriverPoolById(
    poolId: string,
    driverId: string
  ): Promise<{
    id: string;
    pickupLocationId: number;
    pickupLocationName: string;
    status: string;
    capacity: number;
    occupiedSeats: number;
    driverId: string;
    vehicleId: string;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    const [pool] = await this.dbClient
      .select({
        id: pools.id,
        pickupLocationId: pools.pickupLocationId,
        pickupLocationName: locations.name,
        status: pools.status,
        capacity: pools.capacity,
        occupiedSeats: pools.occupiedSeats,
        driverId: pools.driverId,
        vehicleId: pools.vehicleId,
        createdAt: pools.createdAt,
        updatedAt: pools.updatedAt,
      })
      .from(pools)
      .innerJoin(locations, eq(pools.pickupLocationId, locations.id))
      .where(and(eq(pools.id, poolId), eq(pools.driverId, driverId)))
      .limit(1);

    if (!pool?.driverId || !pool?.vehicleId) {
      return null;
    }

    return {
      ...pool,
      driverId: pool.driverId,
      vehicleId: pool.vehicleId,
    };
  }

  async findActiveRosterForPool(
    poolId: string,
    poolStatus: string
  ): Promise<DriverPoolRosterMember[]> {
    const pickupLocations = alias(locations, 'pickup_loc');
    const destLocations = alias(locations, 'dest_loc');

    const rows = await this.dbClient
      .select({
        id: passengerRides.id,
        passengerId: passengerRides.passengerId,
        passengerName: users.name,
        pickupLocationId: rideRequests.pickupLocationId,
        pickupLocationName: pickupLocations.name,
        destLocationId: rideRequests.destLocationId,
        destLocationName: destLocations.name,
        seats: passengerRides.seats,
        farePaisa: passengerRides.farePaisa,
        estimateFarePaisa: rideRequests.estimateFarePaisa,
        paymentMethod: rideRequests.paymentMethod,
        paymentStatus: payments.status,
        completedAt: passengerRides.completedAt,
        cancelledAt: passengerRides.cancelledAt,
        createdAt: passengerRides.createdAt,
        updatedAt: passengerRides.updatedAt,
      })
      .from(passengerRides)
      .innerJoin(users, eq(passengerRides.passengerId, users.id))
      .innerJoin(rideRequests, eq(passengerRides.rideRequestId, rideRequests.id))
      .innerJoin(pickupLocations, eq(rideRequests.pickupLocationId, pickupLocations.id))
      .innerJoin(destLocations, eq(rideRequests.destLocationId, destLocations.id))
      .leftJoin(payments, eq(payments.passengerRideId, passengerRides.id))
      .where(and(eq(passengerRides.poolId, poolId), isNull(passengerRides.cancelledAt)))
      .orderBy(asc(passengerRides.createdAt));

    return rows.map((row) => this.mapRosterMemberRow(row, poolId, poolStatus));
  }

  private mapRosterMemberRow(row: any, poolId: string, poolStatus: string): DriverPoolRosterMember {
    const ride = new Ride({
      id: row.id,
      rideRequestId: row.id,
      passengerId: row.passengerId,
      poolId,
      seats: row.seats,
      farePaisa: row.farePaisa,
      cancelledAt: row.cancelledAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      poolStatus,
    });

    return {
      id: row.id,
      passengerId: row.passengerId,
      passengerName: row.passengerName,
      pickupLocationId: row.pickupLocationId,
      pickupLocationName: row.pickupLocationName,
      destLocationId: row.destLocationId,
      destLocationName: row.destLocationName,
      seats: row.seats,
      farePaisa: row.farePaisa ?? row.estimateFarePaisa,
      status: ride.status,
      paymentMethod: row.paymentMethod,
      paymentStatus: row.paymentStatus ?? 'PENDING',
      createdAt: row.createdAt,
    };
  }

  async findPoolById(poolId: string, tx?: any): Promise<Pool | null> {
    const client = tx ?? this.dbClient;
    const [pool] = await client
      .select()
      .from(pools)
      .where(eq(pools.id, poolId))
      .limit(1);

    return pool ?? null;
  }

  async assignDriverToPool(
    poolId: string,
    driverId: string,
    vehicleId: string,
    vehicleCapacity: number,
    tx?: any
  ): Promise<Pool | null> {
    const client = tx ?? this.dbClient;
    const [updatedPool] = await client
      .update(pools)
      .set({
        driverId,
        vehicleId,
        capacity: vehicleCapacity,
        status: 'MATCHED',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(pools.id, poolId),
          eq(pools.status, 'OPEN'),
          isNull(pools.driverId),
          lte(pools.occupiedSeats, vehicleCapacity)
        )
      )
      .returning();

    return updatedPool ?? null;
  }

  async updatePoolStatus(poolId: string, status: string, tx?: any): Promise<void> {
    const client = tx ?? this.dbClient;
    await client
      .update(pools)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(pools.id, poolId));
  }

  async findActiveMembersByPoolId(
    poolId: string,
    tx?: any
  ): Promise<Array<{ id: string; rideRequestId: string; passengerId: string; farePaisa: number | null }>> {
    const client = tx ?? this.dbClient;
    return client
      .select({
        id: passengerRides.id,
        rideRequestId: passengerRides.rideRequestId,
        passengerId: passengerRides.passengerId,
        farePaisa: passengerRides.farePaisa,
      })
      .from(passengerRides)
      .where(
        and(
          eq(passengerRides.poolId, poolId),
          isNull(passengerRides.cancelledAt)
        )
      );
  }

  async findActiveMembersForCompletion(
    poolId: string,
    tx?: any
  ): Promise<Array<{
    id: string;
    rideRequestId: string;
    passengerId: string;
    farePaisa: number | null;
    estimateFarePaisa: number;
    paymentMethod: string;
  }>> {
    const client = tx ?? this.dbClient;
    return client
      .select({
        id: passengerRides.id,
        rideRequestId: passengerRides.rideRequestId,
        passengerId: passengerRides.passengerId,
        farePaisa: passengerRides.farePaisa,
        estimateFarePaisa: rideRequests.estimateFarePaisa,
        paymentMethod: rideRequests.paymentMethod,
      })
      .from(passengerRides)
      .innerJoin(rideRequests, eq(passengerRides.rideRequestId, rideRequests.id))
      .where(
        and(
          eq(passengerRides.poolId, poolId),
          isNull(passengerRides.cancelledAt)
        )
      );
  }

  async markPassengerRidesCompleted(
    poolId: string,
    completedAt: Date,
    tx?: any
  ): Promise<void> {
    const client = tx ?? this.dbClient;
    await client
      .update(passengerRides)
      .set({
        completedAt,
        updatedAt: completedAt,
      })
      .where(
        and(
          eq(passengerRides.poolId, poolId),
          isNull(passengerRides.cancelledAt)
        )
      );
  }

  async createPendingPayments(
    newPayments: NewPayment[],
    tx?: any
  ): Promise<Payment[]> {
    if (newPayments.length === 0) {
      return [];
    }
    const client = tx ?? this.dbClient;
    return client.insert(payments).values(newPayments).returning();
  }

  async withTransaction<T>(work: (tx: any) => Promise<T>): Promise<T> {
    return this.dbClient.transaction(work);
  }

  async hasDriverDeclinedPool(driverId: string, poolId: string): Promise<boolean> {
    const [row] = await this.dbClient
      .select({ id: rideEvents.id })
      .from(rideEvents)
      .where(
        and(
          eq(rideEvents.actorId, driverId),
          eq(rideEvents.poolId, poolId),
          eq(rideEvents.event, 'DRIVER_DECLINED')
        )
      )
      .limit(1);

    return Boolean(row);
  }

  async findOpenPoolsForDriver(driverId: string, vehicleCapacity: number): Promise<OpenPoolItem[]> {
    const declinedPoolIds = await this.findDeclinedPoolIds(driverId);
    const poolRows = await this.queryCompatibleOpenPools(vehicleCapacity, declinedPoolIds);

    if (poolRows.length === 0) {
      return [];
    }

    const poolIds = poolRows.map((pool) => pool.id);
    const memberRows = await this.findActiveMembersForPools(poolIds);
    const { membersByPoolId, stopsByPoolId } = this.buildPoolMembersMap(memberRows);

    return poolRows.map((pool) => {
      const memberRequests = membersByPoolId.get(pool.id) ?? [];
      const stopMap = stopsByPoolId.get(pool.id) ?? new Map<number, string>();
      const destinationStops: OpenPoolDestinationStop[] = Array.from(stopMap.entries()).map(
        ([locationId, locationName]) => ({
          locationId,
          locationName,
        })
      );

      return {
        id: pool.id,
        pickupLocationId: pool.pickupLocationId,
        pickupLocationName: pool.pickupLocationName,
        status: 'OPEN',
        capacity: pool.capacity,
        occupiedSeats: pool.occupiedSeats,
        passengerCount: memberRequests.length,
        destinationStops,
        memberRequests,
        createdAt: pool.createdAt,
      };
    });
  }

  private async findDeclinedPoolIds(driverId: string): Promise<string[]> {
    const declinedRows = await this.dbClient
      .select({ poolId: rideEvents.poolId })
      .from(rideEvents)
      .where(
        and(
          eq(rideEvents.actorId, driverId),
          eq(rideEvents.event, 'DRIVER_DECLINED'),
          isNotNull(rideEvents.poolId)
        )
      );

    return declinedRows
      .map((row) => row.poolId)
      .filter((id): id is string => Boolean(id));
  }

  private async queryCompatibleOpenPools(
    vehicleCapacity: number,
    excludedPoolIds: string[]
  ) {
    const whereConditions = [
      eq(pools.status, 'OPEN'),
      isNull(pools.driverId),
      lte(pools.occupiedSeats, vehicleCapacity),
      gt(pools.occupiedSeats, 0),
    ];

    if (excludedPoolIds.length > 0) {
      whereConditions.push(notInArray(pools.id, excludedPoolIds));
    }

    return this.dbClient
      .select({
        id: pools.id,
        pickupLocationId: pools.pickupLocationId,
        pickupLocationName: locations.name,
        status: pools.status,
        capacity: pools.capacity,
        occupiedSeats: pools.occupiedSeats,
        createdAt: pools.createdAt,
      })
      .from(pools)
      .innerJoin(locations, eq(pools.pickupLocationId, locations.id))
      .where(and(...whereConditions))
      .orderBy(asc(pools.createdAt));
  }

  private async findActiveMembersForPools(poolIds: string[]) {
    return this.dbClient
      .select({
        poolId: passengerRides.poolId,
        passengerRideId: passengerRides.id,
        seats: passengerRides.seats,
        destLocationId: rideRequests.destLocationId,
        destLocationName: locations.name,
      })
      .from(passengerRides)
      .innerJoin(rideRequests, eq(passengerRides.rideRequestId, rideRequests.id))
      .innerJoin(locations, eq(rideRequests.destLocationId, locations.id))
      .where(
        and(
          inArray(passengerRides.poolId, poolIds),
          isNull(passengerRides.cancelledAt)
        )
      );
  }

  private buildPoolMembersMap(
    memberRows: Array<{
      poolId: string;
      passengerRideId: string;
      destLocationId: number;
      destLocationName: string;
      seats: number;
    }>
  ) {
    const membersByPoolId = new Map<string, OpenPoolMemberRequest[]>();
    const stopsByPoolId = new Map<string, Map<number, string>>();

    for (const member of memberRows) {
      const list = membersByPoolId.get(member.poolId) ?? [];
      list.push({
        passengerRideId: member.passengerRideId,
        destLocationId: member.destLocationId,
        destLocationName: member.destLocationName,
        seats: member.seats,
      });
      membersByPoolId.set(member.poolId, list);

      let stopMap = stopsByPoolId.get(member.poolId);
      if (!stopMap) {
        stopMap = new Map<number, string>();
        stopsByPoolId.set(member.poolId, stopMap);
      }
      stopMap.set(member.destLocationId, member.destLocationName);
    }

    return { membersByPoolId, stopsByPoolId };
  }

  async findPassengerRideForCashSettlement(
    passengerRideId: string,
    tx?: any
  ): Promise<PassengerRideCashSettlementInfo | null> {
    const client = tx ?? this.dbClient;
    const [row] = await client
      .select({
        passengerRideId: passengerRides.id,
        rideRequestId: passengerRides.rideRequestId,
        passengerId: passengerRides.passengerId,
        poolId: passengerRides.poolId,
        completedAt: passengerRides.completedAt,
        driverId: pools.driverId,
        poolStatus: pools.status,
        paymentId: payments.id,
        paymentMethod: rideRequests.paymentMethod,
        paymentAmountPaisa: payments.amountPaisa,
        paymentStatus: payments.status,
        paymentPaidAt: payments.paidAt,
        paymentMarkedBy: payments.markedBy,
      })
      .from(passengerRides)
      .innerJoin(pools, eq(passengerRides.poolId, pools.id))
      .innerJoin(rideRequests, eq(passengerRides.rideRequestId, rideRequests.id))
      .leftJoin(payments, eq(payments.passengerRideId, passengerRides.id))
      .where(eq(passengerRides.id, passengerRideId))
      .limit(1);

    return row ?? null;
  }

  async markPaymentAsPaid(
    paymentId: string,
    driverId: string,
    paidAt: Date,
    tx?: any
  ): Promise<Payment | null> {
    const client = tx ?? this.dbClient;
    const [updated] = await client
      .update(payments)
      .set({
        status: 'PAID',
        paidAt,
        markedBy: driverId,
        updatedAt: paidAt,
      })
      .where(
        and(
          eq(payments.id, paymentId),
          eq(payments.status, 'PENDING')
        )
      )
      .returning();

    return updated ?? null;
  }

  async findDriverPoolHistory(
    driverId: string,
    status?: string
  ): Promise<DriverPoolHistoryItem[]> {
    const conditions = [eq(pools.driverId, driverId)];
    if (status) {
      conditions.push(eq(pools.status, status));
    }
    const poolRows = await this.dbClient
      .select({
        id: pools.id,
        pickupLocationId: pools.pickupLocationId,
        pickupLocationName: locations.name,
        status: pools.status,
        capacity: pools.capacity,
        occupiedSeats: pools.occupiedSeats,
        createdAt: pools.createdAt,
        updatedAt: pools.updatedAt,
      })
      .from(pools)
      .innerJoin(locations, eq(pools.pickupLocationId, locations.id))
      .where(and(...conditions))
      .orderBy(desc(pools.createdAt));

    if (poolRows.length === 0) return [];
    return await this.enrichDriverPoolsHistory(poolRows);
  }

  private async enrichDriverPoolsHistory(
    poolRows: any[]
  ): Promise<DriverPoolHistoryItem[]> {
    const poolIds = poolRows.map((p) => p.id);
    const memberRows = await this.findHistoricalMembersForPools(poolIds);
    const { stopsByPoolId, earningsByPoolId, countsByPoolId } =
      this.buildHistoryAggregates(memberRows);
    return poolRows.map((pool) =>
      this.mapHistoryItem(pool, stopsByPoolId, earningsByPoolId, countsByPoolId)
    );
  }

  private async findHistoricalMembersForPools(poolIds: string[]) {
    return this.dbClient
      .select({
        poolId: passengerRides.poolId,
        farePaisa: passengerRides.farePaisa,
        destLocationId: rideRequests.destLocationId,
        destLocationName: locations.name,
      })
      .from(passengerRides)
      .innerJoin(rideRequests, eq(passengerRides.rideRequestId, rideRequests.id))
      .innerJoin(locations, eq(rideRequests.destLocationId, locations.id))
      .where(
        and(
          inArray(passengerRides.poolId, poolIds),
          isNull(passengerRides.cancelledAt)
        )
      );
  }

  private buildHistoryAggregates(memberRows: any[]) {
    const stopsByPoolId = new Map<string, Map<number, string>>();
    const earningsByPoolId = new Map<string, number>();
    const countsByPoolId = new Map<string, number>();

    for (const member of memberRows) {
      this.accumulateMemberStop(
        stopsByPoolId,
        member.poolId,
        member.destLocationId,
        member.destLocationName
      );
      earningsByPoolId.set(
        member.poolId,
        (earningsByPoolId.get(member.poolId) ?? 0) + (member.farePaisa ?? 0)
      );
      countsByPoolId.set(
        member.poolId,
        (countsByPoolId.get(member.poolId) ?? 0) + 1
      );
    }
    return { stopsByPoolId, earningsByPoolId, countsByPoolId };
  }

  private accumulateMemberStop(
    stops: Map<string, Map<number, string>>,
    poolId: string,
    destLocationId: number,
    destLocationName: string
  ): void {
    let stopMap = stops.get(poolId);
    if (!stopMap) {
      stopMap = new Map<number, string>();
      stops.set(poolId, stopMap);
    }
    stopMap.set(destLocationId, destLocationName);
  }

  private mapHistoryItem(
    pool: any,
    stops: Map<string, Map<number, string>>,
    earnings: Map<string, number>,
    counts: Map<string, number>
  ): DriverPoolHistoryItem {
    return {
      id: pool.id,
      pickupLocationId: pool.pickupLocationId,
      pickupLocationName: pool.pickupLocationName,
      status: pool.status,
      capacity: pool.capacity,
      occupiedSeats: pool.occupiedSeats,
      passengerCount: counts.get(pool.id) ?? 0,
      totalEarningsPaisa: earnings.get(pool.id) ?? 0,
      destinationStops: Array.from(stops.get(pool.id)?.entries() ?? []).map(
        ([locationId, locationName]) => ({ locationId, locationName })
      ),
      createdAt: pool.createdAt,
      updatedAt: pool.updatedAt,
    };
  }
}

export default DriverRepository;
