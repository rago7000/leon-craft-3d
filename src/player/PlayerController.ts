import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { InputManager } from '../core/InputManager';
import { GameMode } from '../core/GameMode';

export class PlayerController {
  controls: PointerLockControls;
  camera: THREE.PerspectiveCamera;
  velocity = new THREE.Vector3();
  position: THREE.Vector3;
  private input: InputManager;
  private gameMode: GameMode;
  onGround = false;

  // Track distance for missions
  distanceMoved = 0;
  private lastPos = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, input: InputManager, gameMode: GameMode, domElement: HTMLElement) {
    this.camera = camera;
    this.input = input;
    this.gameMode = gameMode;
    this.controls = new PointerLockControls(camera, domElement);
    this.position = camera.position;
    this.lastPos.copy(this.position);

    // Apply sensitivity to PointerLockControls
    this.controls.pointerSpeed = gameMode.config.sensitivity;
  }

  get isLocked(): boolean {
    return this.controls.isLocked;
  }

  lock(): void {
    this.controls.lock();
  }

  update(dt: number): void {
    if (!this.controls.isLocked) return;

    // Update sensitivity if mode changes
    this.controls.pointerSpeed = this.gameMode.config.sensitivity;

    const config = this.gameMode.config;
    const speed = (config.canSprint && this.input.isDown('ShiftLeft')) ? config.sprintSpeed : config.walkSpeed;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3();
    if (this.input.isDown('KeyW')) moveDir.add(forward);
    if (this.input.isDown('KeyS')) moveDir.sub(forward);
    if (this.input.isDown('KeyD')) moveDir.add(right);
    if (this.input.isDown('KeyA')) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;

    // Track distance
    const dx = this.position.x - this.lastPos.x;
    const dz = this.position.z - this.lastPos.z;
    this.distanceMoved += Math.sqrt(dx * dx + dz * dz);
    this.lastPos.copy(this.position);
  }
}
