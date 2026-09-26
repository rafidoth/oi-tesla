import { eq } from 'drizzle-orm';
import type { db } from '../../db/client.js';
import { users, vehicles, type User, type Vehicle } from '../../db/schema/index.js';

export class UsersRepository {
  constructor(private readonly dbClient: typeof db) {}

  async findUserById(id: string): Promise<User | null> {
    const [user] = await this.dbClient
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  }

  async findVehicleByDriverId(driverId: string): Promise<Vehicle | null> {
    const [vehicle] = await this.dbClient
      .select()
      .from(vehicles)
      .where(eq(vehicles.driverId, driverId))
      .limit(1);

    return vehicle || null;
  }
}

export default UsersRepository;
