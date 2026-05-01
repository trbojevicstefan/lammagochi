import { create } from 'zustand';
import { DEFAULT_STATS, addXp, clampStat, getWordCapForLevel, type Stats } from '@lamagotchi/core';
import { applySimulationTick, resolveDayPhase, type DayPhase } from './game/simulationTick';
import { getEvolutionStage, type EvolutionStage } from './game/evolution';
import { createAchievements, checkAchievements, type Achievement, type AchievementId } from './game/achievements';
import { soundEffects } from './audio/soundEffects';

type ActionType = 'feed' | 'play' | 'sleep' | 'clean' | 'teach' | 'task' | 'daydream';
type LifecycleStage = 'onboarding' | 'named_egg' | 'hatching' | 'alive';

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  approved: boolean;
  createdAt: number;
}

type TaskDifficulty = 'easy' | 'medium' | 'hard';

export interface JournalEntry {
  id: string;
  type: 'daydream' | 'task' | 'system';
  content: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'creature' | 'system';
  content: string;
  timestamp: number;
}

export type PetAnimationName = 'idle' | 'happy' | 'sleepy' | 'eating' | 'cleaning' | 'playing' | 'learning' | 'daydreaming' | 'evolving' | 'craving';

// Map action to pet animation
const actionToAnim: Record<ActionType, PetAnimationName> = {
  feed: 'eating',
  play: 'playing',
  sleep: 'sleepy',
  clean: 'cleaning',
  teach: 'learning',
  task: 'learning',
  daydream: 'daydreaming',
};
interface ActionCounts {
  chats: number;
  feeds: number;
  cleans: number;
  daydreams: number;
  tasks: number;
  nightInteractions: number;
  approvedMemories: number;
}

interface AppState {
  stage: LifecycleStage;
  petName: string;
  modelName: string;
  level: number;
  xp: number;
  stats: Stats;
  bubbleText: string;
  isStreaming: boolean;
  memoryItems: MemoryItem[];
  journalEntries: JournalEntry[];
  taskDifficulty: TaskDifficulty;
  dayPhase: DayPhase;
  userInput: string;
  lastTick: number;
  // New fields
  chatHistory: ChatMessage[];
  evolutionStage: EvolutionStage;
  achievements: Achievement[];
  soundEnabled: boolean;
  hatchProgress: number;
  actionCounts: ActionCounts;
  currentAnimation: PetAnimationName | null;
  prevLevel: number;
  // Actions
  setPetName: (name: string) => void;
  setModelName: (model: string) => void;
  startHatch: () => void;
  completeHatch: () => void;
  updateHatchProgress: (p: number) => void;
  setUserInput: (text: string) => void;
  setBubbleText: (text: string) => void;
  setStreaming: (value: boolean) => void;
  setTaskDifficulty: (value: TaskDifficulty) => void;
  performAction: (action: ActionType) => void;
  feedKnowledge: (text: string) => void;
  setMemoryApproval: (id: string, approved: boolean) => void;
  clearUserInput: () => void;
  addChatMessage: (msg: ChatMessage) => void;
  toggleSound: () => void;
  clearAnimation: () => void;
  hydrateFromLocal: () => void;
  persistToLocal: () => void;
  applyDecayTick: () => void;
  refreshDayPhase: () => void;
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

const defaultCounts: ActionCounts = {
  chats: 0,
  feeds: 0,
  cleans: 0,
  daydreams: 0,
  tasks: 0,
  nightInteractions: 0,
  approvedMemories: 0,
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
  memoryItems: [],
  journalEntries: [],
  taskDifficulty: 'easy',
  dayPhase: resolveDayPhase(new Date()),
  userInput: '',
  lastTick: Date.now(),
  chatHistory: [],
  evolutionStage: 'baby',
  achievements: createAchievements(),
  soundEnabled: true,
  hatchProgress: 0,
  actionCounts: { ...defaultCounts },
  currentAnimation: null,
  prevLevel: 1,

  setPetName: (name) => {
    soundEffects.chirp();
    set({ petName: name || 'Noodle', stage: 'named_egg' });
  },
  setModelName: (model) =>
    set((state) => ({
      modelName: model || 'Not connected',
      stage: state.stage === 'alive' ? state.stage : 'onboarding',
    })),

  startHatch: () => {
    const state = get();
    if (state.stage !== 'named_egg') return;
    soundEffects.hatchEgg();
    set({ stage: 'hatching', bubbleText: '...', hatchProgress: 0 });
  },

  completeHatch: () => {
    const state = get();
    if (state.stage !== 'hatching') return;
    const greeting = capWords('Hungry', state.level);
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'creature',
      content: greeting,
      timestamp: Date.now(),
    };
    set({
      stage: 'alive',
      bubbleText: greeting,
      hatchProgress: 1,
      evolutionStage: 'baby',
      chatHistory: [msg],
    });
  },

