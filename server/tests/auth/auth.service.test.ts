import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import type { AuthRepository } from '../../src/modules/auth/auth.repository.js';
import { ConflictError } from '../../src/shared/errors/ConflictError.js';
import { UnauthorizedError } from '../../src/shared/errors/UnauthorizedError.js';
import { hashPassword } from '../../src/shared/wrappers/crypto.js';

describe('AuthService Unit Tests', () => {
  let mockRepo: Partial<AuthRepository>;
  let authService: AuthService;

  beforeEach(() => {
    mockRepo = {
      findUserByEmail: vi.fn(),
      findVehicleByRegNo: vi.fn(),
      findVehicleByDriverId: vi.fn(),
      createUserWithVehicle: vi.fn(),
    };
    authService = new AuthService(mockRepo as AuthRepository);
  });

  describe('register', () => {
    it('should register a passenger successfully', async () => {
      (mockRepo.findUserByEmail as any).mockResolvedValue(null);
      (mockRepo.createUserWithVehicle as any).mockResolvedValue({
        user: {
          id: 'usr-1',
          name: 'Nusrat',
          email: 'nusrat@example.com',
          role: 'PASSENGER',
        },
      });

      const result = await authService.register({
        name: 'Nusrat',
        email: 'nusrat@example.com',
        password: 'Password123!',
        role: 'PASSENGER',
      });

      expect(result.message).toBe('Account created successfully');
      expect(result.user.email).toBe('nusrat@example.com');
      expect(result.user.role).toBe('PASSENGER');
    });

    it('should register a driver with vehicle successfully', async () => {
      (mockRepo.findUserByEmail as any).mockResolvedValue(null);
      (mockRepo.findVehicleByRegNo as any).mockResolvedValue(null);
      (mockRepo.createUserWithVehicle as any).mockResolvedValue({
        user: {
          id: 'usr-2',
          name: 'Jashim',
          email: 'jashim@example.com',
          role: 'DRIVER',
        },
        vehicle: {
          id: 'veh-1',
          name: 'Bullet',
          regNo: 'DHA-SHA-11-2233',
          capacity: 3,
        },
      });

      const result = await authService.register({
        name: 'Jashim',
        email: 'jashim@example.com',
        password: 'Password123!',
        role: 'DRIVER',
        vehicle: {
          name: 'Bullet',
          regNo: 'DHA-SHA-11-2233',
          capacity: 3,
        },
      });

      expect(result.message).toBe('Account created successfully');
      expect(result.user.role).toBe('DRIVER');
      expect(result.user.vehicle?.name).toBe('Bullet');
    });

    it('should throw ConflictError if email is already taken', async () => {
      (mockRepo.findUserByEmail as any).mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({
          name: 'Duplicate',
          email: 'taken@example.com',
          password: 'Password123!',
          role: 'PASSENGER',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if driver vehicle registration number is already taken', async () => {
      (mockRepo.findUserByEmail as any).mockResolvedValue(null);
      (mockRepo.findVehicleByRegNo as any).mockResolvedValue({ id: 'veh-existing' });

      await expect(
        authService.register({
          name: 'Driver 2',
          email: 'driver2@example.com',
          password: 'Password123!',
          role: 'DRIVER',
          vehicle: {
            name: 'Tesla 2',
            regNo: 'DHA-SHA-11-2233',
            capacity: 3,
          },
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials and return JWT', async () => {
      const password = 'Password123!';
      const storedHash = hashPassword(password);

      (mockRepo.findUserByEmail as any).mockResolvedValue({
        id: 'usr-1',
        name: 'Nusrat',
        email: 'nusrat@example.com',
        passwordHash: storedHash,
        role: 'PASSENGER',
      });

      const result = await authService.login({
        email: 'nusrat@example.com',
        password,
      });

      expect(result.token).toBeDefined();
      expect(result.user.id).toBe('usr-1');
      expect(result.user.email).toBe('nusrat@example.com');
    });

    it('should reject login if user is not found', async () => {
      (mockRepo.findUserByEmail as any).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should reject login if password does not match', async () => {
      (mockRepo.findUserByEmail as any).mockResolvedValue({
        id: 'usr-1',
        name: 'Nusrat',
        email: 'nusrat@example.com',
        passwordHash: hashPassword('CorrectPassword123!'),
        role: 'PASSENGER',
      });

      await expect(
        authService.login({
          email: 'nusrat@example.com',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
