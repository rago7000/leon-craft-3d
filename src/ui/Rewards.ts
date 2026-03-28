import { SoundManager } from '../audio/SoundManager';

const MESSAGES = [
  'Muy bien Leon!',
  'Increible!',
  'Eres un crack!',
  'Genial!',
  'Sigue asi!',
  'Asombroso!',
  'Fantastico!',
];

export class Rewards {
  private overlay: HTMLElement;
  private textEl: HTMLElement;
  private sound: SoundManager;
  private timeout: number | null = null;
  private msgIndex = 0;

  constructor(sound: SoundManager) {
    this.sound = sound;
    this.overlay = document.getElementById('reward-overlay')!;
    this.textEl = this.overlay.querySelector('.reward-text')!;
  }

  show(customMessage?: string): void {
    // Clear previous
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }
    this.clearStars();

    const msg = customMessage || MESSAGES[this.msgIndex % MESSAGES.length];
    this.msgIndex++;

    this.textEl.textContent = msg;
    this.overlay.classList.remove('hidden');

    // Reset animation
    this.textEl.style.animation = 'none';
    void this.textEl.offsetHeight; // force reflow
    this.textEl.style.animation = '';

    // Spawn stars
    this.spawnStars(8);

    // Play sound
    this.sound.play('reward');

    // Auto hide
    this.timeout = window.setTimeout(() => {
      this.overlay.classList.add('hidden');
      this.clearStars();
      this.timeout = null;
    }, 2500);
  }

  private spawnStars(count: number): void {
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.textContent = '⭐';
      star.style.left = `${20 + Math.random() * 60}%`;
      star.style.top = `${30 + Math.random() * 30}%`;
      star.style.animationDelay = `${Math.random() * 0.4}s`;
      star.style.fontSize = `${24 + Math.random() * 20}px`;
      document.body.appendChild(star);

      setTimeout(() => star.remove(), 2500);
    }
  }

  private clearStars(): void {
    document.querySelectorAll('.star').forEach(s => s.remove());
  }
}
