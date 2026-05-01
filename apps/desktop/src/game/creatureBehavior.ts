import type { Stats } from '@lamagotchi/core';

export type CreatureMood = 'calm' | 'hungry' | 'sleepy' | 'curious' | 'dirty';

export type MotionProfile = {
  floatSpeed: number;
  floatIntensity: number;
  rotIntensity: number;
  emissive: number;
};

export const deriveCreatureMood = (stats: Stats): CreatureMood => {
  if (stats.energy < 25) return 'sleepy';
  if (stats.hunger < 25) return 'hungry';
  if (stats.hygiene < 25) return 'dirty';
  if (stats.curiosity > 70) return 'curious';
  return 'calm';
};

export const motionForMood = (mood: CreatureMood, dayPhase: 'morning' | 'day' | 'evening' | 'night'): MotionProfile => {
  const byMood: Record<CreatureMood, MotionProfile> = {
    calm: { floatSpeed: 1.2, floatIntensity: 0.45, rotIntensity: 0.2, emissive: 0.32 },
    hungry: { floatSpeed: 1.7, floatIntensity: 0.65, rotIntensity: 0.28, emissive: 0.4 },
    sleepy: { floatSpeed: 0.7, floatIntensity: 0.22, rotIntensity: 0.08, emissive: 0.2 },
    curious: { floatSpeed: 1.9, floatIntensity: 0.7, rotIntensity: 0.32, emissive: 0.45 },
    dirty: { floatSpeed: 1.0, floatIntensity: 0.35, rotIntensity: 0.12, emissive: 0.24 },
  };

  const base = byMood[mood];
  if (dayPhase === 'night') return { ...base, floatSpeed: Math.max(0.6, base.floatSpeed - 0.35), emissive: base.emissive - 0.08 };
  if (dayPhase === 'morning') return { ...base, floatSpeed: base.floatSpeed + 0.15, emissive: base.emissive + 0.04 };
  return base;
};
