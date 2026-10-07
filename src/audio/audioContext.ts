export class AudioContextManager {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static limiter: DynamicsCompressorNode | null = null;
  private static isInitialized = false;
  private static isUnlocked = false;

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

      this.isUnlocked = true;
    } catch (err) {
      console.warn('[AudioContextManager] Mobile Web Audio unlock notice:', err);
    }
  }

  /**
   * Initializes or resumes AudioContext strictly upon user interaction.
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
      this.setupGlobalTouchUnlock();
    }

    await this.unlockMobileAudio();
    return this.ctx;
  }

  /**
   * Registers automatic touch listeners to unlock Web Audio on mobile Safari/Chrome on first touch.
   */
  private static setupGlobalTouchUnlock(): void {
    if (typeof window === 'undefined' || this.isUnlocked) return;

    const unlockHandler = async () => {
      if (this.ctx) {
        await this.unlockMobileAudio();
        if (this.ctx.state === 'running') {
          window.removeEventListener('touchstart', unlockHandler, true);
          window.removeEventListener('touchend', unlockHandler, true);
          window.removeEventListener('click', unlockHandler, true);
        }
      }
    };

    window.addEventListener('touchstart', unlockHandler, { capture: true, passive: true });
    window.addEventListener('touchend', unlockHandler, { capture: true, passive: true });
    window.addEventListener('click', unlockHandler, { capture: true, passive: true });
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
