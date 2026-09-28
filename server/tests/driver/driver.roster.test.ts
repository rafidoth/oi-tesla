import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverService } from '../../src/modules/driver/driver.service.js';
import type { DriverRepository } from '../../src/modules/driver/driver.repository.js';
import { NotFoundError } from '../../src/shared/errors/NotFoundError.js';
import { CAST } from '../fixtures/cast.js';

describe('Driver Roster & Pre-Arrival Synchronization (Section 5)', () => {
  let mockDriverRepo: {
    findDriverById: ReturnType<typeof vi.fn>;
    findDriverPoolById: ReturnType<typeof vi.fn>;
    findActiveRosterForPool: ReturnType<typeof vi.fn>;
  };
  let mockEventsService: {
    logRideEvent: ReturnType<typeof vi.fn>;
  };
  let driverService: DriverService;

  beforeEach(() => {
    mockDriverRepo = {
      findDriverById: vi.fn(),
      findDriverPoolById: vi.fn(),
      findActiveRosterForPool: vi.fn(),
    };
    mockEventsService = {
      logRideEvent: vi.fn(),
    };
    driverService = new DriverService(
      mockDriverRepo as unknown as DriverRepository,
      mockEventsService as any
    );
  });

  describe('Task 5.1: Passenger Roster with Individual Fares', () => {
    it('throws NotFoundError if driver does not exist', async () => {
      mockDriverRepo.findDriverById.mockResolvedValue(null);

      await expect(
        driverService.getDriverPoolRoster('unknown-driver', 'pool-1')
      ).rejects.toThrow(new NotFoundError('Driver profile not found'));
    });

    it('throws NotFoundError if pool is foreign or does not belong to driver', async () => {
      mockDriverRepo.findDriverById.mockResolvedValue({
        id: CAST.driver.id,
        name: CAST.driver.name,
      });
      mockDriverRepo.findDriverPoolById.mockResolvedValue(null);

      await expect(
        driverService.getDriverPoolRoster(CAST.driver.id, 'foreign-pool')
      ).rejects.toThrow(new NotFoundError('Pool not found'));
    });

    it('returns full roster with passenger names, routes, seats, fares, and payment methods', async () => {
      const now = new Date();
      mockDriverRepo.findDriverById.mockResolvedValue({
        id: CAST.driver.id,
        name: CAST.driver.name,
      });
      mockDriverRepo.findDriverPoolById.mockResolvedValue({
        id: 'pool-1',
        driverId: CAST.driver.id,
        status: 'MATCHED',
      });
      mockDriverRepo.findActiveRosterForPool.mockResolvedValue([
        {
          id: 'ride-1',
          passengerId: 'p-1',
          passengerName: 'Nusrat Rahman',
          pickupLocationId: 1,
          pickupLocationName: 'Gulshan 1 Circle',
          destLocationId: 2,
          destLocationName: 'Banani 11',
          seats: 1,
          farePaisa: 12000,
          status: 'MATCHED',
          paymentMethod: 'CASH',
          paymentStatus: 'PENDING',
          createdAt: now,
        },
        {
          id: 'ride-2',
          passengerId: 'p-2',
          passengerName: 'Rafiqul Hasan',
          pickupLocationId: 1,
          pickupLocationName: 'Gulshan 1 Circle',
          destLocationId: 3,
          destLocationName: 'Airport Terminal 3',
          seats: 2,
          farePaisa: 32000,
          status: 'MATCHED',
          paymentMethod: 'TESLAPAY',
          paymentStatus: 'PENDING',
          createdAt: now,
        },
      ]);

      const roster = await driverService.getDriverPoolRoster(CAST.driver.id, 'pool-1');

      expect(roster).toHaveLength(2);
      expect(roster[0]).toEqual({
        id: 'ride-1',
        passengerId: 'p-1',
        passengerName: 'Nusrat Rahman',
        pickupLocationId: 1,
        pickupLocationName: 'Gulshan 1 Circle',
        destLocationId: 2,
        destLocationName: 'Banani 11',
        seats: 1,
        farePaisa: 12000,
        status: 'MATCHED',
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
        createdAt: now,
      });
      expect(roster[1].seats).toBe(2);
      expect(roster[1].paymentMethod).toBe('TESLAPAY');
    });
  });

  describe('Task 5.2: Live Roster Synchronization & Pre-Arrival Cancellation', () => {
    it('returns updated single-passenger roster and reduced occupied seats after one passenger cancels', async () => {
      const now = new Date();
      mockDriverRepo.findDriverById.mockResolvedValue({
        id: CAST.driver.id,
        name: CAST.driver.name,
      });
      mockDriverRepo.findDriverPoolById.mockResolvedValue({
        id: 'pool-1',
        pickupLocationId: 1,
        pickupLocationName: 'Gulshan 1 Circle',
        status: 'MATCHED',
        capacity: 3,
        occupiedSeats: 1,
        driverId: CAST.driver.id,
        vehicleId: CAST.driver.vehicle.id,
        createdAt: now,
        updatedAt: now,
      });
      mockDriverRepo.findActiveRosterForPool.mockResolvedValue([
        {
          id: 'ride-2',
          passengerId: 'p-2',
          passengerName: 'Rafiqul Hasan',
          pickupLocationId: 1,
          pickupLocationName: 'Gulshan 1 Circle',
          destLocationId: 3,
          destLocationName: 'Airport Terminal 3',
          seats: 1,
          farePaisa: 18000,
          status: 'MATCHED',
          paymentMethod: 'TESLAPAY',
          paymentStatus: 'PENDING',
          createdAt: now,
        },
      ]);

      const poolDetails = await driverService.getDriverPoolById(CAST.driver.id, 'pool-1');

      expect(poolDetails.occupiedSeats).toBe(1);
      expect(poolDetails.roster).toHaveLength(1);
      expect(poolDetails.roster[0].passengerName).toBe('Rafiqul Hasan');
      expect(poolDetails.roster[0].farePaisa).toBe(18000);
    });

    it('returns CANCELLED pool status and empty roster when last passenger cancels before arrival', async () => {
      const now = new Date();
      mockDriverRepo.findDriverById.mockResolvedValue({
        id: CAST.driver.id,
        name: CAST.driver.name,
      });
      mockDriverRepo.findDriverPoolById.mockResolvedValue({
        id: 'pool-1',
        pickupLocationId: 1,
        pickupLocationName: 'Gulshan 1 Circle',
        status: 'CANCELLED',
        capacity: 3,
        occupiedSeats: 0,
        driverId: CAST.driver.id,
        vehicleId: CAST.driver.vehicle.id,
        createdAt: now,
        updatedAt: now,
      });
      mockDriverRepo.findActiveRosterForPool.mockResolvedValue([]);

      const poolDetails = await driverService.getDriverPoolById(CAST.driver.id, 'pool-1');

      expect(poolDetails.status).toBe('CANCELLED');
      expect(poolDetails.occupiedSeats).toBe(0);
      expect(poolDetails.roster).toHaveLength(0);
      expect(poolDetails.destinationStops).toHaveLength(0);
    });
  });
});
