import * as THREE from 'three';
import { RAY_DISTANCE, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_EYE_HEIGHT } from '../utils/constants';
import { isSolid } from '../world/BlockRegistry';
import { World } from '../world/World';

export interface RayResult {
  blockX: number;
  blockY: number;
  blockZ: number;
  normalX: number;
  normalY: number;
  normalZ: number;
}

export class BlockInteraction {
  private world: World;
  private camera: THREE.PerspectiveCamera;
  highlight: THREE.LineSegments | null = null;
  private highlightGeo: THREE.BoxGeometry;
  private highlightEdges: THREE.EdgesGeometry;
  currentTarget: RayResult | null = null;

  constructor(world: World, camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.world = world;
    this.camera = camera;

    // Create highlight wireframe
    this.highlightGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    this.highlightEdges = new THREE.EdgesGeometry(this.highlightGeo);
    this.highlight = new THREE.LineSegments(
      this.highlightEdges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }),
    );
    this.highlight.visible = false;
    scene.add(this.highlight);
  }

  update(): void {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const origin = this.camera.position.clone();

    this.currentTarget = this.dda(origin, dir, RAY_DISTANCE);

    if (this.currentTarget && this.highlight) {
      this.highlight.visible = true;
      this.highlight.position.set(
        this.currentTarget.blockX + 0.5,
        this.currentTarget.blockY + 0.5,
        this.currentTarget.blockZ + 0.5,
      );
    } else if (this.highlight) {
      this.highlight.visible = false;
    }
  }

  breakBlock(): boolean {
    if (!this.currentTarget) return false;
    const { blockX, blockY, blockZ } = this.currentTarget;
    const blockId = this.world.getBlock(blockX, blockY, blockZ);
    if (blockId === 0 || blockId === 7) return false; // can't break air or water
    this.world.setBlock(blockX, blockY, blockZ, 0);
    return true;
  }

  placeBlock(blockId: number, playerPos: THREE.Vector3): boolean {
    if (!this.currentTarget) return false;
    const { blockX, blockY, blockZ, normalX, normalY, normalZ } = this.currentTarget;
    const px = blockX + normalX;
    const py = blockY + normalY;
    const pz = blockZ + normalZ;

    // Don't place if block already there
    if (this.world.getBlock(px, py, pz) !== 0) return false;

    // Don't place if it would overlap the player
    const halfW = PLAYER_WIDTH / 2;
    const feetY = playerPos.y - PLAYER_EYE_HEIGHT;
    if (
      px + 1 > playerPos.x - halfW && px < playerPos.x + halfW &&
      py + 1 > feetY && py < feetY + PLAYER_HEIGHT &&
      pz + 1 > playerPos.z - halfW && pz < playerPos.z + halfW
    ) {
      return false;
    }

    this.world.setBlock(px, py, pz, blockId);
    return true;
  }

  // DDA voxel traversal
  private dda(origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number): RayResult | null {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = dir.x >= 0 ? 1 : -1;
    const stepY = dir.y >= 0 ? 1 : -1;
    const stepZ = dir.z >= 0 ? 1 : -1;

    const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;

    let tMaxX = dir.x !== 0 ? ((dir.x > 0 ? x + 1 : x) - origin.x) / dir.x : Infinity;
    let tMaxY = dir.y !== 0 ? ((dir.y > 0 ? y + 1 : y) - origin.y) / dir.y : Infinity;
    let tMaxZ = dir.z !== 0 ? ((dir.z > 0 ? z + 1 : z) - origin.z) / dir.z : Infinity;

    let normalX = 0, normalY = 0, normalZ = 0;
    let t = 0;

    while (t < maxDist) {
      const blockId = this.world.getBlock(x, y, z);
      if (isSolid(blockId)) {
        return { blockX: x, blockY: y, blockZ: z, normalX, normalY, normalZ };
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          t = tMaxX;
          x += stepX;
          tMaxX += tDeltaX;
          normalX = -stepX; normalY = 0; normalZ = 0;
        } else {
          t = tMaxZ;
          z += stepZ;
          tMaxZ += tDeltaZ;
          normalX = 0; normalY = 0; normalZ = -stepZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          t = tMaxY;
          y += stepY;
          tMaxY += tDeltaY;
          normalX = 0; normalY = -stepY; normalZ = 0;
        } else {
          t = tMaxZ;
          z += stepZ;
          tMaxZ += tDeltaZ;
          normalX = 0; normalY = 0; normalZ = -stepZ;
        }
      }
    }

    return null;
  }
}
