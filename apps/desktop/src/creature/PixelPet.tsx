import { useEffect, useRef, useState } from 'react';
import type { CreatureMood } from '../game/creatureBehavior';
import { getEvolutionStage, type EvolutionStage } from '../game/evolution';

type PetAnimation =
  | 'idle'
  | 'happy'
  | 'sleepy'
  | 'eating'
  | 'cleaning'
  | 'excited'
  | 'evolving'
  | 'craving';

type PetCostume = 'none' | 'wizard' | 'ninja' | 'astronaut';

type PixelPetProps = {
  level: number;
  mood: CreatureMood;
  dayPhase: 'morning' | 'day' | 'evening' | 'night';
  isStreaming?: boolean;
  interactionSpark?: number;
  costume?: PetCostume;
};

// Map mood to animation
const moodToAnim: Record<CreatureMood, PetAnimation> = {
  calm: 'idle',
  hungry: 'craving',
  sleepy: 'sleepy',
  curious: 'excited',
  dirty: 'craving',
};

// Stage definitions
const stageInfo = (level: number) => ({
  isEgg: level <= 1,
  isInfant: level >= 2 && level <= 5,
  isToddler: level >= 6 && level <= 10,
  isLearner: level >= 11 && level <= 18,
  isCompanion: level >= 19 && level <= 30,
  isSage: level >= 31,
  hasFeet: level >= 4,
  hasCrest: level >= 7,
  hasHands: level >= 12,
  hasWisdom: level >= 20,
  hasAura: level >= 25,
});

