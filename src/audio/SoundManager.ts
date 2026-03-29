export class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();

  async init(): Promise<void> {
    this.ctx = new AudioContext();
    // Generate simple sounds programmatically (no external files needed)
    this.buffers.set('break', this.generateSound(0.1, 200, 100, 'sawtooth'));
    this.buffers.set('place', this.generateSound(0.08, 300, 400, 'square'));
    this.buffers.set('reward', this.generateArpeggio([523, 659, 784, 1047], 0.12, 'sine'));
    this.buffers.set('mission', this.generateArpeggio([392, 494, 587, 659, 784], 0.1, 'sine'));
    this.buffers.set('tutorial', this.generateSound(0.15, 800, 1200, 'sine'));
    this.buffers.set('chirp', this.generateArpeggio([1200, 1500, 1800], 0.06, 'sine'));
    this.buffers.set('treasure', this.generateArpeggio([523, 659, 784, 880, 1047], 0.15, 'sine'));
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

  private generateArpeggio(freqs: number[], noteDuration: number, type: OscillatorType): AudioBuffer {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const totalLength = Math.floor(sampleRate * noteDuration * freqs.length);
    const buffer = ctx.createBuffer(1, totalLength, sampleRate);
    const data = buffer.getChannelData(0);
    const samplesPerNote = Math.floor(sampleRate * noteDuration);

    for (let n = 0; n < freqs.length; n++) {
      const freq = freqs[n];
      for (let i = 0; i < samplesPerNote; i++) {
        const t = i / sampleRate;
        const envelope = 1 - (i / samplesPerNote) * 0.5;
        const sample = Math.sin(2 * Math.PI * freq * t);
        data[n * samplesPerNote + i] = sample * envelope * 0.25;
      }
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
