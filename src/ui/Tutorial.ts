import { SoundManager } from '../audio/SoundManager';

interface TutorialStep {
  icon: string;
  text: string;
  hint: string;
  check: () => boolean;
}

export class Tutorial {
  private el: HTMLElement;
  private iconEl: HTMLElement;
  private textEl: HTMLElement;
  private hintEl: HTMLElement;
  private skipBtn: HTMLElement;
  private currentStep = 0;
  private steps: TutorialStep[];
  active = false;
  completed = false;
  private sound: SoundManager;

  // Tracking state set externally by Game
  playerMoved = false;
  playerJumped = false;
  blockBroken = false;
  blockPlaced = false;

  onComplete: (() => void) | null = null;
  onStepComplete: (() => void) | null = null;

  constructor(sound: SoundManager) {
    this.sound = sound;
    this.el = document.getElementById('tutorial')!;
    this.iconEl = this.el.querySelector('.step-icon')!;
    this.textEl = this.el.querySelector('.step-text')!;
    this.hintEl = this.el.querySelector('.step-hint')!;
    this.skipBtn = this.el.querySelector('.tutorial-skip')!;

    this.steps = [
      {
        icon: '🚶',
        text: 'Camina con W A S D',
        hint: 'Usa las teclas para moverte',
        check: () => this.playerMoved,
      },
      {
        icon: '🦘',
        text: 'Salta con ESPACIO',
        hint: 'Presiona la barra de espacio',
        check: () => this.playerJumped,
      },
      {
        icon: '💥',
        text: 'Rompe un bloque',
        hint: 'Click izquierdo sobre un bloque',
        check: () => this.blockBroken,
      },
      {
        icon: '🧱',
        text: 'Coloca un bloque',
        hint: 'Click derecho para colocar',
        check: () => this.blockPlaced,
      },
    ];

    this.skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.finish();
    });
  }

  start(): void {
    this.active = true;
    this.completed = false;
    this.currentStep = 0;
    this.playerMoved = false;
    this.playerJumped = false;
    this.blockBroken = false;
    this.blockPlaced = false;
    this.el.classList.remove('hidden');
    this.showStep();
  }

  private showStep(): void {
    if (this.currentStep >= this.steps.length) {
      this.finish();
      return;
    }
    const step = this.steps[this.currentStep];
    this.iconEl.textContent = step.icon;
    this.textEl.textContent = step.text;
    this.hintEl.textContent = step.hint;
  }

  update(): void {
    if (!this.active || this.completed) return;
    if (this.currentStep >= this.steps.length) return;

    const step = this.steps[this.currentStep];
    if (step.check()) {
      this.sound.play('tutorial');
      this.onStepComplete?.();
      this.currentStep++;
      if (this.currentStep >= this.steps.length) {
        this.finish();
      } else {
        this.showStep();
      }
    }
  }

  private finish(): void {
    this.active = false;
    this.completed = true;
    this.el.classList.add('hidden');
    this.onComplete?.();
  }

  hide(): void {
    this.el.classList.add('hidden');
  }
}
