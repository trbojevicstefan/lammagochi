/**
 * 12-State Emotion System with Blend Trees
 * Each emotion has: face targets, body language, idle variant, particle type
 */
export type EmotionId = 'happy'|'sad'|'excited'|'sleepy'|'scared'|'proud'|'curious'|'embarrassed'|'angry'|'loving'|'determined'|'silly';

export interface EmotionConfig {
  id: EmotionId;
  label: string;
  icon: string;
  face: { eyeH:number; eyeY:number; squint:number; browY:number; browAngle:number; mouthW:number; mouthH:number; mouthY:number; mouthCurve:number; blushA:number; pupilH:number; };
  body: { tension:number; bounce:number; lean:number; arms: 'down'|'up'|'out'|'cross'|'reach'; };
  particles: { type:string; count:number }|null;
  idleVariant: 'normal'|'bounce'|'sway'|'tremble'|'strut'|'hide'|'stomp'|'cuddle'|'clench';
}

export const EMOTIONS: Record<EmotionId, EmotionConfig> = {
  happy:      { id:'happy', label:'Happy', icon:'😊', face:{eyeH:3.5,eyeY:33,squint:0.7,browY:-1,browAngle:0,mouthW:6,mouthH:3,mouthY:42,mouthCurve:1,blushA:0.8,pupilH:5}, body:{tension:0.3,bounce:0.4,lean:0,arms:'down'}, particles:{type:'hearts',count:1}, idleVariant:'bounce' },
  sad:        { id:'sad', label:'Sad', icon:'😢', face:{eyeH:4.5,eyeY:32,squint:0.3,browY:1.5,browAngle:-8,mouthW:6,mouthH:1.5,mouthY:44,mouthCurve:-1,blushA:0.3,pupilH:4}, body:{tension:0.1,bounce:0,lean:-0.1,arms:'down'}, particles:null, idleVariant:'sway' },
  excited:    { id:'excited', label:'Excited', icon:'🤩', face:{eyeH:5.5,eyeY:30,squint:0,browY:-2,browAngle:0,mouthW:8,mouthH:6,mouthY:41,mouthCurve:0,blushA:0.6,pupilH:6}, body:{tension:0.8,bounce:0.8,lean:0,arms:'up'}, particles:{type:'sparkles',count:3}, idleVariant:'bounce' },
  sleepy:     { id:'sleepy', label:'Sleepy', icon:'😴', face:{eyeH:1.5,eyeY:34,squint:0,browY:0,browAngle:0,mouthW:8,mouthH:3,mouthY:43,mouthCurve:0,blushA:0.15,pupilH:3}, body:{tension:0.05,bounce:0,lean:0.1,arms:'down'}, particles:{type:'z',count:1}, idleVariant:'sway' },
  scared:     { id:'scared', label:'Scared', icon:'😨', face:{eyeH:5.5,eyeY:30,squint:0,browY:-1.5,browAngle:4,mouthW:4,mouthH:2,mouthY:42,mouthCurve:0,blushA:0.1,pupilH:3}, body:{tension:0.9,bounce:0,lean:-0.2,arms:'out'}, particles:{type:'sweat',count:1}, idleVariant:'tremble' },
  proud:      { id:'proud', label:'Proud', icon:'😎', face:{eyeH:4,eyeY:32,squint:0.3,browY:-0.5,browAngle:0,mouthW:4,mouthH:2,mouthY:42,mouthCurve:0.5,blushA:0.4,pupilH:5}, body:{tension:0.6,bounce:0.2,lean:0.05,arms:'cross'}, particles:{type:'stars',count:1}, idleVariant:'strut' },
  curious:    { id:'curious', label:'Curious', icon:'🤔', face:{eyeH:5,eyeY:31,squint:0,browY:-1,browAngle:4,mouthW:3,mouthH:1.5,mouthY:43,mouthCurve:0,blushA:0.2,pupilH:5}, body:{tension:0.4,bounce:0.1,lean:0.15,arms:'reach'}, particles:null, idleVariant:'bounce' },
  embarrassed:{ id:'embarrassed', label:'Embarrassed', icon:'😳', face:{eyeH:4,eyeY:33,squint:0.5,browY:0.5,browAngle:0,mouthW:4,mouthH:2,mouthY:44,mouthCurve:-0.3,blushA:0.9,pupilH:4}, body:{tension:0.5,bounce:0,lean:-0.1,arms:'cross'}, particles:null, idleVariant:'hide' },
  angry:      { id:'angry', label:'Angry', icon:'😤', face:{eyeH:4.5,eyeY:32,squint:0.4,browY:1,browAngle:-10,mouthW:5,mouthH:2,mouthY:44,mouthCurve:-0.8,blushA:0.5,pupilH:4}, body:{tension:0.9,bounce:0.3,lean:0,arms:'cross'}, particles:null, idleVariant:'stomp' },
  loving:     { id:'loving', label:'Loving', icon:'🥰', face:{eyeH:3.5,eyeY:33,squint:0.6,browY:-0.5,browAngle:0,mouthW:5,mouthH:3,mouthY:42,mouthCurve:1,blushA:0.85,pupilH:5}, body:{tension:0.2,bounce:0.1,lean:0.1,arms:'reach'}, particles:{type:'hearts',count:2}, idleVariant:'cuddle' },
  determined: { id:'determined', label:'Determined', icon:'😠', face:{eyeH:4,eyeY:32,squint:0.2,browY:0.5,browAngle:-5,mouthW:3,mouthH:1.5,mouthY:43,mouthCurve:0,blushA:0.15,pupilH:4}, body:{tension:0.8,bounce:0,lean:0.1,arms:'out'}, particles:null, idleVariant:'clench' },
  silly:      { id:'silly', label:'Silly', icon:'😜', face:{eyeH:4.5,eyeY:31,squint:0.1,browY:-0.5,browAngle:0,mouthW:6,mouthH:3,mouthY:42,mouthCurve:0.7,blushA:0.5,pupilH:5}, body:{tension:0.1,bounce:0.6,lean:0,arms:'up'}, particles:{type:'sparkles',count:1}, idleVariant:'bounce' },
};

/** Get emotion config by id */
export const getEmotion = (id: EmotionId): EmotionConfig => EMOTIONS[id];

/** Determine emotion from pet state */
export const determineEmotion = (
  mood: string, hunger: number, energy: number, trust: number, isStreaming: boolean, justLeveled: boolean, isNight: boolean,
): EmotionId => {
  if (justLeveled) return 'proud';
  if (trust > 80) return 'loving';
  if (hunger < 20) return 'sad';
  if (energy < 20) return isNight ? 'sleepy' : 'sad';
  if (mood === 'curious') return 'curious';
  if (mood === 'excited') return 'excited';
  if (mood === 'sleepy') return 'sleepy';
  if (mood === 'happy') return 'happy';
  return 'happy';
};
