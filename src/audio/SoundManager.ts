export class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();

  async init(): Promise<void> {
    this.ctx = new AudioContext();
    // Generate simple sounds programmatically (no external files needed)
    this.buffers.set('break', this.generateSound(0.1, 200, 100, 'sawtooth'));
    this.buffers.set('place', this.generateSound(0.08, 300, 400, 'square'));
  }

  private generateSound(
    duration: number,
    freqStart: number,
    freqEnd: number,
    type: OscillatorType,
  ): AudioBuffer {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = freqStart + (freqEnd - freqStart) * (i / length);
      const envelope = 1 - i / length;
      let sample = 0;
      const phase = 2 * Math.PI * freq * t;
      switch (type) {
        case 'sine': sample = Math.sin(phase); break;
        case 'square': sample = Math.sin(phase) > 0 ? 1 : -1; break;
        case 'sawtooth': sample = 2 * ((freq * t) % 1) - 1; break;
        case 'triangle': sample = Math.abs(4 * ((freq * t) % 1) - 2) - 1; break;
      }
      data[i] = sample * envelope * 0.3;
    }
    return buffer;
  }

  play(name: string): void {
    if (!this.ctx) return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    // Resume context if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    source.start();
  }
}
