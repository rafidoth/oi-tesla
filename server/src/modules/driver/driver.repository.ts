import { and, eq, inArray } from 'drizzle-orm';
import type { db } from '../../db/client.js';
import { users, vehicles, pools, locations, type User, type Vehicle } from '../../db/schema/index.js';
import type { DriverActivePool } from './driver.types.js';

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
}

export default DriverRepository;
