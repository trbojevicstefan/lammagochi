import { PixelRenderer } from './PixelRenderer';
import type { AnimationState } from './AnimationState';

/** Draw emotion particles — hearts, sparkles, Zs, stars */
export const drawParticles = (
  r: PixelRenderer, anim: string, state: AnimationState, time: number,
) => {
  if (anim === 'happy' || anim === 'playing') {
    // Hearts
    for (let i = 0; i < 2; i++) {
      const x = 42 + Math.sin(time * 2 + i) * 8;
      const y = 22 - ((time * 30 + i * 50) % 60);
      if (y > 0) r.text(x, y, '♥', 7, '#f472b6');
    }
  }
  if (anim === 'excited') {
    for (let i = 0; i < 3; i++) {
      const x = 40 + Math.cos(time * 3 + i) * 10;
      const y = 20 - ((time * 40 + i * 40) % 60);
      if (y > 0) r.text(x, y, '✦', 6, '#fbbf24');
    }
  }
  if (anim === 'sleepy') {
    const phase = Math.floor(time * 2) % 2;
    if (phase === 0) r.text(47, 16, 'z', 8, '#818cf8');
    else r.text(50, 10, 'Z', 10, '#818cf8');
  }
  if (anim === 'evolving') {
    for (let i = 0; i < 4; i++) {
      const x = 30 + Math.cos(time * 2 + i * 1.5) * 20;
      const y = 30 + Math.sin(time * 2 + i * 1.5) * 20;
      r.text(x, y, '★', 5, '#facc15');
    }
  }
};
