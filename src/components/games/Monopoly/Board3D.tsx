import React, { useMemo } from 'react';
import { MONOPOLY_BOARD } from '@/lib/monopolyData';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function getSpacePosition(spaceId: number): [number, number, number] {
  // Board is 13x13 units total.
  // Corners are at +/- 5.5
  // Properties are spaced by 1 unit.
  
  if (spaceId >= 0 && spaceId <= 10) {
    // Bottom edge
    const x = 5.5 - (spaceId * 1.1);
    return [x, 0, 5.5];
  } else if (spaceId > 10 && spaceId <= 20) {
    // Left edge
    const z = 5.5 - ((spaceId - 10) * 1.1);
    return [-5.5, 0, z];
  } else if (spaceId > 20 && spaceId <= 30) {
    // Top edge
    const x = -5.5 + ((spaceId - 20) * 1.1);
    return [x, 0, -5.5];
  } else {
    // Right edge
    const z = -5.5 + ((spaceId - 30) * 1.1);
    return [5.5, 0, z];
  }
}

export function Board3D() {
  const spaces = useMemo(() => MONOPOLY_BOARD, []);

  return (
    <group>
      {/* Board Base / Table */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[15, 1, 15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* Center Logo area */}
      <mesh position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Render 40 spaces */}
      {spaces.map((space) => {
        const [x, y, z] = getSpacePosition(space.id);
        const isCorner = space.type === "corner";
        const width = isCorner ? 2 : 1;
        const depth = isCorner ? 2 : 2; // In local space, 'depth' is the height of the card on the board

        // Calculate rotation based on edge
        let rotationY = 0;
        if (space.id > 10 && space.id < 20) rotationY = -Math.PI / 2; // Left edge
        if (space.id > 20 && space.id < 30) rotationY = Math.PI; // Top edge
        if (space.id > 30 && space.id < 40) rotationY = Math.PI / 2; // Right edge

        // Default colors
        const colors: Record<string, string> = {
          brown: "#8b4513",
          lightBlue: "#87ceeb",
          pink: "#ff69b4",
          orange: "#ffa500",
          red: "#ff0000",
          yellow: "#ffff00",
          green: "#008000",
          darkBlue: "#00008b",
        };

        const colorHex = space.colorGroup ? colors[space.colorGroup] : "#cbd5e1";

        return (
          <group key={space.id} position={[x, y, z]} rotation={[0, rotationY, 0]}>
            {/* The Space Card */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width, 0.2, depth]} />
              <meshStandardMaterial color={space.type === "property" ? "#f8fafc" : colorHex} />
            </mesh>

            {/* Color Bar for properties */}
            {space.type === "property" && (
              <mesh position={[0, 0.11, -0.8]}>
                <planeGeometry args={[width * 0.9, depth * 0.2]} />
                <meshBasicMaterial color={colorHex} />
                <mesh rotation={[-Math.PI/2, 0, 0]} />
              </mesh>
            )}

            {/* Placeholder Text */}
            <Text
              position={[0, 0.15, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.15}
              color="black"
              anchorX="center"
              anchorY="middle"
              maxWidth={width * 0.8}
              textAlign="center"
            >
              {space.name}
            </Text>
            
            {space.price && (
              <Text
                position={[0, 0.15, 0.7]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.12}
                color="#333"
                anchorX="center"
                anchorY="middle"
              >
                ${space.price}
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
}
