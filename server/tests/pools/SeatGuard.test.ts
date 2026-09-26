import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeatGuard } from '../../src/modules/pools/domain/SeatGuard.js';
import { PoolsRepository } from '../../src/modules/pools/pools.repository.js';
import { ConflictError } from '../../src/shared/errors/ConflictError.js';

describe('SeatGuard Domain Class Unit & Concurrency Tests', () => {
  let mockPoolsRepo: Partial<PoolsRepository>;
  let seatGuard: SeatGuard;

  beforeEach(() => {
    mockPoolsRepo = {
      incrementSeatsGuarded: vi.fn(),
      decrementSeatsGuarded: vi.fn(),
    };
    seatGuard = new SeatGuard(mockPoolsRepo as PoolsRepository);
  });

  describe('reserveSeats', () => {
    it('successfully increments seats when repo returns true', async () => {
      vi.mocked(mockPoolsRepo.incrementSeatsGuarded!).mockResolvedValue(true);

      await expect(
        seatGuard.reserveSeats('pool-1', 1)
      ).resolves.toBeUndefined();

      expect(mockPoolsRepo.incrementSeatsGuarded).toHaveBeenCalledWith(
        'pool-1',
        1,
        undefined
      );
    });

    it('passes transaction context to poolsRepo.incrementSeatsGuarded', async () => {
      vi.mocked(mockPoolsRepo.incrementSeatsGuarded!).mockResolvedValue(true);
      const mockTx = { execute: vi.fn() };

      await seatGuard.reserveSeats('pool-1', 2, mockTx);

      expect(mockPoolsRepo.incrementSeatsGuarded).toHaveBeenCalledWith(
        'pool-1',
        2,
        mockTx
      );
    });

    it('rejects with ConflictError("POOL_FULL") when pool cannot accept requested seats (0 rows updated)', async () => {
      vi.mocked(mockPoolsRepo.incrementSeatsGuarded!).mockResolvedValue(false);

      await expect(seatGuard.reserveSeats('pool-full-1', 2)).rejects.toThrow(
        ConflictError
      );

      try {
        await seatGuard.reserveSeats('pool-full-1', 2);
        expect.fail('Should have thrown ConflictError');
      } catch (err) {
        expect(err).toBeInstanceOf(ConflictError);
        const conflict = err as ConflictError;
        expect(conflict.statusCode).toBe(409);
        expect(conflict.code).toBe('POOL_FULL');
        expect(conflict.message).toBe('Pool has no free seats');
        expect(conflict.details).toEqual({
          poolId: 'pool-full-1',
          requestedSeats: 2,
        });
      }
    });

    it('enforces status gate (rejects when pool is in STARTED, COMPLETED, or CANCELLED status)', async () => {
      // When a pool has already STARTED or COMPLETED, the guarded SQL condition:
      // status IN ('OPEN', 'MATCHED') fails, returning 0 rows updated (false).
      vi.mocked(mockPoolsRepo.incrementSeatsGuarded!).mockResolvedValue(false);

      await expect(
        seatGuard.reserveSeats('pool-started-1', 1)
      ).rejects.toThrowError(ConflictError);
    });
  });

  describe('releaseSeats', () => {
    it('successfully decrements seats when repo returns true', async () => {
      vi.mocked(mockPoolsRepo.decrementSeatsGuarded!).mockResolvedValue(true);

      await expect(
        seatGuard.releaseSeats('pool-1', 1)
      ).resolves.toBeUndefined();

      expect(mockPoolsRepo.decrementSeatsGuarded).toHaveBeenCalledWith(
        'pool-1',
        1,
        undefined
      );
    });

    it('passes transaction context to poolsRepo.decrementSeatsGuarded', async () => {
      vi.mocked(mockPoolsRepo.decrementSeatsGuarded!).mockResolvedValue(true);
      const mockTx = { execute: vi.fn() };

      await seatGuard.releaseSeats('pool-1', 1, mockTx);

      expect(mockPoolsRepo.decrementSeatsGuarded).toHaveBeenCalledWith(
        'pool-1',
        1,
        mockTx
      );
    });

    it('throws error when decrement fails (cannot decrement below 0)', async () => {
      vi.mocked(mockPoolsRepo.decrementSeatsGuarded!).mockResolvedValue(false);

      await expect(seatGuard.releaseSeats('pool-1', 2)).rejects.toThrow(
        'Cannot decrement seats below 0'
      );
    });
  });

  describe('Concurrency Race Simulation', () => {
    it('serialises concurrent join requests: exactly one wins and the loser gets ConflictError("POOL_FULL")', async () => {
      // Simulate 1 seat left on pool-race.
      // Passenger A and Passenger B both attempt to reserve the final seat concurrently.
      // Under Postgres atomic UPDATE, the first transaction updates the row and returns true.
      // The second transaction matches 0 rows (occupied_seats + 1 <= capacity evaluates to false) and returns false.
      let availableSeats = 1;

      vi.mocked(mockPoolsRepo.incrementSeatsGuarded!).mockImplementation(
        async (_poolId: string, requestedSeats: number) => {
          if (availableSeats >= requestedSeats) {
            availableSeats -= requestedSeats;
            return true;
          }
          return false;
        }
      );

      const results = await Promise.allSettled([
        seatGuard.reserveSeats('pool-race', 1),
        seatGuard.reserveSeats('pool-race', 1),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected'
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      expect(rejected[0].reason).toBeInstanceOf(ConflictError);
      expect((rejected[0].reason as ConflictError).code).toBe('POOL_FULL');
      expect((rejected[0].reason as ConflictError).statusCode).toBe(409);
    });
  });
});

describe('PoolsRepository Guarded SQL Update & Decrement', () => {
  let mockDb: any;
  let repo: PoolsRepository;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn(),
    };
    repo = new PoolsRepository(mockDb);
  });

  describe('incrementSeatsGuarded', () => {
    it('returns true when row is returned by executor.execute', async () => {
      mockDb.execute.mockResolvedValue([{ id: 'pool-123' }]);

      const result = await repo.incrementSeatsGuarded('pool-123', 1);

      expect(result).toBe(true);
      expect(mockDb.execute).toHaveBeenCalled();
      const sqlCall = mockDb.execute.mock.calls[0][0];
      const sqlString = sqlCall.queryChunks.map((c: any) => c.value ?? c).join(' ');
      expect(sqlString).toContain('UPDATE pools');
      expect(sqlString).toContain('status IN');
      expect(sqlString).toContain('occupied_seats +');
    });

    it('returns true when rowCount > 0 is returned by executor', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });

      const result = await repo.incrementSeatsGuarded('pool-123', 2);

      expect(result).toBe(true);
    });

    it('returns false when no rows are updated (0 rows matched)', async () => {
      mockDb.execute.mockResolvedValue([]);

      const result = await repo.incrementSeatsGuarded('pool-123', 1);

      expect(result).toBe(false);
    });

    it('uses provided tx executor when passed', async () => {
      const mockTx = { execute: vi.fn().mockResolvedValue([{ id: 'pool-123' }]) };

      const result = await repo.incrementSeatsGuarded('pool-123', 1, mockTx);

      expect(result).toBe(true);
      expect(mockTx.execute).toHaveBeenCalled();
      expect(mockDb.execute).not.toHaveBeenCalled();
    });
  });

  describe('decrementSeatsGuarded', () => {
    it('returns true when row is returned by executor.execute', async () => {
      mockDb.execute.mockResolvedValue([{ id: 'pool-123' }]);

      const result = await repo.decrementSeatsGuarded('pool-123', 1);

      expect(result).toBe(true);
      expect(mockDb.execute).toHaveBeenCalled();
      const sqlCall = mockDb.execute.mock.calls[0][0];
      const sqlString = sqlCall.queryChunks.map((c: any) => c.value ?? c).join(' ');
      expect(sqlString).toContain('UPDATE pools');
      expect(sqlString).toContain('occupied_seats -');
      expect(sqlString).toContain('>= 0');
    });

    it('returns false when no rows are updated (e.g. would decrement below 0)', async () => {
      mockDb.execute.mockResolvedValue([]);

      const result = await repo.decrementSeatsGuarded('pool-123', 1);

      expect(result).toBe(false);
    });

    it('uses provided tx executor when passed', async () => {
      const mockTx = { execute: vi.fn().mockResolvedValue([{ id: 'pool-123' }]) };

      const result = await repo.decrementSeatsGuarded('pool-123', 1, mockTx);

      expect(result).toBe(true);
      expect(mockTx.execute).toHaveBeenCalled();
      expect(mockDb.execute).not.toHaveBeenCalled();
    });
  });
});
