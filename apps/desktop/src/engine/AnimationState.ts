/** Animation state — plain JS object, no React, updated in rAF, consumed by canvas renderer */

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(t, 1);

export interface ExpressionBlend {
  eyeH: number; eyeY: number; squint: number; browY: number; browAngle: number;
  mouthW: number; mouthH: number; mouthY: number; mouthCurve: number;
  blushA: number; pupilH: number;
}

export interface AnimationState {
  // Transform
  bx: number; by: number; sx: number; sy: number;
  wiggle: number; sway: number;
  // Micro
  blink: number; earL: number; earR: number;
  tailWag: number; headTilt: number;
  noseTwitch: number; eyeDartX: number;
  // Idle
  idleVariant: number; scratchHand: number;
  // Expression
  expr: ExpressionBlend;
  // Flash
  flash: number;
  // Limbs
  lArmAngle: number; rArmAngle: number;
  lLegAngle: number; rLegAngle: number;
  handOpen: number;
}

export const createAnimationState = (): AnimationState => ({
  bx:0, by:0, sx:1, sy:1, wiggle:0, sway:0,
  blink:0, earL:0, earR:0, tailWag:0, headTilt:0,
  noseTwitch:0, eyeDartX:0, idleVariant:0, scratchHand:0,
  expr: { eyeH:8, eyeY:31, squint:0, browY:0, browAngle:0, mouthW:4, mouthH:1.5, mouthY:43, mouthCurve:0, blushA:0.2, pupilH:5 },
  flash:0, lArmAngle:-20, rArmAngle:-20, lLegAngle:0, rLegAngle:0, handOpen:0.3,
});

/** Lerp expression blend values toward targets */
export const lerpExpression = (cur: ExpressionBlend, tgt: ExpressionBlend, speed = 0.08) => {
  cur.eyeH = lerp(cur.eyeH, tgt.eyeH, speed);
  cur.eyeY = lerp(cur.eyeY, tgt.eyeY, speed);
  cur.squint = lerp(cur.squint, tgt.squint, speed);
  cur.browY = lerp(cur.browY, tgt.browY, speed);
  cur.browAngle = lerp(cur.browAngle, tgt.browAngle, speed);
  cur.mouthW = lerp(cur.mouthW, tgt.mouthW, speed);
  cur.mouthH = lerp(cur.mouthH, tgt.mouthH, speed);
  cur.mouthY = lerp(cur.mouthY, tgt.mouthY, speed);
  cur.mouthCurve = lerp(cur.mouthCurve, tgt.mouthCurve, speed);
  cur.blushA = lerp(cur.blushA, tgt.blushA, speed);
  cur.pupilH = lerp(cur.pupilH, tgt.pupilH, speed);
};
