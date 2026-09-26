import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { db } from '../../db/client.js';
import {
  passengerRides,
  rideRequests,
  pools,
  locations,
  users,
  vehicles,
  type PassengerRide as PassengerRideRow,
  type RideRequest as RideRequestRow,
} from '../../db/schema/index.js';

export type { PassengerRideRow, RideRequestRow };

const pickupLocations = alias(locations, 'pickup_loc');
const destLocations = alias(locations, 'dest_loc');
const driverUsers = alias(users, 'driver_user');
const poolVehicles = alias(vehicles, 'pool_vehicle');

export interface ActiveRideRecord {
  id: string;
  rideRequestId: string;
  passengerId: string;
  poolId: string;
  seats: number;
  farePaisa: number | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  originalEstimateFarePaisa: number;
  paymentMethod: string;
  pickupLocation: {
    id: number;
    name: string;
    lat: string;
    lng: string;
  };
  destLocation: {
    id: number;
    name: string;
    lat: string;
    lng: string;
  };
  pool: {
    id: string;
    status: string;
    capacity: number;
    occupiedSeats: number;
  };
  driver: {
    name: string;
  } | null;
  vehicle: {
    name: string;
    regNo: string;
    capacity: number;
  } | null;
}

type DbType = typeof db;

export class RidesRepository {
  constructor(private readonly db: DbType) {}

