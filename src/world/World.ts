import * as THREE from 'three';
import { CHUNK_SIZE, WORLD_HEIGHT, RENDER_DISTANCE, MAX_MESHES_PER_FRAME } from '../utils/constants';
import { worldToChunk, chunkKey, worldToLocal } from '../utils/math';
import { Chunk } from './Chunk';
import { generateTerrain, getTreePositions, placeTree } from './TerrainGenerator';
import { buildChunkMesh } from './ChunkMeshBuilder';

export class World {
  chunks = new Map<string, Chunk>();
  private scene: THREE.Scene;
  private opaqueMaterial: THREE.Material;
  private transparentMaterial: THREE.Material;
  private dirtyQueue: Chunk[] = [];

  constructor(scene: THREE.Scene, opaqueMaterial: THREE.Material, transparentMaterial: THREE.Material) {
    this.scene = scene;
    this.opaqueMaterial = opaqueMaterial;
    this.transparentMaterial = transparentMaterial;
  }

  getBlock(wx: number, wy: number, wz: number): number {
    if (wy < 0 || wy >= WORLD_HEIGHT) return 0;
    const [cx, cz] = worldToChunk(wx, wz);
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (!chunk || !chunk.isGenerated) return 0;
    const [lx, , lz] = worldToLocal(wx, wy, wz);
    return chunk.getBlock(lx, wy, lz);
  }

  setBlock(wx: number, wy: number, wz: number, id: number): void {
    if (wy < 0 || wy >= WORLD_HEIGHT) return;
    const [cx, cz] = worldToChunk(wx, wz);
    const key = chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk || !chunk.isGenerated) return;
    const [lx, , lz] = worldToLocal(wx, wy, wz);
    chunk.setBlock(lx, wy, lz, id);
    this.enqueueDirty(chunk);

    // Mark neighbor chunks dirty if block is on a boundary
    if (lx === 0) this.markNeighborDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.markNeighborDirty(cx + 1, cz);
    if (lz === 0) this.markNeighborDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.markNeighborDirty(cx, cz + 1);
  }

  private markNeighborDirty(cx: number, cz: number): void {
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (chunk && chunk.isGenerated) {
      this.enqueueDirty(chunk);
    }
  }

  private enqueueDirty(chunk: Chunk): void {
    chunk.isDirty = true;
    if (!this.dirtyQueue.includes(chunk)) {
      this.dirtyQueue.push(chunk);
    }
  }

  update(playerX: number, playerZ: number): void {
    const [pcx, pcz] = worldToChunk(playerX, playerZ);

    // Load chunks in range
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const key = chunkKey(cx, cz);
        if (!this.chunks.has(key)) {
          const chunk = new Chunk(cx, cz);
          this.chunks.set(key, chunk);
          generateTerrain(chunk);

          // Place trees
          const trees = getTreePositions(chunk);
          for (const tree of trees) {
            placeTree(chunk, tree.wx, tree.wz, tree.surfaceY);
          }

          this.enqueueDirty(chunk);
        }
      }
    }

    // Unload far chunks
    const unloadDist = RENDER_DISTANCE + 2;
    for (const [key, chunk] of this.chunks) {
      const dx = chunk.cx - pcx;
      const dz = chunk.cz - pcz;
      if (Math.abs(dx) > unloadDist || Math.abs(dz) > unloadDist) {
        chunk.removeMeshes(this.scene);
        this.chunks.delete(key);
      }
    }

    // Rebuild dirty chunks (budget limited)
    // Sort by distance to player
    this.dirtyQueue.sort((a, b) => {
      const da = Math.abs(a.cx - pcx) + Math.abs(a.cz - pcz);
      const db = Math.abs(b.cx - pcx) + Math.abs(b.cz - pcz);
      return da - db;
    });

    let built = 0;
    while (built < MAX_MESHES_PER_FRAME && this.dirtyQueue.length > 0) {
      const chunk = this.dirtyQueue.shift()!;
      if (!chunk.isDirty) continue;
      this.rebuildChunkMesh(chunk);
      chunk.isDirty = false;
      built++;
    }
  }

  private rebuildChunkMesh(chunk: Chunk): void {
    chunk.removeMeshes(this.scene);

    const getNeighborBlock = (wx: number, wy: number, wz: number): number => {
      return this.getBlock(wx, wy, wz);
    };

    const { opaque, transparent } = buildChunkMesh(
      chunk.blocks,
      chunk.cx,
      chunk.cz,
      getNeighborBlock,
      this.opaqueMaterial,
      this.transparentMaterial,
    );

    if (opaque) {
      this.scene.add(opaque);
      chunk.opaqueMesh = opaque;
    }
    if (transparent) {
      this.scene.add(transparent);
      chunk.transparentMesh = transparent;
    }
  }
}
