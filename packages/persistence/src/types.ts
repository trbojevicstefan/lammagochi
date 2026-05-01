export type LifecycleStage = 'onboarding' | 'named_egg' | 'hatching' | 'alive';

export type PetProfile = {
  id: string;
  name: string;
  modelName: string;
  createdAt: number;
  updatedAt: number;
};

export type PetStats = {
  hunger: number;
  curiosity: number;
  energy: number;
  hygiene: number;
  mood: number;
  knowledge: number;
  trust: number;
  boredom: number;
};

export type PetRuntimeState = {
  petId: string;
  level: number;
  xp: number;
  stage: LifecycleStage;
  bubbleText: string;
  lastTickAt: number;
};

export type MemoryItem = {
  id: string;
  petId: string;
  title: string;
  content: string;
  approved: boolean;
  createdAt: number;
};

export type JournalEntry = {
  id: string;
  petId: string;
  entryType: 'daydream' | 'task' | 'system';
  content: string;
  createdAt: number;
};

export type PetSnapshot = {
  profile: PetProfile;
  state: PetRuntimeState;
  stats: PetStats;
  memoryItems: MemoryItem[];
};

