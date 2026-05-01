export interface StageAbility {
  level: number;
  title: string;
  description: string;
  icon: string;
}

export const STAGE_ABILITIES: StageAbility[] = [
  { level: 1, title: 'First Words', description: 'Can speak one word at a time', icon: '💬' },
  { level: 2, title: 'Two Words', description: 'Vocabulary expands to two words', icon: '📝' },
  { level: 3, title: 'Tiny Questions', description: 'Can ask simple questions', icon: '❓' },
  { level: 4, title: 'Memory Keeper', description: 'Remembers name and simple preferences', icon: '🧠' },
  { level: 5, title: 'Knowledge Hungry', description: 'Can accept text feeding and notes', icon: '📖' },
  { level: 6, title: 'Daydreamer', description: 'Daydream action unlocked', icon: '💭' },
  { level: 7, title: 'Storyteller', description: 'Can give small summaries', icon: '📋' },
  { level: 8, title: 'Curious Palate', description: 'Requests specific knowledge food', icon: '🍽️' },
  { level: 9, title: 'Task Ready', description: 'Can handle simple tasks', icon: '⚡' },
  { level: 10, title: 'Sentence Mode', description: 'Breaks word cap — full sentences!', icon: '🌟' },
  { level: 12, title: 'Helping Hands', description: 'Physical form grows hands', icon: '🖐️' },
  { level: 15, title: 'Deep Reader', description: 'Can digest longer texts and files', icon: '📚' },
  { level: 20, title: 'Wisdom Lines', description: 'Shows experience through markings', icon: '✨' },
  { level: 25, title: 'Cosmic Aura', description: 'Radiates a mystical energy ring', icon: '💫' },
  { level: 31, title: 'Sage Companion', description: 'Strong memory continuity and richer speech', icon: '🧙' },
];

// Get newly unlocked abilities when leveling from oldLevel to newLevel
export const getNewlyUnlocked = (oldLevel: number, newLevel: number): StageAbility[] => {
  return STAGE_ABILITIES.filter((a) => a.level > oldLevel && a.level <= newLevel);
};

// Get upcoming abilities
export const getUpcoming = (currentLevel: number, count = 3): StageAbility[] => {
  return STAGE_ABILITIES.filter((a) => a.level > currentLevel).slice(0, count);
};
