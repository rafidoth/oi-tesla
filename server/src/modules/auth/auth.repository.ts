import { eq } from 'drizzle-orm';
import type { db } from '../../db/client.js';
import { users, vehicles, type User, type Vehicle } from '../../db/schema/index.js';

export class AuthRepository {
  constructor(private readonly dbClient: typeof db) {}

  async findUserByEmail(email: string): Promise<User | null> {
    const [user] = await this.dbClient
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    return user || null;
  }

  async findVehicleByRegNo(regNo: string): Promise<Vehicle | null> {
    const [vehicle] = await this.dbClient
      .select()
      .from(vehicles)
      .where(eq(vehicles.regNo, regNo.trim()))
      .limit(1);

    return vehicle || null;
  }

  async findVehicleByDriverId(driverId: string): Promise<Vehicle | null> {
    const [vehicle] = await this.dbClient
      .select()
      .from(vehicles)
      .where(eq(vehicles.driverId, driverId))
      .limit(1);

    return vehicle || null;
  }

  async createUserWithVehicle(
    userData: { name: string; email: string; passwordHash: string; role: 'PASSENGER' | 'DRIVER' },
    vehicleData?: { name: string; regNo: string; capacity: number }
  ): Promise<{ user: User; vehicle?: Vehicle }> {
    return await this.dbClient.transaction(async (tx) => {
      const [insertedUser] = await tx
        .insert(users)
        .values({
          name: userData.name,
          email: userData.email.toLowerCase().trim(),
          passwordHash: userData.passwordHash,
          role: userData.role,
        })
        .returning();

      let insertedVehicle: Vehicle | undefined;
      if (vehicleData) {
        const [v] = await tx
          .insert(vehicles)
          .values({
            driverId: insertedUser.id,
            name: vehicleData.name,
            regNo: vehicleData.regNo,
            capacity: vehicleData.capacity,
            status: 'OFFLINE',
          })
          .returning();
        insertedVehicle = v;
      }

      return { user: insertedUser, vehicle: insertedVehicle };
    });
  }
}

export default AuthRepository;
