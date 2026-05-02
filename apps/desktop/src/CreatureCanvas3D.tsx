import { Canvas } from '@react-three/fiber';
import type { Stats } from '@lamagotchi/core';
import { deriveCreatureMood } from './game/creatureBehavior';
import { PixelPet, EggModel, Environment, ParticleEffects, HatchSequence } from './creature';
import { determineEmotion } from './game/emotions';
import { getWeather } from './game/weather';

type Props = {
  stage: 'onboarding' | 'named_egg' | 'hatching' | 'alive';
  stats: Stats;
  dayPhase: 'morning' | 'day' | 'evening' | 'night';
  level: number;
  isStreaming?: boolean;
  hatchProgress?: number;
  interactionSpark?: number;
  currentAnimation?: string | null;
  skin?: string;
};

export const CreatureCanvas3D = ({
  stage,
  stats,
  dayPhase,
  level,
  isStreaming,
  hatchProgress = 0,
  interactionSpark = 0,
  currentAnimation,
  skin = 'none',
}: Props) => {
  const mood = deriveCreatureMood(stats);
  const emotionId = determineEmotion(mood, stats.hunger, stats.energy, stats.trust, isStreaming || false, currentAnimation === 'evolving', dayPhase === 'night');
  const isEvolving = currentAnimation === 'evolving';
  const weather = getWeather ? getWeather() : { type:'sunny' as const };
  const weatherClass = weather.type === 'rainy' ? 'viewport--rainy' : weather.type === 'starry' ? 'viewport--starry' : weather.type === 'rainbow' ? 'viewport--rainbow' : weather.type === 'snowy' ? 'viewport--snowy' : '';
  const moodClass = emotionId === 'sleepy' ? 'viewport--sleepy' : emotionId === 'happy' ? 'viewport--calm' : emotionId === 'excited' ? 'viewport--excited' : '';

  return (
    <div className={`viewport-container ${isEvolving ? 'viewport--shaking' : ''} ${moodClass} ${weatherClass}`}>
      {/* Mood screen overlay */}
      <div className="viewport-mood-overlay" />
      {/* 3D atmosphere layer (particles, ambient effects) */}
      <div className="viewport-3d-layer">
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <Environment dayPhase={dayPhase} />

          {stage === 'hatching' ? (
            <>
              <EggModel stage="hatching" hatchProgress={hatchProgress} />
              <HatchSequence progress={hatchProgress} />
              <ParticleEffects active type="sparkle" count={30} color="#67e8f9" />
            </>
          ) : stage === 'onboarding' || stage === 'named_egg' ? (
            <>
              <EggModel stage={stage} />
              <ParticleEffects active type="ambient" count={15} />
            </>
          ) : (
            <>
              {/* Alive — just particles in 3D, pet rendered as pixel art overlay */}
              <ParticleEffects active type="ambient" count={20} />
              {interactionSpark > 0 && (
                <ParticleEffects active type="sparkle" count={12} color="#fef3c7" />
              )}
            </>
          )}
        </Canvas>
      </div>

      {/* Pixel pet overlay (on top of 3D atmosphere) */}
      {stage === 'alive' && (
        <div className="viewport-pet-layer">
          <PixelPet
            level={level}
            mood={mood}
            dayPhase={dayPhase}
            isStreaming={isStreaming}
            interactionSpark={interactionSpark}
            actionAnimation={currentAnimation}
            emotion={emotionId}
            skin={skin as any}
          />
        </div>
      )}

      {/* Hatching overlay */}
      {stage === 'hatching' && (
        <div className="viewport-pet-layer">
          <div className="hatch-status-text">
            {hatchProgress < 0.5 ? 'Cracking...' : hatchProgress < 0.8 ? 'Emerging...' : 'Almost there...'}
          </div>
        </div>
      )}
    </div>
  );
};
