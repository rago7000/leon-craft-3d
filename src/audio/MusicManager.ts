// Programmatic ambient music — warm, simple, child-friendly melody loop
// Uses Web Audio API oscillators, no external files

export class MusicManager {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private playing = false;
  private muted = false;
  private loopTimer: number | null = null;
  private volume = 0.06; // very quiet by default

  async init(): Promise<void> {
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.volume;
    this.gainNode.connect(this.ctx.destination);
  }

  start(): void {
    if (this.playing || !this.ctx || !this.gainNode) return;
    this.playing = true;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.playLoop();
  }

  private playLoop(): void {
    if (!this.playing || !this.ctx || !this.gainNode) return;
    this.playMelody();
    // Loop every ~16 seconds (melody duration + pause)
    this.loopTimer = window.setTimeout(() => this.playLoop(), 16000);
  }

  private playMelody(): void {
    if (!this.ctx || !this.gainNode) return;

    // Warm pentatonic melody: C4 D4 E4 G4 A4 G4 E4 D4 C4 — with pauses
    const notes = [
      { freq: 262, time: 0, dur: 0.8 },    // C4
      { freq: 294, time: 1.0, dur: 0.6 },   // D4
      { freq: 330, time: 1.8, dur: 0.8 },   // E4
      { freq: 392, time: 2.8, dur: 1.0 },   // G4
      { freq: 440, time: 4.0, dur: 1.2 },   // A4
      { freq: 392, time: 5.5, dur: 0.8 },   // G4
      { freq: 330, time: 6.5, dur: 0.6 },   // E4
      { freq: 294, time: 7.3, dur: 0.8 },   // D4
      { freq: 262, time: 8.3, dur: 1.5 },   // C4 (long)
      // Second phrase — higher, dreamy
      { freq: 330, time: 10.5, dur: 0.6 },  // E4
      { freq: 392, time: 11.3, dur: 0.8 },  // G4
      { freq: 523, time: 12.3, dur: 1.2 },  // C5
      { freq: 440, time: 13.8, dur: 1.0 },  // A4
      { freq: 392, time: 15.0, dur: 1.0 },  // G4 (resolve)
    ];

    const now = this.ctx.currentTime;
    for (const note of notes) {
      this.playNote(note.freq, now + note.time, note.dur);
    }
  }

  private playNote(freq: number, startTime: number, duration: number): void {
    if (!this.ctx || !this.gainNode) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    // Soft envelope
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(1, startTime + 0.05);
    env.gain.linearRampToValueAtTime(0.7, startTime + duration * 0.3);
    env.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(env);
    env.connect(this.gainNode);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.gainNode) {
      this.gainNode.gain.value = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  stop(): void {
    this.playing = false;
    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }
}
