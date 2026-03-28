import { Mode } from './GameMode';

interface BlockChange {
  x: number;
  y: number;
  z: number;
  id: number;
}

interface MissionProgress {
  blocksBroken: number;
  blocksPlaced: number;
  distanceWalked: number;
  completedMissions: number[];
}

interface SaveData {
  version: number;
  mode: Mode;
  changes: BlockChange[];
  missions: MissionProgress;
  tutorialDone: boolean;
  playerX: number;
  playerY: number;
  playerZ: number;
}

const SAVE_KEY = 'leon-craft-3d-save';
const SAVE_VERSION = 1;

export class SaveManager {
  private changes: BlockChange[] = [];
  private saveTimeout: number | null = null;
  missions: MissionProgress = {
    blocksBroken: 0,
    blocksPlaced: 0,
    distanceWalked: 0,
    completedMissions: [],
  };
  tutorialDone = false;
  playerX = 0.5;
  playerY = 67;
  playerZ = 0.5;
  mode: Mode = 'leon';

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  recordBlockChange(x: number, y: number, z: number, id: number): void {
    // Remove existing change at same position
    this.changes = this.changes.filter(c => !(c.x === x && c.y === y && c.z === z));
    this.changes.push({ x, y, z, id });
    this.debouncedSave();
  }

  private debouncedSave(): void {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = window.setTimeout(() => {
      this.save();
      this.saveTimeout = null;
    }, 2000);
  }

  save(): void {
    const data: SaveData = {
      version: SAVE_VERSION,
      mode: this.mode,
      changes: this.changes,
      missions: { ...this.missions },
      tutorialDone: this.tutorialDone,
      playerX: this.playerX,
      playerY: this.playerY,
      playerZ: this.playerZ,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // localStorage full or unavailable
    }
  }

  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== SAVE_VERSION) return null;
      this.changes = data.changes || [];
      this.missions = data.missions || {
        blocksBroken: 0,
        blocksPlaced: 0,
        distanceWalked: 0,
        completedMissions: [],
      };
      this.tutorialDone = data.tutorialDone || false;
      this.playerX = data.playerX || 0.5;
      this.playerY = data.playerY || 67;
      this.playerZ = data.playerZ || 0.5;
      this.mode = data.mode || 'leon';
      return data;
    } catch {
      return null;
    }
  }

  getChanges(): BlockChange[] {
    return this.changes;
  }

  reset(): void {
    this.changes = [];
    this.missions = {
      blocksBroken: 0,
      blocksPlaced: 0,
      distanceWalked: 0,
      completedMissions: [],
    };
    this.tutorialDone = false;
    localStorage.removeItem(SAVE_KEY);
  }
}
