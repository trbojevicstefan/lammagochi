import { Canvas } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { Stats } from '@lamagotchi/core';
import { deriveCreatureMood, motionForMood } from './game/creatureBehavior';

const Egg = () => (
  <Float speed={1.1} rotationIntensity={0.1} floatIntensity={0.35}>
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#f5f3ff" emissive="#67e8f9" emissiveIntensity={0.2} roughness={0.35} metalness={0.05} />
    </mesh>
  </Float>
);

type Props = {
  stage: 'onboarding' | 'named_egg' | 'hatching' | 'alive';
  stats: Stats;
  dayPhase: 'morning' | 'day' | 'evening' | 'night';
};

export const CreatureCanvas3D = ({ stage, stats, dayPhase }: Props) => {
  const mood = deriveCreatureMood(stats);
  const motion = motionForMood(mood, dayPhase);

  return (
    <Canvas camera={{ position: [0, 0.2, 3.8], fov: 45 }} shadows>
      <color attach="background" args={["#06121a"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 3]} intensity={1.1} castShadow />
      <pointLight position={[-3, -2, 2]} intensity={0.8} color="#22d3ee" />
      {stage === 'alive' ? (
        <Float speed={motion.floatSpeed} rotationIntensity={motion.rotIntensity} floatIntensity={motion.floatIntensity}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[1, 48, 48]} />
            <meshStandardMaterial color="#87f5c8" emissive="#2dd4bf" emissiveIntensity={motion.emissive} roughness={0.25} metalness={0.15} />
          </mesh>
          <mesh position={[-0.35, 0.2, 0.88]}>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
          <mesh position={[0.35, 0.2, 0.88]}>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
        </Float>
      ) : (
        <Egg />
      )}
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.7, 64]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </Canvas>
  );
};
