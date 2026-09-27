import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverService } from '../../src/modules/driver/driver.service.js';
import type { DriverRepository } from '../../src/modules/driver/driver.repository.js';
import { NotFoundError } from '../../src/shared/errors/NotFoundError.js';
import { CAST } from '../fixtures/cast.js';

describe('DriverService Unit Tests', () => {
  let mockDriverRepo: {
    findDriverById: ReturnType<typeof vi.fn>;
    findVehicleByDriverId: ReturnType<typeof vi.fn>;
    findActivePoolByDriverId: ReturnType<typeof vi.fn>;
    updateVehicleStatus: ReturnType<typeof vi.fn>;
  };
  let driverService: DriverService;

  beforeEach(() => {
    mockDriverRepo = {
      findDriverById: vi.fn(),
      findVehicleByDriverId: vi.fn(),
      findActivePoolByDriverId: vi.fn(),
      updateVehicleStatus: vi.fn(),
    };
    driverService = new DriverService(mockDriverRepo as unknown as DriverRepository);
  });

  it('retrieves driver profile and vehicle overview without an active pool', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: CAST.driver.role,
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: CAST.driver.vehicle.capacity,
      status: CAST.driver.vehicle.status,
    });
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue(null);

    const result = await driverService.getDriverMe(CAST.driver.id);

    expect(result.driver).toEqual({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    expect(result.vehicle).toEqual({
      id: CAST.driver.vehicle.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: 3,
      status: 'ONLINE',
    });
    expect(result.activePool).toBeNull();
  });

  it('includes active pool assignment when driver is in an ongoing ride', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: CAST.driver.vehicle.capacity,
      status: CAST.driver.vehicle.status,
    });
    const now = new Date();
    mockDriverRepo.findActivePoolByDriverId.mockResolvedValue({
      id: 'pool-123',
      pickupLocationId: 2,
      pickupLocationName: 'Banani',
      status: 'MATCHED',
      capacity: 3,
      occupiedSeats: 2,
      createdAt: now,
      updatedAt: now,
    });

    const result = await driverService.getDriverMe(CAST.driver.id);

    expect(result.activePool).not.toBeNull();
    expect(result.activePool?.id).toBe('pool-123');
    expect(result.activePool?.pickupLocationName).toBe('Banani');
    expect(result.activePool?.status).toBe('MATCHED');
    expect(result.activePool?.occupiedSeats).toBe(2);
    expect(result.activePool?.capacity).toBe(3);
  });

  it('throws NotFoundError when driver user is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue(null);

    await expect(driverService.getDriverMe('non-existent-id')).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when driver has no vehicle linked', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.findVehicleByDriverId.mockResolvedValue(null);

    await expect(driverService.getDriverMe(CAST.driver.id)).rejects.toThrow(NotFoundError);
  });

  it('successfully updates driver vehicle status to OFFLINE', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.updateVehicleStatus.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: CAST.driver.vehicle.capacity,
      status: 'OFFLINE',
    });

    const result = await driverService.updateDriverStatus(CAST.driver.id, 'OFFLINE');

    expect(mockDriverRepo.updateVehicleStatus).toHaveBeenCalledWith(CAST.driver.id, 'OFFLINE');
    expect(result.status).toBe('OFFLINE');
    expect(result.vehicle.status).toBe('OFFLINE');
  });

  it('successfully updates driver vehicle status to ONLINE', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.updateVehicleStatus.mockResolvedValue({
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: CAST.driver.vehicle.capacity,
      status: 'ONLINE',
    });

    const result = await driverService.updateDriverStatus(CAST.driver.id, 'ONLINE');

    expect(mockDriverRepo.updateVehicleStatus).toHaveBeenCalledWith(CAST.driver.id, 'ONLINE');
    expect(result.status).toBe('ONLINE');
    expect(result.vehicle.status).toBe('ONLINE');
  });

  it('throws NotFoundError on updateDriverStatus when driver user is not found', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue(null);

    await expect(
      driverService.updateDriverStatus('non-existent-id', 'ONLINE')
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError on updateDriverStatus when driver has no vehicle linked', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue({
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: 'DRIVER',
    });
    mockDriverRepo.updateVehicleStatus.mockResolvedValue(null);

    await expect(
      driverService.updateDriverStatus(CAST.driver.id, 'ONLINE')
    ).rejects.toThrow(NotFoundError);
  });
});

