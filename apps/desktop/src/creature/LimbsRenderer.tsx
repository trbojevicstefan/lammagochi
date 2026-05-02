import { useEffect, useRef, useState } from 'react';

/**
 * Joint-based limbs renderer with 10 animation types.
 * Arms: shoulder→elbow→hand. Legs: hip→knee→foot.
 * Pixel-art style with proper pivots and level-gated development.
 */

type LimbAnim = 'idle'|'wave'|'point'|'clap'|'stretch'|'scratch'|'tummy'|'dance'|'walk'|'sit'|'jump';
type EmotionId = string;

type Props = {
  level: number;
  anim: LimbAnim;
  emotion: EmotionId;
  bodyW: number; bodyH: number;
  bodyMain: string; bodyLight: string; bodyDark: string;
};

// Limb development by level
const limbStage = (lvl: number) => ({
  hasLegs: lvl >= 4,
  hasArms: lvl >= 12,
  hasHands: lvl >= 16,
  hasFingers: lvl >= 21,
  legLen: lvl >= 21 ? 14 : lvl >= 16 ? 12 : lvl >= 8 ? 10 : 7,
  armLen: lvl >= 21 ? 12 : lvl >= 16 ? 10 : lvl >= 14 ? 8 : 6,
  footW: lvl >= 21 ? 8 : lvl >= 16 ? 7 : 6,
  handSize: lvl >= 21 ? 6 : 5,
});

const animAngles: Record<LimbAnim, { lArm:number; rArm:number; lLeg:number; rLeg:number; handOpen:number }> = {
  idle:    { lArm:-20, rArm:-20, lLeg:0, rLeg:0, handOpen:0.3 },
  wave:    { lArm:120, rArm:-15, lLeg:0, rLeg:0, handOpen:1 },
  point:   { lArm:-10, rArm:80, lLeg:0, rLeg:0, handOpen:0.8 },
  clap:    { lArm:40, rArm:40, lLeg:0, rLeg:0, handOpen:1 },
  stretch: { lArm:160, rArm:160, lLeg:5, rLeg:5, handOpen:0 },
  scratch: { lArm:130, rArm:-20, lLeg:0, rLeg:0, handOpen:0.5 },
  tummy:   { lArm:50, rArm:50, lLeg:0, rLeg:0, handOpen:0.8 },
  dance:   { lArm:100, rArm:-30, lLeg:10, rLeg:-10, handOpen:1 },
  walk:    { lArm:-40, rArm:40, lLeg:15, rLeg:-15, handOpen:0.5 },
  sit:     { lArm:-30, rArm:-30, lLeg:90, rLeg:90, handOpen:0 },
  jump:    { lArm:140, rArm:140, lLeg:-15, rLeg:-15, handOpen:1 },
};