export const PixelPet = ({
  level,
  mood,
  dayPhase,
  isStreaming,
  interactionSpark = 0,
  costume = 'none',
}: PixelPetProps) => {
  const [frame, setFrame] = useState(0);
  const [animOverride, setAnimOverride] = useState<PetAnimation | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const rafRef = useRef<number>(0);
  const lastSpark = useRef(0);

  // 10 FPS game loop
  useEffect(() => {
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      if (now - last >= 100) {
        setFrame((f) => (f + 1) % 10000);
        last = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Interaction spark triggers flash
  useEffect(() => {
    if (interactionSpark > 0 && interactionSpark !== lastSpark.current) {
      lastSpark.current = interactionSpark;
      setIsFlashing(true);
      setAnimOverride('happy');
      const t1 = setTimeout(() => setIsFlashing(false), 400);
      const t2 = setTimeout(() => setAnimOverride(null), 1500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [interactionSpark]);

  // Level up triggers evolve animation
  useEffect(() => {
    setAnimOverride('evolving');
    const t = setTimeout(() => setAnimOverride(null), 3000);
    return () => clearTimeout(t);
  }, [level]);

  const si = stageInfo(level);
  const animation = animOverride || moodToAnim[mood];
  const isNight = dayPhase === 'night';
  const nightDim = isNight ? 0.55 : 1;

  // Animation math
  const breatheSpeed = si.isEgg ? 1.5 : si.isSage ? 0.4 : 0.7;
  const breatheCycle = frame * breatheSpeed;
  const yOffset = Math.sin(breatheCycle) * (si.isEgg ? 2 : 3);
  const scaleX = 1 + Math.cos(breatheCycle) * 0.02;
  const scaleY = 1 - Math.sin(breatheCycle) * 0.03;

  // Excited bounce
  const bounceY = animation === 'excited' ? -Math.abs(Math.sin(frame * 1.5)) * 10 : 0;
  const bounceSquash = animation === 'excited' ? 1 + bounceY / 30 : 1;

  // Happy wiggle
  const wiggle = animation === 'happy' ? Math.sin(frame * 2) * 3 : 0;

  // Sleepy sway
  const sway = animation === 'sleepy' ? Math.sin(frame * 1.2) * 2 : 0;

  // Evolving pulse
  const evolving = animation === 'evolving';
  const evolveScale = evolving ? 1 + Math.sin(frame * 2) * 0.08 : 1;

  // Body colors by stage
  const bodyColor = si.isSage ? '#312e81' :
    si.isCompanion ? '#4338ca' :
    si.isLearner ? '#4f46e5' :
    si.isToddler ? '#6366f1' :
    '#818cf8';

  const bodyHighlight = si.isSage ? '#4338ca' :
    si.isCompanion ? '#6366f1' :
    '#818cf8';

  const bodyShadow = si.isSage ? '#1e1b4b' :
    si.isCompanion ? '#3730a3' :
    '#4f46e5';

  const eyeColor = '#1e1b4b';
  const blushColor = '#ef4444';

  return (
    <div
      className="pixel-pet-wrapper"
      style={{
        filter: evolving
          ? `brightness(${1.5 + Math.sin(frame * 3) * 0.5}) contrast(1.3) drop-shadow(0 0 30px rgba(99,102,241,0.6))`
          : isFlashing
            ? 'brightness(5) contrast(3) drop-shadow(0 0 60px white)'
            : `brightness(${nightDim})`,
        transition: isFlashing ? 'none' : 'filter 0.4s ease-out',
      }}
    >
      {/* Floor shadow */}
      <div
        className="pixel-pet-shadow"
        style={{
          transform: `scaleX(${1 - yOffset * 0.04})`,
          opacity: animation === 'excited' ? 0.15 : 0.5 * nightDim,
        }}
      />

      <svg
        viewBox="0 0 64 64"
        className="pixel-pet-svg"
        shapeRendering="crispEdges"
      >
        {/* Sage Aura */}
        {si.hasAura && (
          <g className="aura-rings" style={{ transformOrigin: '32px 32px' }}>
            <ellipse cx="32" cy="32" rx="28" ry="12" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
            <ellipse cx="32" cy="32" rx="12" ry="28" fill="none" stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4" />
          </g>
        )}

        {/* Main transform group */}
        <g
          style={{
            transform: [
              `translate(32px, 56px)`,
              `scale(${scaleX * evolveScale}, ${scaleY * evolveScale})`,
              `translate(-32px, -56px)`,
              `translateY(${yOffset + bounceY - sway}px)`,
              `translateX(${wiggle}px)`,
            ].join(' '),
          }}
        >
          {/* ===== EGG STAGE ===== */}
          {si.isEgg && (
            <g className={animation === 'sleepy' ? 'egg-sleep' : 'egg-pulse'}>
              <ellipse cx="32" cy="40" rx="14" ry="17" fill="#f8fafc" />
              {/* Egg shine */}
              <ellipse cx="28" cy="33" rx="5" ry="7" fill="white" opacity="0.5" />
              {/* Egg markings */}
              <rect x="26" y="32" width="3" height="2" fill="#e2e8f0" />
              <rect x="35" y="37" width="4" height="2" fill="#e2e8f0" />
              <rect x="28" y="46" width="5" height="2" fill="#e2e8f0" />
              <rect x="23" y="42" width="2" height="3" fill="#e2e8f0" />
            </g>
          )}

          {/* ===== POST-EGG STAGES ===== */}
          {!si.isEgg && (
            <>
              {/* Ninja sword (behind body) */}
              {costume === 'ninja' && (
                <g>
                  <rect x="12" y="14" width="4" height="24" transform="rotate(-30 14 26)" fill="#cbd5e1" />
                  <rect x="10" y="34" width="8" height="4" transform="rotate(-30 14 26)" fill="#334155" />
                </g>
              )}

              {/* Crest / Hair (secondary motion) */}
              {si.hasCrest && (
                <g style={{ transform: `translateY(${Math.sin((frame - 2) * breatheSpeed) * 3}px)` }}>
                  <rect x="27" y="14" width="10" height="12" fill={si.isSage ? '#06b6d4' : '#fbbf24'} />
                  <rect x="29" y="10" width="6" height="4" fill={si.isSage ? '#22d3ee' : '#f59e0b'} />
                  <rect x="30" y="11" width="3" height="2" fill="#fef3c7" />
                  {/* Wizard hat */}
                  {costume === 'wizard' && (
                    <g style={{ transform: 'translateY(-6px)' }}>
                      <polygon points="32,2 16,20 48,20" fill="#7e22ce" />
                      <rect x="8" y="20" width="48" height="4" rx="2" fill="#6b21a8" />
                      <rect x="28" y="10" width="8" height="6" fill="#facc15" />
                    </g>
                  )}
                </g>
              )}

              {/* Feet */}
              {si.hasFeet && (
                <g>
                  <rect x="20" y="49" width="9" height="4" fill={bodyShadow} />
                  <rect x="35" y="49" width="9" height="4" fill={bodyShadow} />
                  <rect x="21" y="48" width="7" height="2" fill={bodyHighlight} />
                  <rect x="36" y="48" width="7" height="2" fill={bodyHighlight} />
                </g>
              )}

              {/* MAIN BODY */}
              <rect x="16" y="22" width="32" height="28" rx="6" fill={bodyColor} />
              <rect x="18" y="20" width="28" height="32" rx="6" fill={bodyColor} />

              {/* Body highlight (top shine) */}
              <rect x="18" y="22" width="24" height="5" fill={bodyHighlight} />
              {/* Body shadow (left edge) */}
              <rect x="16" y="28" width="4" height="16" fill={bodyShadow} />

              {/* Sage wisdom lines */}
              {si.hasWisdom && (
                <>
                  <rect x="24" y="24" width="16" height="1" fill={bodyShadow} opacity="0.5" />
                  <rect x="26" y="26" width="12" height="1" fill={bodyShadow} opacity="0.4" />
                  <rect x="25" y="28" width="14" height="1" fill={bodyShadow} opacity="0.3" />
                </>
              )}

              {/* Astronaut chest panel */}
              {costume === 'astronaut' && (
                <g>
                  <rect x="24" y="40" width="16" height="10" rx="2" fill="#f1f5f9" />
                  <rect x="26" y="42" width="3" height="3" fill="#ef4444" />
                  <rect x="31" y="42" width="6" height="3" fill="#3b82f6" />
                </g>
              )}

              {/* Ninja headband (over body, under face) */}
              {costume === 'ninja' && (
                <g>
                  <rect x="14" y="26" width="36" height="4" fill="#dc2626" />
                  {/* Tails */}
                  <rect x="8" y={26 + Math.sin(frame)} width="6" height="2" fill="#b91c1c" />
                  <rect x="6" y={28 + Math.cos(frame)} width="4" height="2" fill="#b91c1c" />
                </g>
              )}

              {/* FACE GROUP */}
              <g style={{ transform: `translateY(${animation === 'craving' ? 1 : 0}px)` }}>
                {/* Eyes */}
                {animation === 'sleepy' ? (
                  <>
                    <rect x="22" y="34" width="7" height="2" fill={eyeColor} />
                    <rect x="35" y="34" width="7" height="2" fill={eyeColor} />
                    {frame % 20 < 10 && (
                      <text x="44" y="24" fontSize="7" fill="#818cf8" fontFamily="monospace" fontWeight="bold">z</text>
                    )}
                    {frame % 20 >= 10 && (
                      <text x="49" y="18" fontSize="9" fill="#818cf8" fontFamily="monospace" fontWeight="bold">Z</text>
                    )}
                  </>
                ) : (
                  <>
                    {/* Eye whites */}
                    <rect x="21" y="32" width="9" height="7" fill="white" />
                    <rect x="34" y="32" width="9" height="7" fill="white" />
                    {/* Pupils (track slightly based on animation) */}
                    <g style={{ transform: `translate(${animation === 'excited' ? 1 : animation === 'happy' ? 0 : 0}px, ${animation === 'excited' ? -1 : 0}px)` }}>
                      <rect x="24" y="34" width="4" height="4" fill={eyeColor} />
                      <rect x="37" y="34" width="4" height="4" fill={eyeColor} />
                      {/* Catchlights */}
                      <rect x="25" y="34" width="1.5" height="1.5" fill="white" />
                      <rect x="38" y="34" width="1.5" height="1.5" fill="white" />
                    </g>
                    {/* Happy eye squint */}
                    {animation === 'happy' && (
                      <>
                        <rect x="21" y="34" width="9" height="2" fill={bodyColor} />
                        <rect x="34" y="34" width="9" height="2" fill={bodyColor} />
                      </>
                    )}
                  </>
                )}

                {/* Blush spots */}
                {!si.isEgg && (
                  <g opacity={animation === 'happy' ? 0.9 : animation === 'excited' ? 0.7 : 0.3}>
                    <rect x="18" y="38" width="4" height="2" fill={blushColor} />
                    <rect x="42" y="38" width="4" height="2" fill={blushColor} />
                  </g>
                )}

                {/* Mouth */}
                {animation === 'happy' || animation === 'excited' ? (
                  <rect x="30" y="42" width="4" height="4" fill="#1e1b4b" />
                ) : animation === 'craving' ? (
                  <rect x="28" y="44" width="8" height="3" fill="#1e1b4b" />
                ) : animation === 'sleepy' ? (
                  <rect x="30" y="44" width="4" height="1" fill="#1e1b4b" />
                ) : (
                  <rect x="31" y="43" width="2" height="1" fill="#1e1b4b" />
                )}
              </g>

              {/* Hands (Lvl 12+) */}
              {si.hasHands && (
                <g>
                  <rect
                    x="10"
                    y={34 + (animation === 'excited' ? -8 : 0)}
                    width="7"
                    height="7"
                    rx="1"
                    fill={si.isSage ? '#6366f1' : costume === 'astronaut' ? '#f1f5f9' : bodyHighlight}
                  />
                  <rect
                    x="47"
                    y={34 + (animation === 'excited' ? -8 : 0)}
                    width="7"
                    height="7"
                    rx="1"
                    fill={si.isSage ? '#6366f1' : costume === 'astronaut' ? '#f1f5f9' : bodyHighlight}
                  />
                </g>
              )}

              {/* Astronaut helmet dome (over face) */}
              {costume === 'astronaut' && (
                <g>
                  <rect x="10" y="14" width="44" height="40" rx="18" fill="#7dd3fc" opacity="0.3" />
                  <rect x="14" y="18" width="12" height="6" rx="3" fill="white" opacity="0.4" />
                </g>
              )}
            </>
          )}
        </g>

        {/* === Prop: Food (eating) === */}
        {animation === 'eating' && !si.isEgg && (
          <g style={{ transform: `translate(24px, ${36 + yOffset}px)` }}>
            <rect x="0" y="0" width="10" height="10" fill="#f59e0b" />
            <rect x="2" y="2" width="6" height="6" fill="#b45309" />
            <rect x="4" y="4" width="2" height="2" fill="#fef3c7" />
          </g>
        )}

        {/* === Prop: Wand (excited + wizard) === */}
        {animation === 'excited' && si.hasHands && (
          <g style={{ transform: `translate(40px, ${28 + yOffset + bounceY}px)` }}>
            {costume === 'wizard' ? (
              <>
                <rect x="0" y="-16" width="2" height="18" fill="#854d0e" />
                <rect x="-2" y="-20" width="6" height="6" fill="#facc15" />
                <rect x="-1" y="-19" width="4" height="4" fill="#fef3c7" />
              </>
            ) : (
              <>
                <rect x="2" y="0" width="4" height="12" fill="#cbd5e1" />
                <rect x="0" y="0" width="10" height="3" fill="#334155" />
                <rect x="0" y="9" width="10" height="3" fill="#334155" />
              </>
            )}
          </g>
        )}

        {/* === Prop: Bubbles (cleaning) === */}
        {animation === 'cleaning' && (
          <g style={{ transform: `translate(28px, ${26 + yOffset}px)` }}>
            <circle cx="0" cy="0" r="5" fill="#bae6fd" opacity="0.6" />
            <circle cx="10" cy="-2" r="4" fill="#bae6fd" opacity="0.5" />
            <circle cx="5" cy="10" r="6" fill="#bae6fd" opacity="0.5" />
            <circle cx="15" cy="8" r="3" fill="#bae6fd" opacity="0.4" />
          </g>
        )}
      </svg>

      {/* Inline styles for pixel rendering and animations */}
      <style>{`
        .pixel-pet-wrapper {
          position: relative;
          width: 240px;
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }
        .pixel-pet-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 12px 20px rgba(0,0,0,0.4));
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }
        .pixel-pet-shadow {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 12px;
          background: rgba(0,0,0,0.4);
          border-radius: 50%;
          filter: blur(6px);
        }
        .aura-rings {
          animation: aura-spin 10s linear infinite;
        }
        @keyframes aura-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .egg-pulse {
          animation: egg-float 3s ease-in-out infinite;
        }
        @keyframes egg-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .egg-sleep {
          animation: egg-float 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
