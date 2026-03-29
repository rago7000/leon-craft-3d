import * as THREE from 'three';
import { InputManager } from './core/InputManager';
import { GameMode, Mode } from './core/GameMode';
import { SaveManager } from './core/SaveManager';
import { World } from './world/World';
import { PlayerController } from './player/PlayerController';
import { PlayerPhysics } from './player/PlayerPhysics';
import { BlockInteraction } from './player/BlockInteraction';
import { TextureManager } from './rendering/TextureManager';
import { SkyManager } from './rendering/SkyManager';
import { HUD } from './ui/HUD';
import { Tutorial } from './ui/Tutorial';
import { Missions } from './ui/Missions';
import { Rewards } from './ui/Rewards';
import { SoundManager } from './audio/SoundManager';
import { Pet } from './entities/Pet';
import { Sparkles } from './rendering/Sparkles';
import { generateAtlasDataURL } from './rendering/generateAtlas';
import { RENDER_DISTANCE, BASE_HEIGHT } from './utils/constants';
import { getTerrainHeight } from './utils/noise';
import { placeSpawnLandmarks, SPAWN_HOUSE_POS, MAGIC_TREE_POS } from './world/TerrainGenerator';

export class Game {
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private input!: InputManager;
  private gameMode!: GameMode;
  private saveManager!: SaveManager;
  private world!: World;
  private playerController!: PlayerController;
  private playerPhysics!: PlayerPhysics;
  private blockInteraction!: BlockInteraction;
  private textures!: TextureManager;
  private sky!: SkyManager;
  private hud!: HUD;
  private tutorial!: Tutorial;
  private missions!: Missions;
  private rewards!: Rewards;
  private sound!: SoundManager;
  private pet: Pet | null = null;
  private sparkles!: Sparkles;
  private startScreen!: HTMLElement;
  private lastTime = 0;
  private running = false;
  private started = false;
  private landmarksPlaced = false;
  private nearHouse = false;
  private nearMagicTree = false;

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

    // Core systems
    this.input = new InputManager();
    this.gameMode = new GameMode();
    this.saveManager = new SaveManager();
    this.sound = new SoundManager();
    await this.sound.init();

    // UI systems
    this.rewards = new Rewards(this.sound);
    this.tutorial = new Tutorial(this.sound);
    this.missions = new Missions(this.sound);

    // Tutorial callbacks
    this.tutorial.onStepComplete = () => {
      this.addStars(1);
      this.rewards.show();
    };
    this.tutorial.onComplete = () => {
      this.saveManager.tutorialDone = true;
      this.addStars(2);
      this.saveManager.save();
      this.rewards.show('Tutorial completo!');
      if (this.gameMode.isLeon) {
        this.missions.start();
      }
    };

    // Mission callbacks
    this.missions.onMissionComplete = () => {
      this.addStars(2);
      this.rewards.show();
      if (this.sparkles && this.camera) {
        this.sparkles.emit(this.camera.position.clone().add(new THREE.Vector3(0, -0.5, 0)), 10);
      }
    };

