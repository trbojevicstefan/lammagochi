import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type EnvironmentProps = {
  dayPhase: 'morning' | 'day' | 'evening' | 'night';
};

const phaseColors: Record<string, { bg: string; ambient: number; fogColor: string; fogNear: number; fogFar: number }> = {
  morning: { bg: '#0f172a', ambient: 0.65, fogColor: '#1e293b', fogNear: 4, fogFar: 12 },
  day: { bg: '#0c1929', ambient: 0.7, fogColor: '#0f172a', fogNear: 5, fogFar: 14 },
  evening: { bg: '#1a1025', ambient: 0.5, fogColor: '#1e1b2e', fogNear: 3.5, fogFar: 10 },
  night: { bg: '#020617', ambient: 0.35, fogColor: '#020617', fogNear: 2.5, fogFar: 8 },
};

export const Environment = ({ dayPhase }: EnvironmentProps) => {
  const colors = phaseColors[dayPhase];
  const gridRef = useRef<THREE.Mesh>(null);

  // Grid floor material
  const gridTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = dayPhase === 'night' ? 'rgba(34,211,238,0.15)' : 'rgba(34,211,238,0.2)';
    ctx.lineWidth = 1;
    const cellSize = size / 16;
    for (let x = 0; x <= size; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, x);
      ctx.lineTo(size, x);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }, [dayPhase]);

  useFrame((state) => {
    if (!gridRef.current) return;
    const t = state.clock.elapsedTime;
    // Subtle grid pulse
    const mat = gridRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = dayPhase === 'night' ? 0.3 : 0.5 + Math.sin(t * 0.5) * 0.05;
  });

  return (
    <>
      <color attach="background" args={[colors.bg]} />
      <ambientLight intensity={colors.ambient} />
      <directionalLight
        position={[3, 5, 3]}
        intensity={dayPhase === 'night' ? 0.3 : dayPhase === 'evening' ? 0.6 : 1.0}
        castShadow
        color={dayPhase === 'evening' ? '#fbbf24' : dayPhase === 'morning' ? '#fef3c7' : '#ffffff'}
      />
      <pointLight
        position={[-2, 0.5, -2]}
        intensity={0.6}
        color={dayPhase === 'night' ? '#1e3a8a' : '#22d3ee'}
      />
      <pointLight position={[2, -0.5, 2]} intensity={0.4} color="#5eead4" />

      {/* Grid floor */}
      <mesh ref={gridRef} position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial
          map={gridTexture}
          color={dayPhase === 'night' ? '#0a1628' : '#0f172a'}
          roughness={0.9}
          metalness={0.3}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      <fog attach="fog" args={[colors.fogColor, colors.fogNear, colors.fogFar]} />
    </>
  );
};
