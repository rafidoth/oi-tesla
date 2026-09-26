import type { PoolsRepository } from '../pools.repository.js';
import { ConflictError } from '../../../shared/errors/ConflictError.js';

export interface SeatGuardPoolsRepository {
  incrementSeatsGuarded(poolId: string, seats: number, tx?: any): Promise<boolean>;
  decrementSeatsGuarded(poolId: string, seats: number, tx?: any): Promise<boolean>;
}

export class SeatGuard {
  constructor(private readonly poolsRepo: SeatGuardPoolsRepository | PoolsRepository) {}

  /**
   * Reserves seats in a pool atomically.
   * Throws ConflictError('POOL_FULL') if the conditional increment fails (0 rows updated).
   */
  async reserveSeats(poolId: string, seats: number, tx?: any): Promise<void> {
    const success = await this.poolsRepo.incrementSeatsGuarded(poolId, seats, tx);
    if (!success) {
      throw new ConflictError('POOL_FULL', 'Pool has no free seats', {
        poolId,
        requestedSeats: seats,
      });
    }
  }

  /**
   * Releases seats in a pool atomically.
   * Throws ConflictError if decrement fails (cannot decrement below 0).
   */
  async releaseSeats(poolId: string, seats: number, tx?: any): Promise<void> {
    const success = await this.poolsRepo.decrementSeatsGuarded(poolId, seats, tx);
    if (!success) {
      throw new ConflictError('CANNOT_DECREMENT_SEATS', 'Cannot decrement seats below 0', {
        poolId,
        requestedSeats: seats,
      });
    }
  }
}

export default SeatGuard;