    // Start screen setup
    this.startScreen = document.getElementById('start-screen')!;
    this.setupStartScreen();
  }

  private setupStartScreen(): void {
    const btnLeon = document.getElementById('btn-leon')!;
    const btnLibre = document.getElementById('btn-libre')!;
    const btnLoad = document.getElementById('btn-load')!;
    const btnReset = document.getElementById('btn-reset')!;

    // Show load/reset buttons if save exists
    if (this.saveManager.hasSave()) {
      btnLoad.classList.remove('hidden');
      btnReset.classList.remove('hidden');
    }

    btnLeon.addEventListener('click', () => this.startGame('leon', false));
    btnLibre.addEventListener('click', () => this.startGame('free', false));
    btnLoad.addEventListener('click', () => {
      const data = this.saveManager.load();
      if (data) {
        this.startGame(data.mode, true);
      }
    });
    btnReset.addEventListener('click', () => {
      this.saveManager.reset();
      btnLoad.classList.add('hidden');
      btnReset.classList.add('hidden');
    });
  }

  private startGame(mode: Mode, loadSave: boolean): void {
    if (this.started) return;
    this.started = true;

    this.gameMode.setMode(mode);
    this.saveManager.mode = mode;

    // Sky
    this.sky = new SkyManager(this.scene);
    this.scene.background = this.sky.texture;
    this.scene.fog = new THREE.Fog(0x87ceeb, RENDER_DISTANCE * 12, RENDER_DISTANCE * 16);

    // World
    this.world = new World(this.scene, this.textures.opaqueMaterial, this.textures.transparentMaterial);

    // Player
    this.playerController = new PlayerController(this.camera, this.input, this.gameMode, this.renderer.domElement);

    // Spawn position
    let spawnX = 0.5, spawnZ = 0.5;
    let spawnY = getTerrainHeight(0, 0, BASE_HEIGHT) + 3;

    if (loadSave) {
      spawnX = this.saveManager.playerX;
      spawnY = this.saveManager.playerY;
      spawnZ = this.saveManager.playerZ;
    }

    this.camera.position.set(spawnX, spawnY, spawnZ);
    this.playerPhysics = new PlayerPhysics(this.world, this.gameMode, this.camera.position, this.playerController.velocity);

    // Block interaction
    this.blockInteraction = new BlockInteraction(this.world, this.camera, this.scene);

    // Sparkles (both modes — used for mission rewards)
    this.sparkles = new Sparkles(this.scene);

    // HUD
    this.hud = new HUD(this.gameMode);

    // Ensure terrain around spawn is generated
    this.world.update(spawnX, spawnZ);

    // Place spawn landmarks (Leon mode: house + magic tree)
    if (this.gameMode.isLeon && !this.landmarksPlaced) {
      placeSpawnLandmarks(this.world);
      this.landmarksPlaced = true;
    }

    // Load saved world changes (applied AFTER landmarks so saved changes override)
    if (loadSave) {
      const changes = this.saveManager.getChanges();
      for (const change of changes) {
        this.world.setBlock(change.x, change.y, change.z, change.id);
      }
      this.missions.loadProgress(
        this.saveManager.missions.blocksBroken,
        this.saveManager.missions.blocksPlaced,
        this.saveManager.missions.distanceWalked,
        this.saveManager.missions.specialBlocksPlaced ?? 0,
        this.saveManager.missions.completedMissions,
      );
      this.hud.stars = this.saveManager.stars;
    }

    // Pet (Leon mode only)
    if (this.gameMode.isLeon) {
      this.pet = new Pet(this.scene, this.camera.position.x, this.camera.position.y - 1.6, this.camera.position.z);
    }

    // Start tutorial/missions for Leon mode
    if (this.gameMode.isLeon) {
      if (loadSave && this.saveManager.tutorialDone) {
        this.missions.start();
      } else {
        this.tutorial.start();
      }
    }

    // Pointer lock events
    this.playerController.controls.addEventListener('lock', () => {
      this.startScreen.classList.add('hidden');
    });
    this.playerController.controls.addEventListener('unlock', () => {
      // Save player position
      this.saveManager.playerX = this.camera.position.x;
      this.saveManager.playerY = this.camera.position.y;
      this.saveManager.playerZ = this.camera.position.z;
      this.saveManager.save();
      this.startScreen.classList.remove('hidden');
    });

    // Lock pointer
    this.playerController.lock();

    // Start game loop
    this.lastTime = performance.now();
    this.running = true;
    this.loop();
  }

  start(): void {
    // Just render empty scene until mode is selected
    this.renderLoop();
  }

  private renderLoop = (): void => {
    if (this.running) return; // game loop takes over
    requestAnimationFrame(this.renderLoop);
  };

  private loop = (): void => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
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

      // Tutorial tracking
      if (this.tutorial.active) {
        // Track movement
        if (this.playerController.distanceMoved > 5) {
          this.tutorial.playerMoved = true;
        }
        if (this.input.wasPressed('Space')) {
          this.tutorial.playerJumped = true;
        }
      }

      // Block interaction
      this.blockInteraction.update();

      if (this.input.mouseLeft) {
        if (this.blockInteraction.breakBlock()) {
          this.sound.play('break');
          // Track for tutorial/missions
          this.tutorial.blockBroken = true;
          this.missions.blocksBroken++;
          // Save the block change
          if (this.blockInteraction.currentTarget) {
            const t = this.blockInteraction.currentTarget;
            this.saveManager.recordBlockChange(t.blockX, t.blockY, t.blockZ, 0);
          }
          this.saveMissionProgress();
        }
      }
      if (this.input.mouseRight) {
        if (this.blockInteraction.placeBlock(this.hud.selectedBlockId, this.camera.position)) {
          this.sound.play('place');
          this.tutorial.blockPlaced = true;
          this.missions.blocksPlaced++;
          // Save block change
          if (this.blockInteraction.currentTarget) {
            const t = this.blockInteraction.currentTarget;
            const px = t.blockX + t.normalX;
            const py = t.blockY + t.normalY;
            const pz = t.blockZ + t.normalZ;
            this.saveManager.recordBlockChange(px, py, pz, this.hud.selectedBlockId);
          }
          this.saveMissionProgress();
        }
      }

      // Track special blocks
      if (this.input.mouseRight && this.hud.selectedBlockId >= 11 && this.hud.selectedBlockId <= 16) {
        this.missions.specialBlocksPlaced++;
      }

      // Update distance for missions
      this.missions.distanceWalked = this.playerController.distanceMoved;

      // Check proximity to landmarks (Leon mode)
      if (this.gameMode.isLeon) {
        const px = this.camera.position.x;
        const pz = this.camera.position.z;

        // Near spawn house?
        const dxH = px - SPAWN_HOUSE_POS.x - 2;
        const dzH = pz - SPAWN_HOUSE_POS.z - 2;
        if (Math.sqrt(dxH * dxH + dzH * dzH) < 5 && !this.nearHouse) {
          this.nearHouse = true;
          this.missions.foundHouse = true;
          this.sparkles.emit(new THREE.Vector3(SPAWN_HOUSE_POS.x + 2, this.camera.position.y, SPAWN_HOUSE_POS.z + 2), 12);
        }

        // Near magic tree?
        const dxT = px - MAGIC_TREE_POS.x;
        const dzT = pz - MAGIC_TREE_POS.z;
        if (Math.sqrt(dxT * dxT + dzT * dzT) < 5 && !this.nearMagicTree) {
          this.nearMagicTree = true;
          this.missions.foundMagicTree = true;
          this.sparkles.emit(new THREE.Vector3(MAGIC_TREE_POS.x, this.camera.position.y + 2, MAGIC_TREE_POS.z), 15);
        }
      }
    }

    // Pet (Leon mode)
    if (this.pet && this.playerController.isLocked) {
      this.pet.update(dt, this.camera.position, this.world);
    }

    // Sparkles
    this.sparkles.update(dt);

    // Tutorial and missions
    if (this.gameMode.isLeon) {
      this.tutorial.update();
      this.missions.stars = this.hud.stars;
      this.missions.update();
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

  private addStars(count: number): void {
    this.hud.addStars(count);
    this.saveManager.stars = this.hud.stars;
  }

  private saveMissionProgress(): void {
    this.saveManager.missions = {
      blocksBroken: this.missions.blocksBroken,
      blocksPlaced: this.missions.blocksPlaced,
      distanceWalked: this.missions.distanceWalked,
      specialBlocksPlaced: this.missions.specialBlocksPlaced,
      completedMissions: [...this.missions.completedIds],
    };
  }
}
