import { create } from 'zustand';
import { DEFAULT_STATS, addXp, clampStat, getWordCapForLevel, type Stats } from '@lamagotchi/core';
import { applySimulationTick, resolveDayPhase, type DayPhase } from './game/simulationTick';
import { getEvolutionStage, type EvolutionStage } from './game/evolution';
import { createAchievements, checkAchievements, type Achievement, type AchievementId } from './game/achievements';
import { soundEffects } from './audio/soundEffects';
import { showToast } from './ui/Toast';
import { getNewlyUnlocked } from './game/stageAbilities';
import { applyItemEffects, type GameItem } from './game/items';
import { recordEvent, updatePreferences, createEmptyPreferences, generatePetThought, type BehaviorEvent, type PetPreferences } from './game/behaviorMemory';
import { generatePersonality, getPersonalityChatter, getPersonalityReaction, type PetPersonality } from './game/personality';
import { createSkillTrees, advanceSkill, type SkillTree, type SkillId } from './game/curriculum';
import { createFriendship, checkMilestones, getFriendshipTier, type FriendshipState, type Milestone } from './game/friendship';
import { getWeather, weatherIcons, type WeatherState } from './game/weather';

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
  lastCheckIn: string;
  currentSkin: string;
  previousState: string | null; // JSON snapshot for undo
  behaviorEvents: BehaviorEvent[];
  preferences: PetPreferences;
  personality: PetPersonality;
  skillTrees: SkillTree[];
  friendship: FriendshipState;
  weather: WeatherState;
  miniGame: any;
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
  useItem: (item: GameItem) => void;
  teachSkill: (skillId: SkillId) => { xp:number; tieredUp:boolean };
  feedKnowledge: (text: string) => void;
  setMemoryApproval: (id: string, approved: boolean) => void;
  clearUserInput: () => void;
  addChatMessage: (msg: ChatMessage) => void;
  toggleSound: () => void;
  setSkin: (skin: string) => void;
  exportSave: () => string;
  importSave: (json: string) => void;
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
  lastCheckIn: '',
  currentSkin: 'none',
  previousState: null,
  behaviorEvents: [],
  preferences: createEmptyPreferences(),
  personality: generatePersonality(),
  skillTrees: createSkillTrees(),
  friendship: createFriendship(),
  weather: getWeather(),
  miniGame: null,

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
    const personality = generatePersonality();
    set({
      stage: 'alive',
      bubbleText: greeting,
      hatchProgress: 1,
      evolutionStage: 'baby',
      chatHistory: [msg],
      personality,
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

  setSkin: (skin) => set({ currentSkin: skin }),
  exportSave: () => {
    const s = get();
    return JSON.stringify({ stage:s.stage, petName:s.petName, level:s.level, xp:s.xp, stats:s.stats, memoryItems:s.memoryItems, journalEntries:s.journalEntries, achievements:s.achievements, evolutionStage:s.evolutionStage, actionCounts:s.actionCounts, currentSkin:s.currentSkin, personality:s.personality, preferences:s.preferences }, null, 2);
  },
  importSave: (json: string) => {
    try {
      const p = JSON.parse(json);
      set((s) => ({ ...s, stage:p.stage||s.stage, petName:p.petName||s.petName, level:p.level||s.level, xp:p.xp||s.xp, stats:p.stats||s.stats, memoryItems:p.memoryItems||s.memoryItems, journalEntries:p.journalEntries||s.journalEntries, achievements:p.achievements||s.achievements, evolutionStage:p.evolutionStage||s.evolutionStage, currentSkin:p.currentSkin||s.currentSkin, personality:p.personality||s.personality }));
      showToast('info', '💾 Save imported!', 'Game state restored', 3000);
    } catch { showToast('warning', 'Invalid save file', '', 2000); }
  },

  clearAnimation: () => set({ currentAnimation: null }),

  performAction: (action) => {
    const state = get();
    if (state.stage !== 'alive') return;

    // Daily check-in bonus
    const today = new Date().toISOString().slice(0, 10);
    const isFirstToday = state.lastCheckIn !== today;

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

    // Daily check-in XP bonus
    if (isFirstToday) {
      xpGain += 10;
      showToast('info', '📅 Daily Check-in!', '+10 bonus XP', 3000);
    }

    // Track journal detail for richer entries
    let journalDetail = '';

    if (action === 'feed') {
      stats.hunger = clampStat(stats.hunger + 14);
      stats.mood = clampStat(stats.mood + 6);
      stats.knowledge = clampStat(stats.knowledge + 3);
      xpGain = 8;
      counts.feeds += 1;
      journalDetail = '🍎 Ate a delicious meal. Hunger satisfied!';
    }
    if (action === 'play') {
      stats.mood = clampStat(stats.mood + 10);
      stats.energy = clampStat(stats.energy - 7);
      stats.boredom = clampStat(stats.boredom - 12);
      xpGain = 7;
      journalDetail = '🎾 Played energetically. So much fun!';
    }
    if (action === 'sleep') {
      stats.energy = clampStat(stats.energy + 18);
      stats.mood = clampStat(stats.mood + 4);
      xpGain = 5;
      journalDetail = '😴 Took a restful nap. Feeling refreshed!';
    }
    if (action === 'clean') {
      stats.hygiene = clampStat(stats.hygiene + 18);
      stats.mood = clampStat(stats.mood + 5);
      xpGain = 6;
      counts.cleans += 1;
      journalDetail = '🫧 Sparkling clean after a nice bath!';
    }
    if (action === 'teach') {
      stats.knowledge = clampStat(stats.knowledge + 6);
      stats.curiosity = clampStat(stats.curiosity + 4);
      xpGain = 8;
      journalDetail = '📚 Learned something new. Knowledge grows!';
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
    const emojiMap: Record<string, string> = { feed: '🍎 ', play: '🎾 ', sleep: '😴 ', clean: '✨ ', teach: '📚 ', task: '⚡ ', daydream: '💭 ' };
    // Personality-driven reaction
    const personalityReaction = getPersonalityReaction(state.personality, action);
    const baseResponse = personalityReaction || moodWord(stats);
    const response = emojiMap[action] + capWords(baseResponse, progression.level);

    // Journal entries
    const journalType: JournalEntry['type'] | null =
      action === 'daydream' ? 'daydream' : action === 'task' ? 'task' : null;
    // Richer journal entries
    const entryContent = journalType === 'daydream'
      ? '💭 Daydreamed about new skills and memories. Imagination wandering...'
      : journalType === 'task'
        ? `⚡ Completed a ${state.taskDifficulty} task — learned through doing!`
        : journalDetail || `Interacted via ${action}`;

    const nextJournalEntries: JournalEntry[] = [
      {
        id: `jr_${Date.now()}`,
        type: (journalType || 'system') as JournalEntry['type'],
        content: entryContent,
        createdAt: Date.now(),
      },
      ...state.journalEntries,
    ].slice(0, 60);

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

    // Toast: XP gain
    showToast('xp', `+${xpGain} XP`, action.charAt(0).toUpperCase() + action.slice(1), 2500);

    // Level-up detection
    const justLeveled = progression.level > state.level;
    const stageChanged = newEvoStage !== state.evolutionStage;

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
      lastCheckIn: today,
      behaviorEvents: recordEvent(state.behaviorEvents, action === 'feed' ? 'fed' : action === 'play' ? 'played' : action === 'clean' ? 'cleaned' : action === 'teach' ? 'taught' : action === 'task' ? 'tasked' : action === 'daydream' ? 'dreamed' : 'played', action, 'happy'),
      preferences: updatePreferences(state.preferences, action === 'feed' ? 'fed' : action === 'play' ? 'played' : action === 'clean' ? 'cleaned' : action === 'teach' ? 'taught' : 'played'),
      ...(justLeveled ? { currentAnimation: 'evolving' as PetAnimationName } : {}),
    });

    // Toast: level-up
    if (justLeveled) {
      showToast('level', `Level ${progression.level}!`, `+${xpGain} XP earned`, 3500);

      // Stage ability unlocks
      const unlocked = getNewlyUnlocked(state.level, progression.level);
      unlocked.forEach((ab) => {
        setTimeout(() => {
          showToast('info', `${ab.icon} ${ab.title} Unlocked!`, ab.description, 4000);
        }, 1000); // slight delay so it doesn't stack with level-up toast
      });
    }

    // Toast: evolution stage change
    if (stageChanged) {
      const stageNames: Record<string, string> = { baby: 'Hatchling', child: 'Sprout', teen: 'Wanderer', adult: 'Sage' };
      showToast('evolve', `${stageNames[newEvoStage]}!`, `Evolved to ${newEvoStage} stage`, 4000);
    }

    // Toast: achievement unlock
    achResult.newlyUnlocked.forEach((ach) => {
      showToast('achievement', `${ach.icon} ${ach.title}`, ach.description, 4000);
    });

    // Auto-clear evolving animation after 3s
    if (justLeveled) {
      setTimeout(() => {
        const s = get();
        if (s.currentAnimation === 'evolving') set({ currentAnimation: null });
      }, 3000);
    }
  },

  useItem: (item) => {
    const state = get();
    if (state.stage !== 'alive') return;

    const stats = applyItemEffects(state.stats, item);
    const progression = addXp(state.xp, state.level, item.xpGain);
    const counts = { ...state.actionCounts };

    // Trigger matching animation
    const animMap: Record<string, string> = {
      milk_bottle: 'eating', soft_food: 'eating',
      blanket: 'sleepy', water_drop: 'cleaning',
      soap_bubble: 'cleaning', brush: 'cleaning',
      rattle: 'playing', toy_block: 'playing',
      flash_card: 'learning', story_book: 'learning', puzzle_piece: 'learning',
      heart_pat: 'happy', elixir: 'excited',
    };
    const anim = animMap[item.id] || 'happy';

    set({ currentAnimation: anim as PetAnimationName });
    setTimeout(() => {
      const s = get();
      if (s.currentAnimation === anim) set({ currentAnimation: null });
    }, 2500);

    // Sound
    if (state.soundEnabled) soundEffects.action(item.id.includes('food') || item.id.includes('milk') ? 'feed' : 'play');

    // Toast
    showToast('xp', `+${item.xpGain} XP`, `Used ${item.name}`, 2500);

    // Level-up detection
    const justLeveled = progression.level > state.level;
    const newEvoStage = getEvolutionStage(progression.level);
    const stageChanged = newEvoStage !== state.evolutionStage;

    if (justLeveled) {
      showToast('level', `Level ${progression.level}!`, `${item.name} helped you grow`, 3500);
    }
    if (stageChanged) {
      const stageNames: Record<string, string> = { baby: 'Hatchling', child: 'Sprout', teen: 'Wanderer', adult: 'Sage' };
      showToast('evolve', `${stageNames[newEvoStage]}!`, `Evolved to ${newEvoStage} stage`, 4000);
    }

    const entry: JournalEntry = {
      id: `jr_${Date.now()}`,
      type: 'system',
      content: `Used ${item.name}: ${item.description}`,
      createdAt: Date.now(),
    };

    set({
      stats,
      xp: progression.xp,
      level: progression.level,
      evolutionStage: newEvoStage,
      actionCounts: counts,
      prevLevel: state.level,
      journalEntries: [entry, ...state.journalEntries].slice(0, 60),
      ...(justLeveled ? { currentAnimation: 'evolving' as PetAnimationName } : {}),
    });
  },

  teachSkill: (skillId) => {
    const state = get();
    const result = advanceSkill(state.skillTrees, skillId, 10);
    if (result.tieredUp) {
      const tree = result.trees.find(t => t.id === skillId)!;
      const tier = tree.tiers[tree.currentTier];
      showToast('info', `🎓 ${tier.name}!`, `${tree.label} skill advanced!`, 3500);
    }
    set({ skillTrees: result.trees });
    // Also advance knowledge stat
    const stats = { ...state.stats, knowledge: clampStat(state.stats.knowledge + 5), curiosity: clampStat(state.stats.curiosity + 3) };
    const prog = addXp(state.xp, state.level, 8);
    set({ stats, xp: prog.xp, level: prog.level });
    return { xp: 8, tieredUp: result.tieredUp };
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
        lastCheckIn: typeof parsed.lastCheckIn === 'string' ? parsed.lastCheckIn : '',
        currentSkin: typeof parsed.currentSkin === 'string' ? parsed.currentSkin : 'none',
        behaviorEvents: Array.isArray(parsed.behaviorEvents) ? (parsed.behaviorEvents as BehaviorEvent[]) : [],
        preferences: (parsed.preferences as PetPreferences) ?? createEmptyPreferences(),
        personality: (parsed.personality as PetPersonality) ?? generatePersonality(),
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
      lastCheckIn: state.lastCheckIn,
      currentSkin: state.currentSkin,
      behaviorEvents: state.behaviorEvents.slice(0, 20),
      preferences: state.preferences,
      personality: state.personality,
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
