/**
 * Teaching / Curriculum System
 * Skill tree with 6 branches, lesson definitions, flash cards
 */

export type SkillId = 'vocabulary'|'math'|'art'|'music'|'logic'|'empathy';

export interface SkillTier {
  name: string;
  unlockLevel: number;
  xpReward: number;
  description: string;
}

export interface SkillTree {
  id: SkillId;
  icon: string;
  label: string;
  tiers: SkillTier[];
  currentTier: number; // 0-3
  xp: number;
}

export const SKILL_TREES: Record<SkillId, { icon:string; label:string; tiers:SkillTier[] }> = {
  vocabulary: {
    icon: '📝', label: 'Vocabulary',
    tiers: [
      { name: 'First Words', unlockLevel:1, xpReward:10, description:'Single words and sounds' },
      { name: 'Sentences', unlockLevel:5, xpReward:20, description:'Short sentences and questions' },
      { name: 'Stories', unlockLevel:10, xpReward:35, description:'Can tell simple stories' },
      { name: 'Poetry', unlockLevel:20, xpReward:50, description:'Creative expression with words' },
    ],
  },
  math: {
    icon: '🔢', label: 'Math',
    tiers: [
      { name: 'Counting', unlockLevel:3, xpReward:15, description:'Numbers 1-10' },
      { name: 'Arithmetic', unlockLevel:8, xpReward:25, description:'Simple addition and subtraction' },
      { name: 'Logic', unlockLevel:15, xpReward:40, description:'Patterns and reasoning' },
      { name: 'Problem Solving', unlockLevel:25, xpReward:55, description:'Complex problem solving' },
    ],
  },
  art: {
    icon: '🎨', label: 'Art',
    tiers: [
      { name: 'Scribbles', unlockLevel:5, xpReward:12, description:'Basic drawings and colors' },
      { name: 'Drawing', unlockLevel:10, xpReward:22, description:'Recognizable shapes' },
      { name: 'Painting', unlockLevel:15, xpReward:38, description:'Color mixing and scenes' },
      { name: 'Design', unlockLevel:25, xpReward:52, description:'Creative design thinking' },
    ],
  },
  music: {
    icon: '🎵', label: 'Music',
    tiers: [
      { name: 'Rhythm', unlockLevel:7, xpReward:15, description:'Basic beat recognition' },
      { name: 'Melody', unlockLevel:12, xpReward:28, description:'Simple tune creation' },
      { name: 'Harmony', unlockLevel:18, xpReward:42, description:'Understanding harmony' },
      { name: 'Composition', unlockLevel:30, xpReward:60, description:'Creating full songs' },
    ],
  },
  logic: {
    icon: '🧩', label: 'Logic',
    tiers: [
      { name: 'Puzzles', unlockLevel:10, xpReward:20, description:'Simple puzzle solving' },
      { name: 'Strategy', unlockLevel:15, xpReward:35, description:'Planning and strategy' },
      { name: 'Analysis', unlockLevel:22, xpReward:48, description:'Critical thinking' },
      { name: 'Philosophy', unlockLevel:35, xpReward:65, description:'Deep thinking and wisdom' },
    ],
  },
  empathy: {
    icon: '💝', label: 'Empathy',
    tiers: [
      { name: 'Awareness', unlockLevel:2, xpReward:8, description:'Noticing feelings' },
      { name: 'Sharing', unlockLevel:8, xpReward:18, description:'Learning to share' },
      { name: 'Caring', unlockLevel:15, xpReward:32, description:'Showing care for others' },
      { name: 'Wisdom', unlockLevel:30, xpReward:55, description:'Deep emotional understanding' },
    ],
  },
};

export interface FlashCard {
  id: string;
  skill: SkillId;
  tier: number;
  question: string;
  answer: string;
  hint: string;
}

export const FLASH_CARDS: FlashCard[] = [
  { id:'v1', skill:'vocabulary', tier:0, question:'What sound does a dog make?', answer:'Woof', hint:'Think of a friendly bark' },
  { id:'v2', skill:'vocabulary', tier:0, question:'What color is the sky?', answer:'Blue', hint:'Look up on a sunny day' },
  { id:'v3', skill:'vocabulary', tier:1, question:'What do you call a baby cat?', answer:'Kitten', hint:'Tiny and furry' },
  { id:'m1', skill:'math', tier:0, question:'What is 2 + 2?', answer:'4', hint:'Count on your fingers' },
  { id:'m2', skill:'math', tier:0, question:'How many legs does a dog have?', answer:'4', hint:'Count them one by one' },
  { id:'m3', skill:'math', tier:1, question:'What is 10 - 3?', answer:'7', hint:'Take away three from ten' },
  { id:'a1', skill:'art', tier:0, question:'What color do you get mixing red and blue?', answer:'Purple', hint:'Think of grapes' },
  { id:'a2', skill:'art', tier:0, question:'What shape has 4 equal sides?', answer:'Square', hint:'Like a box' },
  { id:'e1', skill:'empathy', tier:0, question:'How do you feel when someone shares with you?', answer:'Happy', hint:'A warm feeling inside' },
  { id:'e2', skill:'empathy', tier:1, question:'What should you do if a friend is sad?', answer:'Comfort them', hint:'Show you care' },
  { id:'l1', skill:'logic', tier:0, question:'If all cats have tails, and Fluffy is a cat, does Fluffy have a tail?', answer:'Yes', hint:'Follow the logic' },
  { id:'l2', skill:'logic', tier:0, question:'Which is heavier: a pound of feathers or a pound of rocks?', answer:'Same', hint:'A pound is a pound' },
];

export const createSkillTrees = (): SkillTree[] =>
  Object.entries(SKILL_TREES).map(([id, tree]) => ({
    id: id as SkillId, icon: tree.icon, label: tree.label, tiers: tree.tiers, currentTier: 0, xp: 0,
  }));

export const getFlashCardsForSkill = (skill: SkillId, tier: number): FlashCard[] =>
  FLASH_CARDS.filter(c => c.skill === skill && c.tier <= tier);

export const advanceSkill = (trees: SkillTree[], skillId: SkillId, xp: number): { trees: SkillTree[]; tieredUp: boolean } => {
  let tieredUp = false;
  const updated = trees.map(t => {
    if (t.id !== skillId) return t;
    const newXp = t.xp + xp;
    const tier = t.currentTier;
    const nextTier = t.tiers[tier + 1];
    if (nextTier && newXp >= nextTier.unlockLevel * 10) {
      tieredUp = true;
      return { ...t, xp: newXp, currentTier: tier + 1 };
    }
    return { ...t, xp: newXp };
  });
  return { trees: updated, tieredUp };
};
