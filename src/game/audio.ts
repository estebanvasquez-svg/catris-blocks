import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { loadSave } from './storage';

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private noteIndex = 0;
  private activeVoices = 0;
  private readonly maxVoices = 12;
  private isBackgrounded = false;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isBackgrounded = document.hidden;
        if (this.isBackgrounded) {
          this.stopMusic();
        } else if (loadSave().options.music && this.ctx) {
          this.startMusic();
        }
      });
    }
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (loadSave().options.music && !this.musicTimer && !this.isBackgrounded) {
      this.startMusic();
    }
  }

  private canPlaySfx(): boolean {
    return loadSave().options.sfx && !!this.ctx && !this.isBackgrounded && this.activeVoices < this.maxVoices;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.14,
    delay = 0
  ): void {
    if (!this.ctx || this.activeVoices >= this.maxVoices) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    this.activeVoices++;
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick(): void {
    this.unlock();
    if (!this.canPlaySfx()) return;
    this.playTone(620, 880, 0.07, 'triangle', 0.13);
    this.hapticImpact(ImpactStyle.Light);
  }

  public playMove(): void {
    this.unlock();
    if (!this.canPlaySfx()) return;
    this.playTone(440, 520, 0.045, 'sine', 0.08);
  }

  public playRotate(): void {
    this.unlock();
    if (!this.canPlaySfx()) return;
    this.playTone(520, 780, 0.08, 'triangle', 0.12);
    this.hapticImpact(ImpactStyle.Light);
  }

  public playHold(): void {
    this.unlock();
    if (!this.canPlaySfx()) return;
    this.playTone(660, 490, 0.09, 'sine', 0.12);
    this.playTone(490, 740, 0.09, 'sine', 0.12, 0.06);
    this.hapticImpact(ImpactStyle.Light);
  }

  public playLock(): void {
    this.unlock();
    if (!this.canPlaySfx()) return;
    this.playTone(260, 150, 0.09, 'triangle', 0.15);
    this.hapticImpact(ImpactStyle.Medium);
  }

  public playMeowPop(linesCount = 1): void {
    this.unlock();
    if (!this.canPlaySfx()) return;
    // Cute synthesized "miau!" + pop sparkle chord
    this.playTone(680, 980, 0.12, 'triangle', 0.16);
    this.playTone(980, 720, 0.16, 'sine', 0.14, 0.1);
    const notes = [784, 988, 1175, 1568];
    for (let i = 0; i < Math.min(4, linesCount + 1); i++) {
      this.playTone(notes[i], notes[i] * 1.04, 0.16, 'sine', 0.11, 0.08 + i * 0.055);
    }
    this.hapticNotification(NotificationType.Success);
  }

  public playMeowNote(freq: number): void {
    this.unlock();
    if (!this.canPlaySfx()) return;
    this.playTone(freq * 0.85, freq * 1.12, 0.1, 'triangle', 0.16);
    this.playTone(freq * 1.12, freq * 0.96, 0.15, 'sine', 0.14, 0.08);
    this.hapticImpact(ImpactStyle.Light);
  }

  public playVictory(): void {
    this.unlock();
    if (!this.canPlaySfx()) return;
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    const times = [0, 0.1, 0.2, 0.32, 0.48, 0.6];
    fanfare.forEach((f, i) => {
      this.playTone(f, f, i === fanfare.length - 1 ? 0.38 : 0.14, 'triangle', 0.16, times[i]);
    });
    this.hapticNotification(NotificationType.Success);
  }

  public playGameOver(): void {
    this.unlock();
    if (!this.canPlaySfx()) return;
    const notes = [440, 392, 349.23, 293.66];
    notes.forEach((f, i) => {
      this.playTone(f, f * 0.92, 0.18, 'sine', 0.14, i * 0.13);
    });
    this.hapticNotification(NotificationType.Error);
  }

  public startMusic(): void {
    if (this.musicTimer !== null || !loadSave().options.music || this.isBackgrounded) return;
    if (!this.ctx) return;

    // Gentle kawaii marimba-like pentatonic loop
    const melody = [
      523.25, 659.25, 783.99, 659.25,
      880.0, 783.99, 659.25, 587.33,
      523.25, 587.33, 659.25, 783.99,
      659.25, 587.33, 523.25, 0,
    ];

    this.musicTimer = window.setInterval(() => {
      if (!loadSave().options.music || this.isBackgrounded || !this.ctx || this.ctx.state !== 'running') {
        return;
      }
      const freq = melody[this.noteIndex % melody.length];
      this.noteIndex++;
      if (freq > 0) {
        this.playTone(freq, freq, 0.22, 'sine', 0.038);
      }
    }, 320);
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public syncMusicOption(): void {
    if (loadSave().options.music) {
      this.unlock();
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  private hapticImpact(style: ImpactStyle): void {
    if (!loadSave().options.haptics) return;
    if (Capacitor.isNativePlatform()) {
      void Haptics.impact({ style });
    }
  }

  private hapticNotification(type: NotificationType): void {
    if (!loadSave().options.haptics) return;
    if (Capacitor.isNativePlatform()) {
      void Haptics.notification({ type });
    }
  }
}

export const sound = new SoundManager();
