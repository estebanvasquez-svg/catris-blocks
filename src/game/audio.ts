import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { loadSave } from './storage';

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private nextBarTime = 0;
  private currentBar = 0;
  private activeVoices = 0;
  private readonly maxVoices = 16;
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

  private getNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = Math.floor(this.ctx.sampleRate * 0.25);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private playPianoNote(freq: number, startTime: number, duration: number, volume: number): void {
    if (!this.ctx || !this.musicGain) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(3400, freq * 5.2), startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(420, freq * 1.9), startTime + duration);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(volume, startTime + 0.012);
    env.gain.exponentialRampToValueAtTime(volume * 0.45, startTime + Math.min(0.28, duration * 0.35));
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Warm fundamental + soft 2nd & 3rd harmonics for acoustic/electric piano body
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.26, startTime);

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, startTime);
    const g3 = this.ctx.createGain();
    g3.gain.setValueAtTime(0.08, startTime);

    osc1.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);
    osc3.connect(g3);
    g3.connect(filter);

    filter.connect(env);
    env.connect(this.musicGain);

    osc1.onended = () => {
      osc1.disconnect();
      osc2.disconnect();
      osc3.disconnect();
      g2.disconnect();
      g3.disconnect();
      filter.disconnect();
      env.disconnect();
    };

    const stopTime = startTime + duration + 0.03;
    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
  }

  private playPianoChord(freqs: number[], startTime: number, duration: number, volume: number): void {
    // Slight 14ms upward roll like a relaxed blues pianist's hand
    freqs.forEach((f, idx) => {
      this.playPianoNote(f, startTime + idx * 0.014, duration, volume);
    });
  }

  private playBluesKick(startTime: number, volume = 0.22): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, startTime);
    osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.13);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.17);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(startTime);
    osc.stop(startTime + 0.19);
  }

  private playBluesSnare(startTime: number, volume = 0.1): void {
    if (!this.ctx || !this.musicGain) return;
    const buf = this.getNoiseBuffer();
    if (buf) {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, startTime);
      filter.Q.setValueAtTime(0.9, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      src.onended = () => {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
      src.start(startTime);
      src.stop(startTime + 0.16);
    }

    // Warm snare/rim body
    const body = this.ctx.createOscillator();
    const bGain = this.ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(185, startTime);
    body.frequency.exponentialRampToValueAtTime(105, startTime + 0.06);
    bGain.gain.setValueAtTime(volume * 0.55, startTime);
    bGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08);
    body.connect(bGain);
    bGain.connect(this.musicGain);
    body.onended = () => {
      body.disconnect();
      bGain.disconnect();
    };
    body.start(startTime);
    body.stop(startTime + 0.09);
  }

  private playBluesBrushHat(startTime: number, volume = 0.045, open = false): void {
    if (!this.ctx || !this.musicGain) return;
    const buf = this.getNoiseBuffer();
    if (!buf) return;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(6200, startTime);

    const dur = open ? 0.15 : 0.055;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    src.connect(hp);
    hp.connect(gain);
    gain.connect(this.musicGain);
    src.onended = () => {
      src.disconnect();
      hp.disconnect();
      gain.disconnect();
    };
    src.start(startTime);
    src.stop(startTime + dur + 0.02);
  }

  private scheduleThemeBar(barIndex: number, barStart: number, beatSec: number): void {
    // 2/4 time signature at 55 BPM -> 2 beats per bar, swung triplet blues feel (2/3 of beat)
    const bar = barIndex % 8;
    const swing = 2 / 3;

    // Coherent voice-leading piano inversions for C -> E -> F -> G (8-bar A/B arrangement):
    // Bar 0 (C 1st inv):  E4, G4, C5
    // Bar 1 (E root):     E4, G#4, B4  (E4 stays, G4->G#4, C5->B4)
    // Bar 2 (F root):     F4, A4, C5   (each voice steps +1 semitone from E!)
    // Bar 3 (G7 3rd inv): F4, G4, B4   (F4 stays, A4->G4, C5->B4 -> resolves cleanly to C!)
    // Bar 4 (C 2nd inv):  G4, C5, E5   (brighter lift for B section)
    // Bar 5 (E 1st inv):  G#4, B4, E5  (E5 stays, G4->G#4, C5->B4)
    // Bar 6 (F 1st inv):  A4, C5, F5   (each voice steps +1 semitone!)
    // Bar 7 (G 2nd inv):  G4, B4, D5   (smooth turnaround back to C)
    const progression: Array<{
      chord: number[];
      altChord: number[];
      bass1: number;
      bass2: number;
      melody: Array<{ beat: number; freq: number; dur: number; vol?: number }>;
    }> = [
      {
        // Bar 0: C (1st inversion)
        chord: [329.63, 392.0, 523.25],
        altChord: [329.63, 392.0, 523.25],
        bass1: 130.81, // C3
        bass2: 98.0,   // G2
        melody: [
          { beat: 0.0, freq: 523.25, dur: 0.72, vol: 0.095 }, // C5
          { beat: swing, freq: 659.25, dur: 0.42, vol: 0.085 }, // E5
          { beat: 1.0, freq: 783.99, dur: 0.78, vol: 0.1 },   // G5
          { beat: 1 + swing, freq: 659.25, dur: 0.4, vol: 0.08 }, // E5
        ],
      },
      {
        // Bar 1: E (root position, smooth voice leading from C)
        chord: [329.63, 415.3, 493.88],
        altChord: [329.63, 415.3, 493.88, 587.33], // E7 color on off-beat
        bass1: 164.81, // E3
        bass2: 123.47, // B2
        melody: [
          { beat: 0.0, freq: 622.25, dur: 0.16, vol: 0.065 }, // Eb5 blue-note grace
          { beat: 0.12, freq: 659.25, dur: 0.65, vol: 0.095 }, // E5
          { beat: 1.0, freq: 587.33, dur: 0.55, vol: 0.088 }, // D5 (bluesy 7th)
          { beat: 1 + swing, freq: 493.88, dur: 0.42, vol: 0.08 }, // B4
        ],
      },
      {
        // Bar 2: F (root position, +1 semitone resolution from E)
        chord: [349.23, 440.0, 523.25],
        altChord: [349.23, 440.0, 523.25],
        bass1: 174.61, // F3
        bass2: 130.81, // C3
        melody: [
          { beat: 0.0, freq: 523.25, dur: 0.7, vol: 0.095 }, // C5
          { beat: swing, freq: 587.33, dur: 0.36, vol: 0.08 }, // D5
          { beat: 1.0, freq: 698.46, dur: 0.78, vol: 0.095 }, // F5
          { beat: 1 + swing, freq: 659.25, dur: 0.42, vol: 0.082 }, // E5
        ],
      },
      {
        // Bar 3: G7 (3rd inversion [F4, G4, B4] -> resolves to C [E4, G4, C5])
        chord: [349.23, 392.0, 493.88],
        altChord: [293.66, 392.0, 493.88], // G 2nd inv
        bass1: 98.0,   // G2
        bass2: 123.47, // B2
        melody: [
          { beat: 0.0, freq: 587.33, dur: 0.7, vol: 0.095 }, // D5
          { beat: 1.0, freq: 493.88, dur: 0.58, vol: 0.085 }, // B4
          { beat: 1 + swing, freq: 587.33, dur: 0.4, vol: 0.082 }, // D5
        ],
      },
      {
        // Bar 4: C (2nd inversion [G4, C5, E5])
        chord: [392.0, 523.25, 659.25],
        altChord: [392.0, 523.25, 659.25],
        bass1: 130.81, // C3
        bass2: 164.81, // E3
        melody: [
          { beat: 0.0, freq: 783.99, dur: 0.74, vol: 0.095 }, // G5
          { beat: swing, freq: 659.25, dur: 0.4, vol: 0.085 }, // E5
          { beat: 1.0, freq: 622.25, dur: 0.14, vol: 0.06 },  // Eb5 blues slide
          { beat: 1.1, freq: 659.25, dur: 0.7, vol: 0.09 },   // E5
        ],
      },
      {
        // Bar 5: E (1st inversion [G#4, B4, E5])
        chord: [415.3, 493.88, 659.25],
        altChord: [415.3, 493.88, 587.33],
        bass1: 164.81, // E3
        bass2: 103.83, // G#2
        melody: [
          { beat: 0.0, freq: 659.25, dur: 0.68, vol: 0.092 }, // E5
          { beat: swing, freq: 783.99, dur: 0.4, vol: 0.085 }, // G5
          { beat: 1.0, freq: 830.61, dur: 0.62, vol: 0.09 },  // G#5
          { beat: 1 + swing, freq: 783.99, dur: 0.42, vol: 0.082 }, // G5
        ],
      },
      {
        // Bar 6: F (1st inversion [A4, C5, F5])
        chord: [440.0, 523.25, 698.46],
        altChord: [440.0, 523.25, 698.46],
        bass1: 174.61, // F3
        bass2: 110.0,  // A2
        melody: [
          { beat: 0.0, freq: 880.0, dur: 0.74, vol: 0.095 },  // A5
          { beat: swing, freq: 783.99, dur: 0.38, vol: 0.082 }, // G5
          { beat: 1.0, freq: 698.46, dur: 0.65, vol: 0.09 },  // F5
          { beat: 1 + swing, freq: 659.25, dur: 0.4, vol: 0.082 }, // E5
        ],
      },
      {
        // Bar 7: G (2nd inversion [D4, G4, B4] / turnaround)
        chord: [293.66, 392.0, 493.88],
        altChord: [349.23, 392.0, 493.88],
        bass1: 98.0,   // G2
        bass2: 146.83, // D3
        melody: [
          { beat: 0.0, freq: 587.33, dur: 0.66, vol: 0.092 }, // D5
          { beat: swing, freq: 659.25, dur: 0.38, vol: 0.08 }, // E5
          { beat: 1.0, freq: 587.33, dur: 0.55, vol: 0.085 }, // D5
          { beat: 1 + swing, freq: 493.88, dur: 0.42, vol: 0.078 }, // B4
        ],
      },
    ];

    const data = progression[bar];

    // Piano Left Hand Bass (walking 2/4)
    this.playPianoNote(data.bass1, barStart, beatSec * 0.92, 0.135);
    this.playPianoNote(data.bass2, barStart + beatSec, beatSec * 0.9, 0.115);

    // Piano Right Hand Chords (warm downbeat + gentle swung blues comping)
    this.playPianoChord(data.chord, barStart, beatSec * 0.95, 0.068);
    this.playPianoChord(data.altChord, barStart + beatSec * (1 + swing), beatSec * 0.45, 0.048);

    // Expressive Blues-Kawaii Piano Melody
    for (const note of data.melody) {
      this.playPianoNote(note.freq, barStart + note.beat * beatSec, note.dur * beatSec, note.vol ?? 0.09);
    }

    // Blues Percussion in 2/4 Shuffle
    this.playBluesKick(barStart, 0.22);
    if (bar % 2 === 1) {
      this.playBluesKick(barStart + beatSec * (1 + swing), 0.13);
    }
    this.playBluesSnare(barStart + beatSec, 0.11); // Backbeat on beat 2

    // Triplet brush shuffle on ride/hi-hat
    this.playBluesBrushHat(barStart, 0.048, false);
    this.playBluesBrushHat(barStart + beatSec * swing, 0.036, false);
    this.playBluesBrushHat(barStart + beatSec, 0.052, false);
    this.playBluesBrushHat(barStart + beatSec * (1 + swing), 0.04, bar % 4 === 3);
  }

  public startMusic(): void {
    if (this.musicTimer !== null || !loadSave().options.music || this.isBackgrounded) return;
    if (!this.ctx) return;

    const BPM = 55;
    const BEAT_SEC = 60 / BPM;
    const BAR_SEC = BEAT_SEC * 2; // 2/4 time signature

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.musicGain.connect(this.ctx.destination);

    this.currentBar = 0;
    this.nextBarTime = this.ctx.currentTime + 0.06;

    const scheduleAheadSec = 0.35;
    const scheduler = () => {
      if (!loadSave().options.music || this.isBackgrounded || !this.ctx || this.ctx.state !== 'running') {
        return;
      }
      if (this.nextBarTime < this.ctx.currentTime - 0.1) {
        this.nextBarTime = this.ctx.currentTime + 0.05;
      }
      while (this.nextBarTime < this.ctx.currentTime + scheduleAheadSec) {
        this.scheduleThemeBar(this.currentBar, this.nextBarTime, BEAT_SEC);
        this.nextBarTime += BAR_SEC;
        this.currentBar = (this.currentBar + 1) % 8;
      }
    };

    scheduler();
    this.musicTimer = window.setInterval(scheduler, 100);
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicGain) {
      this.musicGain.disconnect();
      this.musicGain = null;
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
