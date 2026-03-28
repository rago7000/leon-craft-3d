import * as THREE from 'three';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_EYE_HEIGHT } from '../utils/constants';
import { isSolid } from '../world/BlockRegistry';
import { World } from '../world/World';
import { GameMode } from '../core/GameMode';

export class PlayerPhysics {
  private world: World;
  private gameMode: GameMode;
  position: THREE.Vector3; // eye position
  velocity: THREE.Vector3;
  onGround = false;

  constructor(world: World, gameMode: GameMode, position: THREE.Vector3, velocity: THREE.Vector3) {
    this.world = world;
    this.gameMode = gameMode;
    this.position = position;
    this.velocity = velocity;
  }

  update(dt: number, jumpPressed: boolean): void {
    const config = this.gameMode.config;

    // Apply gravity
    this.velocity.y += config.gravity * dt;

    // Jump
    if (jumpPressed && this.onGround) {
      this.velocity.y = config.jumpVelocity;
      this.onGround = false;
    }

    const halfW = PLAYER_WIDTH / 2;
    const feetY = this.position.y - PLAYER_EYE_HEIGHT;

    // Move along X
    this.position.x += this.velocity.x * dt;
    if (this.checkCollision(this.position.x, feetY, this.position.z, halfW)) {
      this.position.x -= this.velocity.x * dt;
      this.velocity.x = 0;
    }

    // Move along Z
    this.position.z += this.velocity.z * dt;
    if (this.checkCollision(this.position.x, feetY, this.position.z, halfW)) {
      this.position.z -= this.velocity.z * dt;
      this.velocity.z = 0;
    }

    // Move along Y
    const prevFeetY = this.position.y - PLAYER_EYE_HEIGHT;
    this.position.y += this.velocity.y * dt;
    const newFeetY = this.position.y - PLAYER_EYE_HEIGHT;

    if (this.checkCollision(this.position.x, newFeetY, this.position.z, halfW)) {
      if (this.velocity.y < 0) {
        this.position.y = Math.floor(prevFeetY) + 1 + PLAYER_EYE_HEIGHT;
        this.onGround = true;
      } else {
        this.position.y -= this.velocity.y * dt;
      }
      this.velocity.y = 0;
    } else {
      this.onGround = false;
    }

    if (this.position.y < PLAYER_EYE_HEIGHT) {
      this.position.y = PLAYER_EYE_HEIGHT;
      this.velocity.y = 0;
      this.onGround = true;
    }
  }

  private checkCollision(px: number, feetY: number, pz: number, halfW: number): boolean {
    const minX = Math.floor(px - halfW);
    const maxX = Math.floor(px + halfW);
    const minY = Math.floor(feetY);
    const maxY = Math.floor(feetY + PLAYER_HEIGHT);
    const minZ = Math.floor(pz - halfW);
    const maxZ = Math.floor(pz + halfW);

    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (isSolid(this.world.getBlock(bx, by, bz))) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
