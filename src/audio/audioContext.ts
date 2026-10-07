export class AudioContextManager {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static limiter: DynamicsCompressorNode | null = null;
  private static isInitialized = false;

  public static getContext(): AudioContext | null {
    return this.ctx;
  }

  public static isReady(): boolean {
    return this.isInitialized && this.ctx !== null && this.ctx.state === 'running';
  }

  /**
   * Initializes or resumes AudioContext strictly upon user interaction.
   */
  public static async init(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Dynamics compressor as brick-wall limiter to protect hearing and prevent digital clipping
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-4, this.ctx.currentTime);
      this.limiter.knee.setValueAtTime(6, this.ctx.currentTime);
      this.limiter.ratio.setValueAtTime(16, this.ctx.currentTime);
      this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.limiter.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      // Routing: Sources -> Limiter -> MasterGain -> Destination
      this.limiter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.isInitialized = true;
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  public static getMasterNode(): AudioNode | null {
    return this.limiter;
  }

  public static setMasterVolume(vol: number): void {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1.5, vol));
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
    }
  }

  public static supportsStereoPanner(): boolean {
    return typeof StereoPannerNode !== 'undefined';
  }
}
