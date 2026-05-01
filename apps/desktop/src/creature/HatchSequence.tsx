import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type HatchSequenceProps = {
  progress: number; // 0 to 1
};

const ShellFragment = ({ index, progress }: { index: number; progress: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const angle = (index / 12) * Math.PI * 2;
  const baseRadius = 0.95;
  const startPos: [number, number, number] = [
    Math.cos(angle) * baseRadius * 0.7,
    (Math.sin(index * 2.3) * baseRadius) * 0.8,
    Math.sin(angle) * baseRadius * 0.5,
  ];

  useFrame(() => {
    if (!meshRef.current || progress < 0.3) return;
    const burstProgress = Math.min(1, (progress - 0.3) / 0.7);
    meshRef.current.position.set(
      startPos[0] + Math.cos(angle) * burstProgress * 2.5 * (0.5 + Math.random() * 0.5),
      startPos[1] + burstProgress * 2 * (0.3 + Math.random() * 0.7),
      startPos[2] + Math.sin(angle) * burstProgress * 1.5 * (0.5 + Math.random() * 0.5),
    );
    meshRef.current.rotation.set(
      burstProgress * Math.random() * 6,
      burstProgress * Math.random() * 6,
      burstProgress * Math.random() * 6,
    );
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 1 - burstProgress * 0.85;
    mat.transparent = true;
  });

  return (
    <mesh ref={meshRef} position={startPos}>
      <icosahedronGeometry args={[0.08 + Math.random() * 0.06, 1]} />
      <meshStandardMaterial
        color={index % 3 === 0 ? '#c7d2fe' : '#e0e7ff'}
        roughness={0.3}
        metalness={0.1}
        transparent
        opacity={1}
      />
    </mesh>
  );
};

export const HatchSequence = ({ progress }: HatchSequenceProps) => {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const scale = progress < 0.5
        ? 1 + progress * 1.5 + Math.sin(t * 8) * 0.2
        : 1.75 - (progress - 0.5) * 2 + Math.sin(t * 6) * 0.1;
      glowRef.current.scale.setScalar(scale);
      mat.opacity = progress < 0.5
        ? progress * 1.2
        : 0.6 - (progress - 0.5) * 1.2;
    }

    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      ringRef.current.scale.setScalar(0.5 + progress * 3 + Math.sin(t * 5) * 0.4);
      mat.opacity = progress > 0.15 ? Math.min(0.5, (progress - 0.15) * 2) : 0;
    }
  });

  return (
    <group>
      {/* Burst glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Expanding ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.02, 8, 48]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Shell fragments */}
      {Array.from({ length: 14 }).map((_, i) => (
        <ShellFragment key={i} index={i} progress={progress} />
      ))}

      {/* Sparkle particles at burst */}
      {progress > 0.2 && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={(() => {
                const arr = new Float32Array(40 * 3);
                for (let i = 0; i < 40; i++) {
                  const theta = Math.random() * Math.PI * 2;
                  const phi = Math.acos(2 * Math.random() - 1);
                  const r = progress * 3;
                  arr[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
                  arr[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
                  arr[i * 3 + 2] = Math.cos(phi) * r;
                }
                return arr;
              })()}
              count={40}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#fef3c7"
            size={0.04}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={progress > 0.5 ? 1 - (progress - 0.5) * 2 : progress * 2}
          />
        </points>
      )}
    </group>
  );
};
