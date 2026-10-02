/**
 * Lightweight synthesized audio feedback for Instagram-like tactile interactions.
 * Uses Web Audio API without needing external MP3/WAV assets.
 */
class AudioManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Subtle, warm double-pulse harmonic pop when liking a post.
   */
  public playLikeSound(): void {
    try {
      // Haptic vibration on mobile if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([18]);
      }

      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Primary tone (warm pop)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(740, now + 0.08);

      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.09);

      // Subtle second harmonic for depth
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(580, now + 0.03);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.11);

      gain2.gain.setValueAtTime(0.08, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.03);
      osc2.stop(now + 0.12);
    } catch {
      // Audio playback fails gracefully if muted/unsupported
    }
  }
}

export const audio = new AudioManager();
