import { and, asc, eq, gt, inArray, isNotNull, isNull, lte, notInArray } from 'drizzle-orm';
import type { db } from '../../db/client.js';
import {
  users,
  vehicles,
  pools,
  locations,
  passengerRides,
  rideRequests,
  rideEvents,
  type User,
  type Vehicle,
  type Pool,
} from '../../db/schema/index.js';
import type {
  DriverActivePool,
  OpenPoolItem,
  OpenPoolMemberRequest,
  OpenPoolDestinationStop,
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

  async findActivePoolByDriverId(driverId: string): Promise<DriverActivePool | null> {
    const [row] = await this.dbClient
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

  async findPoolById(poolId: string): Promise<Pool | null> {
    const [pool] = await this.dbClient
      .select()
      .from(pools)
      .where(eq(pools.id, poolId))
      .limit(1);

    return pool ?? null;
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
}

export default DriverRepository;
