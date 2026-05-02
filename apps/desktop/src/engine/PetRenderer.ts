import { PixelRenderer } from './PixelRenderer';
import { getStage, SKIN_COLORS } from './PetSpec';
import type { AnimationState } from './AnimationState';

const C = (r: PixelRenderer) => (r as any).ctx as CanvasRenderingContext2D;

export const drawPet = (
  r: PixelRenderer, state: AnimationState, level: number,
  skin: string, emotion: string, night: boolean,
) => {
  const spec = getStage(level);
  const [skinMain, skinLight, skinDark] = SKIN_COLORS[skin] || SKIN_COLORS.none;
  const bodyMain = spec.isRegal ? spec.colorDefault : skinMain;
  const bodyLight = spec.isRegal ? spec.colorLight : skinLight;
  const bodyDark = spec.isRegal ? spec.colorDark : skinDark;
  const { by, sx, sy, wiggle, sway, tailWag, headTilt, idleVariant, scratchHand, flash, blink, eyeDartX } = state;
  const e = state.expr;

  r.clear();

  const c = C(r);
  c.save();

  // === EGG ===
  if (spec.stage === 'egg') {
    c.translate(32, 31);
    const eggGrad = c.createRadialGradient(-4, -6, 4, 0, 0, 17);
    eggGrad.addColorStop(0, '#ffffff'); eggGrad.addColorStop(0.4, '#f8fafc'); eggGrad.addColorStop(0.8, '#e0e7ff'); eggGrad.addColorStop(1, '#c7d2fe');
    c.fillStyle = eggGrad; c.beginPath(); c.ellipse(0, 8, 14, 17, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(-5, 1, 5, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e2e8f0'; c.fillRect(-7, -1, 3, 2); c.fillRect(2, 4, 4, 2); c.fillRect(-5, 13, 5, 2);
    c.restore(); return;
  }

  // Pet transform: center pivot at body center, apply animation
  const bx = 32, by2 = 24;
  c.translate(bx, by2 + spec.bodyH / 2);
  c.scale(sx, sy);
  c.rotate(headTilt * 0.05);
  c.translate(-bx, -by2 - spec.bodyH / 2);
  c.translate(wiggle - sway, by);

  // ========== BODY (elliptical, gradient 3D) ==========
  const bodyCX = 32, bodyCY = by2 + spec.bodyH / 2;
  const bodyRX = spec.bodyW / 2, bodyRY = spec.bodyH / 2;

  const bodyGrad = c.createLinearGradient(0, bodyCY - bodyRY, 0, bodyCY + bodyRY);
  bodyGrad.addColorStop(0, bodyLight); bodyGrad.addColorStop(0.3, bodyMain); bodyGrad.addColorStop(0.7, bodyMain); bodyGrad.addColorStop(1, bodyDark);
  c.fillStyle = bodyGrad;
  c.beginPath(); c.ellipse(bodyCX, bodyCY, bodyRX, bodyRY, 0, 0, Math.PI * 2); c.fill();

  // Shine highlight
  const hlGrad = c.createRadialGradient(bodyCX - bodyRX * 0.25, bodyCY - bodyRY * 0.35, bodyRX * 0.05, bodyCX, bodyCY, bodyRX);
  hlGrad.addColorStop(0, 'rgba(255,255,255,0.18)'); hlGrad.addColorStop(1, 'transparent');
  c.fillStyle = hlGrad;
  c.beginPath(); c.ellipse(bodyCX, bodyCY, bodyRX, bodyRY, 0, 0, Math.PI * 2); c.fill();

  // Belly patch
  c.fillStyle = 'rgba(255,255,255,0.06)';
  c.beginPath(); c.ellipse(bodyCX, bodyCY + bodyRY * 0.15, bodyRX * 0.55, bodyRY * 0.5, 0, 0, Math.PI * 2); c.fill();

  // Wisdom lines
  if (spec.hasWisdom) { c.fillStyle = bodyDark; c.globalAlpha = 0.2; c.fillRect(bodyCX - 9, bodyCY - bodyRY + 4, 18, 1.5); c.fillRect(bodyCX - 7, bodyCY - bodyRY + 7, 14, 1); c.globalAlpha = 1; }
  // Star (sage+)
  if (spec.isRegal) { c.fillStyle = '#facc15'; c.globalAlpha = 0.5; c.fillRect(bodyCX + bodyRX * 0.3, bodyCY - bodyRY + 4, 5, 5); c.globalAlpha = 1; }
  // Heart (companion)
  if (spec.stage === 'companion') { c.fillStyle = '#f472b6'; c.globalAlpha = 0.2; c.fillRect(bodyCX + 3, bodyCY + bodyRY * 0.3, 3, 3); c.globalAlpha = 1; }

  // ========== LEGS (attached at body bottom) ==========
  if (spec.hasLegs) {
    const legTop = bodyCY + bodyRY - 4;
    const lw = spec.legJoints >= 2 ? 5 : 7;
    const lh = spec.legLen;
    const legSpacing = (spec.bodyW / 2) * 0.6;
    [[-legSpacing, -lw/2], [legSpacing - lw, -lw/2]].forEach(([lxOff]) => {
      const lx = bodyCX + (lxOff as number);
      c.fillStyle = bodyDark;
      c.fillRect(lx, legTop, lw, lh);
      // Foot
      c.fillRect(lx - 2, legTop + lh - 2, lw + 4, 4);
      // Knee highlight
      if (spec.legJoints >= 2) { c.fillStyle = bodyLight; c.fillRect(lx + 1, legTop + lh * 0.35, lw - 2, 2); c.fillStyle = bodyDark; }
    });
  }

  // ========== TAIL (behind body right) ==========
  if ((spec.stage as string) !== 'hatchling') {
    c.save();
    c.translate(bodyCX - bodyRX + 6, bodyCY + bodyRY * 0.3);
    c.rotate(0.5 + tailWag * 0.6);
    const tl = spec.isRegal ? 16 : spec.hasWisdom ? 12 : 8;
    c.fillStyle = bodyDark;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-3, tl * 0.5, -1, tl); c.lineWidth = 4; c.strokeStyle = bodyDark; c.stroke();
    c.fillStyle = bodyLight; c.beginPath(); c.arc(-1, tl, 3, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  // ========== ARMS (attached at body sides) ==========
  if (spec.hasArms) {
    const armTop = bodyCY - bodyRY * 0.3;
    const al = spec.armLen;
    const armGrad = c.createLinearGradient(0, armTop, 0, armTop + al);
    armGrad.addColorStop(0, bodyLight); armGrad.addColorStop(0.5, bodyMain); armGrad.addColorStop(1, bodyDark);

    const drawArm = (side: number) => {
      const ax = bodyCX + (bodyRX - 2) * side;
      c.save(); c.translate(ax, armTop); c.rotate(side * 0.25);
      // Upper arm
      c.fillStyle = armGrad; c.fillRect(-2, 0, 4, al);
      // Elbow joint
      if (spec.armJoints >= 2) {
        c.fillStyle = bodyDark; c.beginPath(); c.arc(0, al, 2, 0, Math.PI * 2); c.fill();
        // Forearm
        c.fillStyle = bodyDark; c.fillRect(-1.5, al, 3, al * 0.55);
        // Hand
        if (spec.hasHands) {
          const hy = al + al * 0.55;
          c.fillStyle = bodyLight;
          c.beginPath(); c.arc(0, hy + 2, 3, 0, Math.PI * 2); c.fill();
          if (spec.hasFingers) {
            c.fillStyle = bodyLight;
            if (side > 0) { c.fillRect(1, hy, 2, 4); c.fillRect(-3, hy, 2, 3); }
            else { c.fillRect(-3, hy, 2, 4); c.fillRect(1, hy, 2, 3); }
          }
        }
      }
      c.restore();
    };
    drawArm(-1); drawArm(1);
  }

  // ========== HEAD (on top of body) ==========
  const headR = spec.headR * 24;
  const headCX = bodyCX;
  const headCY = bodyCY - bodyRY - headR * 0.55;

  const headGrad = c.createRadialGradient(headCX - headR * 0.25, headCY - headR * 0.3, headR * 0.05, headCX, headCY, headR);
  headGrad.addColorStop(0, bodyLight); headGrad.addColorStop(0.6, bodyMain); headGrad.addColorStop(1, bodyDark);
  c.fillStyle = headGrad; c.beginPath(); c.arc(headCX, headCY, headR, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.arc(headCX - headR * 0.25, headCY - headR * 0.25, headR * 0.35, 0, Math.PI * 2); c.fill();

  // Snout
  if (spec.snoutSize > 0) {
    const snR = spec.snoutSize * 1.2;
    c.fillStyle = '#f8fafc'; c.beginPath(); c.ellipse(headCX, headCY + headR * 0.25, snR, snR * 0.7, 0, 0, Math.PI * 2); c.fill();
    if (spec.snoutSize >= 4) { c.fillStyle = '#334155'; c.fillRect(headCX - 2, headCY + headR * 0.25 - 1, 1.5, 1.5); c.fillRect(headCX + 1, headCY + headR * 0.25 - 1, 1.5, 1.5); }
  }

  // Crest
  if (spec.hasCrest) {
    const crColor = spec.isRegal ? '#06b6d4' : '#fbbf24';
    const crLight = spec.isRegal ? '#22d3ee' : '#f59e0b';
    c.fillStyle = crColor; c.fillRect(headCX - 5, headCY - headR - 12, 10, 14);
    c.fillStyle = crLight; c.fillRect(headCX - 3, headCY - headR - 15, 6, 5);
    c.fillStyle = '#fef3c7'; c.fillRect(headCX - 1.5, headCY - headR - 14, 3, 3);
  }

  // ========== FACE ==========
  const faceCY = headCY - headR * 0.1;
  const eyeSize = headR * 0.28; // proportional to head
  const eyeGap = headR * 0.45;

  // Eyebrows
  const browY = faceCY - headR * 0.45 + e.browY;
  const bw = spec.stage === 'hatchling' ? headR * 0.4 : headR * 0.45;
  c.fillStyle = bodyDark;
  c.fillRect(headCX - eyeGap - bw / 2 + 1, browY, bw, 2);
  c.fillRect(headCX + eyeGap - bw / 2 + 1, browY, bw, 2);

  // Eyes
  const eyeY = faceCY + e.eyeY - 31;
  const eyeH = Math.max(1, e.eyeH * 0.9 * (1 - blink * 0.95));

  const drawEye = (cx: number) => {
    if (e.eyeH <= 2.5) {
      // Sleepy
      c.fillStyle = '#1e1b4b'; c.fillRect(cx - eyeSize * 0.5, eyeY + 3, eyeSize, 1.5);
    } else {
      // Eye white
      c.fillStyle = '#ffffff';
      c.fillRect(cx - eyeSize / 2, eyeY, eyeSize, eyeH);
      // Squint overlay
      if (e.squint > 0.1) { c.fillStyle = bodyMain; c.fillRect(cx - eyeSize / 2, eyeY, eyeSize, Math.round(e.squint * 3)); }
      // Iris + pupil
      if (blink < 0.6) {
        const irisR = e.pupilH * 1.8;
        c.fillStyle = '#1e1b4b';
        c.beginPath(); c.arc(cx + eyeDartX * 0.5, eyeY + eyeH / 2, irisR, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'white';
        c.fillRect(cx - 1 + eyeDartX * 0.3, eyeY + eyeH / 2 - irisR * 0.5, 2, 2);
      }
    }
  };
  drawEye(headCX - eyeGap);
  drawEye(headCX + eyeGap);

  // Blush
  if ((spec.stage as string) !== 'egg') {
    c.fillStyle = skin === 'inferno' ? '#fca5a5' : '#f472b6'; c.globalAlpha = e.blushA;
    c.fillRect(headCX - eyeGap - eyeSize / 2 - 3, eyeY + eyeH + 2, eyeSize * 0.45, 2.5);
    c.fillRect(headCX + eyeGap + eyeSize / 2 - 2, eyeY + eyeH + 2, eyeSize * 0.45, 2.5);
    c.globalAlpha = 1;
  }

  // Mouth
  const mw = e.mouthW, mh = e.mouthH, my = e.mouthY, mc = e.mouthCurve;
  const mouthX = headCX - mw / 2;
  c.fillStyle = '#1e1b4b';
  if (mc > 0.5) {
    c.fillRect(mouthX, my, mw, mh);
    c.fillRect(mouthX - 2, my - 1.5, 2, 2.5);
    c.fillRect(mouthX + mw, my - 1.5, 2, 2.5);
  } else if (mc < -0.5) {
    c.fillRect(mouthX, my, mw, mh);
  } else if (mh > 4) {
    c.fillRect(mouthX, my, mw, mh);
    c.fillStyle = '#ef4444'; c.fillRect(mouthX + 2, my + Math.round(mh * 0.5), mw - 4, Math.round(mh * 0.35));
  } else {
    c.fillRect(mouthX + 1, my, mw - 2, mh);
  }

  // ========== SKIN ACCESSORIES ==========
  if (skin === 'wizard') {
    c.fillStyle = '#7e22ce'; c.beginPath(); c.moveTo(headCX, headCY - headR - 13); c.lineTo(headCX - 16, headCY - headR + 1); c.lineTo(headCX + 16, headCY - headR + 1); c.fill();
    c.fillStyle = '#6b21a8'; c.fillRect(headCX - 18, headCY - headR, 36, 5);
    c.fillStyle = '#facc15'; c.fillRect(headCX - 3, headCY - headR - 10, 6, 6);
  }
  if (skin === 'ninja') { c.fillStyle = '#dc2626'; c.fillRect(headCX - 19, faceCY - headR * 0.5, 38, 3.5); }
  if (skin === 'astronaut') { c.strokeStyle = 'rgba(125,211,252,0.25)'; c.lineWidth = 1; c.beginPath(); c.arc(headCX, headCY, headR + 5, 0, Math.PI * 2); c.stroke(); }

  // Aura
  if (spec.hasAura) {
    c.strokeStyle = spec.isRegal ? 'rgba(6,182,212,0.4)' : 'rgba(129,140,248,0.3)';
    c.lineWidth = 1; c.setLineDash([5, 5]);
    c.beginPath(); c.ellipse(32, 32, 28, 12, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(32, 32, 12, 28, 0, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
  }

  c.restore();
};
