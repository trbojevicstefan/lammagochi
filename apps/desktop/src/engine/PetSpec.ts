/** 10-stage body specification */
export type StageId = 'egg'|'hatchling'|'infant'|'toddler'|'learner'|'explorer'|'companion'|'guardian'|'sage'|'ascendant';

export interface BodySpec {
  stage: StageId; levelMin:number; levelMax:number|number;
  bodyW:number; bodyH:number; headR:number; eyeSize:number; snoutSize:number;
  hasLegs:boolean; legJoints:number; legLen:number;
  hasArms:boolean; armJoints:number; armLen:number;
  hasHands:boolean; hasFingers:boolean;
  hasCrest:boolean; hasWisdom:boolean; hasAura:boolean; isRegal:boolean;
  bellyW:number; bellyH:number;
  colorDefault:string; colorLight:string; colorDark:string;
}

export const STAGES: BodySpec[] = [
  { stage:'egg',levelMin:1,levelMax:1,bodyW:0,bodyH:0,headR:0,eyeSize:0,snoutSize:0,hasLegs:false,legJoints:0,legLen:0,hasArms:false,armJoints:0,armLen:0,hasHands:false,hasFingers:false,hasCrest:false,hasWisdom:false,hasAura:false,isRegal:false,bellyW:0,bellyH:0,colorDefault:'#f8fafc',colorLight:'#ffffff',colorDark:'#e2e8f0'},
  { stage:'hatchling',levelMin:2,levelMax:3,bodyW:36,bodyH:26,headR:0.65,eyeSize:0.20,snoutSize:2,hasLegs:false,legJoints:0,legLen:0,hasArms:false,armJoints:0,armLen:0,hasHands:false,hasFingers:false,hasCrest:false,hasWisdom:false,hasAura:false,isRegal:false,bellyW:22,bellyH:14,colorDefault:'#818cf8',colorLight:'#a5b4fc',colorDark:'#6366f1'},
  { stage:'infant',levelMin:4,levelMax:6,bodyW:34,bodyH:28,headR:0.62,eyeSize:0.18,snoutSize:3,hasLegs:true,legJoints:1,legLen:4,hasArms:false,armJoints:0,armLen:0,hasHands:false,hasFingers:false,hasCrest:false,hasWisdom:false,hasAura:false,isRegal:false,bellyW:20,bellyH:16,colorDefault:'#818cf8',colorLight:'#a5b4fc',colorDark:'#6366f1'},
  { stage:'toddler',levelMin:7,levelMax:10,bodyW:32,bodyH:30,headR:0.60,eyeSize:0.16,snoutSize:4,hasLegs:true,legJoints:2,legLen:8,hasArms:false,armJoints:0,armLen:0,hasHands:false,hasFingers:false,hasCrest:true,hasWisdom:false,hasAura:false,isRegal:false,bellyW:18,bellyH:18,colorDefault:'#6366f1',colorLight:'#818cf8',colorDark:'#4f46e5'},
  { stage:'learner',levelMin:11,levelMax:15,bodyW:30,bodyH:32,headR:0.58,eyeSize:0.15,snoutSize:5,hasLegs:true,legJoints:2,legLen:10,hasArms:true,armJoints:1,armLen:4,hasHands:false,hasFingers:false,hasCrest:true,hasWisdom:false,hasAura:false,isRegal:false,bellyW:16,bellyH:20,colorDefault:'#6366f1',colorLight:'#818cf8',colorDark:'#4f46e5'},
  { stage:'explorer',levelMin:16,levelMax:20,bodyW:28,bodyH:34,headR:0.56,eyeSize:0.14,snoutSize:6,hasLegs:true,legJoints:2,legLen:12,hasArms:true,armJoints:2,armLen:8,hasHands:true,hasFingers:false,hasCrest:true,hasWisdom:true,hasAura:false,isRegal:false,bellyW:14,bellyH:22,colorDefault:'#4f46e5',colorLight:'#6366f1',colorDark:'#4338ca'},
  { stage:'companion',levelMin:21,levelMax:26,bodyW:26,bodyH:36,headR:0.55,eyeSize:0.13,snoutSize:6,hasLegs:true,legJoints:2,legLen:14,hasArms:true,armJoints:2,armLen:10,hasHands:true,hasFingers:true,hasCrest:true,hasWisdom:true,hasAura:false,isRegal:false,bellyW:13,bellyH:24,colorDefault:'#4338ca',colorLight:'#4f46e5',colorDark:'#3730a3'},
  { stage:'guardian',levelMin:27,levelMax:33,bodyW:26,bodyH:36,headR:0.55,eyeSize:0.13,snoutSize:6,hasLegs:true,legJoints:3,legLen:14,hasArms:true,armJoints:3,armLen:10,hasHands:true,hasFingers:true,hasCrest:true,hasWisdom:true,hasAura:true,isRegal:true,bellyW:13,bellyH:24,colorDefault:'#3730a3',colorLight:'#4338ca',colorDark:'#312e81'},
  { stage:'sage',levelMin:34,levelMax:42,bodyW:25,bodyH:38,headR:0.54,eyeSize:0.12,snoutSize:6,hasLegs:true,legJoints:3,legLen:15,hasArms:true,armJoints:3,armLen:11,hasHands:true,hasFingers:true,hasCrest:true,hasWisdom:true,hasAura:true,isRegal:true,bellyW:12,bellyH:26,colorDefault:'#312e81',colorLight:'#3730a3',colorDark:'#1e1b4b'},
  { stage:'ascendant',levelMin:43,levelMax:999,bodyW:25,bodyH:38,headR:0.54,eyeSize:0.12,snoutSize:6,hasLegs:true,legJoints:3,legLen:15,hasArms:true,armJoints:3,armLen:11,hasHands:true,hasFingers:true,hasCrest:true,hasWisdom:true,hasAura:true,isRegal:true,bellyW:12,bellyH:26,colorDefault:'#1e1b4b',colorLight:'#312e81',colorDark:'#0f0a2e'},
];

export const getStage = (level: number): BodySpec => {
  for (const s of STAGES) {
    if (level >= s.levelMin && level <= s.levelMax) return s;
  }
  return STAGES[STAGES.length - 1];
};

export const getStageIndex = (level: number): number => {
  for (let i = 0; i < STAGES.length; i++) {
    if (level >= STAGES[i].levelMin && level <= STAGES[i].levelMax) return i;
  }
  return STAGES.length - 1;
};

export const SKIN_COLORS: Record<string, [string,string,string]> = {
  none: ['#6366f1','#818cf8','#4f46e5'],
  wizard: ['#7e22ce','#a855f7','#581c87'],
  ninja: ['#1e293b','#334155','#0f172a'],
  astronaut: ['#e2e8f0','#f8fafc','#94a3b8'],
  aurora: ['#06b6d4','#67e8f9','#0891b2'],
  inferno: ['#ef4444','#fca5a5','#991b1b'],
  ocean: ['#2563eb','#93c5fd','#1e3a5f'],
  forest: ['#16a34a','#86efac','#14532d'],
};
