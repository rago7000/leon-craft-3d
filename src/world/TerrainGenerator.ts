import { CHUNK_SIZE, WORLD_HEIGHT, SEA_LEVEL, BASE_HEIGHT } from '../utils/constants';
import { getTerrainHeight, posRandom } from '../utils/noise';
import { Chunk } from './Chunk';

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
