export type PetProfile = {
  id: string;
  name: string;
  modelName: string;
  createdAt: string;
  updatedAt: string;
};

export type MemoryItem = {
  id: string;
  petId: string;
  title: string;
  content: string;
  approved: boolean;
  createdAt: string;
};

export interface PersistenceGateway {
  initialize(): Promise<void>;
}

export const createPersistenceGateway = (): PersistenceGateway => ({
  async initialize() {
    // Placeholder for Drizzle + SQLite initialization in next iteration.
  },
});
