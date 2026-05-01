import { describe, expect, it } from 'vitest';
import { createPersistenceGateway } from './index';

describe('persistence gateway', () => {
  it('runs table creation SQL on initialize', async () => {
    const executed: string[] = [];
    const gateway = createPersistenceGateway({
      async execute(sql: string) {
        executed.push(sql);
      },
    });

    await gateway.initialize();
    expect(executed.length).toBeGreaterThanOrEqual(5);
  });

  it('stores and loads in-memory snapshot through repository contract', async () => {
    const gateway = createPersistenceGateway({
      async execute() {
        return undefined;
      },
    });

    await gateway.repository.upsertProfile({
      id: 'pet-1',
      name: 'Noodle',
      modelName: 'qwen2.5:7b',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await gateway.repository.upsertState({
      petId: 'pet-1',
      level: 2,
      xp: 3,
      stage: 'alive',
      bubbleText: 'Hi',
      lastTickAt: Date.now(),
    });

    await gateway.repository.upsertStats('pet-1', {
      hunger: 60,
      curiosity: 70,
      energy: 80,
      hygiene: 75,
      mood: 77,
      knowledge: 20,
      trust: 15,
      boredom: 40,
    });

    const snapshot = await gateway.repository.loadSnapshot('pet-1');
    expect(snapshot?.profile.name).toBe('Noodle');
    expect(snapshot?.state.level).toBe(2);
    expect(snapshot?.stats.energy).toBe(80);
  });
});

