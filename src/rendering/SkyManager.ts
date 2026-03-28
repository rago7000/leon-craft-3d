import * as THREE from 'three';
import { DAY_DURATION } from '../utils/constants';

interface ColorStop {
  time: number;
  top: [number, number, number];
  bottom: [number, number, number];
}

const SKY_COLORS: ColorStop[] = [
  { time: 0.0,  top: [10, 10, 46],    bottom: [20, 20, 60] },     // midnight
  { time: 0.2,  top: [15, 15, 60],    bottom: [40, 30, 80] },     // pre-dawn
  { time: 0.25, top: [80, 60, 100],   bottom: [255, 126, 71] },   // sunrise
  { time: 0.3,  top: [100, 160, 235], bottom: [180, 210, 240] },  // morning
  { time: 0.5,  top: [135, 206, 235], bottom: [200, 230, 255] },  // noon
  { time: 0.7,  top: [100, 160, 235], bottom: [180, 210, 240] },  // afternoon
  { time: 0.75, top: [80, 60, 100],   bottom: [255, 126, 71] },   // sunset
  { time: 0.8,  top: [15, 15, 60],    bottom: [40, 30, 80] },     // dusk
  { time: 1.0,  top: [10, 10, 46],    bottom: [20, 20, 60] },     // midnight
];

export class SkyManager {
  timeOfDay = 0.3; // start at morning
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  fogColor = new THREE.Color();
  private sun: THREE.Sprite;
  private moon: THREE.Sprite;

  constructor(scene: THREE.Scene) {
    // Sky gradient texture
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1;
    this.canvas.height = 128;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.magFilter = THREE.LinearFilter;

    // Lighting
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    scene.add(this.sunLight);
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(this.ambientLight);

    // Sun sprite
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 64;
    sunCanvas.height = 64;
    const sctx = sunCanvas.getContext('2d')!;
    const sunGrad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sunGrad.addColorStop(0, '#ffffaa');
    sunGrad.addColorStop(0.5, '#ffdd44');
    sunGrad.addColorStop(1, 'transparent');
    sctx.fillStyle = sunGrad;
    sctx.fillRect(0, 0, 64, 64);
    const sunTex = new THREE.CanvasTexture(sunCanvas);
    this.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, transparent: true }));
    this.sun.scale.set(40, 40, 1);
    scene.add(this.sun);

    // Moon sprite
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 64;
    moonCanvas.height = 64;
    const mctx = moonCanvas.getContext('2d')!;
    const moonGrad = mctx.createRadialGradient(32, 32, 0, 32, 32, 24);
    moonGrad.addColorStop(0, '#eeeeff');
    moonGrad.addColorStop(0.7, '#ccccdd');
    moonGrad.addColorStop(1, 'transparent');
    mctx.fillStyle = moonGrad;
    mctx.fillRect(0, 0, 64, 64);
    const moonTex = new THREE.CanvasTexture(moonCanvas);
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true }));
    this.moon.scale.set(30, 30, 1);
    scene.add(this.moon);
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    this.timeOfDay = (this.timeOfDay + dt / DAY_DURATION) % 1;

    // Interpolate sky colors
    const { top, bottom } = this.interpolateColors(this.timeOfDay);
    const grad = this.ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, `rgb(${top[0]},${top[1]},${top[2]})`);
    grad.addColorStop(1, `rgb(${bottom[0]},${bottom[1]},${bottom[2]})`);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, 1, 128);
    this.texture.needsUpdate = true;

    // Fog color = mid sky
    const midR = (top[0] + bottom[0]) / 2;
    const midG = (top[1] + bottom[1]) / 2;
    const midB = (top[2] + bottom[2]) / 2;
    this.fogColor.setRGB(midR / 255, midG / 255, midB / 255);

    // Sun/moon position
    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const radius = 400;
    this.sun.position.set(
      playerPos.x + Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      playerPos.z,
    );
    this.moon.position.set(
      playerPos.x + Math.cos(angle + Math.PI) * radius,
      Math.sin(angle + Math.PI) * radius,
      playerPos.z,
    );

    this.sun.visible = Math.sin(angle) > -0.1;
    this.moon.visible = Math.sin(angle + Math.PI) > -0.1;

    // Light intensity based on sun elevation
    const sunElevation = Math.max(0, Math.sin(angle));
    this.sunLight.intensity = sunElevation * 1.2;
    this.sunLight.position.copy(this.sun.position);
    this.ambientLight.intensity = 0.15 + sunElevation * 0.5;
  }

  private interpolateColors(t: number): { top: [number, number, number]; bottom: [number, number, number] } {
    let i = 0;
    while (i < SKY_COLORS.length - 1 && SKY_COLORS[i + 1].time < t) i++;
    const a = SKY_COLORS[i];
    const b = SKY_COLORS[Math.min(i + 1, SKY_COLORS.length - 1)];
    const range = b.time - a.time;
    const f = range === 0 ? 0 : (t - a.time) / range;

    return {
      top: [
        Math.round(a.top[0] + (b.top[0] - a.top[0]) * f),
        Math.round(a.top[1] + (b.top[1] - a.top[1]) * f),
        Math.round(a.top[2] + (b.top[2] - a.top[2]) * f),
      ],
      bottom: [
        Math.round(a.bottom[0] + (b.bottom[0] - a.bottom[0]) * f),
        Math.round(a.bottom[1] + (b.bottom[1] - a.bottom[1]) * f),
        Math.round(a.bottom[2] + (b.bottom[2] - a.bottom[2]) * f),
      ],
    };
  }
}
