import * as THREE from 'three';
import { World } from '../world/World';
import { isSolid } from '../world/BlockRegistry';
import { SoundManager } from '../audio/SoundManager';

export class Pet {
  group: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private bobTime = 0;
  private posX: number;
  private posY: number;
  private posZ: number;
  private sound: SoundManager;

  // Interaction state
  private idleTime = 0;
  private jumpAnim = 0; // >0 means doing a little hop
  private chirpCooldown = 0;
  nearPlayer = false; // true when within 2 blocks

  constructor(scene: THREE.Scene, spawnX: number, spawnY: number, spawnZ: number, sound: SoundManager) {
    this.sound = sound;
    this.group = new THREE.Group();
    this.posX = spawnX + 2;
    this.posY = spawnY;
    this.posZ = spawnZ + 2;

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
    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.12), orange);
    beak.position.set(0, 0.47, 0.22);
    this.group.add(beak);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), black);
    eyeL.position.set(-0.08, 0.54, 0.16);
    this.group.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), black);
    eyeR.position.set(0.08, 0.54, 0.16);
    this.group.add(eyeR);

    // Small wings
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.25), yellow);
    wingL.position.set(-0.24, 0.25, 0.0);
    this.group.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.25), yellow);
    wingR.position.set(0.24, 0.25, 0.0);
    this.group.add(wingR);

    this.group.position.set(this.posX, this.posY, this.posZ);
    scene.add(this.group);
  }

  update(dt: number, playerPos: THREE.Vector3, world: World): void {
    this.bobTime += dt * 3;
    this.chirpCooldown = Math.max(0, this.chirpCooldown - dt);

    const dx = playerPos.x - this.posX;
    const dz = playerPos.z - this.posZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const wasFar = !this.nearPlayer;
    this.nearPlayer = dist < 2.5;

    // Chirp when player approaches
    if (this.nearPlayer && wasFar && this.chirpCooldown <= 0) {
      this.sound.play('chirp');
      this.chirpCooldown = 5; // don't spam chirps
      this.jumpAnim = 0.4; // excited hop
    }

    // Movement behavior changes based on player proximity
    if (dist > 3) {
      // Follow player
      const speed = Math.min(2.5, dist - 2) * dt;
      const nx = dx / dist;
      const nz = dz / dist;
      this.posX += nx * speed;
      this.posZ += nz * speed;
      this.idleTime = 0;
    } else if (dist > 1.5) {
      // Slowly approach when player is still
      this.idleTime += dt;
      if (this.idleTime > 2) {
        const speed = 0.5 * dt;
        const nx = dx / dist;
        const nz = dz / dist;
        this.posX += nx * speed;
        this.posZ += nz * speed;
      }
    } else {
      this.idleTime += dt;
    }

    // Ground snapping
    const checkX = Math.floor(this.posX);
    const checkZ = Math.floor(this.posZ);
    let groundY = Math.floor(playerPos.y) - 1;

    for (let y = Math.floor(playerPos.y) + 2; y >= Math.floor(playerPos.y) - 5; y--) {
      if (isSolid(world.getBlock(checkX, y, checkZ))) {
        groundY = y + 1;
        break;
      }
    }

    this.posY += (groundY - this.posY) * Math.min(1, dt * 5);

    // Jump animation
    let jumpOffset = 0;
    if (this.jumpAnim > 0) {
      this.jumpAnim -= dt;
      jumpOffset = Math.sin(this.jumpAnim / 0.4 * Math.PI) * 0.3;
    }

    // Bob + head tilt when idle near player
    const bob = Math.sin(this.bobTime) * 0.05;
    const headTilt = this.nearPlayer ? Math.sin(this.bobTime * 1.5) * 0.15 : 0;
    this.head.rotation.z = headTilt;

    this.group.position.set(this.posX, this.posY + bob + jumpOffset, this.posZ);

    // Face the player
    if (dist > 0.5) {
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = angle;
    }
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.group);
  }
}
