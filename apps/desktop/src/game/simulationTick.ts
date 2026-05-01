import { applyDecay, clampStat, type Stats } from '@lamagotchi/core';

export type DayPhase = 'morning' | 'day' | 'evening' | 'night';

export const resolveDayPhase = (date: Date): DayPhase => {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'day';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
};

export const applySimulationTick = (stats: Stats, minutes: number, dayPhase: DayPhase): Stats => {
  const decayed = applyDecay(stats, minutes);
  const adjusted = { ...decayed };

  if (dayPhase === 'night') {
    adjusted.energy = clampStat(adjusted.energy - 1);
    adjusted.mood = clampStat(adjusted.mood - 1);
  }

  if (dayPhase === 'morning') {
    adjusted.curiosity = clampStat(adjusted.curiosity + 1);
  }

  return adjusted;
};

export const chooseAutonomousPrompt = (stats: Stats, dayPhase: DayPhase): string | null => {
  if (stats.hunger < 28) return 'Feed?';
  if (stats.energy < 24) return dayPhase === 'night' ? 'Sleep.' : 'Sleepy.';
  if (stats.curiosity > 74) return 'Task?';
  if (stats.boredom > 72) return 'Play?';
  if (dayPhase === 'evening') return 'Daydream?';
  return null;
};
