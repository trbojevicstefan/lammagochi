export type EvolutionStage = 'baby' | 'child' | 'teen' | 'adult';

export const getEvolutionStage = (level: number): EvolutionStage => {
  if (level <= 2) return 'baby';
  if (level <= 5) return 'child';
  if (level <= 8) return 'teen';
  return 'adult';
};

export const getEvolutionName = (stage: EvolutionStage): string => {
  switch (stage) {
    case 'baby': return 'Hatchling';
    case 'child': return 'Sprout';
    case 'teen': return 'Wanderer';
    case 'adult': return 'Sage';
  }
};

export const getEvolutionColor = (stage: EvolutionStage): string => {
  switch (stage) {
    case 'baby': return '#fef3c7';
    case 'child': return '#5eead4';
    case 'teen': return '#22d3ee';
    case 'adult': return '#c084fc';
  }
};

export const getNextEvolutionLevel = (level: number): number | null => {
  if (level < 3) return 3;
  if (level < 6) return 6;
  if (level < 9) return 9;
  return null;
};

// Per-level scaling — granular growth, not just 4 jumps
export const getLevelScale = (level: number): number => {
  if (level <= 2) return 0.70 + (level - 1) * 0.05;  // 0.70 → 0.75
  if (level <= 5) return 0.78 + (level - 3) * 0.04;  // 0.78 → 0.90
  if (level <= 8) return 0.92 + (level - 6) * 0.03;  // 0.92 → 1.01
  if (level <= 15) return 1.02 + (level - 9) * 0.015; // 1.02 → 1.11
  if (level <= 25) return 1.12 + (level - 16) * 0.005; // 1.12 → 1.17
  return 1.18; // cap at 1.18
};

// Skins unlockable by level
export type PetSkin = 'none' | 'wizard' | 'ninja' | 'astronaut' | 'aurora' | 'inferno' | 'ocean' | 'forest';

export interface SkinDefinition {
  id: PetSkin;
  name: string;
  icon: string;
  unlockLevel: number;
  bodyColor?: string;
  bodyLight?: string;
  bodyDark?: string;
}

export const SKINS: SkinDefinition[] = [
  { id: 'none', name: 'Default', icon: '🔮', unlockLevel: 1 },
  { id: 'wizard', name: 'Wizard', icon: '🧙', unlockLevel: 3, bodyColor: '#7e22ce', bodyLight: '#a855f7', bodyDark: '#581c87' },
  { id: 'ninja', name: 'Ninja', icon: '🥷', unlockLevel: 5, bodyColor: '#1e293b', bodyLight: '#334155', bodyDark: '#0f172a' },
  { id: 'astronaut', name: 'Astronaut', icon: '🚀', unlockLevel: 8, bodyColor: '#e2e8f0', bodyLight: '#f8fafc', bodyDark: '#94a3b8' },
  { id: 'aurora', name: 'Aurora', icon: '🌌', unlockLevel: 12, bodyColor: '#06b6d4', bodyLight: '#67e8f9', bodyDark: '#0891b2' },
  { id: 'inferno', name: 'Inferno', icon: '🔥', unlockLevel: 16, bodyColor: '#ef4444', bodyLight: '#fca5a5', bodyDark: '#991b1b' },
  { id: 'ocean', name: 'Ocean', icon: '🌊', unlockLevel: 20, bodyColor: '#2563eb', bodyLight: '#93c5fd', bodyDark: '#1e3a5f' },
  { id: 'forest', name: 'Forest', icon: '🌿', unlockLevel: 25, bodyColor: '#16a34a', bodyLight: '#86efac', bodyDark: '#14532d' },
];

export const getUnlockedSkins = (level: number): SkinDefinition[] =>
  SKINS.filter((s) => s.unlockLevel <= level);
