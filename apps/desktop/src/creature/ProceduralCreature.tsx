import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CreatureMood } from '../game/creatureBehavior';
import { getEvolutionStage, type EvolutionStage } from '../game/evolution';

type CreatureProps = {
  level: number;
  mood: CreatureMood;
  dayPhase: 'morning' | 'day' | 'evening' | 'night';
  isStreaming?: boolean;
  interactionSpark?: number; // 0-1 pulse on interaction
};

const moodColors: Record<CreatureMood, { body: string; emissive: string; emissiveIntensity: number }> = {
  calm: { body: '#5eead4', emissive: '#2dd4bf', emissiveIntensity: 0.3 },
  hungry: { body: '#fbbf24', emissive: '#f59e0b', emissiveIntensity: 0.45 },
  sleepy: { body: '#94a3b8', emissive: '#64748b', emissiveIntensity: 0.15 },
  curious: { body: '#67e8f9', emissive: '#06b6d4', emissiveIntensity: 0.5 },
  dirty: { body: '#a8a29e', emissive: '#78716c', emissiveIntensity: 0.2 },
};

const evolutionScales: Record<EvolutionStage, number> = {
  baby: 0.75,
  child: 0.9,
  teen: 1.05,
  adult: 1.15,
};

export const ProceduralCreature = ({ level, mood, dayPhase, isStreaming, interactionSpark = 0 }: CreatureProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  const evoStage = getEvolutionStage(level);
  const baseScale = evolutionScales[evoStage];
  const colors = moodColors[mood];

  // Create a rounded body mesh
  const bodyGeometry = useMemo(() => {
    // Combine sphere (top) and slightly wider sphere (bottom) for egg-dino body
    const geo = new THREE.SphereGeometry(1, 48, 48);
    // Pinch top slightly, widen bottom - will be done via scale
    return geo;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const nightFactor = dayPhase === 'night' ? 0.4 : 1;

    // Breathing animation
    const breathScale = 1 + Math.sin(t * 1.8) * 0.03 * nightFactor;
    if (bodyRef.current) {
      bodyRef.current.scale.setScalar(breathScale);
    }

    // Eye blink
    const blinkCycle = Math.sin(t * 0.7) * 0.5 + 0.5;
    const isBlinking = blinkCycle > 0.96 || (interactionSpark > 0.5 && blinkCycle > 0.85);
    const eyeScaleY = isBlinking ? 0.05 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScaleY;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleY;

    // Ear animation
    const earWiggle = Math.sin(t * 2.5) * 0.08 * (mood === 'curious' ? 2 : 1);
    if (leftEarRef.current) leftEarRef.current.rotation.z = -0.2 + earWiggle;
    if (rightEarRef.current) rightEarRef.current.rotation.z = 0.2 - earWiggle;

    // Tail wag
    if (tailRef.current && evoStage !== 'baby') {
      tailRef.current.rotation.z = Math.sin(t * 3) * 0.3;
    }

    // Streaming glow pulse
    if (isStreaming && bodyRef.current) {
      const mat = bodyRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = colors.emissiveIntensity + Math.sin(t * 4) * 0.15;
    }
  });

  const eyeSize = evoStage === 'baby' ? 0.18 : evoStage === 'child' ? 0.15 : 0.13;
  const earHeight = evoStage === 'baby' ? 0.35 : evoStage === 'child' ? 0.5 : evoStage === 'teen' ? 0.6 : 0.7;
  const earWidth = evoStage === 'baby' ? 0.18 : evoStage === 'child' ? 0.22 : 0.25;
  const bodyY = [1, 1, 1.05, 1.08] as const;
  const bodyX = [1, 1, 1.05, 1.12] as const;

  return (
    <group ref={groupRef} scale={baseScale}>
      {/* Legs */}
      {evoStage !== 'baby' && (
        <>
          <mesh position={[-0.45, -0.85, 0.25]} castShadow>
            <capsuleGeometry args={[0.12, 0.25, 8, 8]} />
            <meshStandardMaterial color={colors.body} roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[0.45, -0.85, 0.25]} castShadow>
            <capsuleGeometry args={[0.12, 0.25, 8, 8]} />
            <meshStandardMaterial color={colors.body} roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[-0.4, -0.85, -0.25]} castShadow>
            <capsuleGeometry args={[0.1, 0.2, 8, 8]} />
            <meshStandardMaterial color={colors.body} roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[0.4, -0.85, -0.25]} castShadow>
            <capsuleGeometry args={[0.1, 0.2, 8, 8]} />
            <meshStandardMaterial color={colors.body} roughness={0.4} metalness={0.1} />
          </mesh>
        </>
      )}

      {/* Body */}
      <mesh ref={bodyRef} castShadow>
        <primitive object={bodyGeometry} />
        <meshStandardMaterial
          color={colors.body}
          emissive={colors.emissive}
          emissiveIntensity={colors.emissiveIntensity}
          roughness={0.25}
          metalness={0.12}
        />
      </mesh>

      {/* Body shape - slightly wider at bottom */}
      <mesh scale={[1.05, 0.95, 1.05]} position={[0, -0.1, 0]} castShadow>
        <primitive object={bodyGeometry} />
        <meshStandardMaterial
          color={colors.body}
          emissive={colors.emissive}
          emissiveIntensity={colors.emissiveIntensity * 0.6}
          roughness={0.3}
          metalness={0.08}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Belly patch (lighter) */}
      <mesh position={[0, -0.15, 0.65]} scale={[0.55, 0.45, 0.25]} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#ecfdf5"
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      {/* Head */}
      <group position={[0, 0.75, 0.15]}>
        <mesh castShadow>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial
            color={colors.body}
            emissive={colors.emissive}
            emissiveIntensity={colors.emissiveIntensity * 0.8}
            roughness={0.22}
            metalness={0.1}
          />
        </mesh>

        {/* Snout */}
        <mesh position={[0, -0.15, 0.42]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color={evoStage === 'baby' ? '#fce7f3' : '#ecfdf5'}
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>

        {/* Nose dots */}
        <mesh position={[-0.06, -0.1, 0.58]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.2} />
        </mesh>
        <mesh position={[0.06, -0.1, 0.58]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.2} />
        </mesh>

        {/* Eyes */}
        <mesh ref={leftEyeRef} position={[-0.18, 0.12, 0.42]}>
          <sphereGeometry args={[eyeSize, 24, 24]} />
          <meshStandardMaterial color="#020617" roughness={0.1} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.18, 0.12, 0.42]}>
          <sphereGeometry args={[eyeSize, 24, 24]} />
          <meshStandardMaterial color="#020617" roughness={0.1} />
        </mesh>

        {/* Eye catchlights */}
        <mesh position={[-0.14, 0.17, 0.52]}>
          <sphereGeometry args={[eyeSize * 0.25, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.22, 0.17, 0.52]}>
          <sphereGeometry args={[eyeSize * 0.25, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Ears */}
        <group ref={leftEarRef} position={[-0.28, 0.35, -0.05]} rotation={[0, 0, -0.2]}>
          <mesh castShadow>
            <coneGeometry args={[earWidth, earHeight, 12, 1]} />
            <meshStandardMaterial
              color={colors.body}
              emissive={colors.emissive}
              emissiveIntensity={colors.emissiveIntensity * 0.7}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
          {/* Inner ear */}
          <mesh position={[0, earHeight * 0.05, 0]}>
            <coneGeometry args={[earWidth * 0.55, earHeight * 0.7, 12, 1]} />
            <meshStandardMaterial color="#fce7f3" roughness={0.25} metalness={0.05} />
          </mesh>
        </group>

        <group ref={rightEarRef} position={[0.28, 0.35, -0.05]} rotation={[0, 0, 0.2]}>
          <mesh castShadow>
            <coneGeometry args={[earWidth, earHeight, 12, 1]} />
            <meshStandardMaterial
              color={colors.body}
              emissive={colors.emissive}
              emissiveIntensity={colors.emissiveIntensity * 0.7}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
          <mesh position={[0, earHeight * 0.05, 0]}>
            <coneGeometry args={[earWidth * 0.55, earHeight * 0.7, 12, 1]} />
            <meshStandardMaterial color="#fce7f3" roughness={0.25} metalness={0.05} />
          </mesh>
        </group>
      </group>

      {/* Tail (only child+) */}
      {evoStage !== 'baby' && (
        <mesh ref={tailRef} position={[0, -0.35, -0.85]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.1, 0.4, 8, 8]} />
          <meshStandardMaterial
            color={colors.body}
            emissive={colors.emissive}
            emissiveIntensity={colors.emissiveIntensity * 0.5}
            roughness={0.3}
            metalness={0.08}
          />
        </mesh>
      )}

      {/* Level glow ring (visible L5+) */}
      {level >= 5 && (
        <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.75, 0.03, 16, 48]} />
          <meshBasicMaterial
            color={level >= 10 ? '#f59e0b' : '#22d3ee'}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};
