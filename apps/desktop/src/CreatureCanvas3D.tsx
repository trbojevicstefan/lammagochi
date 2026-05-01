import { Canvas } from '@react-three/fiber';
import type { Stats } from '@lamagotchi/core';
import { deriveCreatureMood } from './game/creatureBehavior';
import { EggModel, ProceduralCreature, Environment, ParticleEffects, HatchSequence } from './creature';

type Props = {
  stage: 'onboarding' | 'named_egg' | 'hatching' | 'alive';
  stats: Stats;
  dayPhase: 'morning' | 'day' | 'evening' | 'night';
  level: number;
  isStreaming?: boolean;
  hatchProgress?: number;
  interactionSpark?: number;
};

export const CreatureCanvas3D = ({
  stage,
  stats,
  dayPhase,
  level,
  isStreaming,
  hatchProgress = 0,
  interactionSpark = 0,
}: Props) => {
  const mood = deriveCreatureMood(stats);

  return (
    <Canvas
      camera={{ position: [0, -0.15, 3.8], fov: 45 }}
      shadows
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 1.5]}
    >
      <Environment dayPhase={dayPhase} />

      {stage === 'alive' ? (
        <>
          <ProceduralCreature
            level={level}
            mood={mood}
            dayPhase={dayPhase}
            isStreaming={isStreaming}
            interactionSpark={interactionSpark}
          />
          <ParticleEffects active type="ambient" count={25} />
          {interactionSpark > 0 && (
            <ParticleEffects
              active
              type="sparkle"
              count={15}
              color={interactionSpark > 0.5 ? '#fef3c7' : '#5eead4'}
            />
          )}
        </>
      ) : stage === 'hatching' ? (
        <>
          <EggModel stage="hatching" hatchProgress={hatchProgress} />
          <HatchSequence progress={hatchProgress} />
          <ParticleEffects active type="sparkle" count={30} color="#67e8f9" />
        </>
      ) : (
        <>
          <EggModel stage={stage} />
          <ParticleEffects active type="ambient" count={15} />
        </>
      )}
    </Canvas>
  );
};
