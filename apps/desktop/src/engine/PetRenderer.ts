import { PixelRenderer } from './PixelRenderer';
import { getStage, SKIN_COLORS } from './PetSpec';
import type { AnimationState } from './AnimationState';

/** Get a CanvasRenderingContext2D reference for gradient creation */
const ctx = (r: PixelRenderer): CanvasRenderingContext2D => (r as any).ctx as CanvasRenderingContext2D;

/** Create a vertical linear gradient */
const vGrad = (r: PixelRenderer, x1:number,y1:number,x2:number,y2:number, stops:[number,string][]) => {
  const g = ctx(r).createLinearGradient(x1,y1,x2,y2);
  stops.forEach(([pos,color]) => g.addColorStop(pos,color));
  return g;
};

/** Create a radial gradient */
const rGrad = (r: PixelRenderer, cx:number,cy:number,r1:number,r2:number, stops:[number,string][]) => {
  const g = ctx(r).createRadialGradient(cx,cy,r1,cx,cy,r2);
  stops.forEach(([pos,color]) => g.addColorStop(pos,color));
  return g;
};

export const drawPet = (
  r: PixelRenderer, state: AnimationState, level: number,
  skin: string, emotion: string, night: boolean,
) => {
  const spec = getStage(level);
  const [skinMain, skinLight, skinDark] = SKIN_COLORS[skin] || SKIN_COLORS.none;
  const isRegal = spec.isRegal;
  const bodyMain = isRegal ? spec.colorDefault : skinMain;
  const bodyLight = isRegal ? spec.colorLight : skinLight;
  const bodyDark = isRegal ? spec.colorDark : skinDark;

  const { by, sx, sy, wiggle, sway, tailWag, headTilt, idleVariant, scratchHand, flash, blink, eyeDartX } = state;
  const e = state.expr;
  const dp = e.pupilH;

  const bright = night ? 0.55 + flash * 0.45 : 1 + flash * 2.5;

  r.clear('#020617');

  // Save canvas state for pet transform
  const c = ctx(r);
  c.save();
  c.translate(32, 56);
  c.scale(sx, sy);
  c.translate(-32, -56);
  c.translate(wiggle - sway, by);
  c.rotate(headTilt * 0.05);

  // ========== EGG ==========
  if (spec.stage === 'egg') {
    const eggGrad = rGrad(r, 28, 33, 4, 17, [[0,'#ffffff'],[0.4,'#f8fafc'],[0.8,'#e0e7ff'],[1,'#c7d2fe']]);
    c.fillStyle = eggGrad; c.beginPath(); c.ellipse(32, 40, 14, 17, 0, 0, Math.PI*2); c.fill();
    // Shine
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(27, 33, 4.5, 7, 0, 0, Math.PI*2); c.fill();
    // Shell dots
    c.fillStyle = '#e2e8f0'; c.fillRect(25, 31, 3, 2); c.fillRect(34, 36, 4, 2); c.fillRect(27, 45, 5, 2);
    // Glow
    const glowGrad = rGrad(r, 32, 40, 12, 22, [[0,'rgba(129,140,248,0.15)'],[1,'transparent']]);
    c.fillStyle = glowGrad; c.beginPath(); c.ellipse(32, 40, 18, 22, 0, 0, Math.PI*2); c.fill();
    c.restore(); return;
  }

  // ========== BODY ==========
  const bx = 32, by2 = 22;

  // Body gradient (top-light, bottom-dark for 3D sphere feel)
  const bodyGrad = vGrad(r, 0, by2-4, 0, by2+spec.bodyH+4, [
    [0, bodyLight], [0.25, bodyMain], [0.7, bodyMain], [1, bodyDark]
  ]);

  // Main body shape — ellipse for organic feel
  c.fillStyle = bodyGrad;
  c.beginPath();
  c.ellipse(bx, by2 + spec.bodyH/2, spec.bodyW/2, spec.bodyH/2, 0, 0, Math.PI*2);
  c.fill();

  // Body highlight (top-left shine)
  const hlGrad = rGrad(r, bx - spec.bodyW*0.15, by2 + spec.bodyH*0.2, 2, spec.bodyW*0.4, [
    [0, 'rgba(255,255,255,0.2)'], [1, 'transparent']
  ]);
  c.fillStyle = hlGrad;
  c.beginPath();
  c.ellipse(bx - spec.bodyW*0.1, by2 + spec.bodyH*0.25, spec.bodyW*0.25, spec.bodyH*0.3, -0.3, 0, Math.PI*2);
  c.fill();

  // Belly patch (lighter oval on front)
  c.fillStyle = 'rgba(255,255,255,0.06)';
  c.beginPath();
  c.ellipse(bx, by2 + spec.bodyH*0.55, spec.bellyW/2, spec.bellyH/2, 0, 0, Math.PI*2);
  c.fill();

  // ========== STAGE MARKINGS ==========
  if (spec.hasWisdom) {
    c.fillStyle = bodyDark; c.globalAlpha = 0.25;
    c.fillRect(bx - 9, by2 + 3, 18, 1.5);
    c.fillRect(bx - 7, by2 + 5.5, 14, 1);
    c.fillRect(bx - 8, by2 + 8, 16, 1);
    c.globalAlpha = 1;
  }
  if (isRegal) {
    // Small star on body
    c.fillStyle = '#facc15'; c.globalAlpha = 0.6;
    c.fillRect(bx + spec.bodyW*0.35, by2 + 2, 5, 5);
    c.globalAlpha = 1;
  }
  // Stage-specific: heart for companion
  if (spec.stage === 'companion') {
    c.fillStyle = '#f472b6'; c.globalAlpha = 0.25;
    c.fillRect(bx + 2, by2 + spec.bodyH*0.5, 3, 3);
    c.globalAlpha = 1;
  }

  // ========== LEGS ==========
  if (spec.hasLegs) {
    const footY = by2 + spec.bodyH - 2;
    const legW = spec.legJoints >= 2 ? 5 : 7;
    const legH = spec.legLen;

    // Left leg
    const lLegGrad = vGrad(r, 0, footY, 0, footY+legH, [[0,bodyDark],[0.5,bodyMain],[1,bodyDark]]);
    c.fillStyle = lLegGrad;
    r.r(bx - spec.bodyW/2 + 6, footY, legW, legH, '', 2);
    c.fillStyle = lLegGrad; c.fillRect(bx - spec.bodyW/2 + 6, footY, legW, legH);
    // Foot
    c.fillStyle = bodyDark;
    r.r(bx - spec.bodyW/2 + 5, footY + legH - 2, legW + 4, 5, '', 1.5);
    c.fillStyle = bodyDark; c.fillRect(bx - spec.bodyW/2 + 5, footY + legH - 2, legW + 4, 5);
    if (spec.legJoints >= 2) {
      // Knee highlight
      c.fillStyle = bodyLight;
      c.fillRect(bx - spec.bodyW/2 + 7, footY + legH*0.4, legW-2, 2);
    }

    // Right leg
    const rLegX = bx + spec.bodyW/2 - 6 - legW;
    c.fillStyle = lLegGrad; c.fillRect(rLegX, footY, legW, legH);
    c.fillStyle = bodyDark; c.fillRect(rLegX - 1, footY + legH - 2, legW + 4, 5);
    if (spec.legJoints >= 2) {
      c.fillStyle = bodyLight;
      c.fillRect(rLegX + 1, footY + legH*0.4, legW-2, 2);
    }
  }

  // ========== TAIL ==========
  if ((spec.stage as string) !== 'hatchling') {
    c.save();
    c.translate(5, 38);
    c.rotate(0.3 + tailWag * 0.5);
    const tailLen = isRegal ? 18 : spec.hasWisdom ? 14 : spec.hasCrest ? 10 : 7;
    // Tail body
    c.fillStyle = bodyDark;
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(3, tailLen*0.4, 0, tailLen);
    c.lineWidth = 5; c.strokeStyle = bodyDark; c.stroke();
    // Tail tip
    c.fillStyle = bodyLight;
    c.beginPath(); c.arc(0, tailLen, isRegal ? 4 : 3, 0, Math.PI*2); c.fill();
    c.restore();
  }

  // ========== ARMS ==========
  if (spec.hasArms) {
    const armY = by2 + 6;
    const armLen = spec.armLen;

    const drawArm = (lx: number, flip: boolean) => {
      c.save();
      c.translate(lx, armY);
      const angle = flip ? 0.3 : -0.3;
      c.rotate(angle + (scratchHand && flip ? -0.5 : 0));

      // Upper arm
      const armGrad = vGrad(r, 0, 0, 0, armLen, [[0,bodyLight],[0.5,bodyMain],[1,bodyDark]]);
      c.fillStyle = armGrad;
      const aw = 4;
      c.fillRect(-aw/2, 0, aw, armLen);

      // Joint (elbow)
      if (spec.armJoints >= 2) {
        c.fillStyle = bodyDark;
        c.beginPath(); c.arc(0, armLen, 2.5, 0, Math.PI*2); c.fill();

        // Lower arm
        c.fillStyle = bodyDark;
        c.fillRect(-3, armLen, 3, armLen*0.6);

        // Hand
        if (spec.hasHands) {
          const handY = armLen + armLen*0.6;
          c.fillStyle = bodyLight;
          c.beginPath(); c.arc(0, handY + 3, 3.5, 0, Math.PI*2); c.fill();
          if (spec.hasFingers) {
            c.fillStyle = bodyLight;
            if (flip) { c.fillRect(2, handY+1, 2, 4); c.fillRect(-4, handY+1, 2, 3); }
            else { c.fillRect(-4, handY+1, 2, 4); c.fillRect(2, handY+1, 2, 3); }
          }
        }
      }
      c.restore();
    };

    drawArm(bx - spec.bodyW/2 + 4, false); // left
    drawArm(bx + spec.bodyW/2 - 4, true);  // right
  }

  // ========== HEAD ==========
  const headR = spec.headR * 22;
  const headCX = 32;
  const headCY = by2 - headR*0.3;

  // Head gradient (top-light for 3D ball)
  const headGrad = rGrad(r, headCX-headR*0.2, headCY-headR*0.3, headR*0.1, headR*1.1, [
    [0, bodyLight], [0.5, bodyMain], [1, bodyDark]
  ]);
  c.fillStyle = headGrad;
  c.beginPath(); c.arc(headCX, headCY, headR, 0, Math.PI*2); c.fill();

  // Head highlight
  c.fillStyle = 'rgba(255,255,255,0.15)';
  c.beginPath(); c.arc(headCX - headR*0.2, headCY - headR*0.25, headR*0.4, 0, Math.PI*2); c.fill();

  // ========== SNOUT ==========
  if (spec.snoutSize > 0) {
    c.fillStyle = '#f8fafc';
    c.beginPath();
    c.ellipse(headCX, headCY + headR*0.3, spec.snoutSize, spec.snoutSize*0.7, 0, 0, Math.PI*2);
    c.fill();
    // Nostrils
    if (spec.snoutSize >= 4) {
      c.fillStyle = '#334155';
      c.fillRect(headCX - 2, headCY + headR*0.3 - 1, 1.5, 1.5);
      c.fillRect(headCX + 1, headCY + headR*0.3 - 1, 1.5, 1.5);
    }
  }

  // ========== CREST ==========
  if (spec.hasCrest) {
    const crestColor = isRegal ? '#06b6d4' : '#fbbf24';
    const crestLight = isRegal ? '#22d3ee' : '#f59e0b';
    c.fillStyle = crestColor;
    c.fillRect(headCX - 5, headCY - headR*1.1, 10, 14);
    c.fillStyle = crestLight;
    c.fillRect(headCX - 3, headCY - headR*1.3, 6, 5);
    // Crest tip shine
    c.fillStyle = '#fef3c7';
    c.fillRect(headCX - 1.5, headCY - headR*1.25, 3, 3);
  }

  // ========== FACE ==========
  const faceCY = headCY - headR*0.1;

  // Eyebrows
  if ((spec.stage as string) !== 'egg') {
    const browY = faceCY - headR*0.4 + e.browY;
    const browW = spec.stage === 'hatchling' ? 6 : 8;
    c.fillStyle = bodyDark;
    const bxOff = e.browAngle * 0.1;
    c.save(); c.translate(headCX - 12, browY); c.rotate(bxOff * 0.02);
    c.fillRect(0, 0, browW, 2.5);
    c.restore();
    c.save(); c.translate(headCX + 12 - browW, browY); c.rotate(-bxOff * 0.02);
    c.fillRect(0, 0, browW, 2.5);
    c.restore();
  }

  // Eyes
  const eyeY = faceCY - 2 + e.eyeY - 31;
  const eyeH = e.eyeH * (1 - blink * 0.95);
  const eyeW = spec.stage === 'hatchling' ? 11 : 9;
  const eyeGap = spec.stage === 'hatchling' ? 10 : 12;

  const drawEye = (cx: number, flip: boolean) => {
    if (e.eyeH <= 2.5) {
      // Sleepy line eyes
      c.fillStyle = '#1e1b4b';
      c.fillRect(cx - 4, eyeY + 3, 8, e.eyeH);
    } else {
      // Eye white
      c.fillStyle = '#ffffff';
      c.fillRect(cx - eyeW/2, eyeY, eyeW, eyeH);

      // Squint overlay (top eyelid covers part of eye)
      if (e.squint > 0.1) {
        c.fillStyle = bodyMain;
        const sqH = Math.round(e.squint * 4);
        c.fillRect(cx - eyeW/2, eyeY, eyeW, sqH);
      }

      // Iris + pupil
      if (blink < 0.6) {
        const irisR = dp * 2.5;
        // Iris
        c.fillStyle = '#1e1b4b';
        const px = cx + eyeDartX * 0.5;
        c.beginPath(); c.arc(px, eyeY + eyeH*0.5, irisR, 0, Math.PI*2); c.fill();
        // Catch light
        c.fillStyle = '#ffffff';
        c.fillRect(px - 1, eyeY + eyeH*0.3, 2, 2);
      }
    }
  };

  drawEye(headCX - eyeGap/2, false);
  drawEye(headCX + eyeGap/2, true);

  // Blush
  if ((spec.stage as string) !== 'egg') {
    c.fillStyle = skin === 'inferno' ? '#fca5a5' : '#f472b6';
    c.globalAlpha = e.blushA;
    c.fillRect(headCX - eyeGap/2 - eyeW/2 - 3, eyeY + eyeH + 2, 5, 3);
    c.fillRect(headCX + eyeGap/2 + eyeW/2 - 2, eyeY + eyeH + 2, 5, 3);
    c.globalAlpha = 1;
  }

  // ========== MOUTH ==========
  const mw = e.mouthW, mh = e.mouthH, my = e.mouthY, mc = e.mouthCurve;
  const mouthX = headCX - mw/2;

  c.fillStyle = '#1e1b4b';
  if (mc > 0.5) {
    // Smile — curved arc
    c.fillRect(mouthX, my, mw, mh);
    c.fillRect(mouthX - 1.5, my - 1.5, 2, 2.5);
    c.fillRect(mouthX + mw - 0.5, my - 1.5, 2, 2.5);
  } else if (mc < -0.5) {
    // Frown
    c.fillRect(mouthX, my, mw, mh);
  } else if (mh > 4) {
    // Open mouth
    c.fillRect(mouthX, my, mw, mh);
    c.fillStyle = '#ef4444';
    c.fillRect(mouthX + 2, my + Math.round(mh*0.5), mw - 4, Math.round(mh*0.4));
  } else {
    // Neutral
    c.fillRect(mouthX, my, mw, mh);
  }

  // ========== SKIN ACCESSORIES ==========
  if (skin === 'wizard') {
    // Wizard hat
    c.fillStyle = '#7e22ce';
    c.beginPath(); c.moveTo(headCX, headCY - headR - 12);
    c.lineTo(headCX - 16, headCY - headR + 2);
    c.lineTo(headCX + 16, headCY - headR + 2);
    c.fill();
    c.fillStyle = '#6b21a8';
    c.fillRect(headCX - 18, headCY - headR, 36, 5);
    // Star on hat
    c.fillStyle = '#facc15';
    c.fillRect(headCX - 4, headCY - headR - 8, 8, 8);
  }
  if (skin === 'ninja') {
    c.fillStyle = '#dc2626';
    c.fillRect(headCX - 19, faceCY - headR*0.5, 38, 4);
    // Headband tails
    c.fillRect(headCX - 26 + Math.sin(state.by*2)*1, faceCY - headR*0.5 + 1, 7, 2);
  }
  if (skin === 'astronaut') {
    c.strokeStyle = '#7dd3fc'; c.lineWidth = 1;
    c.globalAlpha = 0.3;
    c.beginPath(); c.arc(headCX, headCY, headR + 6, 0, Math.PI*2); c.stroke();
    c.globalAlpha = 1;
  }

  // ========== AURA (Guardian+) ==========
  if (spec.hasAura) {
    c.strokeStyle = isRegal ? 'rgba(6,182,212,0.5)' : 'rgba(129,140,248,0.35)';
    c.lineWidth = 1;
    c.setLineDash([5, 5]);
    c.beginPath(); c.ellipse(32, 32, 28, 12, 0, 0, Math.PI*2); c.stroke();
    c.beginPath(); c.ellipse(32, 32, 12, 28, 0, 0, Math.PI*2); c.stroke();
    c.setLineDash([]);
  }

  c.restore();
};
