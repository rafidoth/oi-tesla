import type { db } from '../../db/client.js';

type DbType = typeof db;

export class RidesRepository {
  constructor(private readonly db: DbType) {}
}

export default RidesRepository;
