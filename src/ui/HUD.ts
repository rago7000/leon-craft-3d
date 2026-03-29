import { BLOCKS } from '../world/BlockRegistry';
import { InputManager } from '../core/InputManager';
import { GameMode } from '../core/GameMode';

// Leon mode: balanced mix of base + special blocks
const LEON_HOTBAR = [1, 4, 9, 11, 12, 13, 14, 15, 16];
// Free mode: original functional blocks
const FREE_HOTBAR = [1, 2, 3, 4, 5, 6, 9, 10, 8];

export class HUD {
  selectedSlot = 0;
  hotbarBlocks: number[];
  private hotbarEl: HTMLElement;
  private debugEl: HTMLElement;
  private blockNameEl: HTMLElement;
  private starEl: HTMLElement;
  private slots: HTMLElement[] = [];
  private showDebug = false;
  private fps = 0;
  private frameCount = 0;
  private fpsTimer = 0;
  private blockNameTimeout: number | null = null;
  private gameMode: GameMode;
  stars = 0;

  constructor(gameMode: GameMode) {
    this.gameMode = gameMode;
    this.hotbarBlocks = gameMode.isLeon ? [...LEON_HOTBAR] : [...FREE_HOTBAR];
    this.hotbarEl = document.getElementById('hotbar')!;
    this.debugEl = document.getElementById('debug')!;
    this.blockNameEl = document.getElementById('block-name')!;
    this.starEl = document.getElementById('star-counter')!;
    this.buildHotbar();
    this.updateStars();
  }

  private buildHotbar(): void {
    this.hotbarEl.innerHTML = '';
    this.slots = [];
    for (let i = 0; i < this.hotbarBlocks.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot' + (i === this.selectedSlot ? ' active' : '');

      const num = document.createElement('span');
      num.className = 'slot-num';
      num.textContent = String(i + 1);
      slot.appendChild(num);

      const block = BLOCKS[this.hotbarBlocks[i]];
      const icon = document.createElement('div');
      icon.className = 'block-icon';
      icon.style.background = block.color;
      slot.appendChild(icon);

      this.hotbarEl.appendChild(slot);
      this.slots.push(slot);
    }
  }

  private showBlockName(): void {
    const block = BLOCKS[this.hotbarBlocks[this.selectedSlot]];
    this.blockNameEl.textContent = block.name;
    this.blockNameEl.classList.add('visible');
    if (this.blockNameTimeout !== null) clearTimeout(this.blockNameTimeout);
    this.blockNameTimeout = window.setTimeout(() => {
      this.blockNameEl.classList.remove('visible');
    }, 1500);
  }

  update(dt: number, input: InputManager, playerPos: { x: number; y: number; z: number }, chunkCount: number): void {
    let changed = false;

    // Slot selection via number keys
    for (let i = 1; i <= 9; i++) {
      if (input.wasPressed(`Digit${i}`)) {
        this.selectedSlot = i - 1;
        changed = true;
      }
    }

    // Scroll wheel
    if (input.scrollDelta !== 0) {
      this.selectedSlot = ((this.selectedSlot + input.scrollDelta) % 9 + 9) % 9;
      changed = true;
    }

    if (changed) this.showBlockName();

    // Update active slot highlight
    this.slots.forEach((slot, i) => {
      slot.className = 'hotbar-slot' + (i === this.selectedSlot ? ' active' : '');
    });

    // Debug toggle (only in free mode)
    if (this.gameMode.config.showDebug && input.wasPressed('F3')) {
      this.showDebug = !this.showDebug;
      this.debugEl.className = this.showDebug ? 'visible' : '';
    }

    // FPS counter
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (this.showDebug) {
      this.debugEl.innerHTML = `
        FPS: ${this.fps}<br>
        XYZ: ${playerPos.x.toFixed(1)} / ${playerPos.y.toFixed(1)} / ${playerPos.z.toFixed(1)}<br>
        Chunks: ${chunkCount}
      `;
    }
  }

  addStars(count: number): void {
    this.stars += count;
    this.updateStars();
  }

  private updateStars(): void {
    this.starEl.textContent = `⭐ ${this.stars}`;
  }

  get selectedBlockId(): number {
    return this.hotbarBlocks[this.selectedSlot];
  }
}
