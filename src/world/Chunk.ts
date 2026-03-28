import * as THREE from 'three';
import { CHUNK_SIZE, WORLD_HEIGHT } from '../utils/constants';
import { localIndex } from '../utils/math';

export class Chunk {
  cx: number;
  cz: number;
  blocks: Uint8Array;
  isGenerated = false;
  isDirty = false;
  opaqueMesh: THREE.Mesh | null = null;
  transparentMesh: THREE.Mesh | null = null;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
  }

  getBlock(lx: number, ly: number, lz: number): number {
    if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE || ly < 0 || ly >= WORLD_HEIGHT) {
      return 0;
    }
    return this.blocks[localIndex(lx, ly, lz)];
  }

  setBlock(lx: number, ly: number, lz: number, id: number): void {
    if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE || ly < 0 || ly >= WORLD_HEIGHT) return;
    this.blocks[localIndex(lx, ly, lz)] = id;
    this.isDirty = true;
  }

  removeMeshes(scene: THREE.Scene): void {
    if (this.opaqueMesh) {
      scene.remove(this.opaqueMesh);
      this.opaqueMesh.geometry.dispose();
      this.opaqueMesh = null;
    }
    if (this.transparentMesh) {
      scene.remove(this.transparentMesh);
      this.transparentMesh.geometry.dispose();
      this.transparentMesh = null;
    }
  }
}
