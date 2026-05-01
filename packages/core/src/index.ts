export type StatKey =
  | 'hunger'
  | 'curiosity'
  | 'energy'
  | 'hygiene'
  | 'mood'
  | 'knowledge'
  | 'trust'
  | 'boredom';

export type Stats = Record<StatKey, number>;

export const DEFAULT_STATS: Stats = {
  hunger: 50,
  curiosity: 60,
  energy: 70,
  hygiene: 60,
  mood: 65,
  knowledge: 10,
  trust: 20,
  boredom: 35,
};

export const clampStat = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

export const getWordCapForLevel = (level: number): number => {
  if (level <= 1) return 1;
  if (level <= 10) return level;
  return 999;
};

export const addXp = (currentXp: number, currentLevel: number, delta: number): { xp: number; level: number } => {
  let xp = Math.max(0, currentXp + delta);
  let level = currentLevel;

  while (xp >= xpThreshold(level)) {
    xp -= xpThreshold(level);
    level += 1;
  }

  return { xp, level };
};

export const xpThreshold = (level: number): number => 20 + level * 10;

export const applyDecay = (stats: Stats, minutesElapsed: number): Stats => {
  const ticks = Math.max(0, Math.floor(minutesElapsed));
  if (ticks === 0) return stats;

  return {
    hunger: clampStat(stats.hunger - ticks * 0.15),
    curiosity: clampStat(stats.curiosity - ticks * 0.1),
    energy: clampStat(stats.energy - ticks * 0.2),
    hygiene: clampStat(stats.hygiene - ticks * 0.1),
    mood: clampStat(stats.mood - ticks * 0.08),
    knowledge: clampStat(stats.knowledge),
    trust: clampStat(stats.trust),
    boredom: clampStat(stats.boredom + ticks * 0.12),
  };
};