  updateHatchProgress: (p) => set({ hatchProgress: Math.max(0, Math.min(1, p)) }),

  setUserInput: (text) => set({ userInput: text }),
  setBubbleText: (text) => set({ bubbleText: text }),
  setStreaming: (value) => set({ isStreaming: value }),
  setTaskDifficulty: (value) => set({ taskDifficulty: value }),
  clearUserInput: () => set({ userInput: '' }),

  addChatMessage: (msg) =>
    set((state) => ({
      chatHistory: [...state.chatHistory, msg].slice(-80),
    })),

  toggleSound: () =>
    set((state) => ({ soundEnabled: !state.soundEnabled })),

  clearAnimation: () => set({ currentAnimation: null }),

  performAction: (action) => {
    const state = get();
    if (state.stage !== 'alive') return;

    // Trigger action animation
    const anim = actionToAnim[action];
    set({ currentAnimation: anim });
    // Auto-clear action animation after 2.5s
    setTimeout(() => {
      const s = get();
      if (s.currentAnimation === anim) set({ currentAnimation: null });
    }, 2500);

    const stats = { ...state.stats };
    let xpGain = 4;
    const counts = { ...state.actionCounts };

    if (action === 'feed') {
      stats.hunger = clampStat(stats.hunger + 14);
      stats.mood = clampStat(stats.mood + 6);
      stats.knowledge = clampStat(stats.knowledge + 3);
      xpGain = 8;
      counts.feeds += 1;
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
      counts.cleans += 1;
    }
    if (action === 'teach') {
      stats.knowledge = clampStat(stats.knowledge + 6);
      stats.curiosity = clampStat(stats.curiosity + 4);
      xpGain = 8;
    }
    if (action === 'task') {
      if (stats.energy < 30 || stats.hunger < 25) {
        const refusedEntry: JournalEntry = {
          id: `jr_${Date.now()}`,
          type: 'task',
          content: 'Refused task due to low energy or hunger.',
          createdAt: Date.now(),
        };
        set({
          bubbleText: capWords(stats.energy < 30 ? 'Sleepy' : 'Hungry', state.level),
          journalEntries: [refusedEntry, ...state.journalEntries].slice(0, 60),
        });
        if (state.soundEnabled) soundEffects.error();
        return;
      }

      const diff = state.taskDifficulty;
      const diffXp = diff === 'easy' ? 7 : diff === 'medium' ? 11 : 16;
      const diffEnergyCost = diff === 'easy' ? 4 : diff === 'medium' ? 8 : 13;
      stats.knowledge = clampStat(stats.knowledge + 5);
      stats.energy = clampStat(stats.energy - diffEnergyCost);
      xpGain = diffXp;
      counts.tasks += 1;
    }
    if (action === 'daydream') {
      stats.curiosity = clampStat(stats.curiosity + 7);
      stats.energy = clampStat(stats.energy + 3);
      stats.boredom = clampStat(stats.boredom - 6);
      xpGain = 6;
      counts.daydreams += 1;
    }

    // Track night interactions
    if (state.dayPhase === 'night') {
      counts.nightInteractions += 1;
    }

    const prevLevel = state.level;
    const progression = addXp(state.xp, state.level, xpGain);
    const response = capWords(moodWord(stats), progression.level);

    // Journal entries
    const journalType: JournalEntry['type'] | null =
      action === 'daydream' ? 'daydream' : action === 'task' ? 'task' : null;
    const nextJournalEntries: JournalEntry[] = journalType
      ? [
          {
            id: `jr_${Date.now()}`,
            type: journalType,
            content:
              journalType === 'daydream'
                ? 'Daydreamed about new skills and memories.'
                : `Completed a ${state.taskDifficulty} task and learned from it.`,
            createdAt: Date.now(),
          },
          ...state.journalEntries,
        ].slice(0, 60)
      : state.journalEntries;

    // Evolution check
    const newEvoStage = getEvolutionStage(progression.level);

    // Achievement checks
    const achUpdates: Partial<Record<AchievementId, number>> = {};
    if (counts.feeds > state.actionCounts.feeds) achUpdates.well_fed = counts.feeds - state.actionCounts.feeds;
    if (counts.cleans > state.actionCounts.cleans) achUpdates.clean_machine = counts.cleans - state.actionCounts.cleans;
    if (counts.daydreams > state.actionCounts.daydreams) achUpdates.dreamer = counts.daydreams - state.actionCounts.daydreams;
    if (counts.tasks > state.actionCounts.tasks) achUpdates.taskmaster = counts.tasks - state.actionCounts.tasks;
    if (counts.nightInteractions > state.actionCounts.nightInteractions)
      achUpdates.night_owl = counts.nightInteractions - state.actionCounts.nightInteractions;
    if (progression.level > prevLevel) achUpdates.scholar = progression.level - prevLevel;

    const achResult = checkAchievements(state.achievements, achUpdates);

    // Level up message
    if (progression.level > prevLevel) {
      if (state.soundEnabled) soundEffects.levelUp();
      const levelMsg: ChatMessage = {
        id: `msg_${Date.now()}_lvl`,
        role: 'system',
        content: `🎉 Level Up! ${state.petName} reached level ${progression.level}!`,
        timestamp: Date.now(),
      };
      set((s) => ({ chatHistory: [...s.chatHistory, levelMsg].slice(-80) }));
    }

    // Achievement unlock messages
    if (achResult.newlyUnlocked.length > 0) {
      if (state.soundEnabled) soundEffects.achievement();
      achResult.newlyUnlocked.forEach((ach) => {
        const achMsg: ChatMessage = {
          id: `msg_${Date.now()}_ach_${ach.id}`,
          role: 'system',
          content: `🏆 Achievement unlocked: ${ach.icon} ${ach.title}!`,
          timestamp: Date.now(),
        };
        set((s) => ({ chatHistory: [...s.chatHistory, achMsg].slice(-80) }));
      });
    }

    // Sound
    if (state.soundEnabled) soundEffects.action(action);

    // Level-up detection
    const justLeveled = progression.level > state.level;

    set({
      stats,
      xp: progression.xp,
      level: progression.level,
      bubbleText: response,
      journalEntries: nextJournalEntries,
      evolutionStage: newEvoStage,
      achievements: achResult.achievements,
      actionCounts: counts,
      prevLevel: state.level,
      ...(justLeveled ? { currentAnimation: 'evolving' as PetAnimationName } : {}),
    });

    // Auto-clear evolving animation after 3s
    if (justLeveled) {
      setTimeout(() => {
        const s = get();
        if (s.currentAnimation === 'evolving') set({ currentAnimation: null });
      }, 3000);
    }
  },

