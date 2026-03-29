import * as THREE from 'three';
import { World } from '../world/World';
import { isSolid } from '../world/BlockRegistry';

export class Pet {
  group: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private beak: THREE.Mesh;
  private eyeL: THREE.Mesh;
  private eyeR: THREE.Mesh;
  private bobTime = 0;
  private targetX: number;
  private targetZ: number;
  private posX: number;
  private posY: number;
  private posZ: number;

  constructor(scene: THREE.Scene, spawnX: number, spawnY: number, spawnZ: number) {
    this.group = new THREE.Group();
    this.posX = spawnX + 2;
    this.posY = spawnY;
    this.posZ = spawnZ + 2;
    this.targetX = this.posX;
    this.targetZ = this.posZ;

    const yellow = new THREE.MeshLambertMaterial({ color: 0xffeb3b });
    const orange = new THREE.MeshLambertMaterial({ color: 0xff9800 });
    const black = new THREE.MeshLambertMaterial({ color: 0x222222 });

    // Body
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), yellow);
    this.body.position.y = 0.2;
    this.group.add(this.body);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.3), yellow);
    this.head.position.set(0, 0.5, 0.05);
    this.group.add(this.head);

    // Beak
    this.beak = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.12), orange);
    this.beak.position.set(0, 0.47, 0.22);
    this.group.add(this.beak);

    // Eyes
    this.eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), black);
    this.eyeL.position.set(-0.08, 0.54, 0.16);
    this.group.add(this.eyeL);

    this.eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), black);
    this.eyeR.position.set(0.08, 0.54, 0.16);
    this.group.add(this.eyeR);

    this.group.position.set(this.posX, this.posY, this.posZ);
    scene.add(this.group);
  }

  update(dt: number, playerPos: THREE.Vector3, world: World): void {
    this.bobTime += dt * 3;

    // Target = near the player but not too close
    const dx = playerPos.x - this.posX;
    const dz = playerPos.z - this.posZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 3) {
      // Move toward player
      const speed = Math.min(2.5, dist - 2) * dt;
      const nx = dx / dist;
      const nz = dz / dist;
      this.posX += nx * speed;
      this.posZ += nz * speed;
    }

    // Simple ground snapping: find solid block below
    const checkX = Math.floor(this.posX);
    const checkZ = Math.floor(this.posZ);
    let groundY = Math.floor(playerPos.y) - 1; // default near player

    for (let y = Math.floor(playerPos.y) + 2; y >= Math.floor(playerPos.y) - 5; y--) {
      if (isSolid(world.getBlock(checkX, y, checkZ))) {
        groundY = y + 1;
        break;
      }
    }

    // Smooth Y transition
    const targetY = groundY;
    this.posY += (targetY - this.posY) * Math.min(1, dt * 5);

    // Bob animation
    const bob = Math.sin(this.bobTime) * 0.05;

    this.group.position.set(this.posX, this.posY + bob, this.posZ);

    // Face the player (Y rotation only)
    if (dist > 0.5) {
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = angle;
    }
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.group);
  }
}
