/** Autonomous behavior tree for pet decision-making */
import type { Stats } from '@lamagotchi/core';
import type { PetPersonality } from './personality';

export type BehaviorState = 'exploring'|'resting'|'seeking_attention'|'learning'|'playing_alone'|'caring';

export interface BehaviorDecision { state: BehaviorState; action: string; speech: string|null; priority: number; }

/** Decide what the pet should do autonomously */
export const decideBehavior = (
  stats: Stats, personality: PetPersonality, isNight: boolean, lastInteractionMin: number, isRoutineTime: boolean,
): BehaviorDecision => {
  // Priority 1: Critical needs
  if (stats.hunger < 15) return { state:'seeking_attention', action:'request_food', speech:'So hungry...', priority:100 };
  if (stats.energy < 10) return { state:'resting', action:'sleep', speech:'Need rest...', priority:100 };
  if (stats.hygiene < 15) return { state:'seeking_attention', action:'request_clean', speech:'Need bath...', priority:90 };

  // Priority 2: Routine
  if (isRoutineTime) {
    const hour = new Date().getHours();
    if (hour >= 10 && hour < 12) return { state:'learning', action:'study', speech:'Time to learn!', priority:80 };
    if (hour >= 12 && hour < 14) return { state:'playing_alone', action:'play', speech:'Play time!', priority:80 };
    if (hour >= 14 && hour < 16) return { state:'resting', action:'nap', speech:'Nap time...', priority:80 };
  }

  // Priority 3: Personality-driven
  if (personality.primary === 'playful' && stats.boredom > 50) return { state:'playing_alone', action:'play', speech:'Bored... let\'s play!', priority:60 };
  if (personality.primary === 'curious' && stats.curiosity > 60) return { state:'exploring', action:'explore', speech:'What\'s over there?', priority:55 };
  if (personality.primary === 'scholarly' && stats.knowledge < 50) return { state:'learning', action:'study', speech:'Want to learn more...', priority:55 };
  if (personality.primary === 'affectionate' && stats.trust > 60) return { state:'caring', action:'show_affection', speech:'Love you!', priority:50 };

  // Priority 4: Idle
  if (lastInteractionMin > 5) {
    if (stats.boredom > 40) return { state:'playing_alone', action:'self_play', speech:'Hmm... what to do?', priority:40 };
    if (isNight) return { state:'resting', action:'doze', speech:null, priority:30 };
    return { state:'exploring', action:'wander', speech:null, priority:20 };
  }

  return { state:'resting', action:'idle', speech:null, priority:0 };
};
