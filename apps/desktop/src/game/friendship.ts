/** Friendship & Milestone System */
export type FriendshipTier = 'stranger'|'acquaintance'|'friend'|'good_friend'|'best_friend'|'soul_bond';

export interface FriendshipState {
  tier: FriendshipTier;
  trust: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlockedAt: number | null;
  trustRequired: number;
}

export const FRIENDSHIP_TIERS: { tier: FriendshipTier; name:string; minTrust:number; unlocks:string[] }[] = [
  { tier:'stranger', name:'Stranger', minTrust:0, unlocks:['Basic care'] },
  { tier:'acquaintance', name:'Acquaintance', minTrust:20, unlocks:['Pet remembers your name','Shows recognition'] },
  { tier:'friend', name:'Friend', minTrust:40, unlocks:['Pet shares thoughts','Trusts you with secrets'] },
  { tier:'good_friend', name:'Good Friend', minTrust:60, unlocks:['Pet gives gifts','Special reactions'] },
  { tier:'best_friend', name:'Best Friend', minTrust:80, unlocks:['Pet writes notes','Unique animations'] },
  { tier:'soul_bond', name:'Soul Bond', minTrust:96, unlocks:['Complete trust','All abilities maxed'] },
];

export const MILESTONES: Milestone[] = [
  { id:'first_word', title:'First Word', icon:'💬', description:'Pet spoke its first word', unlockedAt:null, trustRequired:1 },
  { id:'first_fed', title:'First Meal', icon:'🍎', description:'First time feeding your pet', unlockedAt:null, trustRequired:1 },
  { id:'first_play', title:'Playtime!', icon:'🎾', description:'First play session together', unlockedAt:null, trustRequired:1 },
  { id:'first_skill', title:'First Skill', icon:'📚', description:'Pet learned its first skill', unlockedAt:null, trustRequired:5 },
  { id:'loves_you', title:'I Love You', icon:'💝', description:'Pet said "I love you" for the first time', unlockedAt:null, trustRequired:50 },
  { id:'gift_given', title:'First Gift', icon:'🎁', description:'Pet gave you a gift', unlockedAt:null, trustRequired:60 },
  { id:'birthday', title:'Birthday!', icon:'🎂', description:'Celebrated pet\'s birthday', unlockedAt:null, trustRequired:30 },
  { id:'anniversary', title:'Gotcha Day', icon:'🎉', description:'Adoption anniversary celebrated', unlockedAt:null, trustRequired:30 },
  { id:'midnight_talk', title:'Midnight Talk', icon:'🌙', description:'Had a late-night conversation', unlockedAt:null, trustRequired:40 },
  { id:'trust_fall', title:'Trust Fall', icon:'🤝', description:'Pet fully trusts you now', unlockedAt:null, trustRequired:80 },
];

export const getFriendshipTier = (trust: number): FriendshipTier => {
  for (let i = FRIENDSHIP_TIERS.length - 1; i >= 0; i--) {
    if (trust >= FRIENDSHIP_TIERS[i].minTrust) return FRIENDSHIP_TIERS[i].tier;
  }
  return 'stranger';
};

export const getTierInfo = (tier: FriendshipTier) => FRIENDSHIP_TIERS.find(t => t.tier === tier)!;

export const checkMilestones = (milestones: Milestone[], trust: number): Milestone[] =>
  milestones.map(m => m.unlockedAt === null && trust >= m.trustRequired ? { ...m, unlockedAt: Date.now() } : m);

export const createFriendship = (): FriendshipState => ({
  tier:'stranger', trust:0, milestones: MILESTONES.map(m => ({ ...m })),
});
