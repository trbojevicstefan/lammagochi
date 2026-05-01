export * from './migrations';
export * from './repository';
export * from './schema';
export * from './types';

import { createTablesSql } from './migrations';
import { createPersistenceRepository, type PersistenceRepository, type SqlExecutor } from './repository';

export interface PersistenceGateway {
  initialize(): Promise<void>;
  repository: PersistenceRepository;
}

export const createPersistenceGateway = (db: SqlExecutor): PersistenceGateway => ({
  repository: createPersistenceRepository(db),
  async initialize() {
    for (const sql of createTablesSql) {
      await db.execute(sql);
    }
  },
});

