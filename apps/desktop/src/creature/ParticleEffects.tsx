import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type ParticleEffectProps = {
  active: boolean;
  type?: 'ambient' | 'sparkle' | 'levelup' | 'feeding' | 'playing' | 'cleaning';
  count?: number;
  color?: string;
};

const effectColors: Record<string, string> = {
  ambient: '#22d3ee',
  sparkle: '#fef3c7',
  levelup: '#facc15',
  feeding: '#4ade80',
  playing: '#fbbf24',
  cleaning: '#60a5fa',
};

export const ParticleEffects = ({ active, type = 'ambient', count = 30, color }: ParticleEffectProps) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Spread in a sphere around origin
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = type === 'ambient' ? 1.5 + Math.random() * 2.5 : 0.5 + Math.random() * 1.5;
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r + 0.3;
      pos[i * 3 + 2] = Math.cos(phi) * r * 0.7;
      vel[i * 3] = (Math.random() - 0.5) * 0.3;
      vel[i * 3 + 1] = type === 'ambient' ? 0.2 + Math.random() * 0.5 : (Math.random() - 0.5) * 1.2;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      sz[i] = 0.015 + Math.random() * 0.04;
    }
    return { positions: pos, velocities: vel, sizes: sz };
  }, [count, type]);

  const particleColor = color || effectColors[type] || effectColors.ambient;

  useFrame((state) => {
    if (!pointsRef.current || !active) return;
    const t = state.clock.elapsedTime;
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const maxY = type === 'ambient' ? 2.5 : 3;
    const minY = type === 'ambient' ? -1.5 : -0.5;

    for (let i = 0; i < count; i++) {
      posArr[i * 3] += velocities[i * 3] * 0.016;
      posArr[i * 3 + 1] += velocities[i * 3 + 1] * 0.016;
      posArr[i * 3 + 2] += velocities[i * 3 + 2] * 0.016;

      // Wrap around when going too far
      if (posArr[i * 3 + 1] > maxY) {
        posArr[i * 3 + 1] = minY;
        posArr[i * 3] = (Math.random() - 0.5) * 3;
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
      if (posArr[i * 3 + 1] < minY) {
        posArr[i * 3 + 1] = maxY;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Fade particles based on their lifecycle
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.4 + Math.sin(t * 1.5) * 0.15;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color={particleColor}
        size={0.04}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
};
