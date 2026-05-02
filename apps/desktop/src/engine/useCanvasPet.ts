import { useEffect, useRef } from 'react';
import { canvasEngine, type FPSMode } from './CanvasEngine';
import { PixelRenderer } from './PixelRenderer';
import { drawPet } from './PetRenderer';
import { drawParticles } from './ParticleDrawer';
import { drawProps } from './PropsDrawer';
import { createAnimationState, lerpExpression, type AnimationState } from './AnimationState';
import { getEmotion, type EmotionId } from '../game/emotions';

type Props = {
  level: number; emotion: string; skin?: string; night?: boolean;
  actionAnimation?: string | null; interactionSpark?: number;
  width?: number; height?: number; mode?: FPSMode;
};

export const useCanvasPet = ({
  level, emotion, skin = 'none', night = false,
  actionAnimation, interactionSpark = 0,
  width = 320, height = 320, mode = 'full',
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<AnimationState>(createAnimationState());
  const timeRef = useRef(0);
  const lastSpark = useRef(0);

  // Blink timer state (external to animation loop for proper timing)
  const blinkPhase = useRef<'open'|'closing'|'closed'|'opening'>('open');
  const blinkTimer = useRef(0);
  const nextBlinkAt = useRef(2000 + Math.random() * 3000);
  const blinkCount = useRef(0);

  // Ear twitch timer
  const earTwitchTimer = useRef(0);
  const earTwitchTarget = useRef<'none'|'left'|'right'>('none');
  const nextEarTwitchAt = useRef(3000 + Math.random() * 5000);

  // Idle variant timer
  const idleVariantTimer = useRef(0);
  const idleVariantType = useRef(0); // 0=normal,1=stretch,2=look,3=wiggle,4=sniff,5=scratch
  const nextIdleVariantAt = useRef(5000 + Math.random() * 10000);

  // Head tilt timer
  const headTiltTimer = useRef(0);
  const headTiltTarget = useRef(0);
  const nextHeadTiltAt = useRef(5000 + Math.random() * 8000);

  const petRef = (node: HTMLCanvasElement | null) => { canvasRef.current = node; };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvasEngine.setMode(mode);
    const renderer = new PixelRenderer(canvas);
    renderer.setSize(width, height);

    const unsub = canvasEngine.subscribe((dt) => {
      const state = stateRef.current;
      const t = (timeRef.current += dt);
      const anim = actionAnimation || 'idle';
      const emo = getEmotion((emotion as EmotionId) || 'happy');

      // === ANIMATION TARGETS ===
      // Breathing (subtle float)
      const bSpeed = 0.4;
      state.by = Math.sin(t * bSpeed * Math.PI * 2) * 1.0;
      state.sx = 1 + Math.cos(t * bSpeed * Math.PI * 2) * 0.005;
      state.sy = 1 - Math.sin(t * bSpeed * Math.PI * 2) * 0.006;

      // Action overrides
      if (anim === 'excited' || anim === 'playing') {
        const b = Math.abs(Math.sin(t * 2.8)) * 5;
        state.by = -b; state.sy = 1 + b / 70; state.sx = 1 - b / 90;
      }
      if (anim === 'happy') { state.by = Math.sin(t * 2.8) * 1.2; state.wiggle = Math.sin(t * 2.8) * 1.2; }
      if (anim === 'sleepy' || anim === 'daydreaming') { state.sway = Math.sin(t * 0.9) * 1.5; }
      if (anim === 'craving') { state.wiggle = Math.sin(t * 5) * 0.8; }
      if (anim === 'evolving') { state.sx = 1 + Math.sin(t * 2) * 0.03; state.sy = 1 + Math.sin(t * 2) * 0.03; state.flash = 0.35; }

      // === BLINK SYSTEM ===
      blinkTimer.current += dt * 1000;
      const bp = blinkPhase.current;
      if (bp === 'open' && blinkTimer.current >= nextBlinkAt.current) { blinkPhase.current = 'closing'; blinkTimer.current = 0; }
      if (bp === 'closing' && blinkTimer.current > 40) { blinkPhase.current = 'closed'; blinkTimer.current = 0; blinkCount.current++; }
      if (bp === 'closed' && blinkTimer.current > 60 + (blinkCount.current % 3 === 0 ? 80 : 0)) { blinkPhase.current = 'opening'; blinkTimer.current = 0; }
      if (bp === 'opening' && blinkTimer.current > 40) { blinkPhase.current = 'open'; blinkTimer.current = 0; nextBlinkAt.current = 2000 + Math.random() * 4000; }
      const bv = bp === 'closing' ? Math.min(1, blinkTimer.current / 40) : bp === 'closed' ? 1 : bp === 'opening' ? Math.max(0, 1 - blinkTimer.current / 40) : 0;
      state.blink = state.blink + (bv - state.blink) * 0.6;

      // === EAR TWITCH ===
      earTwitchTimer.current += dt * 1000;
      if (earTwitchTarget.current === 'none' && earTwitchTimer.current >= nextEarTwitchAt.current) {
        earTwitchTarget.current = Math.random() < 0.5 ? 'left' : 'right'; earTwitchTimer.current = 0;
      }
      if (earTwitchTarget.current !== 'none' && earTwitchTimer.current > 180) { earTwitchTarget.current = 'none'; nextEarTwitchAt.current = 3000 + Math.random() * 7000; earTwitchTimer.current = 0; }
      const twitchPhase = earTwitchTarget.current !== 'none' ? Math.sin(earTwitchTimer.current / 180 * Math.PI) * 0.15 : 0;
      state.earL = state.earL + ((earTwitchTarget.current === 'left' ? twitchPhase : 0) - state.earL) * 0.3;
      state.earR = state.earR + ((earTwitchTarget.current === 'right' ? twitchPhase : 0) - state.earR) * 0.3;

      // === IDLE VARIANTS ===
      if (anim === 'idle') {
        idleVariantTimer.current += dt * 1000;
        if (idleVariantTimer.current >= nextIdleVariantAt.current) {
          idleVariantType.current = Math.floor(Math.random() * 6);
          idleVariantTimer.current = 0;
          nextIdleVariantAt.current = 5000 + Math.random() * 10000;
        }
        const vp = idleVariantTimer.current < 1500 ? idleVariantTimer.current / 1500 : 1 - Math.min(1, (idleVariantTimer.current - 1500) / 500);
        const vi = idleVariantType.current === 1 ? vp * 2 : idleVariantType.current === 3 ? vp * 1.5 : idleVariantType.current === 5 ? vp : 0;
        state.idleVariant = state.idleVariant + (vi - state.idleVariant) * 0.15;
        if (idleVariantType.current === 4 && idleVariantTimer.current < 1200) { state.noseTwitch = Math.sin(idleVariantTimer.current / 150 * Math.PI) * 0.5; }
        if (idleVariantType.current === 5) { state.scratchHand = state.scratchHand + (vp * 8 - state.scratchHand) * 0.15; }
        else { state.scratchHand = state.scratchHand + (0 - state.scratchHand) * 0.1; }
      } else { state.idleVariant = state.idleVariant + (0 - state.idleVariant) * 0.1; }

      // === TAIL WAG ===
      const tailTgt = anim === 'happy' ? 0.5 : anim === 'excited' || anim === 'playing' ? 0.8 : anim === 'idle' ? 0.15 : 0.05;
      state.tailWag = Math.sin(t * 4.5) * tailTgt;

      // === HEAD TILT ===
      headTiltTimer.current += dt * 1000;
      if (headTiltTimer.current >= nextHeadTiltAt.current) { headTiltTarget.current = (Math.random() - 0.5) * 0.04; headTiltTimer.current = 0; nextHeadTiltAt.current = 5000 + Math.random() * 10000; }
      headTiltTarget.current *= 0.995;
      state.headTilt = state.headTilt + (headTiltTarget.current - state.headTilt) * 0.05;

      // === EYE DART ===
      state.eyeDartX = Math.sin(t * 3.5 + Math.sin(t * 0.7)) * 0.8;

      // === EXPRESSION ===
      lerpExpression(state.expr, emo.face, 0.06);

      // === FLASH ===
      if (interactionSpark > 0 && interactionSpark !== lastSpark.current) { lastSpark.current = interactionSpark; state.flash = 1; }
      state.flash *= 0.9;

      // === DRAW ===
      renderer.clear(); // transparent bg
      drawPet(renderer, state, level, skin, emotion, night);
      drawProps(renderer, anim, skin, state, level);
      drawParticles(renderer, anim, state, t);
    });
    return () => { unsub(); };
  }, [level, emotion, skin, night, actionAnimation, interactionSpark, width, height, mode]);

  return { canvasRef: petRef };
};
