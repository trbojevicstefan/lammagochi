import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

type EggProps = {
  stage: 'onboarding' | 'named_egg' | 'hatching';
  hatchProgress?: number;
};

export const EggModel = ({ stage, hatchProgress = 0 }: EggProps) => {
  const eggRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const isHatching = stage === 'hatching';

  // Procedural egg shell pattern dots
  const shellDots = useMemo(() => {
    const dots: Array<{ pos: [number, number, number]; size: number }> = [];
    for (let i = 0; i < 60; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.02;
      dots.push({
        pos: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi) + 0.15,
          r * Math.sin(phi) * Math.sin(theta),
        ],
        size: 0.015 + Math.random() * 0.025,
      });
    }
    return dots;
  }, []);

  useFrame((state) => {
    if (!eggRef.current || !glowRef.current) return;
    const t = state.clock.elapsedTime;

    if (isHatching) {
      const shakeAmount = 0.03 + hatchProgress * 0.06;
      eggRef.current.position.x = Math.sin(t * 20) * shakeAmount;
      eggRef.current.position.y = Math.cos(t * 17) * shakeAmount * 0.7;
    }

    // Glow pulse
    if (glowRef.current) {
      const pulseScale = isHatching ? 1.15 + Math.sin(t * 6) * 0.15 : 1.05 + Math.sin(t * 2) * 0.05;
      glowRef.current.scale.setScalar(pulseScale);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = isHatching ? 0.25 + Math.sin(t * 6) * 0.15 : 0.12 + Math.sin(t * 2) * 0.05;
        mat.transparent = true;
      }
    }
  });

  return (
    <Float speed={isHatching ? 3 : 1.1} rotationIntensity={0.08} floatIntensity={isHatching ? 0.15 : 0.35}>
      <group ref={eggRef}>
        {/* Main egg shape - slightly elongated sphere */}
        <mesh castShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            color="#e0e7ff"
            emissive={isHatching ? "#67e8f9" : "#818cf8"}
            emissiveIntensity={isHatching ? 0.5 : 0.2}
            roughness={0.25}
            metalness={0.1}
            transparent
            opacity={1 - hatchProgress * 0.6}
          />
        </mesh>

        {/* Egg slightly tall - scale Y */}
        <mesh scale={[1, 1.15, 1]} castShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhysicalMaterial
            color={isHatching ? "#c7d2fe" : "#eef2ff"}
            roughness={0.15}
            metalness={0.05}
            clearcoat={0.3}
            clearcoatRoughness={0.2}
            transparent
            opacity={1 - hatchProgress * 0.5}
          />
        </mesh>

        {/* Shell pattern dots */}
        {shellDots.map((dot, i) => (
          <mesh key={i} position={dot.pos}>
            <sphereGeometry args={[dot.size, 8, 8]} />
            <meshStandardMaterial
              color={isHatching ? "#a5f3fc" : "#c4b5fd"}
              emissive={isHatching ? "#67e8f9" : "#a78bfa"}
              emissiveIntensity={0.6}
              roughness={0.1}
              transparent
              opacity={1 - hatchProgress * 0.7}
            />
          </mesh>
        ))}

        {/* Inner glow sphere (visible through shell as it cracks) */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.92, 32, 32]} />
          <meshBasicMaterial
            color="#67e8f9"
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Crack lines when hatching */}
        {isHatching && hatchProgress > 0.1 && (
          <>
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2 + hatchProgress * 2;
              const crackLen = 0.3 + hatchProgress * 1.2;
              const startRadius = 0.6 + Math.random() * 0.3;
              const crackPoints = [
                new THREE.Vector3(
                  Math.cos(angle) * startRadius,
                  (Math.random() - 0.5) * 1.5,
                  Math.sin(angle) * startRadius,
                ),
                new THREE.Vector3(
                  Math.cos(angle + 0.15) * (startRadius + crackLen * 0.5),
                  (Math.random() - 0.5) * 1.5 + crackLen * 0.4,
                  Math.sin(angle + 0.15) * (startRadius + crackLen * 0.5),
                ),
                new THREE.Vector3(
                  Math.cos(angle - 0.1) * (startRadius + crackLen),
                  (Math.random() - 0.5) * 1.5 + crackLen * 0.8,
                  Math.sin(angle - 0.1) * (startRadius + crackLen),
                ),
              ];
              const curve = new THREE.CatmullRomCurve3(crackPoints);
              return (
                <mesh key={`crack-${i}`}>
                  <tubeGeometry args={[curve, 8, 0.008 + hatchProgress * 0.01, 8, false]} />
                  <meshBasicMaterial color="#67e8f9" transparent opacity={hatchProgress * 1.5} />
                </mesh>
              );
            })}
          </>
        )}
      </group>
    </Float>
  );
};
