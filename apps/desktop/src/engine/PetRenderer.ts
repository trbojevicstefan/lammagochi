import { PixelRenderer } from './PixelRenderer';
import { getStage, SKIN_COLORS, type BodySpec } from './PetSpec';
import { type ExpressionBlend, type AnimationState } from './AnimationState';

type Skin = string;

export const drawPet = (
  r: PixelRenderer, state: AnimationState, level: number,
  skin: Skin, emotion: string, night: boolean,
) => {
  const spec = getStage(level);
  const [skinMain, skinLight, skinDark] = SKIN_COLORS[skin] || SKIN_COLORS.none;
  const bodyMain = spec.isRegal ? spec.colorDefault : skinMain;
  const bodyLight = spec.isRegal ? spec.colorLight : skinLight;
  const bodyDark = spec.isRegal ? spec.colorDark : skinDark;

  const { bx, by, sx, sy, wiggle, sway, tailWag, headTilt, idleVariant, scratchHand, flash,
    blink, eyeDartX } = state;
  const e = state.expr;
  const exPupilH = e.pupilH;

  // Night dim
  const dim = night ? 0.55 : 1;
  const bright = dim + flash * (1 - dim);

  r.clear();

  // === Background ===
  r.ellipse(32, 32, 31, 31, `rgba(99,102,241,${0.03 * bright})`);

  // === Floor shadow ===
  r.ellipse(32, 58, 18 * (1 - by * 0.03), 5, `rgba(0,0,0,${0.35 * bright})`);

  // === Aura (Guardian+) ===
  if (spec.hasAura) {
    r.ellipse(32, 32, 30, 14, 'none');
    r.ellipse(32, 32, 14, 30, 'none');
    // Draw aura rings via arcs
    const c = (r as any).ctx;
    c.strokeStyle = spec.isRegal ? 'rgba(6,182,212,0.4)' : 'rgba(129,140,248,0.3)';
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.beginPath(); c.ellipse(32, 32, 28, 12, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(32, 32, 12, 28, 0, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
  }

  // Save transform for pet body
  (r as any).ctx.save();
  const tctx = (r as any).ctx;
  tctx.translate(32, 56);
  tctx.scale(sx, sy);
  tctx.translate(-32, -56);
  tctx.translate(wiggle - sway, by);
  tctx.rotate(headTilt * 0.05);

  // === Egg ===
  if (spec.stage === 'egg') {
    r.ellipse(32, 40, 14, 17, '#f8fafc');
    r.ellipse(27, 33, 5, 7, `rgba(255,255,255,${0.4 * bright})`);
    r.r(24, 30, 4, 2, '#e2e8f0', 0.5);
    r.r(33, 35, 5, 2, '#e2e8f0', 0.5);
    r.r(26, 44, 6, 2, '#e2e8f0', 0.5);
    (r as any).ctx.restore();
    return;
  }

  // === Body ===
  const bx2 = 32 - spec.bodyW / 2;
  const by2 = 22;
  r.r(bx2, by2, spec.bodyW, spec.bodyH, bodyMain, spec.stage === 'hatchling' ? 10 : 7);
  r.r(bx2 + 2, by2 - 2, spec.bodyW - 4, spec.bodyH + 4, bodyMain, spec.stage === 'hatchling' ? 10 : 7);
  // Highlight
  r.r(bx2 + 2, by2, spec.bodyW - 8, 5, bodyLight, 2);
  // Belly
  r.r(32 - spec.bellyW / 2, by2 + 8, spec.bellyW, spec.bellyH, `rgba(255,255,255,0.08)`);

  // === Stage markings ===
  if (spec.hasWisdom) {
    r.r(25, 24, 14, 1, bodyDark);
    r.r(27, 26, 10, 1, bodyDark);
  }
  if (spec.isRegal) {
    r.r(44, 22, 5, 5, '#facc15');
  }

  // === Legs ===
  if (spec.hasLegs) {
    const footY = by2 + spec.bodyH - 2;
    const legW = spec.legJoints >= 2 ? 4 : 6;
    // Left leg
    r.r(32 - spec.bodyW / 2 + 4, footY, legW, spec.legLen, bodyDark, 2);
    if (spec.legJoints >= 2) {
      r.r(32 - spec.bodyW / 2 + 4, footY + spec.legLen * 0.5, legW - 1, spec.legLen * 0.5, bodyLight, 1.5);
    }
    r.r(32 - spec.bodyW / 2 + 4 - 2, footY + spec.legLen - 2, legW + 4, 4, bodyDark, 1);
    // Right leg
    r.r(32 + spec.bodyW / 2 - 4 - legW, footY, legW, spec.legLen, bodyDark, 2);
    if (spec.legJoints >= 2) {
      r.r(32 + spec.bodyW / 2 - 4 - legW + 1, footY + spec.legLen * 0.5, legW - 1, spec.legLen * 0.5, bodyLight, 1.5);
    }
    r.r(32 + spec.bodyW / 2 - 4 - legW - 2, footY + spec.legLen - 2, legW + 4, 4, bodyDark, 1);
  }

  // === Tail ===
  if ((spec.stage as string) !== 'hatchling') {
    const tailLen = spec.hasWisdom ? 16 : spec.hasCrest ? 12 : 8;
    (r as any).ctx.save();
    tctx.translate(5, 38);
    tctx.rotate(0.3 + tailWag * 0.5);
    r.r(0, 0, 5, tailLen, bodyDark, 2);
    r.r(0, tailLen - 4, 4, tailLen * 0.5, bodyLight, 1);
    (r as any).ctx.restore();
  }

  // === Arms ===
  if (spec.hasArms) {
    const armY = by2 + 6;
    const lx = bx2 + 2;
    const rx = bx2 + spec.bodyW - 2;
    // Left arm
    r.r(lx - spec.armLen * 0.3, armY, 4, spec.armLen, bodyLight, 2);
    if (spec.armJoints >= 2) {
      r.r(lx - spec.armLen * 0.3, armY + spec.armLen * 0.5, 3, spec.armLen * 0.5, bodyDark, 1.5);
      if (spec.hasHands) {
        const handY = armY + spec.armLen - scratchHand;
        r.r(lx - spec.armLen * 0.3 - 1, handY, 6, 6, bodyLight, 2);
        if (spec.hasFingers) {
          r.r(lx - spec.armLen * 0.3 - 3, handY + 2, 2, 3, bodyLight, 0.5);
        }
      }
    }
    // Right arm
    r.r(rx - spec.armLen * 0.3, armY, 4, spec.armLen, bodyLight, 2);
    if (spec.armJoints >= 2) {
      r.r(rx - spec.armLen * 0.3, armY + spec.armLen * 0.5, 3, spec.armLen * 0.5, bodyDark, 1.5);
      if (spec.hasHands) {
        r.r(rx - spec.armLen * 0.3 - 1, armY + spec.armLen, 6, 6, bodyLight, 2);
        if (spec.hasFingers) {
          r.r(rx - spec.armLen * 0.3 + 4, armY + spec.armLen + 2, 2, 3, bodyLight, 0.5);
        }
      }
    }
  }

  // === Head ===
  const headY = by2 - spec.headR * 8;
  const headCX = 32;
  const headCY = headY + spec.headR * 10;
  r.circle(headCX, headCY, spec.headR * 32, bodyMain);
  // Snout
  if (spec.snoutSize > 0) {
    r.circle(headCX, headCY + spec.headR * 20, spec.snoutSize, '#f8fafc');
    if (spec.snoutSize >= 4) {
      r.r(headCX - 2, headCY + spec.headR * 20 - 1, 1.5, 1.5, '#334155');
      r.r(headCX + 1, headCY + spec.headR * 20 - 1, 1.5, 1.5, '#334155');
    }
  }

  // === Crest ===
  if (spec.hasCrest) {
    r.r(28, headCY - spec.headR * 30, 8, 12, spec.isRegal ? '#06b6d4' : '#fbbf24', 1);
    r.r(30, headCY - spec.headR * 36, 4, 4, spec.isRegal ? '#22d3ee' : '#f59e0b', 1);
    r.r(31, headCY - spec.headR * 35, 2, 2, '#fef3c7');
  }

  // === Face ===
  // Eyebrows
  const browY = headCY - spec.headR * 16 + e.browY;
  r.r(headCX - 12, browY, 8, 2, bodyDark, 1);
  r.r(headCX + 4, browY, 8, 2, bodyDark, 1);

  // Eyes
  const eyeY = headCY - spec.headR * 10 + e.eyeY - 31;
  const eyeH = e.eyeH * (1 - blink * 0.95);
  if (e.eyeH <= 2.5) {
    r.r(headCX - 12, eyeY + 2, 8, e.eyeH, '#1e1b4b', 1);
    r.r(headCX + 4, eyeY + 2, 8, e.eyeH, '#1e1b4b', 1);
  } else {
    r.r(headCX - 12, eyeY, 10, eyeH, '#ffffff', 1);
    r.r(headCX + 4, eyeY, 10, eyeH, '#ffffff', 1);
    // Squint
    if (e.squint > 0.1) {
      r.r(headCX - 12, eyeY, 10, Math.round(e.squint * 4), bodyMain, 1);
      r.r(headCX + 4, eyeY, 10, Math.round(e.squint * 4), bodyMain, 1);
    }
    // Pupils
    if (blink < 0.6) {
      r.r(headCX - 9 + eyeDartX, eyeY + 2, 5, Math.max(1, exPupilH), '#1e1b4b', 0.5);
      r.r(headCX + 7 + eyeDartX, eyeY + 2, 5, Math.max(1, exPupilH), '#1e1b4b', 0.5);
      r.r(headCX - 7, eyeY + 2, 2, 2, '#ffffff');
      r.r(headCX + 9, eyeY + 2, 2, 2, '#ffffff');
    }
  }

  // Blush
  if ((spec.stage as string) !== 'egg') {
    r.r(headCX - 15, eyeY + 7, 5, 2, skin === 'inferno' ? '#fca5a5' : '#f472b6');
    r.r(headCX + 10, eyeY + 7, 5, 2, skin === 'inferno' ? '#fca5a5' : '#f472b6');
  }

  // Mouth
  const mw = e.mouthW, mh = e.mouthH, my = e.mouthY, mc = e.mouthCurve;
  if (mc > 0.5) {
    // Smile
    r.r(headCX - mw/2, my, mw, mh, '#1e1b4b', 1);
    r.r(headCX - mw/2 - 1.5, my - 1, 1.5, 2, '#1e1b4b', 0.5);
    r.r(headCX + mw/2, my - 1, 1.5, 2, '#1e1b4b', 0.5);
  } else if (mc < -0.5) {
    r.r(headCX - mw/2, my, mw, mh, '#1e1b4b', 0.5);
  } else {
    r.r(headCX - mw/2, my, mw, mh, '#1e1b4b', 0.5);
  }

  // === Skin accessories ===
  if (skin === 'wizard') {
    r.r(headCX - 18, headCY - spec.headR * 40, 36, 4, '#6b21a8', 2);
    (r as any).ctx.beginPath();
    (r as any).ctx.moveTo(32, headCY - spec.headR * 48);
    (r as any).ctx.lineTo(18, headCY - spec.headR * 28);
    (r as any).ctx.lineTo(46, headCY - spec.headR * 28);
    (r as any).ctx.fillStyle = '#7e22ce';
    (r as any).ctx.fill();
  }
  if (skin === 'ninja') {
    r.r(headCX - 19, headCY - spec.headR * 14, 38, 4, '#dc2626');
    r.r(headCX - 26, headCY - spec.headR * 13, 7, 2, '#b91c1c');
  }

  (r as any).ctx.restore();
};
