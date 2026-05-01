import type { Stats } from '@lamagotchi/core';
import { clampStat } from '@lamagotchi/core';

export interface GameItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  minLevel: number;
  maxLevel: number | null; // null = no max
  stageName: string;
  effects: Partial<Stats>;
  xpGain: number;
  cooldownMs: number;
}

// Full item catalog following Hatchling PRD
export const ITEM_CATALOG: GameItem[] = [
  // === INFANT items (L2-5) ===
  {
    id: 'milk_bottle',
    name: 'Milk Bottle',
    icon: '🍼',
    description: 'Warm milk for a growing Byteling',
    minLevel: 2,
    maxLevel: 5,
    stageName: 'Infant',
    effects: { hunger: 35, mood: 8, trust: 6 },
    xpGain: 5,
    cooldownMs: 15000,
  },
  {
    id: 'rattle',
    name: 'Rattle',
    icon: '🧸',
    description: 'A noisy toy that sparks curiosity',
    minLevel: 2,
    maxLevel: 5,
    stageName: 'Infant',
    effects: { mood: 12, curiosity: 5 },
    xpGain: 4,
    cooldownMs: 10000,
  },
  {
    id: 'blanket',
    name: 'Blanket',
    icon: '🛏️',
    description: 'Cozy warmth for restful sleep',
    minLevel: 2,
    maxLevel: null,
    stageName: 'Infant',
    effects: { energy: 35, mood: 5 },
    xpGain: 5,
    cooldownMs: 30000,
  },

  // === TODDLER items (L6-10) ===
  {
    id: 'soft_food',
    name: 'Soft Food Bowl',
    icon: '🍎',
    description: 'Nutritious soft food for a growing toddler',
    minLevel: 6,
    maxLevel: 10,
    stageName: 'Toddler',
    effects: { hunger: 30, mood: 10, knowledge: 3 },
    xpGain: 6,
    cooldownMs: 12000,
  },
  {
    id: 'toy_block',
    name: 'Toy Block',
    icon: '🧩',
    description: 'A colorful block for play and learning',
    minLevel: 6,
    maxLevel: 10,
    stageName: 'Toddler',
    effects: { mood: 14, curiosity: 8 },
    xpGain: 6,
    cooldownMs: 10000,
  },
  {
    id: 'soap_bubble',
    name: 'Soap Bubble',
    icon: '🫧',
    description: 'Gentle bubbles for a sparkling clean',
    minLevel: 6,
    maxLevel: null,
    stageName: 'Toddler',
    effects: { hygiene: 25, mood: 3 },
    xpGain: 3,
    cooldownMs: 20000,
  },

  // === LEARNER items (L11-18) ===
  {
    id: 'flash_card',
    name: 'Flash Card',
    icon: '📚',
    description: 'A knowledge card that teaches new concepts',
    minLevel: 11,
    maxLevel: 18,
    stageName: 'Learner',
    effects: { curiosity: 10, knowledge: 8 },
    xpGain: 8,
    cooldownMs: 20000,
  },
  {
    id: 'story_book',
    name: 'Story Book',
    icon: '📖',
    description: 'Stories that expand vocabulary and imagination',
    minLevel: 11,
    maxLevel: 18,
    stageName: 'Learner',
    effects: { knowledge: 6, curiosity: 6, mood: 4 },
    xpGain: 7,
    cooldownMs: 25000,
  },
  {
    id: 'puzzle_piece',
    name: 'Puzzle Piece',
    icon: '🧠',
    description: 'A brain teaser that sharpens focus',
    minLevel: 11,
    maxLevel: 18,
    stageName: 'Learner',
    effects: { knowledge: 5, curiosity: 8, trust: 3 },
    xpGain: 9,
    cooldownMs: 18000,
  },

  // === COMPANION+ items (L19+) ===
  {
    id: 'water_drop',
    name: 'Water Drop',
    icon: '💧',
    description: 'Pure hydration for energy and freshness',
    minLevel: 2,
    maxLevel: null,
    stageName: 'Universal',
    effects: { energy: 15, hygiene: 5 },
    xpGain: 2,
    cooldownMs: 8000,
  },
  {
    id: 'brush',
    name: 'Brush',
    icon: '🪥',
    description: 'A grooming brush for a shiny coat',
    minLevel: 4,
    maxLevel: null,
    stageName: 'Universal',
    effects: { hygiene: 20, mood: 5, trust: 4 },
    xpGain: 3,
    cooldownMs: 15000,
  },
  {
    id: 'heart_pat',
    name: 'Heart Pat',
    icon: '💖',
    description: 'A gentle pat that builds trust and affection',
    minLevel: 2,
    maxLevel: null,
    stageName: 'Universal',
    effects: { mood: 10, trust: 8 },
    xpGain: 3,
    cooldownMs: 5000,
  },
  {
    id: 'elixir',
    name: 'Wisdom Elixir',
    icon: '🧪',
    description: 'A rare potion that accelerates learning',
    minLevel: 19,
    maxLevel: null,
    stageName: 'Companion',
    effects: { knowledge: 12, curiosity: 10, trust: 5 },
    xpGain: 12,
    cooldownMs: 60000,
  },
];

// Get available items for current level
export const getAvailableItems = (level: number): GameItem[] => {
  return ITEM_CATALOG.filter(
    (item) => level >= item.minLevel && (item.maxLevel === null || level <= item.maxLevel),
  );
};

// Apply item effects to stats
export const applyItemEffects = (stats: Stats, item: GameItem): Stats => {
  const next = { ...stats };
  for (const [key, delta] of Object.entries(item.effects)) {
    if (key in next && typeof delta === 'number') {
      next[key as keyof Stats] = clampStat(next[key as keyof Stats] + delta);
    }
  }
  return next;
};
