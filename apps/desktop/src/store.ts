import { create } from 'zustand';
import { DEFAULT_STATS, addXp, applyDecay, clampStat, getWordCapForLevel, type Stats } from '@lamagotchi/core';

type ActionType = 'feed' | 'play' | 'sleep' | 'clean' | 'teach' | 'task' | 'daydream';
type LifecycleStage = 'onboarding' | 'named_egg' | 'hatching' | 'alive';

interface AppState {
  stage: LifecycleStage;
  petName: string;
  modelName: string;
  level: number;
  xp: number;
  stats: Stats;
  bubbleText: string;
  isStreaming: boolean;
  userInput: string;
  lastTick: number;
  setPetName: (name: string) => void;
  setModelName: (model: string) => void;
  hatch: () => void;
  setUserInput: (text: string) => void;
  setBubbleText: (text: string) => void;
  setStreaming: (value: boolean) => void;
  performAction: (action: ActionType) => void;
  clearUserInput: () => void;
  hydrateFromLocal: () => void;
  persistToLocal: () => void;
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
  stage: 'onboarding',
  petName: 'Noodle',
  modelName: 'Not connected',
  level: 1,
  xp: 0,
  stats: DEFAULT_STATS,
  bubbleText: 'Hungry',
  isStreaming: false,
  userInput: '',
  lastTick: Date.now(),

  setPetName: (name) => set({ petName: name || 'Noodle', stage: 'named_egg' }),
  setModelName: (model) =>
    set((state) => ({
      modelName: model || 'Not connected',
      stage: state.stage === 'alive' ? state.stage : 'onboarding',
    })),
  hatch: () => {
    const state = get();
    if (state.stage !== 'named_egg') return;
    set({ stage: 'hatching', bubbleText: '...' });
    setTimeout(() => {
      const s = get();
      if (s.stage === 'hatching') {
        set({ stage: 'alive', bubbleText: capWords('Hungry', s.level) });
      }
    }, 1500);
  },
  setUserInput: (text) => set({ userInput: text }),
  setBubbleText: (text) => set({ bubbleText: text }),
  setStreaming: (value) => set({ isStreaming: value }),
  clearUserInput: () => set({ userInput: '' }),

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

  hydrateFromLocal: () => {
    const raw = localStorage.getItem('lamagotchi.v1');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      set({
        stage: (parsed.stage as LifecycleStage) ?? 'onboarding',
        petName: parsed.petName ?? 'Noodle',
        modelName: parsed.modelName ?? 'Not connected',
        level: typeof parsed.level === 'number' ? parsed.level : 1,
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
        stats: parsed.stats ?? DEFAULT_STATS,
        bubbleText: parsed.bubbleText ?? 'Hungry',
        lastTick: typeof parsed.lastTick === 'number' ? parsed.lastTick : Date.now(),
      });
    } catch {
      // ignore invalid local state
    }
  },
  persistToLocal: () => {
    const state = get();
    const snapshot = {
      stage: state.stage,
      petName: state.petName,
      modelName: state.modelName,
      level: state.level,
      xp: state.xp,
      stats: state.stats,
      bubbleText: state.bubbleText,
      lastTick: state.lastTick,
    };
    localStorage.setItem('lamagotchi.v1', JSON.stringify(snapshot));
  },

  applyDecayTick: () => {
    const now = Date.now();
    const { lastTick, stats, stage } = get();
    if (stage !== 'alive') return;
    const minutes = (now - lastTick) / 60000;
    if (minutes < 1) return;
    set({ stats: applyDecay(stats, minutes), lastTick: now });
  },
}));
