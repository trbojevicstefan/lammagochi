import { PixelRenderer } from './PixelRenderer';
import type { AnimationState } from './AnimationState';
import { getStage } from './PetSpec';

/** Draw action props — food, toy, book, bubbles */
export const drawProps = (
  r: PixelRenderer, anim: string, skin: string, state: AnimationState, level: number,
) => {
  const spec = getStage(level);
  const by = state.by;
  const hasHands = spec.hasHands;

  if (anim === 'eating' && spec.stage !== 'egg') {
    // Food — shrinks over time
    r.r(22, 36 + by, 10, 10, skin === 'inferno' ? '#ef4444' : '#f59e0b', 1);
    r.r(24, 38 + by, 6, 6, '#b45309', 1);
    r.r(26, 40 + by, 2, 2, '#fef3c7');
  }

  if (anim === 'playing' && hasHands) {
    const bounce = Math.abs(Math.sin(state.by)) * 3;
    r.r(44, 30 + by - bounce, 10, 10, skin === 'ocean' ? '#3b82f6' : skin === 'forest' ? '#22c55e' : '#fbbf24', 1);
    r.r(45, 31 + by - bounce, 4, 4, skin === 'ocean' ? '#2563eb' : '#f59e0b');
    r.r(49, 31 + by - bounce, 4, 4, '#fef3c7');
  }

  if (anim === 'learning' && hasHands) {
    r.r(12, 28 + by, 14, 11, skin === 'aurora' ? '#06b6d4' : '#c084fc', 1);
    r.r(13, 29 + by, 5, 9, '#fef3c7');
    r.r(18, 29 + by, 5, 9, '#fef3c7');
    r.r(14, 31 + by, 3, 2, skin === 'aurora' ? '#67e8f9' : '#a78bfa');
  }

  if (anim === 'cleaning') {
    for (let i = 0; i < 4; i++) {
      const wobX = Math.sin(state.by * 2 + i) * 2;
      r.circle(26 + i * 4 + wobX, 24 + by + i * 3, 4 + i, '#bae6fd');
    }
  }

  if (anim === 'daydreaming') {
    const accent = skin === 'aurora' ? '#67e8f9' : '#c084fc';
    r.circle(44, 14 + by + state.sway, 5, accent);
    r.circle(52, 8 + by + state.sway, 4, accent);
    r.circle(58, 2 + by + state.sway, 3, accent);
  }

  if (anim === 'excited' && hasHands) {
    if (skin === 'wizard') {
      r.r(42, 8 + by, 2, 20, '#854d0e');
      r.r(39, 4 + by, 8, 8, '#facc15', 1);
    } else {
      r.r(44, 26 + by, 4, 14, '#cbd5e1', 1);
      r.r(42, 26 + by, 8, 3, '#334155', 0.5);
    }
  }
};