export const LimbsRenderer = ({ level, anim, emotion, bodyW, bodyH, bodyMain, bodyLight, bodyDark }: Props) => {
  const ls = limbStage(level);
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => (t + 1) % 60), 50); return () => clearInterval(i); }, []);

  const phase = tick / 60;
  const angles = animAngles[anim] || animAngles.idle;
  const sway = anim === 'walk' ? Math.sin(phase * Math.PI * 4) : anim === 'dance' ? Math.sin(phase * Math.PI * 2) : 0;
  const bounce = anim === 'jump' ? Math.abs(Math.sin(phase * Math.PI * 2)) * 5 : 0;
  const squash = anim === 'jump' ? 1 - bounce * 0.03 : 1;

  if (!ls.hasLegs && !ls.hasArms) return null;

  const bodyCX = 32;
  const bodyCY = 22;
  const bodyBottom = bodyCY + bodyH;

  return (
    <g>
      {/* ===== LEGS ===== */}
      {ls.hasLegs && (
        <>
          {/* Left leg */}
          <g transform={`translate(${bodyCX - 8}, ${bodyBottom - 2})`}>
            <g transform={`rotate(${-angles.lLeg + sway * 15})`} style={{ transformOrigin: '0px 0px' }}>
              {/* Thigh */}
              <rect x="-3" y="0" width="6" height={ls.legLen * 0.5} fill={bodyDark} rx="2" />
              {/* Calf */}
              <rect x="-2.5" y={ls.legLen * 0.5} width="5" height={ls.legLen * 0.5} fill={bodyLight} rx="2" />
              {/* Foot */}
              <rect x={-ls.footW / 2} y={ls.legLen - 2} width={ls.footW} height="4" fill={bodyDark} rx="1" />
              {ls.hasFingers && <rect x={-ls.footW / 2 + 1} y={ls.legLen + 1} width="2" height="2" fill={bodyLight} rx="0.5" />}
            </g>
          </g>
          {/* Right leg */}
          <g transform={`translate(${bodyCX + 8}, ${bodyBottom - 2})`}>
            <g transform={`rotate(${angles.rLeg + sway * 15})`} style={{ transformOrigin: '0px 0px' }}>
              <rect x="-3" y="0" width="6" height={ls.legLen * 0.5} fill={bodyDark} rx="2" />
              <rect x="-2.5" y={ls.legLen * 0.5} width="5" height={ls.legLen * 0.5} fill={bodyLight} rx="2" />
              <rect x={-ls.footW / 2} y={ls.legLen - 2} width={ls.footW} height="4" fill={bodyDark} rx="1" />
              {ls.hasFingers && <rect x={-ls.footW / 2 + ls.footW - 3} y={ls.legLen + 1} width="2" height="2" fill={bodyLight} rx="0.5" />}
            </g>
          </g>
        </>
      )}

      {/* ===== ARMS ===== */}
      {ls.hasArms && (
        <>
          {/* Left arm */}
          <g transform={`translate(${bodyCX - bodyW / 2 + 2}, ${bodyCY + 6 - bounce})`}>
            <g transform={`rotate(${-angles.lArm})`} style={{ transformOrigin: '0px 0px' }}>
              <rect x="-2.5" y="0" width="5" height={ls.armLen * 0.5} fill={bodyLight} rx="2" />
              <rect x="-2" y={ls.armLen * 0.5} width="4" height={ls.armLen * 0.5} fill={bodyDark} rx="1.5" />
              {ls.hasHands && (
                <g transform={`translate(0, ${ls.armLen})`}>
                  <rect x={-ls.handSize / 2} y="0" width={ls.handSize} height={ls.handSize} fill={bodyLight} rx="2" />
                  {ls.hasFingers && angles.handOpen > 0.5 && (
                    <>
                      <rect x={-ls.handSize / 2 - 1.5} y="2" width="2" height="3" fill={bodyLight} rx="0.5" />
                      <rect x={ls.handSize / 2 - 0.5} y="2" width="2" height="3" fill={bodyLight} rx="0.5" />
                    </>
                  )}
                </g>
              )}
            </g>
          </g>
          {/* Right arm */}
          <g transform={`translate(${bodyCX + bodyW / 2 - 2}, ${bodyCY + 6 - bounce})`}>
            <g transform={`rotate(${angles.rArm})`} style={{ transformOrigin: '0px 0px' }}>
              <rect x="-2.5" y="0" width="5" height={ls.armLen * 0.5} fill={bodyLight} rx="2" />
              <rect x="-2" y={ls.armLen * 0.5} width="4" height={ls.armLen * 0.5} fill={bodyDark} rx="1.5" />
              {ls.hasHands && (
                <g transform={`translate(0, ${ls.armLen})`}>
                  <rect x={-ls.handSize / 2} y="0" width={ls.handSize} height={ls.handSize} fill={bodyLight} rx="2" />
                  {ls.hasFingers && angles.handOpen > 0.5 && (
                    <>
                      <rect x={-ls.handSize / 2 - 1.5} y="2" width="2" height="3" fill={bodyLight} rx="0.5" />
                      <rect x={ls.handSize / 2 - 0.5} y="2" width="2" height="3" fill={bodyLight} rx="0.5" />
                    </>
                  )}
                </g>
              )}
            </g>
          </g>
        </>
      )}
    </g>
  );
};
