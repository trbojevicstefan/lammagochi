import type { MemoryItem, PetProfile, PetRuntimeState, PetSnapshot, PetStats } from './types';

export type SqlExecutor = {
  execute: (sql: string, params?: unknown[]) => Promise<unknown>;
};

export interface PersistenceRepository {
  upsertProfile(profile: PetProfile): Promise<void>;
  upsertState(state: PetRuntimeState): Promise<void>;
  upsertStats(petId: string, stats: PetStats): Promise<void>;
  replaceMemoryItems(petId: string, items: MemoryItem[]): Promise<void>;
  loadSnapshot(petId: string): Promise<PetSnapshot | null>;
}

export const createPersistenceRepository = (_db: SqlExecutor): PersistenceRepository => {
  // Wiring real SQL statements is the next step when we connect Tauri SQL plugin.
  // This repository already defines stable persistence contracts for the app layer.
  const cache = new Map<string, PetSnapshot>();

  return {
    async upsertProfile(profile) {
      const existing = cache.get(profile.id);
      cache.set(profile.id, {
        profile,
        state:
          existing?.state ??
          ({
            petId: profile.id,
            level: 1,
            xp: 0,
            stage: 'onboarding',
            bubbleText: 'Hungry',
            lastTickAt: Date.now(),
          } as PetRuntimeState),
        stats:
          existing?.stats ??
          ({
            hunger: 50,
            curiosity: 60,
            energy: 70,
            hygiene: 60,
            mood: 65,
            knowledge: 10,
            trust: 20,
            boredom: 35,
          } as PetStats),
        memoryItems: existing?.memoryItems ?? [],
      });
    },
    async upsertState(state) {
      const existing = cache.get(state.petId);
      if (!existing) return;
      cache.set(state.petId, { ...existing, state });
    },
    async upsertStats(petId, stats) {
      const existing = cache.get(petId);
      if (!existing) return;
      cache.set(petId, { ...existing, stats });
    },
    async replaceMemoryItems(petId, items) {
      const existing = cache.get(petId);
      if (!existing) return;
      cache.set(petId, { ...existing, memoryItems: items });
    },
    async loadSnapshot(petId) {
      return cache.get(petId) ?? null;
    },
  };
};

