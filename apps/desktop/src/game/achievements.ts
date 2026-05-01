export type AchievementId =
  | 'first_words'
  | 'well_fed'
  | 'clean_machine'
  | 'scholar'
  | 'night_owl'
  | 'memory_keeper'
  | 'dreamer'
  | 'taskmaster'
  | 'trusted_friend';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
  progress: number;
  target: number;
}

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  { id: 'first_words', title: 'First Words', description: 'Chat with your Lamagotchi 5 times', icon: '💬', target: 5 },
  { id: 'well_fed', title: 'Well Fed', description: 'Feed your Lamagotchi 10 times', icon: '🍎', target: 10 },
  { id: 'clean_machine', title: 'Clean Machine', description: 'Clean your Lamagotchi 5 times', icon: '✨', target: 5 },
  { id: 'scholar', title: 'Scholar', description: 'Reach level 5', icon: '📚', target: 5 },
  { id: 'night_owl', title: 'Night Owl', description: 'Interact during night phase 3 times', icon: '🦉', target: 3 },
  { id: 'memory_keeper', title: 'Memory Keeper', description: 'Approve 10 memories', icon: '🧠', target: 10 },
  { id: 'dreamer', title: 'Dreamer', description: 'Daydream 8 times', icon: '💭', target: 8 },
  { id: 'taskmaster', title: 'Taskmaster', description: 'Complete 5 tasks', icon: '⚡', target: 5 },
  { id: 'trusted_friend', title: 'Trusted Friend', description: 'Reach trust level 80', icon: '🤝', target: 80 },
];

export const createAchievements = (): Achievement[] =>
  ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    unlockedAt: null,
    progress: 0,
  }));

export const checkAchievements = (
  achievements: Achievement[],
  updates: Partial<Record<AchievementId, number>>,
): { achievements: Achievement[]; newlyUnlocked: Achievement[] } => {
  const newlyUnlocked: Achievement[] = [];
  const updated = achievements.map((a) => {
    const delta = updates[a.id];
    if (delta === undefined) return a;
    const progress = Math.min(a.target, a.progress + delta);
    const unlockedAt = progress >= a.target && a.unlockedAt === null ? Date.now() : a.unlockedAt;
    if (unlockedAt && a.unlockedAt === null) {
      newlyUnlocked.push({ ...a, progress, unlockedAt });
    }
    return { ...a, progress, unlockedAt: unlockedAt ?? a.unlockedAt };
  });
  return { achievements: updated, newlyUnlocked };
};
