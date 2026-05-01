import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';

const Creature = () => (
  <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#87f5c8" emissive="#2dd4bf" emissiveIntensity={0.35} roughness={0.25} metalness={0.15} />
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
);

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
};

export const CreatureCanvas3D = ({ stage }: Props) => {
  return (
    <Canvas camera={{ position: [0, 0.2, 3.8], fov: 45 }} shadows>
      <color attach="background" args={["#06121a"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 3]} intensity={1.1} castShadow />
      <pointLight position={[-3, -2, 2]} intensity={0.8} color="#22d3ee" />
      {stage === 'alive' ? <Creature /> : <Egg />}
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.7, 64]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI * 0.58} minPolarAngle={Math.PI * 0.42} />
    </Canvas>
  );
};
