const fs = require('fs');
const path = require('path');

const fileContent = `export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
}

export interface CourseConfig {
  startPos: { x: number; y: number };
  holePos: { x: number; y: number };
  par: number;
  walls: Rect[];
  sandTraps: Rect[];
  waterHazards: Rect[];
}

export const COURSES: CourseConfig[] = [
${Array.from({ length: 20 }).map((_, i) => {
  // Generate 20 distinct procedural-ish maps
  const type = i % 5;
  const difficulty = Math.floor(i / 5);
  
  let walls = [];
  let sandTraps = [];
  let waterHazards = [];
  let startPos = { x: 250, y: 700 };
  let holePos = { x: 250, y: 100 };
  let par = 2 + difficulty;

  if (type === 0) {
    // Zig Zag
    walls.push({ x: 150, y: 500, w: 300, h: 20 });
    walls.push({ x: 350, y: 300, w: 300, h: 20 });
    if (difficulty > 0) sandTraps.push({ x: 250, y: 400, w: 100, h: 100 });
    if (difficulty > 1) waterHazards.push({ x: 250, y: 600, w: 100, h: 100 });
  } else if (type === 1) {
    // Funnel
    walls.push({ x: 100, y: 400, w: 300, h: 20, angle: Math.PI / 4 });
    walls.push({ x: 400, y: 400, w: 300, h: 20, angle: -Math.PI / 4 });
    startPos = { x: 250, y: 750 };
    if (difficulty > 0) waterHazards.push({ x: 250, y: 250, w: 150, h: 50 });
  } else if (type === 2) {
    // Islands
    waterHazards.push({ x: 250, y: 400, w: 500, h: 300 }); // Massive water
    walls.push({ x: 250, y: 400, w: 150, h: 150 }); // Island block
    sandTraps.push({ x: 250, y: 400, w: 130, h: 130 }); // Sand on island
    holePos = { x: 250, y: 50 };
  } else if (type === 3) {
    // Corner Pocket
    startPos = { x: 50, y: 750 };
    holePos = { x: 450, y: 50 };
    walls.push({ x: 250, y: 400, w: 400, h: 20, angle: Math.PI / 4 });
    if (difficulty > 0) sandTraps.push({ x: 150, y: 250, w: 100, h: 100 });
  } else if (type === 4) {
    // The Maze
    walls.push({ x: 200, y: 600, w: 300, h: 20 });
    walls.push({ x: 300, y: 450, w: 300, h: 20 });
    walls.push({ x: 200, y: 300, w: 300, h: 20 });
    walls.push({ x: 300, y: 150, w: 300, h: 20 });
    startPos = { x: 50, y: 700 };
    holePos = { x: 50, y: 50 };
  }
  
  // Add some random scatter based on 'i' to make them unique
  if (i > 5) {
     const xOff = (i * 37) % 200 - 100;
     sandTraps.push({ x: 250 + xOff, y: 300 + xOff, w: 80, h: 80 });
  }

  return \`  {
    startPos: { x: \${startPos.x}, y: \${startPos.y} },
    holePos: { x: \${holePos.x}, y: \${holePos.y} },
    par: \${par},
    walls: \${JSON.stringify(walls)},
    sandTraps: \${JSON.stringify(sandTraps)},
    waterHazards: \${JSON.stringify(waterHazards)}
  }\`;
}).join(',\\n')}
];
`;

const dir = path.join(__dirname, 'src/components/games/minigolf');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'courses.ts'), fileContent);
console.log('courses.ts generated!');
