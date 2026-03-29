import { SoundManager } from '../audio/SoundManager';

interface Mission {
  id: number;
  name: string;
  target: number;
  getProgress: () => number;
}

export class Missions {
  private el: HTMLElement;
  private listEl: HTMLElement;
  private missions: Mission[];
  active = false;
  private sound: SoundManager;

  // Stats tracked externally
  blocksBroken = 0;
  blocksPlaced = 0;
  distanceWalked = 0;
  specialBlocksPlaced = 0;
  foundHouse = false;
  foundMagicTree = false;
  stars = 0;
  completedIds: number[] = [];

  onMissionComplete: ((name: string) => void) | null = null;

  constructor(sound: SoundManager) {
    this.sound = sound;
    this.el = document.getElementById('missions')!;
    this.listEl = document.getElementById('mission-list')!;

    this.missions = [
      { id: 0, name: 'Rompe 3 bloques', target: 3, getProgress: () => this.blocksBroken },
      { id: 1, name: 'Coloca 3 bloques', target: 3, getProgress: () => this.blocksPlaced },
      { id: 2, name: 'Construye una torre', target: 5, getProgress: () => Math.min(this.blocksPlaced, 5) },
      { id: 3, name: 'Explora el mundo', target: 100, getProgress: () => Math.floor(this.distanceWalked) },
      { id: 4, name: 'Constructor maestro', target: 20, getProgress: () => this.blocksPlaced },
      { id: 5, name: 'Encuentra la casita', target: 1, getProgress: () => this.foundHouse ? 1 : 0 },
      { id: 6, name: 'Visita el arbol magico', target: 1, getProgress: () => this.foundMagicTree ? 1 : 0 },
      { id: 7, name: 'Coloca un bloque especial', target: 1, getProgress: () => Math.min(this.specialBlocksPlaced, 1) },
      { id: 8, name: 'Colecciona 10 estrellas', target: 10, getProgress: () => this.stars },
    ];
  }

  start(): void {
    this.active = true;
    this.el.classList.remove('hidden');
    this.render();
  }

  hide(): void {
    this.el.classList.add('hidden');
    this.active = false;
  }

  loadProgress(blocksBroken: number, blocksPlaced: number, distanceWalked: number, specialBlocksPlaced: number, completedIds: number[]): void {
    this.blocksBroken = blocksBroken;
    this.blocksPlaced = blocksPlaced;
    this.distanceWalked = distanceWalked;
    this.specialBlocksPlaced = specialBlocksPlaced;
    this.completedIds = [...completedIds];
  }

  update(): void {
    if (!this.active) return;

    // Check for newly completed missions
    for (const mission of this.missions) {
      if (this.completedIds.includes(mission.id)) continue;
      const progress = mission.getProgress();
      if (progress >= mission.target) {
        this.completedIds.push(mission.id);
        this.sound.play('mission');
        this.onMissionComplete?.(mission.name);
      }
    }

    this.render();
  }

  private render(): void {
    this.listEl.innerHTML = '';
    for (const mission of this.missions) {
      const completed = this.completedIds.includes(mission.id);
      const progress = Math.min(mission.getProgress(), mission.target);
      const pct = Math.round((progress / mission.target) * 100);

      const item = document.createElement('div');
      item.className = 'mission-item' + (completed ? ' completed' : '');

      const check = document.createElement('span');
      check.className = 'check';
      check.textContent = completed ? '✅' : '⬜';
      item.appendChild(check);

      const name = document.createElement('span');
      name.textContent = mission.name;
      item.appendChild(name);

      if (!completed) {
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${pct}%`;
        bar.appendChild(fill);
        item.appendChild(bar);
      }

      this.listEl.appendChild(item);
    }
  }
}
