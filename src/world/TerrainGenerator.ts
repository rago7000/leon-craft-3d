import { CHUNK_SIZE, WORLD_HEIGHT, SEA_LEVEL, BASE_HEIGHT } from '../utils/constants';
import { getTerrainHeight, posRandom } from '../utils/noise';
import { Chunk } from './Chunk';
import { World } from './World';

// Spawn landmarks positions (world coords)
export const SPAWN_HOUSE_POS = { x: 4, z: 4 };
export const MAGIC_TREE_POS = { x: 20, z: 15 };
export const TREASURE_POS = { x: -8, z: 10 };

export function generateTerrain(chunk: Chunk): void {
  const wx0 = chunk.cx * CHUNK_SIZE;
  const wz0 = chunk.cz * CHUNK_SIZE;

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wx = wx0 + lx;
      const wz = wz0 + lz;
      const surfaceY = getTerrainHeight(wx, wz, BASE_HEIGHT);

      for (let y = 0; y < WORLD_HEIGHT; y++) {
        let blockId = 0; // air

        if (y === 0) {
          blockId = 3; // stone bedrock
        } else if (y < surfaceY - 3) {
          blockId = 3; // stone
          // Coal ore: ~1.5% below y=50
          if (y < 50 && posRandom(wx * 100 + y, wz) < 0.015) {
            blockId = 8; // coal ore
          }
        } else if (y <= surfaceY) {
          if (surfaceY < SEA_LEVEL) {
            blockId = 6; // sand (beach/underwater)
          } else if (y === surfaceY) {
            blockId = 1; // grass
          } else {
            blockId = 2; // dirt
          }
        } else if (y <= SEA_LEVEL) {
          blockId = 7; // water
        }

        if (blockId !== 0) {
          chunk.setBlock(lx, y, lz, blockId);
        }
      }
    }
  }

  chunk.isGenerated = true;
  chunk.isDirty = true;
}

export interface TreePosition {
  wx: number;
  wz: number;
  surfaceY: number;
}

export function getTreePositions(chunk: Chunk): TreePosition[] {
  const trees: TreePosition[] = [];
  const wx0 = chunk.cx * CHUNK_SIZE;
  const wz0 = chunk.cz * CHUNK_SIZE;

  for (let lx = 2; lx < CHUNK_SIZE - 2; lx++) {
    for (let lz = 2; lz < CHUNK_SIZE - 2; lz++) {
      const wx = wx0 + lx;
      const wz = wz0 + lz;
      const surfaceY = getTerrainHeight(wx, wz, BASE_HEIGHT);

      if (surfaceY >= SEA_LEVEL + 2 && posRandom(wx, wz) < 0.015) {
        trees.push({ wx, wz, surfaceY });
      }
    }
  }
  return trees;
}

export function placeTree(chunk: Chunk, wx: number, wz: number, surfaceY: number): void {
  const wx0 = chunk.cx * CHUNK_SIZE;
  const wz0 = chunk.cz * CHUNK_SIZE;
  const trunkHeight = 4 + Math.floor(posRandom(wx + 1000, wz + 1000) * 3); // 4-6

  // Place trunk
  for (let dy = 1; dy <= trunkHeight; dy++) {
    const lx = wx - wx0;
    const lz = wz - wz0;
    if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
      chunk.setBlock(lx, surfaceY + dy, lz, 4); // wood
    }
  }

  // Place leaves
  const topY = surfaceY + trunkHeight;
  for (let dy = -1; dy <= 1; dy++) {
    const radius = dy === 1 ? 1 : 2;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (dx === 0 && dz === 0 && dy < 1) continue; // trunk
        const lx = (wx + dx) - wx0;
        const lz = (wz + dz) - wz0;
        const ly = topY + dy;
        if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && ly > 0 && ly < WORLD_HEIGHT) {
          if (chunk.getBlock(lx, ly, lz) === 0) {
            chunk.setBlock(lx, ly, lz, 5); // leaves
          }
        }
      }
    }
  }
  // Top leaf
  const lx = wx - wx0;
  const lz = wz - wz0;
  if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
    chunk.setBlock(lx, topY + 2, lz, 5);
  }
}

// Place spawn landmarks directly into the world (called once after initial chunks load)
export function placeSpawnLandmarks(world: World): void {
  placeSpawnHouse(world);
  placeMagicTree(world);
  placeTreasure(world);
}

function setWorldBlock(world: World, x: number, y: number, z: number, id: number): void {
  world.setBlock(x, y, z, id);
}

