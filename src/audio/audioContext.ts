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
   * Unlocks Web Audio hardware on mobile browsers (iOS Safari & Android Chrome)
   * by firing a 1-sample silent AudioBuffer pulse and calling ctx.resume().
   */
  public static async unlockMobileAudio(): Promise<void> {
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      // Play 1-sample silent buffer to unlock iOS Safari & Android Web Audio hardware
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
    } catch (err) {
      console.warn('[AudioContextManager] Mobile Web Audio unlock notice:', err);
    }
  }

  /**
   * Initializes or resumes AudioContext strictly upon explicit user interaction.
   */
  public static async init(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

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

    await this.unlockMobileAudio();
    return this.ctx;
  }

  /**
   * Suspends the AudioContext immediately when the user clicks Stop / Mute.
   */
  public static async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      try {
        await this.ctx.suspend();
      } catch (err) {
        console.warn('[AudioContextManager] Suspend notice:', err);
      }
    }
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

  private static tap: MediaStreamAudioDestinationNode | null = null;

  /** A MediaStream of everything the app plays (for the Record button). */
  public static getRecordStream(): MediaStream | null {
    if (!this.ctx || !this.masterGain) return null;
    if (!this.tap) {
      this.tap = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.tap);
    }
    return this.tap.stream;
  }

  public static supportsStereoPanner(): boolean {
    return typeof StereoPannerNode !== 'undefined';
  }
}
