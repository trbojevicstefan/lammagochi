import { useEffect, useRef, useState, useCallback } from 'react';
import type { CreatureMood } from '../game/creatureBehavior';

/* ================================================================
   PixelPet v2 — Production-quality 60fps pixel-art creature
   Hatchling 16-bit Retro-Future Arcade design language
   Palette: Indigo-900 primary, Cyan-400 energy, Orange-500 satiety, Pink-500 mood
   ================================================================ */

type PetAnim = 'idle'|'happy'|'sleepy'|'eating'|'cleaning'|'playing'|'learning'|'daydreaming'|'excited'|'evolving'|'craving';
type PetCostume = 'none' | 'wizard' | 'ninja' | 'astronaut';

type Props = {
  level: number;
  mood: CreatureMood;
  dayPhase: 'morning' | 'day' | 'evening' | 'night';
  isStreaming?: boolean;
  interactionSpark?: number;
  costume?: PetCostume;
  actionAnimation?: string | null;
};

const moodToAnim: Record<CreatureMood, PetAnim> = {
  calm: 'idle', hungry: 'craving', sleepy: 'sleepy', curious: 'excited', dirty: 'craving',
};

const stage = (lvl: number) => ({
  isEgg: lvl <= 1, isInfant: lvl >= 2 && lvl <= 5, isToddler: lvl >= 6 && lvl <= 10,
  isLearner: lvl >= 11 && lvl <= 18, isCompanion: lvl >= 19 && lvl <= 30, isSage: lvl >= 31,
  hasFeet: lvl >= 4, hasCrest: lvl >= 7, hasHands: lvl >= 12, hasWisdom: lvl >= 20, hasAura: lvl >= 25,
});

