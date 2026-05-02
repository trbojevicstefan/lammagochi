import { useEffect, useRef } from 'react';
import { canvasEngine, type FPSMode } from './CanvasEngine';
import { PixelRenderer } from './PixelRenderer';
import { drawPet } from './PetRenderer';
import { createAnimationState, lerpExpression } from './AnimationState';
import { getEmotion, type EmotionId } from '../game/emotions';

type CanvasPetProps = {
  level: number; emotion: string; skin?: string; night?: boolean;
  actionAnimation?: string | null; interactionSpark?: number;
  width?: number; height?: number; mode?: FPSMode;
};

export const useCanvasPet = ({
  level, emotion, skin = 'none', night = false,
  actionAnimation, interactionSpark = 0,
  width = 320, height = 320, mode = 'full',
}: CanvasPetProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(createAnimationState());
  const timeRef = useRef(0);
  const lastSpark = useRef(0);

  // Canvas ref callback
  const petRef = (node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvasEngine.setMode(mode);
    const renderer = new PixelRenderer(canvas);
    renderer.setSize(width, height);

    const unsub = canvasEngine.subscribe((dt) => {
      const state = stateRef.current;
      const t = (timeRef.current += dt);
      const emo = getEmotion((emotion as EmotionId) || 'happy');
      const bSpeed = 0.4;
      state.by = Math.sin(t * bSpeed * Math.PI * 2) * 1.0;
      state.sx = 1 + Math.cos(t * bSpeed * Math.PI * 2) * 0.005;
      state.sy = 1 - Math.sin(t * bSpeed * Math.PI * 2) * 0.006;
      state.blink = Math.sin(t * 0.6) > 0.92 ? 1 : 0;
      state.tailWag = Math.sin(t * 4.5) * 0.15;
      state.headTilt = Math.sin(t * 0.3) * 0.02;
      state.eyeDartX = Math.sin(t * 3.5) * 0.8;
      lerpExpression(state.expr, emo.face, 0.06);
      if (interactionSpark > 0 && interactionSpark !== lastSpark.current) { lastSpark.current = interactionSpark; state.flash = 1; }
      state.flash *= 0.9;
      renderer.clear();
      drawPet(renderer, state, level, skin, emotion, night);
    });
    return () => { unsub(); };
  }, [level, emotion, skin, night, actionAnimation, interactionSpark, width, height, mode]);

  return { canvasRef: petRef };
};