  feedKnowledge: (text) => {
    const state = get();
    if (state.stage !== 'alive') return;
    const clean = text.trim();
    if (!clean) return;

    const snippet = clean.slice(0, 160);
    const id = `mem_${Date.now()}`;
    const memoryItem: MemoryItem = {
      id,
      title: `Fed note (${Math.min(clean.length, 160)} chars)`,
      content: snippet,
      approved: false,
      createdAt: Date.now(),
    };

    const stats = {
      ...state.stats,
      hunger: clampStat(state.stats.hunger + 8),
      curiosity: clampStat(state.stats.curiosity + 6),
      knowledge: clampStat(state.stats.knowledge + 5),
      mood: clampStat(state.stats.mood + 4),
    };

    const progression = addXp(state.xp, state.level, 9);
    if (state.soundEnabled) soundEffects.action('feed');

    set({
      stats,
      xp: progression.xp,
      level: progression.level,
      bubbleText: capWords('More', progression.level),
      memoryItems: [memoryItem, ...state.memoryItems].slice(0, 30),
    });
  },

  setMemoryApproval: (id, approved) => {
    const state = get();
    const memoryItems = state.memoryItems.map((m) => (m.id === id ? { ...m, approved } : m));
    const counts = { ...state.actionCounts };
    if (approved) {
      counts.approvedMemories += 1;
    }
    const achResult = checkAchievements(state.achievements, {
      memory_keeper: approved ? 1 : 0,
    });
    if (achResult.newlyUnlocked.length > 0) {
      if (state.soundEnabled) soundEffects.achievement();
    }
    set({ memoryItems, actionCounts: counts, achievements: achResult.achievements });
  },