// Smooth easing
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(t, 1);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const PixelPet = ({ level, mood, dayPhase, isStreaming, interactionSpark = 0, costume = 'none', actionAnimation }: Props) => {
  // Smooth animation state — lerp toward target
  const animRef = useRef({ bx: 0, by: 0, sx: 1, sy: 1, wiggle: 0, sway: 0, flash: 0, evolvePulse: 0 });
  const targetRef = useRef({ bx: 0, by: 0, sx: 1, sy: 1, wiggle: 0, sway: 0, flash: 0 });
  const [renderTick, setRender] = useState(0);
  const frameRef = useRef(0);
  const rafRef = useRef(0);
  const lastSpark = useRef(0);
  const animStartRef = useRef(0);
  const prevAnimRef = useRef<PetAnim>('idle');
  const flashTimeout = useRef<ReturnType<typeof setTimeout>>();

  const st = stage(level);
  const resolvedAnim: PetAnim = (actionAnimation as PetAnim) || moodToAnim[mood];
  const isNight = dayPhase === 'night';

  // Detect animation change for smooth transitions
  useEffect(() => {
    if (resolvedAnim !== prevAnimRef.current) {
      animStartRef.current = performance.now();
      prevAnimRef.current = resolvedAnim;
    }
  }, [resolvedAnim]);

  // 60fps game loop with delta-time smoothing
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // cap delta
      last = now;
      frameRef.current += dt;

      const t = frameRef.current;
      const anim = resolvedAnim;
      const elapsed = (now - animStartRef.current) / 1000;
      const blend = easeOut(Math.min(elapsed / 0.3, 1)); // 300ms blend into new animation

      // Compute target animation values
      const tg = { bx: 0, by: 0, sx: 1, sy: 1, wiggle: 0, sway: 0, flash: 0 };

      // Breathing (base idle)
      const breatheSpeed = st.isEgg ? 1.5 : st.isSage ? 0.4 : 0.7;
      tg.by = Math.sin(t * breatheSpeed * Math.PI * 2) * (st.isEgg ? 2 : 3);
      tg.sx = 1 + Math.cos(t * breatheSpeed * Math.PI * 2) * 0.015;
      tg.sy = 1 - Math.sin(t * breatheSpeed * Math.PI * 2) * 0.025;

      // Animation-specific overrides
      if (anim === 'excited' || anim === 'playing') {
        const bounce = Math.abs(Math.sin(t * 3.5)) * 12;
        tg.by = -bounce;
        tg.sy = 1 + bounce / 25;
        tg.sx = 1 - bounce / 35;
      }
      if (anim === 'happy') {
        tg.wiggle = Math.sin(t * 4) * 2.5;
        tg.sy = 1 + Math.sin(t * 4) * 0.02;
      }
      if (anim === 'sleepy' || anim === 'daydreaming') {
        tg.sway = Math.sin(t * 1.4) * 2.5;
        tg.sy = 1 - 0.03;
      }
      if (anim === 'craving') {
        tg.wiggle = Math.sin(t * 6) * 1.5;
        tg.by = Math.sin(t * 8) * 1.5;
      }
      if (anim === 'evolving') {
        tg.sx = 1 + Math.sin(t * 3) * 0.06;
        tg.sy = 1 + Math.sin(t * 3) * 0.06;
        tg.flash = 0.5 + Math.sin(t * 5) * 0.5;
      }

      // Blend into target
      const cur = animRef.current;
      cur.bx = lerp(cur.bx, tg.bx, 0.25);
      cur.by = lerp(cur.by, tg.by, 0.25);
      cur.sx = lerp(cur.sx, tg.sx, 0.25);
      cur.sy = lerp(cur.sy, tg.sy, 0.25);
      cur.wiggle = lerp(cur.wiggle, tg.wiggle, 0.2);
      cur.sway = lerp(cur.sway, tg.sway, 0.2);
      cur.flash = lerp(cur.flash, tg.flash, 0.15);

      setRender(Math.floor(frameRef.current * 20) % 10000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [resolvedAnim, level]);

  // Interaction spark
  useEffect(() => {
    if (interactionSpark > 0 && interactionSpark !== lastSpark.current) {
      lastSpark.current = interactionSpark;
      animRef.current.flash = 1;
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
      flashTimeout.current = setTimeout(() => { animRef.current.flash = 0; }, 400);
    }
  }, [interactionSpark]);

  const { bx, by, sx, sy, wiggle, sway, flash } = animRef.current;
  const evolveGlow = resolvedAnim === 'evolving' ? animRef.current.flash : 0;
  const brightness = isNight ? 0.55 + flash * 0.45 : 1 + flash * 3;
  const contrast = resolvedAnim === 'evolving' ? 1.3 + evolveGlow * 0.5 : flash > 0.1 ? 2 + flash * 3 : 1;

  /* ================================================================
     Hatchling Color Palette
     ================================================================ */
  const bodyMain = st.isSage ? '#312e81' : st.isCompanion ? '#4338ca' : st.isLearner ? '#4f46e5' : st.isToddler ? '#6366f1' : '#818cf8';
  const bodyLight = st.isSage ? '#4338ca' : st.isCompanion ? '#6366f1' : '#818cf8';
  const bodyDark = st.isSage ? '#1e1b4b' : st.isCompanion ? '#3730a3' : '#4f46e5';
  const crestColor = st.isSage ? '#06b6d4' : '#fbbf24';
  const crestLight = st.isSage ? '#22d3ee' : '#f59e0b';

  return (
    <div className="pixel-pet-wrapper" style={{
      filter: `brightness(${brightness}) contrast(${contrast}) drop-shadow(0 12px 20px rgba(0,0,0,0.4))`,
      transition: flash > 0.1 ? 'none' : 'filter 0.4s ease-out',
    }}>
      <div className="pixel-pet-shadow" style={{
        transform: `scaleX(${1 - by * 0.04}) translateX(${-sway * 0.3}px)`,
        opacity: (resolvedAnim === 'excited' || resolvedAnim === 'playing') ? 0.15 : 0.5 * (isNight ? 0.55 : 1),
      }} />

      <svg viewBox="0 0 64 64" className="pixel-pet-svg" shapeRendering="crispEdges">
        {/* Sage cosmic aura */}
        {st.hasAura && (
          <g style={{ transformOrigin: '32px 32px', animation: 'aura-spin 12s linear infinite' }}>
            <ellipse cx="32" cy="32" rx="28" ry="12" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="5 5" opacity="0.7" />
            <ellipse cx="32" cy="32" rx="12" ry="28" fill="none" stroke="#818cf8" strokeWidth="1" strokeDasharray="5 5" opacity="0.6" />
          </g>
        )}

        {/* Main sprite group — all transforms composed */}
        <g style={{ transform: `translate(32px,56px) scale(${sx},${sy}) translate(-32px,-56px) translateY(${by}px) translateX(${wiggle - sway}px)` }}>
          {/* === EGG === */}
          {st.isEgg && (
            <g>
              <ellipse cx="32" cy="40" rx="14" ry="17" fill="#f8fafc" />
              <ellipse cx="27" cy="33" rx="5" ry="7" fill="white" opacity="0.45" />
              <rect x="25" y="31" width="3" height="2" fill="#e2e8f0" rx="0.5" />
              <rect x="34" y="36" width="4" height="2" fill="#e2e8f0" rx="0.5" />
              <rect x="27" y="45" width="5" height="2" fill="#e2e8f0" rx="0.5" />
              <rect x="22" y="41" width="2" height="3" fill="#e2e8f0" rx="0.5" />
            </g>
          )}

          {/* === POST-EGG === */}
          {!st.isEgg && (
            <>
              {/* Ninja sword behind body */}
              {costume === 'ninja' && (
                <g>
                  <rect x="10" y="12" width="4" height="26" transform="rotate(-30 12 25)" fill="#cbd5e1" />
                  <rect x="8" y="34" width="8" height="4" transform="rotate(-30 12 25)" fill="#334155" />
                </g>
              )}

              {/* Crest / hair with secondary motion delay */}
              {st.hasCrest && (
                <g style={{ transform: `translateY(${Math.sin(frameRef.current * 1.7 + 1) * 2.5}px)` }}>
                  <rect x="27" y="13" width="10" height="12" fill={crestColor} rx="1" />
                  <rect x="29" y="9" width="6" height="4" fill={crestLight} rx="1" />
                  <rect x="30" y="10" width="3" height="2" fill="#fef3c7" />
                  {costume === 'wizard' && (
                    <g style={{ transform: 'translateY(-6px)' }}>
                      <polygon points="32,0 14,22 50,22" fill="#7e22ce" />
                      <rect x="6" y="22" width="52" height="4" rx="2" fill="#6b21a8" />
                      <rect x="27" y="8" width="10" height="7" fill="#facc15" rx="1" />
                    </g>
                  )}
                </g>
              )}

              {/* Feet */}
              {st.hasFeet && (
                <g>
                  <rect x="19" y="49" width="10" height="5" fill={bodyDark} rx="1" />
                  <rect x="35" y="49" width="10" height="5" fill={bodyDark} rx="1" />
                  <rect x="20" y="48" width="8" height="2" fill={bodyLight} />
                  <rect x="36" y="48" width="8" height="2" fill={bodyLight} />
                </g>
              )}

              {/* MAIN BODY */}
              <rect x="15" y="22" width="34" height="28" rx="7" fill={bodyMain} />
              <rect x="17" y="20" width="30" height="32" rx="7" fill={bodyMain} />
              {/* Body highlight (top shine) */}
              <rect x="17" y="22" width="26" height="5" rx="2" fill={bodyLight} opacity="0.7" />
              {/* Body shadow (left edge) */}
              <rect x="15" y="28" width="4" height="16" rx="1" fill={bodyDark} opacity="0.6" />

              {/* Ninja headband */}
              {costume === 'ninja' && (
                <g>
                  <rect x="13" y="26" width="38" height="4" fill="#dc2626" />
                  <rect x="6" y={26 + Math.sin(frameRef.current * 2) * 1} width="7" height="2" fill="#b91c1c" />
                  <rect x="4" y={28 + Math.cos(frameRef.current * 2) * 1} width="4" height="2" fill="#b91c1c" />
                </g>
              )}

              {/* Sage wisdom lines */}
              {st.hasWisdom && (
                <g opacity="0.35">
                  <rect x="23" y="24" width="18" height="1" fill={bodyDark} />
                  <rect x="25" y="26" width="14" height="1" fill={bodyDark} />
                  <rect x="24" y="28" width="16" height="1" fill={bodyDark} />
                </g>
              )}

              {/* Astronaut chest */}
              {costume === 'astronaut' && (
                <g>
                  <rect x="23" y="40" width="18" height="11" rx="2" fill="#f1f5f9" opacity="0.9" />
                  <rect x="25" y="42" width="3" height="3" fill="#ef4444" />
                  <rect x="30" y="42" width="8" height="3" fill="#3b82f6" />
                </g>
              )}

              {/* FACE GROUP */}
              <g style={{ transform: `translateY(${resolvedAnim === 'craving' ? 0.5 : 0}px)` }}>
                {/* Eyes */}
                {resolvedAnim === 'sleepy' || resolvedAnim === 'daydreaming' ? (
                  <>
                    <rect x="21" y="34" width="8" height="2" fill="#1e1b4b" rx="0.5" />
                    <rect x="35" y="34" width="8" height="2" fill="#1e1b4b" rx="0.5" />
                    {renderTick % 20 < 10 && resolvedAnim === 'sleepy' && (
                      <text x="45" y="22" fontSize="8" fill="#818cf8" fontFamily="monospace" fontWeight="bold">z</text>
                    )}
                    {renderTick % 20 >= 10 && resolvedAnim === 'sleepy' && (
                      <text x="50" y="16" fontSize="10" fill="#818cf8" fontFamily="monospace" fontWeight="bold">Z</text>
                    )}
                  </>
                ) : (
                  <>
                    <rect x="20" y="31" width="10" height="8" fill="white" rx="1" />
                    <rect x="34" y="31" width="10" height="8" fill="white" rx="1" />
                    {/* Pupils */}
                    <rect x="23" y="33" width="5" height="5" fill="#1e1b4b" />
                    <rect x="37" y="33" width="5" height="5" fill="#1e1b4b" />
                    {/* Catchlights */}
                    <rect x="24" y="33" width="2" height="2" fill="white" />
                    <rect x="38" y="33" width="2" height="2" fill="white" />
                    {/* Happy squint overlay */}
                    {(resolvedAnim === 'happy' || resolvedAnim === 'playing') && (
                      <>
                        <rect x="20" y="35" width="10" height="3" fill={bodyMain} />
                        <rect x="34" y="35" width="10" height="3" fill={bodyMain} />
                      </>
                    )}
                  </>
                )}

                {/* Blush */}
                {!st.isEgg && (
                  <g opacity={resolvedAnim === 'happy' || resolvedAnim === 'playing' ? 0.85 : resolvedAnim === 'excited' ? 0.6 : 0.25}>
                    <rect x="17" y="38" width="5" height="2" fill="#f472b6" rx="0.5" />
                    <rect x="42" y="38" width="5" height="2" fill="#f472b6" rx="0.5" />
                  </g>
                )}

                {/* Mouth */}
                {resolvedAnim === 'happy' || resolvedAnim === 'playing' ? (
                  <rect x="29" y="42" width="6" height="4" fill="#1e1b4b" rx="1" />
                ) : resolvedAnim === 'excited' ? (
                  <rect x="28" y="41" width="8" height="6" fill="#1e1b4b" rx="1" />
                ) : resolvedAnim === 'eating' ? (
                  <rect x="28" y="42" width="8" height="3" fill="#1e1b4b" rx="0.5" />
                ) : resolvedAnim === 'craving' ? (
                  <rect x="27" y="44" width="10" height="3" fill="#1e1b4b" rx="0.5" />
                ) : resolvedAnim === 'sleepy' || resolvedAnim === 'daydreaming' ? (
                  <rect x="29" y="44" width="6" height="1.5" fill="#1e1b4b" />
                ) : resolvedAnim === 'learning' ? (
                  <rect x="31" y="43" width="3" height="1.5" fill="#1e1b4b" />
                ) : (
                  <rect x="31" y="43" width="2.5" height="1.5" fill="#1e1b4b" />
                )}
              </g>

              {/* Hands (L12+) */}
              {st.hasHands && (
                <g>
                  <rect x="8" y={34 + (resolvedAnim === 'excited' || resolvedAnim === 'playing' ? -9 : 0)} width="8" height="8" rx="2"
                    fill={st.isSage ? '#6366f1' : costume === 'astronaut' ? '#f1f5f9' : bodyLight} />
                  <rect x="48" y={34 + (resolvedAnim === 'excited' || resolvedAnim === 'playing' ? -9 : 0)} width="8" height="8" rx="2"
                    fill={st.isSage ? '#6366f1' : costume === 'astronaut' ? '#f1f5f9' : bodyLight} />
                </g>
              )}

              {/* Astronaut helmet */}
              {costume === 'astronaut' && (
                <g>
                  <rect x="8" y="12" width="48" height="42" rx="20" fill="#7dd3fc" opacity="0.25" />
                  <rect x="12" y="16" width="14" height="7" rx="3" fill="white" opacity="0.35" />
                </g>
              )}
            </>
          )}
        </g>

        {/* === PROPS (rendered outside main transform group for independent positioning) === */}

        {/* Food prop (eating) */}
        {resolvedAnim === 'eating' && !st.isEgg && (
          <g style={{ transform: `translate(22px, ${36 + by}px)` }}>
            <rect x="0" y="0" width="11" height="11" fill="#f59e0b" rx="1" />
            <rect x="2" y="2" width="7" height="7" fill="#b45309" rx="1" />
            <rect x="4" y="4" width="3" height="3" fill="#fef3c7" />
          </g>
        )}

        {/* Toy block (playing) */}
        {resolvedAnim === 'playing' && st.hasHands && (
          <g style={{ transform: `translate(44px, ${30 + by}px)` }}>
            <rect x="0" y="0" width="11" height="11" fill="#fbbf24" rx="1" />
            <rect x="1" y="1" width="4" height="4" fill="#f59e0b" />
            <rect x="6" y="1" width="4" height="4" fill="#fef3c7" />
            <rect x="1" y="6" width="4" height="4" fill="#fde68a" />
            <rect x="6" y="6" width="4" height="4" fill="#f59e0b" />
          </g>
        )}

        {/* Book (learning) */}
        {resolvedAnim === 'learning' && st.hasHands && (
          <g style={{ transform: `translate(12px, ${28 + by}px)` }}>
            <rect x="0" y="0" width="14" height="11" fill="#c084fc" rx="1" />
            <rect x="1" y="1" width="5.5" height="9" fill="#fef3c7" />
            <rect x="7.5" y="1" width="5.5" height="9" fill="#fef3c7" />
            <rect x="2" y="2" width="3.5" height="2" fill="#a78bfa" />
            <rect x="8.5" y="3" width="3.5" height="2" fill="#a78bfa" />
          </g>
        )}

        {/* Bubbles (cleaning) */}
        {resolvedAnim === 'cleaning' && (
          <g style={{ transform: `translate(26px, ${24 + by}px)` }}>
            <circle cx="0" cy="0" r="6" fill="#bae6fd" opacity="0.55" />
            <circle cx="11" cy="-3" r="5" fill="#bae6fd" opacity="0.45" />
            <circle cx="5" cy="12" r="7" fill="#bae6fd" opacity="0.45" />
            <circle cx="17" cy="9" r="4" fill="#bae6fd" opacity="0.35" />
            <circle cx="-4" cy="8" r="3" fill="#bae6fd" opacity="0.3" />
          </g>
        )}

        {/* Dream bubbles (daydreaming) */}
        {resolvedAnim === 'daydreaming' && (
          <g style={{ transform: `translate(44px, ${14 + by + sway}px)` }}>
            <circle cx="0" cy="0" r="6" fill="#c084fc" opacity="0.45" />
            <circle cx="9" cy="-7" r="5" fill="#a78bfa" opacity="0.35" />
            <circle cx="16" cy="-14" r="4" fill="#818cf8" opacity="0.25" />
            <circle cx="4" cy="-17" r="2.5" fill="#6366f1" opacity="0.2" />
            <text x="5" y="-2" fontSize="7" fill="#a78bfa" fontFamily="monospace" fontWeight="bold">z</text>
          </g>
        )}

        {/* Wand (excited wizard) */}
        {resolvedAnim === 'excited' && st.hasHands && (
          <g style={{ transform: `translate(42px, ${26 + by}px)` }}>
            {costume === 'wizard' ? (
              <>
                <rect x="0" y="-18" width="2.5" height="20" fill="#854d0e" />
                <rect x="-3" y="-22" width="8" height="8" fill="#facc15" rx="1" />
                <rect x="-1" y="-20" width="4" height="4" fill="#fef3c7" />
              </>
            ) : (
              <>
                <rect x="2" y="0" width="5" height="14" fill="#cbd5e1" rx="1" />
                <rect x="0" y="0" width="9" height="3.5" fill="#334155" rx="0.5" />
                <rect x="0" y="10.5" width="9" height="3.5" fill="#334155" rx="0.5" />
              </>
            )}
          </g>
        )}
      </svg>

      <style>{`
        .pixel-pet-wrapper {
          position: relative; width: 256px; height: 256px;
          display: flex; align-items: center; justify-content: center;
          image-rendering: pixelated; image-rendering: crisp-edges;
        }
        .pixel-pet-svg {
          width: 100%; height: 100%;
          image-rendering: pixelated; image-rendering: crisp-edges;
          z-index: 2;
        }
        .pixel-pet-shadow {
          position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
          width: 90px; height: 12px; background: rgba(0,0,0,0.35); border-radius: 50%;
          filter: blur(7px); z-index: 1;
        }
        @keyframes aura-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
