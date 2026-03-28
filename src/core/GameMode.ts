export type Mode = 'leon' | 'free';

export interface ModeConfig {
  walkSpeed: number;
  sprintSpeed: number;
  canSprint: boolean;
  sensitivity: number;
  gravity: number;
  jumpVelocity: number;
  rayDistance: number;
  showDebug: boolean;
  showTutorial: boolean;
  showMissions: boolean;
}

const LEON_CONFIG: ModeConfig = {
  walkSpeed: 2.5,
  sprintSpeed: 2.5,
  canSprint: false,
  sensitivity: 0.4,
  gravity: -16,
  jumpVelocity: 6.5,
  rayDistance: 5,
  showDebug: false,
  showTutorial: true,
  showMissions: true,
};

const FREE_CONFIG: ModeConfig = {
  walkSpeed: 4.3,
  sprintSpeed: 5.6,
  canSprint: true,
  sensitivity: 1.0,
  gravity: -24,
  jumpVelocity: 8,
  rayDistance: 6,
  showDebug: true,
  showTutorial: false,
  showMissions: false,
};

export class GameMode {
  mode: Mode = 'leon';
  config: ModeConfig = LEON_CONFIG;

  setMode(mode: Mode): void {
    this.mode = mode;
    this.config = mode === 'leon' ? { ...LEON_CONFIG } : { ...FREE_CONFIG };
  }

  get isLeon(): boolean {
    return this.mode === 'leon';
  }
}
