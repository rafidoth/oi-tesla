import { AuthRepository } from './auth.repository.js';
import type { RegisterDto, LoginDto, AuthResponse, RegisterResponse } from './auth.types.js';
import { ConflictError } from '../../shared/errors/ConflictError.js';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError.js';
import { hashPassword, verifyPassword } from '../../shared/wrappers/crypto.js';
import { signToken } from '../../shared/wrappers/jwt.js';

export class AuthService {
  constructor(private readonly authRepo: AuthRepository) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const existingUser = await this.authRepo.findUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('EMAIL_TAKEN', 'An account with this email address already exists');
    }

    if (dto.role === 'DRIVER' && dto.vehicle) {
      const existingVehicle = await this.authRepo.findVehicleByRegNo(dto.vehicle.regNo);
      if (existingVehicle) {
        throw new ConflictError('VEHICLE_REG_TAKEN', 'A vehicle with this registration number already exists');
      }
    }

    const passwordHash = hashPassword(dto.password);

    const { user, vehicle } = await this.authRepo.createUserWithVehicle(
      {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
      },
      dto.role === 'DRIVER' ? dto.vehicle : undefined
    );

    return {
      message: 'Account created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'PASSENGER' | 'DRIVER',
        vehicle: vehicle
          ? {
              id: vehicle.id,
              name: vehicle.name,
              regNo: vehicle.regNo,
              capacity: vehicle.capacity,
            }
          : undefined,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.authRepo.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isMatch = verifyPassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    let vehicleDetails: { id?: string; name: string; regNo: string; capacity: number } | undefined;
    if (user.role === 'DRIVER') {
      const vehicle = await this.authRepo.findVehicleByDriverId(user.id);
      if (vehicle) {
        vehicleDetails = {
          id: vehicle.id,
          name: vehicle.name,
          regNo: vehicle.regNo,
          capacity: vehicle.capacity,
        };
      }
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role as 'PASSENGER' | 'DRIVER',
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'PASSENGER' | 'DRIVER',
        vehicle: vehicleDetails,
      },
    };
  }
}

export default AuthService;
