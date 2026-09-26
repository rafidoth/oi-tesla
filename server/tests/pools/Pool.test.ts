import { describe, it, expect } from 'vitest';
import { Pool } from '../../src/modules/pools/domain/Pool.js';

describe('Pool Entity Unit Tests', () => {
  const basePoolProps = {
    id: 'pool-uuid-1',
    pickupLocationId: 2,
    status: 'OPEN',
    driverId: null,
    vehicleId: null,
    capacity: 3,
    occupiedSeats: 1,
    createdAt: new Date('2026-09-26T10:00:00Z'),
    updatedAt: new Date('2026-09-26T10:00:00Z'),
  };

  describe('Properties and defaults', () => {
    it('exposes all pool properties correctly', () => {
      const pool = new Pool(basePoolProps);

      expect(pool.id).toBe('pool-uuid-1');
      expect(pool.pickupLocationId).toBe(2);
      expect(pool.status).toBe('OPEN');
      expect(pool.driverId).toBeNull();
      expect(pool.vehicleId).toBeNull();
      expect(pool.capacity).toBe(3);
      expect(pool.occupiedSeats).toBe(1);
      expect(pool.createdAt).toEqual(new Date('2026-09-26T10:00:00Z'));
      expect(pool.updatedAt).toEqual(new Date('2026-09-26T10:00:00Z'));
    });

    it('defaults optional fields safely when omitted', () => {
      const pool = new Pool({
        id: 'pool-uuid-2',
        pickupLocationId: 2,
        status: 'OPEN',
        capacity: 3,
        occupiedSeats: 0,
        createdAt: new Date('2026-09-26T10:00:00Z'),
      });

      expect(pool.driverId).toBeNull();
      expect(pool.vehicleId).toBeNull();
      expect(pool.updatedAt).toEqual(pool.createdAt);
    });
  });

  describe('canJoin()', () => {
    it('returns true when status is OPEN and seats fit within capacity', () => {
      const pool = new Pool({ ...basePoolProps, status: 'OPEN', occupiedSeats: 1, capacity: 3 });
      expect(pool.canJoin(1)).toBe(true);
      expect(pool.canJoin(2)).toBe(true);
    });

    it('returns true when status is MATCHED and seats fit within capacity', () => {
      const pool = new Pool({ ...basePoolProps, status: 'MATCHED', occupiedSeats: 2, capacity: 3 });
      expect(pool.canJoin(1)).toBe(true);
    });

    it('returns false when seats exceed remaining capacity', () => {
      const pool = new Pool({ ...basePoolProps, status: 'OPEN', occupiedSeats: 2, capacity: 3 });
      expect(pool.canJoin(2)).toBe(false);
    });

    it('returns false when pool is in DRIVER_ARRIVED, STARTED, COMPLETED, or CANCELLED status', () => {
      const statuses = ['DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED'];
      for (const status of statuses) {
        const pool = new Pool({ ...basePoolProps, status, occupiedSeats: 0, capacity: 3 });
        expect(pool.canJoin(1)).toBe(false);
      }
    });
  });

  describe('canAccept()', () => {
    it('returns true when status is OPEN and vehicle capacity is >= occupied seats', () => {
      const pool = new Pool({ ...basePoolProps, status: 'OPEN', occupiedSeats: 2 });
      expect(pool.canAccept(4)).toBe(true);
      expect(pool.canAccept(2)).toBe(true);
    });

    it('returns false when vehicle capacity is < occupied seats', () => {
      const pool = new Pool({ ...basePoolProps, status: 'OPEN', occupiedSeats: 3 });
      expect(pool.canAccept(2)).toBe(false);
    });

    it('returns false when pool status is not OPEN (e.g. already MATCHED)', () => {
      const pool = new Pool({ ...basePoolProps, status: 'MATCHED', occupiedSeats: 1 });
      expect(pool.canAccept(4)).toBe(false);
    });
  });
});
