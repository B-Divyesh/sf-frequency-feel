import type { FilterSettings } from './model';

export type ListenMode = 'before' | 'after';

export class FrequencyAudio {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private master: GainNode | null = null;
  private settings: FilterSettings;
  private mode: ListenMode = 'after';
  private volume = 0.18;

  constructor(settings: FilterSettings) {
    this.settings = { ...settings };
  }

  get supported(): boolean {
    return 'AudioContext' in window || 'webkitAudioContext' in window;
  }

  get playing(): boolean {
    return this.context?.state === 'running' && this.source !== null;
  }

  async play(): Promise<void> {
    if (!this.supported) throw new Error('Web Audio is not available in this browser.');
    if (!this.context) this.createGraph();
    await this.context?.resume();
  }

  async pause(): Promise<void> {
    await this.context?.suspend();
  }

  setMode(mode: ListenMode): void {
    this.mode = mode;
    this.applyMix();
  }

  setVolume(value: number): void {
    this.volume = value;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.02);
    }
  }

  update(settings: FilterSettings): void {
    this.settings = { ...settings };
    if (!this.context || !this.filter) return;
    const now = this.context.currentTime;
    this.filter.type = settings.type;
    this.filter.frequency.setTargetAtTime(settings.frequency, now, 0.015);
    this.filter.Q.setTargetAtTime(settings.q, now, 0.015);
    this.filter.gain.setTargetAtTime(settings.gain, now, 0.015);
    this.applyMix();
  }

  getResponse(frequencies: Float32Array<ArrayBuffer>): Float32Array<ArrayBuffer> {
    const magnitude = new Float32Array(frequencies.length);
    const phase = new Float32Array(frequencies.length);
    if (this.filter) {
      this.filter.getFrequencyResponse(frequencies, magnitude, phase);
      return magnitude;
    }
    const OfflineContext = window.OfflineAudioContext;
    if (OfflineContext) {
      const context = new OfflineContext(1, 1, 44100);
      const filter = context.createBiquadFilter();
      filter.type = this.settings.type;
      filter.frequency.value = this.settings.frequency;
      filter.Q.value = this.settings.q;
      filter.gain.value = this.settings.gain;
      filter.getFrequencyResponse(frequencies, magnitude, phase);
      return magnitude;
    }
    magnitude.fill(1);
    return magnitude;
  }

  private createGraph(): void {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextClass({ latencyHint: 'interactive' });
    this.source = this.context.createBufferSource();
    this.source.buffer = this.makeOriginalLoop(this.context);
    this.source.loop = true;

    this.filter = this.context.createBiquadFilter();
    this.dryGain = this.context.createGain();
    this.wetGain = this.context.createGain();
    this.master = this.context.createGain();
    this.master.gain.value = this.volume;

    this.source.connect(this.dryGain).connect(this.master);
    this.source.connect(this.filter).connect(this.wetGain).connect(this.master);
    this.master.connect(this.context.destination);
    this.update(this.settings);
    this.applyMix(true);
    this.source.start();
  }

  private applyMix(immediate = false): void {
    if (!this.context || !this.dryGain || !this.wetGain) return;
    const now = this.context.currentTime;
    const time = immediate ? 0.001 : 0.025;
    const wetMatch = this.estimateWetMatch();
    const dry = this.mode === 'before' ? 1 : 0;
    const wet = this.mode === 'after' ? wetMatch : 0;
    this.dryGain.gain.setTargetAtTime(dry, now, time);
    this.wetGain.gain.setTargetAtTime(wet, now, time);
  }

  private estimateWetMatch(): number {
    const frequencies = new Float32Array([80, 125, 200, 315, 500, 800, 1250, 2000, 3150, 5000, 8000, 12000]);
    const response = this.getResponse(frequencies);
    const weights = [0.25, 0.35, 0.5, 0.7, 0.85, 1, 1, 0.9, 0.75, 0.6, 0.4, 0.2];
    let energy = 0;
    let weight = 0;
    response.forEach((magnitude, index) => {
      energy += magnitude * magnitude * weights[index];
      weight += weights[index];
    });
    return Math.min(2.25, Math.max(0.55, 1 / Math.sqrt(energy / weight)));
  }

  private makeOriginalLoop(context: AudioContext): AudioBuffer {
    const duration = 4;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 24681357;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const notes = [110, 164.81, 220, 329.63];
    for (let index = 0; index < data.length; index += 1) {
      const time = index / sampleRate;
      const step = Math.floor(time * 4) % 16;
      const within = (time * 4) % 1;
      const envelope = Math.exp(-within * 5.2);
      const fundamental = notes[Math.floor(step / 4) % notes.length];
      let sample = 0;
      for (let harmonic = 1; harmonic <= 9; harmonic += 1) {
        sample += Math.sin(2 * Math.PI * fundamental * harmonic * time) * (1 / harmonic) * envelope * 0.13;
      }
      if (step % 4 === 2) sample += (random() * 2 - 1) * Math.exp(-within * 16) * 0.16;
      sample += Math.sin(2 * Math.PI * 55 * time) * Math.exp(-((time * 2) % 1) * 9) * 0.12;
      data[index] = Math.max(-0.8, Math.min(0.8, sample));
    }
    return buffer;
  }
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