  /**
   * Checks passenger_rides joined with pools where passengerId matches,
   * cancelledAt IS NULL, and pools.status IN ('OPEN', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED').
   */
  async findActiveRideByPassengerId(
    passengerId: string,
    tx?: any
  ): Promise<{ id: string; poolId: string; status: string } | null> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const [activeRide] = await executor
      .select({
        id: passengerRides.id,
        poolId: passengerRides.poolId,
        status: pools.status,
      })
      .from(passengerRides)
      .innerJoin(pools, eq(passengerRides.poolId, pools.id))
      .where(
        and(
          eq(passengerRides.passengerId, passengerId),
          isNull(passengerRides.cancelledAt),
          inArray(pools.status, ['OPEN', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'])
        )
      )
      .limit(1);

    return activeRide ?? null;
  }

  /**
   * Queries active ride details for a passenger joined with ride_requests, pools,
   * pickup/dest locations, and optional driver user and vehicle.
   */
  async findActiveRideDetailsByPassengerId(
    passengerId: string,
    tx?: any
  ): Promise<ActiveRideRecord | null> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const [row] = await executor
      .select({
        id: passengerRides.id,
        rideRequestId: passengerRides.rideRequestId,
        passengerId: passengerRides.passengerId,
        poolId: passengerRides.poolId,
        seats: passengerRides.seats,
        farePaisa: passengerRides.farePaisa,
        cancelledAt: passengerRides.cancelledAt,
        cancelReason: passengerRides.cancelReason,
        completedAt: passengerRides.completedAt,
        createdAt: passengerRides.createdAt,
        updatedAt: passengerRides.updatedAt,
        originalEstimateFarePaisa: rideRequests.estimateFarePaisa,
        paymentMethod: rideRequests.paymentMethod,
        pickupLocationId: pickupLocations.id,
        pickupLocationName: pickupLocations.name,
        pickupLocationLat: pickupLocations.lat,
        pickupLocationLng: pickupLocations.lng,
        destLocationId: destLocations.id,
        destLocationName: destLocations.name,
        destLocationLat: destLocations.lat,
        destLocationLng: destLocations.lng,
        poolStatus: pools.status,
        poolCapacity: pools.capacity,
        poolOccupiedSeats: pools.occupiedSeats,
        driverName: driverUsers.name,
        vehicleName: poolVehicles.name,
        vehicleRegNo: poolVehicles.regNo,
        vehicleCapacity: poolVehicles.capacity,
      })
      .from(passengerRides)
      .innerJoin(rideRequests, eq(passengerRides.rideRequestId, rideRequests.id))
      .innerJoin(pools, eq(passengerRides.poolId, pools.id))
      .innerJoin(pickupLocations, eq(rideRequests.pickupLocationId, pickupLocations.id))
      .innerJoin(destLocations, eq(rideRequests.destLocationId, destLocations.id))
      .leftJoin(driverUsers, eq(pools.driverId, driverUsers.id))
      .leftJoin(poolVehicles, eq(pools.vehicleId, poolVehicles.id))
      .where(
        and(
          eq(passengerRides.passengerId, passengerId),
          isNull(passengerRides.cancelledAt),
          inArray(pools.status, ['OPEN', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'])
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return this.mapActiveRideRow(row);
  }

  /**
   * Queries ride details by ride ID scoped strictly to the requesting passenger ID.
   */
  async findRideDetailsById(
    rideId: string,
    passengerId: string,
    tx?: any
  ): Promise<ActiveRideRecord | null> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const [row] = await executor
      .select({
        id: passengerRides.id,
        rideRequestId: passengerRides.rideRequestId,
        passengerId: passengerRides.passengerId,
        poolId: passengerRides.poolId,
        seats: passengerRides.seats,
        farePaisa: passengerRides.farePaisa,
        cancelledAt: passengerRides.cancelledAt,
        cancelReason: passengerRides.cancelReason,
        completedAt: passengerRides.completedAt,
        createdAt: passengerRides.createdAt,
        updatedAt: passengerRides.updatedAt,
        originalEstimateFarePaisa: rideRequests.estimateFarePaisa,
        paymentMethod: rideRequests.paymentMethod,
        pickupLocationId: pickupLocations.id,
        pickupLocationName: pickupLocations.name,
        pickupLocationLat: pickupLocations.lat,
        pickupLocationLng: pickupLocations.lng,
        destLocationId: destLocations.id,
        destLocationName: destLocations.name,
        destLocationLat: destLocations.lat,
        destLocationLng: destLocations.lng,
        poolStatus: pools.status,
        poolCapacity: pools.capacity,
        poolOccupiedSeats: pools.occupiedSeats,
        driverName: driverUsers.name,
        vehicleName: poolVehicles.name,
        vehicleRegNo: poolVehicles.regNo,
        vehicleCapacity: poolVehicles.capacity,
      })
      .from(passengerRides)
      .innerJoin(rideRequests, eq(passengerRides.rideRequestId, rideRequests.id))
      .innerJoin(pools, eq(passengerRides.poolId, pools.id))
      .innerJoin(pickupLocations, eq(rideRequests.pickupLocationId, pickupLocations.id))
      .innerJoin(destLocations, eq(rideRequests.destLocationId, destLocations.id))
      .leftJoin(driverUsers, eq(pools.driverId, driverUsers.id))
      .leftJoin(poolVehicles, eq(pools.vehicleId, poolVehicles.id))
      .where(
        and(
          eq(passengerRides.id, rideId),
          eq(passengerRides.passengerId, passengerId)
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return this.mapActiveRideRow(row);
  }

  private mapActiveRideRow(row: {
    id: string;
    rideRequestId: string;
    passengerId: string;
    poolId: string;
    seats: number;
    farePaisa: number | null;
    cancelledAt: Date | null;
    cancelReason: string | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    originalEstimateFarePaisa: number;
    paymentMethod: string;
    pickupLocationId: number;
    pickupLocationName: string;
    pickupLocationLat: string;
    pickupLocationLng: string;
    destLocationId: number;
    destLocationName: string;
    destLocationLat: string;
    destLocationLng: string;
    poolStatus: string;
    poolCapacity: number;
    poolOccupiedSeats: number;
    driverName: string | null;
    vehicleName: string | null;
    vehicleRegNo: string | null;
    vehicleCapacity: number | null;
  }): ActiveRideRecord {
    return {
      id: row.id,
      rideRequestId: row.rideRequestId,
      passengerId: row.passengerId,
      poolId: row.poolId,
      seats: row.seats,
      farePaisa: row.farePaisa,
      cancelledAt: row.cancelledAt,
      cancelReason: row.cancelReason,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      originalEstimateFarePaisa: row.originalEstimateFarePaisa,
      paymentMethod: row.paymentMethod,
      pickupLocation: {
        id: row.pickupLocationId,
        name: row.pickupLocationName,
        lat: row.pickupLocationLat,
        lng: row.pickupLocationLng,
      },
      destLocation: {
        id: row.destLocationId,
        name: row.destLocationName,
        lat: row.destLocationLat,
        lng: row.destLocationLng,
      },
      pool: {
        id: row.poolId,
        status: row.poolStatus,
        capacity: row.poolCapacity,
        occupiedSeats: row.poolOccupiedSeats,
      },
      driver: row.driverName ? { name: row.driverName } : null,
      vehicle:
        row.vehicleName && row.vehicleRegNo && row.vehicleCapacity !== null
          ? {
              name: row.vehicleName,
              regNo: row.vehicleRegNo,
              capacity: row.vehicleCapacity,
            }
          : null,
    };
  }

  /**
   * Inserts a record into the ride_requests table.
   */
  async createRideRequest(
    data: {
      passengerId: string;
      pickupLocationId: number;
      destLocationId: number;
      seats: number;
      paymentMethod: string;
      estimateFarePaisa: number;
    },
    tx?: any
  ): Promise<RideRequestRow> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const [created] = await executor
      .insert(rideRequests)
      .values({
        passengerId: data.passengerId,
        pickupLocationId: data.pickupLocationId,
        destLocationId: data.destLocationId,
        seats: data.seats,
        paymentMethod: data.paymentMethod,
        estimateFarePaisa: data.estimateFarePaisa,
      })
      .returning();

    return created;
  }

  /**
   * Inserts a record into the passenger_rides table.
   */
  async createPassengerRide(
    data: {
      rideRequestId: string;
      passengerId: string;
      poolId: string;
      seats: number;
      farePaisa: number;
    },
    tx?: any
  ): Promise<PassengerRideRow> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const [created] = await executor
      .insert(passengerRides)
      .values({
        rideRequestId: data.rideRequestId,
        passengerId: data.passengerId,
        poolId: data.poolId,
        seats: data.seats,
        farePaisa: data.farePaisa,
      })
      .returning();

    return created;
  }

  /**
   * Finds ride joined with pool to verify ownership, cancellation status, and pool status.
   */
  async findRideForCancellation(
    rideId: string,
    passengerId: string,
    tx?: any
  ): Promise<{
    id: string;
    passengerId: string;
    poolId: string;
    seats: number;
    cancelledAt: Date | null;
    poolStatus: string;
  } | null> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const [row] = await executor
      .select({
        id: passengerRides.id,
        passengerId: passengerRides.passengerId,
        poolId: passengerRides.poolId,
        seats: passengerRides.seats,
        cancelledAt: passengerRides.cancelledAt,
        poolStatus: pools.status,
      })
      .from(passengerRides)
      .innerJoin(pools, eq(passengerRides.poolId, pools.id))
      .where(
        and(
          eq(passengerRides.id, rideId),
          eq(passengerRides.passengerId, passengerId)
        )
      )
      .limit(1);

    return row ?? null;
  }

  /**
   * Marks a passenger ride as cancelled with timestamp and optional reason.
   */
  async markRideCancelled(
    rideId: string,
    cancelReason?: string | null,
    tx?: any
  ): Promise<void> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    await executor
      .update(passengerRides)
      .set({
        cancelledAt: sql`now()`,
        cancelReason: cancelReason || null,
        updatedAt: sql`now()`,
      })
      .where(eq(passengerRides.id, rideId));
  }

  /**
   * Counts active (non-cancelled) passenger members in a pool.
   */
  async countActivePoolMembers(poolId: string, tx?: any): Promise<number> {
    const executor: DbType = tx ? (tx as DbType) : this.db;
    const [result] = await executor
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(passengerRides)
      .where(
        and(
          eq(passengerRides.poolId, poolId),
          isNull(passengerRides.cancelledAt)
        )
      );

    return result ? Number(result.count) : 0;
  }
}

export default RidesRepository;
