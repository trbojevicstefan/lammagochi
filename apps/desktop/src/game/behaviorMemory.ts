/**
 * Behavior Memory System
 * Tracks what the pet "remembers" about interactions, develops preferences,
 * and generates contextual responses based on history.
 */

export interface BehaviorEvent {
  id: string;
  type: 'fed' | 'played' | 'cleaned' | 'taught' | 'tasked' | 'dreamed' | 'leveled' | 'returned' | 'neglected';
  timestamp: number;
  detail: string;
  emotion: 'happy' | 'neutral' | 'sad' | 'excited';
}

export interface PetPreferences {
  favoriteAction: string;
  favoriteFood: string;
  favoriteTimeOfDay: string;
  timesFed: number;
  timesPlayed: number;
  timesCleaned: number;
  timesTaught: number;
  lastFedAt: number;
  lastPlayedAt: number;
  lastCleanedAt: number;
}

const MAX_EVENTS = 50;

export const createEmptyPreferences = (): PetPreferences => ({
  favoriteAction: 'feed', favoriteFood: 'anything', favoriteTimeOfDay: 'morning',
  timesFed: 0, timesPlayed: 0, timesCleaned: 0, timesTaught: 0,
  lastFedAt: 0, lastPlayedAt: 0, lastCleanedAt: 0,
});

export const recordEvent = (
  events: BehaviorEvent[],
  type: BehaviorEvent['type'],
  detail: string,
  emotion: BehaviorEvent['emotion'] = 'neutral',
): BehaviorEvent[] => {
  const event: BehaviorEvent = { id: `bev_${Date.now()}`, type, timestamp: Date.now(), detail, emotion };
  return [event, ...events].slice(0, MAX_EVENTS);
};

export const updatePreferences = (prefs: PetPreferences, eventType: BehaviorEvent['type']): PetPreferences => {
  const p = { ...prefs };
  if (eventType === 'fed') { p.timesFed++; p.lastFedAt = Date.now(); }
  if (eventType === 'played') { p.timesPlayed++; p.lastPlayedAt = Date.now(); }
  if (eventType === 'cleaned') { p.timesCleaned++; p.lastCleanedAt = Date.now(); }
  if (eventType === 'taught') p.timesTaught++;
  const counts: [string, number][] = [['feed', p.timesFed], ['play', p.timesPlayed], ['clean', p.timesCleaned], ['teach', p.timesTaught]];
  counts.sort((a, b) => b[1] - a[1]);
  p.favoriteAction = counts[0][0];
  return p;
};

export const generatePetThought = (
  prefs: PetPreferences, events: BehaviorEvent[], currentMood: string,
): string | null => {
  const now = Date.now();
  const hrsFed = (now - prefs.lastFedAt) / 3600000;
  const hrsPlayed = (now - prefs.lastPlayedAt) / 3600000;
  const hrsCleaned = (now - prefs.lastCleanedAt) / 3600000;

  if (events.length > 0 && events[0].type === 'returned') {
    const phrases = ['You came back!', 'I waited for you!', 'Missed you lots!', 'So happy!'];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  if (hrsFed > 2 && prefs.timesFed > 3) return `Last meal was ${Math.floor(hrsFed)}h ago...`;
  if (prefs.timesPlayed > 5 && hrsPlayed > 1) {
    const phrases = ['Remember when we played?', 'I love playing with you.', 'Playtime is best.'];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  if (prefs.timesTaught > 3) return 'I learned so much from you...';
  if (hrsCleaned > 3 && prefs.timesCleaned > 2) return 'Feeling a bit messy...';
  if (events.some(e => e.type === 'leveled')) return 'Growing because of you!';
  return null;
};
