import { useEffect, useRef, useState } from 'react';
import type { PetSkin } from '../game/evolution';

type Props = { anim: string; skin: PetSkin; hasHands: boolean; by: number; sway: number; };

const skinAccent = (skin: PetSkin, fb: string, alt?: string) => {
  if (skin === 'inferno') return alt || '#ef4444'; if (skin === 'ocean') return '#3b82f6';
  if (skin === 'forest') return '#22c55e'; if (skin === 'aurora') return '#06b6d4'; return fb;
};

/** Food that shrinks as pet "eats" it + crumbs fly off */
const EatingProp = ({ skin, by }: { skin: PetSkin; by: number }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 120); return () => clearInterval(i); }, []);
  const bite = Math.max(0.25, 1 - Math.min(1, tick / 14));
  const crumb1 = tick > 4 ? (tick - 4) * 0.8 : 0;
  const crumb2 = tick > 7 ? (tick - 7) * 0.6 : 0;
  if (tick > 20) return null;
  return (
    <g style={{ transform: `translate(22px, ${36 + by}px)` }}>
      <rect x={3 * (1 - bite)} y={3 * (1 - bite)} width={7 * bite} height={7 * bite} fill={skinAccent(skin, '#f59e0b')} rx="1" />
      <rect x={3 * (1 - bite) + 1} y={3 * (1 - bite) + 1} width={3 * bite} height={3 * bite} fill="#fef3c7" rx="0.5" />
      {crumb1 > 0 && <rect x={12 + crumb1} y={38 - crumb1} width="2" height="2" fill="#f59e0b" opacity={1 - crumb1 * 0.1} rx="0.5" />}
      {crumb2 > 0 && <rect x={15 + crumb2 * 0.5} y={36 - crumb2 * 0.7} width="1.5" height="1.5" fill="#fef3c7" opacity={1 - crumb2 * 0.08} rx="0.5" />}
    </g>
  );
};

/** Toy that bounces with squash/stretch */
const PlayingProp = ({ skin, by }: { skin: PetSkin; by: number }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => (t + 1) % 60), 60); return () => clearInterval(i); }, []);
  const phase = tick / 60;
  const bounce = phase < 0.12 ? phase / 0.12 * 5 : phase < 0.5 ? 5 * (1 - (phase - 0.12) / 0.38) : 0;
  const squash = 1 - bounce * 0.06;
  return (
    <g style={{ transform: `translate(44px, ${30 + by - bounce}px)` }}>
      <rect x="0" y="0" width="12" height={12 * squash} fill={skinAccent(skin, '#fbbf24')} rx="1" />
      <rect x="1.5" y="1.5" width="4" height="4" fill={skinAccent(skin, '#f59e0b', '#dc2626')} />
      <rect x="6.5" y="1.5" width="4" height="4" fill="#fef3c7" />
      <rect x="3" y={bounce > 2 ? 0 : 2} width="6" height="2" fill="#fef3c7" opacity="0.5" rx="0.5" />
    </g>
  );
};

/** Book with page flip */
const LearningProp = ({ skin, by }: { skin: PetSkin; by: number }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => (t + 1) % 40), 150); return () => clearInterval(i); }, []);
  const flip = tick < 20;
  return (
    <g style={{ transform: `translate(12px, ${28 + by}px)` }}>
      <rect x="0" y="0" width="14" height="11" fill={skinAccent(skin, '#c084fc')} rx="1" />
      <rect x="1" y="1" width="5.5" height="9" fill="#fef3c7" />
      <rect x="7.5" y="1" width={flip ? 5.5 : 2.5} height="9" fill={flip ? '#fef3c7' : '#e2e8f0'} />
      <rect x="2" y="3" width="3" height="1.5" fill={skinAccent(skin, '#a78bfa')} />
      <rect x="8.5" y="2.5" width="3" height="1.5" fill={skinAccent(skin, '#a78bfa')} />
      <rect x="8.5" y="5.5" width="3" height="1.5" fill={skinAccent(skin, '#a78bfa')} />
    </g>
  );
};

/** Bubbles that grow, wobble, pop */
const CleaningProp = ({ by }: { by: number }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => (t + 1) % 100), 80); return () => clearInterval(i); }, []);
  const bubbles = [0, 1, 2, 3, 4].map(i => {
    const phase = ((tick * (1 + i * 0.3)) % 60) / 60;
    const grow = phase < 0.7 ? phase / 0.7 : 1 - (phase - 0.7) / 0.3;
    const wobX = Math.sin(tick * 0.15 + i) * 2;
    return { grow: Math.max(0, grow), wobX, size: 3.5 + i * 1.5 };
  });
  return (
    <g style={{ transform: `translate(26px, ${24 + by}px)` }}>
      {bubbles.map((b, i) => b.grow > 0 && (
        <g key={i}>
          <circle cx={i * 3.5 + b.wobX} cy={i * 2.5} r={b.size * b.grow} fill="#bae6fd" opacity={0.45 * b.grow} />
          <circle cx={i * 3.5 + b.wobX + b.size * 0.3} cy={i * 2.5 - b.size * 0.3} r={b.size * 0.25} fill="white" opacity={0.25 * b.grow} />
          {b.grow < 0.2 && b.grow > 0 && <circle cx={i * 3.5} cy={i * 2.5} r={b.size * 1.5} fill="white" opacity={0.15} />}
        </g>
      ))}
    </g>
  );
};

/** Thought bubbles with changing icons */
const DaydreamProp = ({ skin, by, sway }: { skin: PetSkin; by: number; sway: number }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => (t + 1) % 100), 100); return () => clearInterval(i); }, []);
  const icons = ['💭', '✨', '🌈', '⭐', '🌙', '🎵'];
  const iconIdx = Math.floor(tick / 25) % icons.length;
  const accent = skinAccent(skin, '#c084fc');
  return (
    <g style={{ transform: `translate(44px, ${14 + by + sway}px)` }}>
      <circle cx="0" cy="0" r="5" fill={accent} opacity="0.35" />
      <circle cx="8" cy="-7" r="4" fill={accent} opacity="0.22" />
      <circle cx="15" cy="-14" r="3" fill={accent} opacity="0.15" />
      <text x="-3" y="2" fontSize="5" fill={accent} fontFamily="monospace">{icons[iconIdx]}</text>
    </g>
  );
};

export const PropsRenderer = ({ anim, skin, hasHands, by, sway }: Props) => (
  <>
    {anim === 'eating' && <EatingProp skin={skin} by={by} />}
    {anim === 'playing' && hasHands && <PlayingProp skin={skin} by={by} />}
    {anim === 'learning' && hasHands && <LearningProp skin={skin} by={by} />}
    {anim === 'cleaning' && <CleaningProp by={by} />}
    {anim === 'daydreaming' && <DaydreamProp skin={skin} by={by} sway={sway} />}
    {anim === 'excited' && hasHands && (
      <g style={{ transform: `translate(42px, ${26 + by}px)` }}>
        {skin === 'wizard' ? (
          <>
            <rect x="0" y="-18" width="2.5" height="20" fill="#854d0e" />
            <rect x="-3" y="-22" width="8" height="8" fill="#facc15" rx="1" />
            <rect x="-1" y="-20" width="4" height="4" fill="#fef3c7" />
          </>
        ) : (
          <>
            <rect x="2" y="0" width="5" height="14" fill="#cbd5e1" rx="1" />
            <rect x="0" y="0" width="9" height="3" fill="#334155" rx="0.5" />
            <rect x="0" y="10.5" width="9" height="3" fill="#334155" rx="0.5" />
          </>
        )}
      </g>
    )}
  </>
);
