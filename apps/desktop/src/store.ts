import { create } from 'zustand';
import { DEFAULT_STATS, addXp, applyDecay, clampStat, getWordCapForLevel, type Stats } from '@lamagotchi/core';

type ActionType = 'feed' | 'play' | 'sleep' | 'clean' | 'teach' | 'task' | 'daydream';

interface AppState {
  petName: string;
  modelName: string;
  level: number;
  xp: number;
  stats: Stats;
  bubbleText: string;
  userInput: string;
  lastTick: number;
  setPetName: (name: string) => void;
  setModelName: (model: string) => void;
  setUserInput: (text: string) => void;
  performAction: (action: ActionType) => void;
  sendUserMessage: () => void;
  applyDecayTick: () => void;
}

const moodWord = (stats: Stats): string => {
  if (stats.hunger < 25) return 'Hungry';
  if (stats.energy < 25) return 'Sleepy';
  if (stats.hygiene < 25) return 'Dirty';
  if (stats.curiosity < 30) return 'Bored';
  return 'Hi';
};

const capWords = (text: string, level: number): string => {
  const cap = getWordCapForLevel(level);
  if (cap >= 999) return text;
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, cap)
    .join(' ');
};

export const useAppStore = create<AppState>((set, get) => ({
  petName: 'Noodle',
  modelName: 'Not connected',
  level: 1,
  xp: 0,
  stats: DEFAULT_STATS,
  bubbleText: 'Hungry',
  userInput: '',
  lastTick: Date.now(),

  setPetName: (name) => set({ petName: name || 'Noodle' }),
  setModelName: (model) => set({ modelName: model || 'Not connected' }),
  setUserInput: (text) => set({ userInput: text }),

  performAction: (action) => {
    const state = get();
    const stats = { ...state.stats };
    let xpGain = 4;

    if (action === 'feed') {
      stats.hunger = clampStat(stats.hunger + 14);
      stats.mood = clampStat(stats.mood + 6);
      stats.knowledge = clampStat(stats.knowledge + 3);
      xpGain = 8;
    }
    if (action === 'play') {
      stats.mood = clampStat(stats.mood + 10);
      stats.energy = clampStat(stats.energy - 7);
      stats.boredom = clampStat(stats.boredom - 12);
      xpGain = 7;
    }
    if (action === 'sleep') {
      stats.energy = clampStat(stats.energy + 18);
      stats.mood = clampStat(stats.mood + 4);
      xpGain = 5;
    }
    if (action === 'clean') {
      stats.hygiene = clampStat(stats.hygiene + 18);
      stats.mood = clampStat(stats.mood + 5);
      xpGain = 6;
    }
    if (action === 'teach') {
      stats.knowledge = clampStat(stats.knowledge + 6);
      stats.curiosity = clampStat(stats.curiosity + 4);
      xpGain = 8;
    }
    if (action === 'task') {
      stats.knowledge = clampStat(stats.knowledge + 5);
      stats.energy = clampStat(stats.energy - 6);
      xpGain = 9;
    }
    if (action === 'daydream') {
      stats.curiosity = clampStat(stats.curiosity + 7);
      stats.energy = clampStat(stats.energy + 3);
      stats.boredom = clampStat(stats.boredom - 6);
      xpGain = 6;
    }

    const progression = addXp(state.xp, state.level, xpGain);
    const response = capWords(moodWord(stats), progression.level);

    set({
      stats,
      xp: progression.xp,
      level: progression.level,
      bubbleText: response,
    });
  },

  sendUserMessage: () => {
    const state = get();
    const response = capWords(moodWord(state.stats), state.level);
    set({ bubbleText: response || 'Hi', userInput: '' });
  },

  applyDecayTick: () => {
    const now = Date.now();
    const { lastTick, stats } = get();
    const minutes = (now - lastTick) / 60000;
    if (minutes < 1) return;
    set({ stats: applyDecay(stats, minutes), lastTick: now });
  },
}));
