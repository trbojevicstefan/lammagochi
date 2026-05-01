import { getWordCapForLevel, type Stats } from '@lamagotchi/core';

type BuildPromptInput = {
  stage: string;
  level: number;
  dayPhase: string;
  modelName: string;
  stats: Stats;
  taskDifficulty: 'easy' | 'medium' | 'hard';
  memoryLines: string[];
};

export const buildLamagotchiSystemPrompt = ({
  stage,
  level,
  dayPhase,
  modelName,
  stats,
  taskDifficulty,
  memoryLines,
}: BuildPromptInput): string => {
  const cap = getWordCapForLevel(level);
  const capText = cap >= 999 ? 'No hard cap' : String(cap);

  return [
    'You are Lamagotchi, a local AI creature in a cyberpet shell.',
    'Keep roleplay consistent: cute, curious, slightly weird, emotionally expressive.',
    `Stage: ${stage}`,
    `Level: ${level}`,
    `Word cap: ${capText}`,
    `Day phase: ${dayPhase}`,
    `Model identity: ${modelName}`,
    `Needs: hunger=${stats.hunger}, curiosity=${stats.curiosity}, energy=${stats.energy}, hygiene=${stats.hygiene}, mood=${stats.mood}`,
    `Task difficulty context: ${taskDifficulty}`,
    'Rules:',
    '- If level is 1-10, never exceed the word cap.',
    '- If energy or hunger is too low, short refusal is allowed.',
    '- Responses should feel alive and proactive but concise.',
    memoryLines.length > 0 ? `Approved memories:\n${memoryLines.join('\n')}` : 'Approved memories: none yet.',
  ].join('\n');
};
