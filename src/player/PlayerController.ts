import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { InputManager } from '../core/InputManager';
import { WALK_SPEED, SPRINT_SPEED } from '../utils/constants';

export class PlayerController {
  controls: PointerLockControls;
  camera: THREE.PerspectiveCamera;
  velocity = new THREE.Vector3();
  position: THREE.Vector3;
  private input: InputManager;
  onGround = false;

  constructor(camera: THREE.PerspectiveCamera, input: InputManager, domElement: HTMLElement) {
    this.camera = camera;
    this.input = input;
    this.controls = new PointerLockControls(camera, domElement);
    this.position = camera.position;
  }

  get isLocked(): boolean {
    return this.controls.isLocked;
  }

  lock(): void {
    this.controls.lock();
  }

  update(dt: number): void {
    if (!this.controls.isLocked) return;

    const speed = this.input.isDown('ShiftLeft') ? SPRINT_SPEED : WALK_SPEED;

    // Movement direction relative to camera yaw (no pitch)
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
  }
}
