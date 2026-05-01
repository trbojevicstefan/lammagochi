import type { Stats } from '@lamagotchi/core';
import { buildIdentityPrompt } from './systemPrompt';

type BuildPromptInput = {
  stage: string;
  level: number;
  dayPhase: string;
  modelName: string;
  stats: Stats;
  taskDifficulty: 'easy' | 'medium' | 'hard';
  memoryLines: string[];
  petName: string;
};

export const buildLamagotchiSystemPrompt = (input: BuildPromptInput): string => {
  return buildIdentityPrompt({
    petName: input.petName,
    level: input.level,
    stats: input.stats,
    dayPhase: input.dayPhase,
    modelName: input.modelName,
    stage: input.stage,
    memoryLines: input.memoryLines,
  });
};
