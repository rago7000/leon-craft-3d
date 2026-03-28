import * as THREE from 'three';
import { InputManager } from './core/InputManager';
import { World } from './world/World';
import { PlayerController } from './player/PlayerController';
import { PlayerPhysics } from './player/PlayerPhysics';
import { BlockInteraction } from './player/BlockInteraction';
import { TextureManager } from './rendering/TextureManager';
import { SkyManager } from './rendering/SkyManager';
import { HUD } from './ui/HUD';
import { SoundManager } from './audio/SoundManager';
import { generateAtlasDataURL } from './rendering/generateAtlas';
import { RENDER_DISTANCE, BASE_HEIGHT } from './utils/constants';
import { getTerrainHeight } from './utils/noise';

export class Game {
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private input!: InputManager;
  private world!: World;
  private playerController!: PlayerController;
  private playerPhysics!: PlayerPhysics;
  private blockInteraction!: BlockInteraction;
  private textures!: TextureManager;
  private sky!: SkyManager;
  private hud!: HUD;
  private sound!: SoundManager;
  private startScreen!: HTMLElement;
  private lastTime = 0;
  private running = false;

  async init(): Promise<void> {
    // Scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Generate atlas texture
    const atlasURL = generateAtlasDataURL();

    // Load textures
    this.textures = new TextureManager();
    // Override atlas path with generated data URL
    await new Promise<void>((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.load(atlasURL, (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        this.textures.atlas = texture;
        this.textures.opaqueMaterial = new THREE.MeshLambertMaterial({ map: texture });
        this.textures.transparentMaterial = new THREE.MeshLambertMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.1,
          side: THREE.DoubleSide,
        });
        resolve();
      });
    });

    // Input
    this.input = new InputManager();

    // Sky
    this.sky = new SkyManager(this.scene);
    this.scene.background = this.sky.texture;

    // Fog
    this.scene.fog = new THREE.Fog(0x87ceeb, RENDER_DISTANCE * 12, RENDER_DISTANCE * 16);

    // World
    this.world = new World(this.scene, this.textures.opaqueMaterial, this.textures.transparentMaterial);

    // Player
    this.playerController = new PlayerController(this.camera, this.input, this.renderer.domElement);
    // Spawn above terrain
    const spawnY = getTerrainHeight(0, 0, BASE_HEIGHT) + 3;
    this.camera.position.set(0.5, spawnY, 0.5);
    this.playerPhysics = new PlayerPhysics(this.world, this.camera.position, this.playerController.velocity);

    // Block interaction
    this.blockInteraction = new BlockInteraction(this.world, this.camera, this.scene);

    // HUD
    this.hud = new HUD();

    // Sound
    this.sound = new SoundManager();
    await this.sound.init();

    // Start screen
    this.startScreen = document.getElementById('start-screen')!;
    const playBtn = this.startScreen.querySelector('.play-btn')!;
    playBtn.addEventListener('click', () => {
      this.playerController.lock();
    });

    this.playerController.controls.addEventListener('lock', () => {
      this.startScreen.classList.add('hidden');
    });
    this.playerController.controls.addEventListener('unlock', () => {
      this.startScreen.classList.remove('hidden');
    });
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  private loop = (): void => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Cap delta to prevent physics explosions
    if (dt > 0.1) dt = 0.1;

    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number): void {
    this.input.update();

    // World chunk management
    this.world.update(this.camera.position.x, this.camera.position.z);

    if (this.playerController.isLocked) {
      // Player movement
      this.playerController.update(dt);
      this.playerPhysics.update(dt, this.input.wasPressed('Space'));

      // Block interaction
      this.blockInteraction.update();

      if (this.input.mouseLeft) {
        if (this.blockInteraction.breakBlock()) {
          this.sound.play('break');
        }
      }
      if (this.input.mouseRight) {
        if (this.blockInteraction.placeBlock(this.hud.selectedBlockId, this.camera.position)) {
          this.sound.play('place');
        }
      }
    }

    // Sky and lighting
    this.sky.update(dt, this.camera.position);
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(this.sky.fogColor);
    }

    // HUD
    this.hud.update(dt, this.input, this.camera.position, this.world.chunks.size);

    this.input.endFrame();
  }
}
