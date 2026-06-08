import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSpacePosition } from './Board3D';

interface Token3DProps {
  positionIndex: number;
  color: string;
  playerIndex: number; // to offset tokens if they are on the same space
}

export function Token3D({ positionIndex, color, playerIndex }: Token3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPosition = useRef(new THREE.Vector3());

  useEffect(() => {
    // Get the base coordinate for the board space
    const [x, y, z] = getSpacePosition(positionIndex);
    
    // Add small offset so multiple players on the same space don't completely overlap
    const offsetX = (playerIndex % 2 === 0 ? 0.3 : -0.3);
    const offsetZ = (playerIndex < 2 ? 0.3 : -0.3);
    
    targetPosition.current.set(x + offsetX, y + 0.5, z + offsetZ);
  }, [positionIndex, playerIndex]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smoothly interpolate current position to target position
      meshRef.current.position.lerp(targetPosition.current, 5 * delta);
    }
  });

  return (
    <mesh ref={meshRef} position={targetPosition.current} castShadow>
      {/* Placeholder token: a small cylinder or cone */}
      <cylinderGeometry args={[0.2, 0.3, 0.6, 16]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
    </mesh>
  );
}
