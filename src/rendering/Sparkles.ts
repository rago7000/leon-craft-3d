import * as THREE from 'three';

interface Particle {
  sprite: THREE.Sprite;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 30;

export class Sparkles {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private material: THREE.SpriteMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Create a small sparkle texture
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
    grad.addColorStop(0.3, 'rgba(255, 215, 64, 0.8)');
    grad.addColorStop(1, 'rgba(255, 215, 64, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);

    const texture = new THREE.CanvasTexture(canvas);
    this.material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
  }

  emit(position: THREE.Vector3, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      // Recycle or skip if at max
      if (this.particles.length >= MAX_PARTICLES) {
        const dead = this.particles.find(p => p.life <= 0);
        if (dead) {
          this.resetParticle(dead, position);
          continue;
        }
        break; // skip if no recyclable particle
      }

      const sprite = new THREE.Sprite(this.material.clone());
      sprite.scale.set(0.3, 0.3, 1);
      this.scene.add(sprite);

      const particle: Particle = {
        sprite,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          1 + Math.random() * 2,
          (Math.random() - 0.5) * 2,
        ),
        life: 1.0,
        maxLife: 1.0,
      };

      sprite.position.copy(position);
      sprite.position.x += (Math.random() - 0.5) * 1;
      sprite.position.z += (Math.random() - 0.5) * 1;
      this.particles.push(particle);
    }
  }

  private resetParticle(p: Particle, position: THREE.Vector3): void {
    p.life = 1.0;
    p.velocity.set(
      (Math.random() - 0.5) * 2,
      1 + Math.random() * 2,
      (Math.random() - 0.5) * 2,
    );
    p.sprite.position.copy(position);
    p.sprite.position.x += (Math.random() - 0.5) * 1;
    p.sprite.position.z += (Math.random() - 0.5) * 1;
    p.sprite.visible = true;
  }

  update(dt: number): void {
    for (const p of this.particles) {
      if (p.life <= 0) {
        p.sprite.visible = false;
        continue;
      }

      p.life -= dt;
      p.sprite.position.add(p.velocity.clone().multiplyScalar(dt));
      p.velocity.y -= dt * 2; // gentle gravity

      // Fade out
      const alpha = Math.max(0, p.life / p.maxLife);
      (p.sprite.material as THREE.SpriteMaterial).opacity = alpha;
      const s = 0.3 * alpha;
      p.sprite.scale.set(s, s, 1);
    }

    // Cleanup dead particles periodically
    if (this.particles.length > MAX_PARTICLES) {
      const dead = this.particles.filter(p => p.life <= 0);
      for (const p of dead.slice(0, dead.length - 5)) {
        this.scene.remove(p.sprite);
        p.sprite.material.dispose();
      }
      this.particles = this.particles.filter(p => p.life > 0 || this.particles.indexOf(p) < MAX_PARTICLES);
    }
  }
}
