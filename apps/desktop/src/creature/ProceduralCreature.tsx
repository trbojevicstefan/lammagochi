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
  interactionSpark?: number;
};

const moodColors: Record<CreatureMood, { body: string; head: string; emissive: string; emissiveIntensity: number }> = {
  calm:    { body: '#5eead4', head: '#a7f3d0', emissive: '#2dd4bf', emissiveIntensity: 0.3 },
  hungry:  { body: '#fbbf24', head: '#fde68a', emissive: '#f59e0b', emissiveIntensity: 0.45 },
  sleepy:  { body: '#94a3b8', head: '#cbd5e1', emissive: '#64748b', emissiveIntensity: 0.15 },
  curious: { body: '#67e8f9', head: '#bae6fd', emissive: '#06b6d4', emissiveIntensity: 0.5 },
  dirty:   { body: '#a8a29e', head: '#d6d3d1', emissive: '#78716c', emissiveIntensity: 0.2 },
};

const evolutionScales: Record<EvolutionStage, number> = {
  baby: 0.7,
  child: 0.85,
  teen: 1.0,
  adult: 1.1,
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

  // Shared geometry instances
  const bodyGeo = useMemo(() => new THREE.SphereGeometry(1, 48, 48), []);
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.55, 32, 32), []);
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(1, 24, 24), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const nightFactor = dayPhase === 'night' ? 0.4 : 1;

    // Breathing — scale body only
    const breathScale = 1 + Math.sin(t * 1.8) * 0.025 * nightFactor;
    if (bodyRef.current) {
      bodyRef.current.scale.set(1, breathScale, 1);
    }

    // Eye blink
    const blinkCycle = Math.sin(t * 0.7) * 0.5 + 0.5;
    const isBlinking = blinkCycle > 0.96 || (interactionSpark > 0.5 && blinkCycle > 0.85);
    const eyeScaleY = isBlinking ? 0.05 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScaleY;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleY;

    // Ear wiggle
    const earWiggle = Math.sin(t * 2.5) * 0.06 * (mood === 'curious' ? 2 : 1);
    if (leftEarRef.current) leftEarRef.current.rotation.z = -0.15 + earWiggle;
    if (rightEarRef.current) rightEarRef.current.rotation.z = 0.15 - earWiggle;

    // Tail wag
    if (tailRef.current && evoStage !== 'baby') {
      tailRef.current.rotation.z = Math.sin(t * 3) * 0.35;
    }

    // Streaming pulse
    if (isStreaming && bodyRef.current) {
      const mat = bodyRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = colors.emissiveIntensity + Math.sin(t * 4) * 0.15;
    }
  });

  // Stage-dependent sizes
  const eyeSize = evoStage === 'baby' ? 0.18 : evoStage === 'child' ? 0.15 : 0.13;
  const earHeight = evoStage === 'baby' ? 0.35 : evoStage === 'child' ? 0.5 : evoStage === 'teen' ? 0.6 : 0.7;
  const earRadius = evoStage === 'baby' ? 0.16 : evoStage === 'child' ? 0.2 : 0.24;
  const legSize = evoStage === 'baby' ? 0.08 : evoStage === 'child' ? 0.1 : 0.12;
  const legHeight = evoStage === 'baby' ? 0.15 : evoStage === 'child' ? 0.2 : 0.28;
  const hasLegs = evoStage !== 'baby';
  const hasTail = evoStage !== 'baby';

  // Body: positioned low, sphere scaled slightly wide and short (cute egg-dino)
  // Sphere radius=1, but we scale Y=0.78 so body height ~1.56, centered at y=-0.35
  // Body bottom ~ -0.35*baseScale - 0.78*baseScale ≈ -1.13*baseScale
  // Body top ~ -0.35*baseScale + 0.78*baseScale ≈ 0.43*baseScale
  // Head radius=0.55, positioned at y=0.65 so head bottom ≈ 0.1 (clear of body top 0.43)
  // Wait — the body scaling vs actual position: body sphere radius=1, scaleY=0.78 → effective height=1.56
  // body at y=-0.35. Bottom: -0.35 - 0.78 = -1.13, Top: -0.35 + 0.78 = 0.43
  // Head at y=0.72, radius=0.55. Bottom: 0.72 - 0.55 = 0.17, Top: 0.72 + 0.55 = 1.27
  // Gap: head bottom (0.17) is below body top (0.43)... still overlap.
  //
  // FIXED: Body at y=-0.25, scaleY=0.72. Top ≈ -0.25+0.72=0.47.
  // Head at y=0.85, radius=0.5. Bottom ≈ 0.85-0.5=0.35.
  // Gap = 0.47 - 0.35 = ... wait those still overlap slightly.
  // Let me just make the body shorter and head higher:
  // Body: y=-0.3, scaleY=0.65 → top at 0.35
  // Head: y=0.85, radius=0.5 → bottom at 0.35
  // There will be slight overlap but the color contrast (body vs slightly lighter head) sells the separation

  return (
    <group ref={groupRef} scale={baseScale}>
      {/* ======= BODY ======= */}
      {/* Main body: wide egg shape */}
      <mesh ref={bodyRef} position={[0, -0.3, 0]} scale={[1.02, 0.65, 0.95]} castShadow>
        <primitive object={bodyGeo} />
        <meshStandardMaterial
          color={colors.body}
          emissive={colors.emissive}
          emissiveIntensity={colors.emissiveIntensity}
          roughness={0.28}
          metalness={0.1}
        />
      </mesh>

      {/* Belly patch — lighter oval on the front */}
      <mesh position={[0, -0.35, 0.55]} scale={[0.55, 0.35, 0.18]} castShadow>
        <primitive object={bodyGeo} />
        <meshStandardMaterial
          color="#ecfdf5"
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      {/* ======= LEGS (child+) ======= */}
      {hasLegs && (
        <>
          {/* Front legs */}
          <mesh position={[-0.42, -0.85, 0.3]} castShadow>
            <capsuleGeometry args={[legSize, legHeight, 8, 8]} />
            <meshStandardMaterial color={colors.body} roughness={0.4} metalness={0.08} />
          </mesh>
          <mesh position={[0.42, -0.85, 0.3]} castShadow>
            <capsuleGeometry args={[legSize, legHeight, 8, 8]} />
            <meshStandardMaterial color={colors.body} roughness={0.4} metalness={0.08} />
          </mesh>
          {/* Back legs (slightly smaller and further back) */}
          <mesh position={[-0.38, -0.85, -0.25]} castShadow>
            <capsuleGeometry args={[legSize * 0.85, legHeight * 0.85, 8, 8]} />
            <meshStandardMaterial color={colors.body} roughness={0.4} metalness={0.08} />
          </mesh>
          <mesh position={[0.38, -0.85, -0.25]} castShadow>
            <capsuleGeometry args={[legSize * 0.85, legHeight * 0.85, 8, 8]} />
            <meshStandardMaterial color={colors.body} roughness={0.4} metalness={0.08} />
          </mesh>
        </>
      )}

      {/* ======= HEAD ======= */}
      <group position={[0, 0.82, 0.1]}>
        {/* Head sphere */}
        <mesh castShadow>
          <primitive object={headGeo} />
          <meshStandardMaterial
            color={colors.head}
            emissive={colors.emissive}
            emissiveIntensity={colors.emissiveIntensity * 0.5}
            roughness={0.22}
            metalness={0.06}
          />
        </mesh>

        {/* Snout — small bump on the front */}
        <mesh position={[0, -0.18, 0.4]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial
            color={evoStage === 'baby' ? '#fce7f3' : '#f8fafc'}
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>

        {/* Nostrils */}
        <mesh position={[-0.05, -0.14, 0.55]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.2} />
        </mesh>
        <mesh position={[0.05, -0.14, 0.55]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.2} />
        </mesh>

        {/* Eyes */}
        <mesh ref={leftEyeRef} position={[-0.17, 0.1, 0.4]}>
          <primitive object={eyeGeo} scale={eyeSize} />
          <meshStandardMaterial color="#020617" roughness={0.08} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.17, 0.1, 0.4]}>
          <primitive object={eyeGeo} scale={eyeSize} />
          <meshStandardMaterial color="#020617" roughness={0.08} />
        </mesh>

        {/* Catchlights (white sparkle in eyes) */}
        <mesh position={[-0.13, 0.15, 0.5]}>
          <sphereGeometry args={[eyeSize * 0.22, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.21, 0.15, 0.5]}>
          <sphereGeometry args={[eyeSize * 0.22, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Ears (llama-style, cone based, slight outward tilt) */}
        <group ref={leftEarRef} position={[-0.3, 0.32, -0.08]} rotation={[0, 0, -0.15]}>
          <mesh castShadow>
            <coneGeometry args={[earRadius, earHeight, 12, 1]} />
            <meshStandardMaterial
              color={colors.body}
              emissive={colors.emissive}
              emissiveIntensity={colors.emissiveIntensity * 0.5}
              roughness={0.2}
              metalness={0.08}
            />
          </mesh>
          {/* Inner ear (pink) */}
          <mesh position={[0, earHeight * 0.04, 0]}>
            <coneGeometry args={[earRadius * 0.5, earHeight * 0.65, 12, 1]} />
            <meshStandardMaterial color="#fce7f3" roughness={0.25} metalness={0.05} />
          </mesh>
        </group>

        <group ref={rightEarRef} position={[0.3, 0.32, -0.08]} rotation={[0, 0, 0.15]}>
          <mesh castShadow>
            <coneGeometry args={[earRadius, earHeight, 12, 1]} />
            <meshStandardMaterial
              color={colors.body}
              emissive={colors.emissive}
              emissiveIntensity={colors.emissiveIntensity * 0.5}
              roughness={0.2}
              metalness={0.08}
            />
          </mesh>
          <mesh position={[0, earHeight * 0.04, 0]}>
            <coneGeometry args={[earRadius * 0.5, earHeight * 0.65, 12, 1]} />
            <meshStandardMaterial color="#fce7f3" roughness={0.25} metalness={0.05} />
          </mesh>
        </group>

        {/* Small tuft/hair between ears (teen+) */}
        {evoStage !== 'baby' && evoStage !== 'child' && (
          <mesh position={[0, 0.58, -0.02]} rotation={[0.1, 0, 0]}>
            <coneGeometry args={[0.06, 0.2, 8, 8]} />
            <meshStandardMaterial
              color={colors.emissive}
              roughness={0.2}
              metalness={0.05}
            />
          </mesh>
        )}
      </group>

      {/* ======= TAIL (child+) ======= */}
      {hasTail && (
        <mesh ref={tailRef} position={[0, -0.35, -0.8]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.08, 0.35, 8, 8]} />
          <meshStandardMaterial
            color={colors.body}
            emissive={colors.emissive}
            emissiveIntensity={colors.emissiveIntensity * 0.4}
            roughness={0.3}
            metalness={0.06}
          />
        </mesh>
      )}

      {/* ======= LEVEL RING (L5+) ======= */}
      {level >= 5 && (
        <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.03, 16, 48]} />
          <meshBasicMaterial
            color={level >= 10 ? '#f59e0b' : '#22d3ee'}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};