function placeSpawnHouse(world: World): void {
  const hx = SPAWN_HOUSE_POS.x;
  const hz = SPAWN_HOUSE_POS.z;
  const groundY = getTerrainHeight(hx, hz, BASE_HEIGHT);

  // Flatten ground 7x7 under house
  for (let dx = -1; dx <= 5; dx++) {
    for (let dz = -1; dz <= 5; dz++) {
      // Fill up to groundY with dirt, clear above
      for (let dy = groundY - 2; dy <= groundY + 6; dy++) {
        if (dy <= groundY) {
          setWorldBlock(world, hx + dx, dy, hz + dz, 2); // dirt
        } else {
          setWorldBlock(world, hx + dx, dy, hz + dz, 0); // air
        }
      }
      // Grass on top of flattened area outside house
      setWorldBlock(world, hx + dx, groundY, hz + dz, 1);
    }
  }

  const fy = groundY + 1; // floor level

  // Floor (wood)
  for (let dx = 0; dx <= 4; dx++) {
    for (let dz = 0; dz <= 4; dz++) {
      setWorldBlock(world, hx + dx, groundY, hz + dz, 4); // wood floor
    }
  }

  // Walls (brick, 3 blocks tall)
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx <= 4; dx++) {
      setWorldBlock(world, hx + dx, fy + dy, hz, 9); // south wall
      setWorldBlock(world, hx + dx, fy + dy, hz + 4, 9); // north wall
    }
    for (let dz = 1; dz <= 3; dz++) {
      setWorldBlock(world, hx, fy + dy, hz + dz, 9); // west wall
      setWorldBlock(world, hx + 4, fy + dy, hz + dz, 9); // east wall
    }
  }

  // Door (front, south wall) — 1x2 opening at center
  setWorldBlock(world, hx + 2, fy, hz, 0);
  setWorldBlock(world, hx + 2, fy + 1, hz, 0);

  // Windows (glass) — one on each side wall
  setWorldBlock(world, hx, fy + 1, hz + 2, 10);
  setWorldBlock(world, hx + 4, fy + 1, hz + 2, 10);

  // Roof (wood slabs, flat)
  for (let dx = -1; dx <= 5; dx++) {
    for (let dz = -1; dz <= 5; dz++) {
      setWorldBlock(world, hx + dx, fy + 3, hz + dz, 4);
    }
  }

  // Star block on top center of roof
  setWorldBlock(world, hx + 2, fy + 4, hz + 2, 13); // estrella
}

function placeMagicTree(world: World): void {
  const tx = MAGIC_TREE_POS.x;
  const tz = MAGIC_TREE_POS.z;
  const groundY = getTerrainHeight(tx, tz, BASE_HEIGHT);

  // Flatten small area
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = groundY - 1; dy <= groundY + 12; dy++) {
        if (dy <= groundY) {
          setWorldBlock(world, tx + dx, dy, tz + dz, 1); // grass
        } else {
          setWorldBlock(world, tx + dx, dy, tz + dz, 0); // air clear
        }
      }
    }
  }

  // Tall trunk (7 blocks)
  for (let dy = 1; dy <= 7; dy++) {
    setWorldBlock(world, tx, groundY + dy, tz, 4); // wood
  }

  // Large leaf canopy (radius 3 at top)
  const topY = groundY + 7;
  for (let dy = -2; dy <= 1; dy++) {
    const r = dy === 1 ? 1 : (dy === 0 ? 2 : 3);
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (dx === 0 && dz === 0 && dy <= 0) continue; // trunk
        if (Math.abs(dx) === r && Math.abs(dz) === r) continue; // round corners
        const ly = topY + dy;
        if (world.getBlock(tx + dx, ly, tz + dz) === 0) {
          setWorldBlock(world, tx + dx, ly, tz + dz, 5); // leaves
        }
      }
    }
  }

  // Estrella blocks scattered in the leaves
  setWorldBlock(world, tx + 1, topY, tz, 13);
  setWorldBlock(world, tx - 1, topY - 1, tz + 1, 13);
  setWorldBlock(world, tx, topY - 2, tz - 2, 13);

  // Rainbow block on very top
  setWorldBlock(world, tx, topY + 2, tz, 11); // arcoiris crown
}

function placeTreasure(world: World): void {
  const gx = TREASURE_POS.x;
  const gz = TREASURE_POS.z;
  const groundY = getTerrainHeight(gx, gz, BASE_HEIGHT);

  // Small 3x3 flat area
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      setWorldBlock(world, gx + dx, groundY, gz + dz, 1); // grass
      setWorldBlock(world, gx + dx, groundY + 1, gz + dz, 0); // clear above
    }
  }

  // Gift box: brillante base + estrella on top
  setWorldBlock(world, gx, groundY + 1, gz, 14); // brillante block
  setWorldBlock(world, gx, groundY + 2, gz, 13); // estrella on top
}