  hydrateFromLocal: () => {
    const raw = localStorage.getItem('lamagotchi.v2');
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
        memoryItems: Array.isArray(parsed.memoryItems) ? (parsed.memoryItems as MemoryItem[]) : [],
        journalEntries: Array.isArray(parsed.journalEntries) ? (parsed.journalEntries as JournalEntry[]) : [],
        taskDifficulty: (parsed.taskDifficulty as TaskDifficulty) ?? 'easy',
        dayPhase: (parsed.dayPhase as DayPhase) ?? resolveDayPhase(new Date()),
        lastTick: typeof parsed.lastTick === 'number' ? parsed.lastTick : Date.now(),
        chatHistory: Array.isArray(parsed.chatHistory) ? (parsed.chatHistory as ChatMessage[]) : [],
        evolutionStage: (parsed.evolutionStage as EvolutionStage) ?? getEvolutionStage(typeof parsed.level === 'number' ? parsed.level : 1),
        achievements: Array.isArray(parsed.achievements) ? (parsed.achievements as Achievement[]) : createAchievements(),
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
        actionCounts: (parsed.actionCounts as ActionCounts) ?? { ...defaultCounts },
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
      memoryItems: state.memoryItems,
      journalEntries: state.journalEntries,
      taskDifficulty: state.taskDifficulty,
      dayPhase: state.dayPhase,
      lastTick: state.lastTick,
      chatHistory: state.chatHistory.slice(-50),
      evolutionStage: state.evolutionStage,
      achievements: state.achievements,
      soundEnabled: state.soundEnabled,
      actionCounts: state.actionCounts,
    };
    localStorage.setItem('lamagotchi.v2', JSON.stringify(snapshot));
  },

  applyDecayTick: () => {
    const now = Date.now();
    const { lastTick, stats, stage, dayPhase } = get();
    if (stage !== 'alive') return;
    const minutes = (now - lastTick) / 60000;
    if (minutes < 1) return;
    const adjusted = applySimulationTick(stats, minutes, dayPhase);
    set({ stats: adjusted, lastTick: now });
  },

  refreshDayPhase: () => {
    const state = get();
    const next = resolveDayPhase(new Date());
    if (next === state.dayPhase) return;
    const entry: JournalEntry = {
      id: `jr_${Date.now()}`,
      type: 'system',
      content: `Phase changed: ${state.dayPhase} -> ${next}.`,
      createdAt: Date.now(),
    };
    set({
      dayPhase: next,
      journalEntries: [entry, ...state.journalEntries].slice(0, 60),
      bubbleText: capWords(next === 'night' ? 'Sleepy' : next === 'morning' ? 'Awake' : 'Ready', state.level),
    });
  },
}));
