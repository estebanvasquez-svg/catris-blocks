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
  private safariUnlocked = false;
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
          this.unlock();
        }
      });
    }
    if (typeof window !== 'undefined') {
      const unlockOnGesture = () => {
        if (
          !this.ctx ||
          this.ctx.state !== 'running' ||
          !this.safariUnlocked ||
          (loadSave().options.music && !this.musicTimer && !this.isBackgrounded)
        ) {
          this.unlock();
        }
      };
      window.addEventListener('touchstart', unlockOnGesture, { passive: true, capture: true });
      window.addEventListener('touchend', unlockOnGesture, { passive: true, capture: true });
      window.addEventListener('mousedown', unlockOnGesture, { passive: true, capture: true });
      window.addEventListener('click', unlockOnGesture, { passive: true, capture: true });
      window.addEventListener('pointerdown', unlockOnGesture, { passive: true, capture: true });
      window.addEventListener('keydown', unlockOnGesture, { passive: true, capture: true });
    }
  }

  private playSilentUnlockBuffer(): void {
    if (!this.ctx || this.safariUnlocked) return;
    try {
      const buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate || 44100);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
      this.safariUnlocked = true;
    } catch {
      // Ignore if context is not ready yet
    }
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.ctx.onstatechange = () => {
          if (this.ctx?.state === 'running' && loadSave().options.music && !this.musicTimer && !this.isBackgrounded) {
            this.startMusic();
          }
        };
      }
    }
    if (!this.ctx) return;

    // Safari (iOS & macOS) requires resume() + a silent buffer inside touchstart/mousedown/click
    this.playSilentUnlockBuffer();

    if (this.ctx.state !== 'running') {
      void this.ctx.resume().then(() => {
        this.playSilentUnlockBuffer();
        if (loadSave().options.music && !this.musicTimer && !this.isBackgrounded) {
          this.startMusic();
        }
      }).catch(() => {});
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
    const t0 = Math.max(startTime, this.ctx.currentTime + 0.005);
    const dur = Math.max(0.12, duration);
    const attackEnd = t0 + 0.028;
    const decayMid = Math.min(t0 + dur - 0.02, Math.max(attackEnd + 0.02, t0 + Math.min(0.45, dur * 0.45)));

    // Warm dark-lofi lowpass on piano: removes treble/highs while keeping warm mids
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(0.55, t0);
    filter.frequency.setValueAtTime(Math.min(1150, Math.max(520, freq * 1.85)), t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(320, freq * 1.05), t0 + dur);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(volume, attackEnd);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.68), decayMid);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    // Warm Rhodes/felt blend with minimal upper harmonics
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t0);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, t0);
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.12, t0);

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 2, t0);
    const g3 = this.ctx.createGain();
    g3.gain.setValueAtTime(0.05, t0);

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

    const stopTime = t0 + dur + 0.03;
    osc1.start(t0);
    osc2.start(t0);
    osc3.start(t0);
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

  private playSoftPad(freqs: number[], startTime: number, duration: number, volume = 0.036): void {
    if (!this.ctx || !this.musicGain) return;
    const t0 = Math.max(startTime, this.ctx.currentTime + 0.005);
    const dur = Math.max(0.6, duration);
    const fadeIn = Math.min(0.5, dur * 0.3);
    const fadeOutStart = Math.max(t0 + fadeIn + 0.05, t0 + dur - 0.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1050, t0);
    filter.Q.setValueAtTime(0.6, t0);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(volume, t0 + fadeIn);
    env.gain.setValueAtTime(volume * 0.94, fadeOutStart);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    filter.connect(env);
    env.connect(this.musicGain);

    const oscs: OscillatorNode[] = [];
    for (const freq of freqs) {
      for (const detune of [-7, 0, 7]) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        osc.detune.setValueAtTime(detune, t0);
        osc.connect(filter);
        osc.start(t0);
        osc.stop(t0 + dur + 0.04);
        oscs.push(osc);
      }
    }

    if (oscs.length > 0) {
      oscs[0].onended = () => {
        for (const o of oscs) o.disconnect();
        filter.disconnect();
        env.disconnect();
      };
    }
  }

  private playBluesKick(startTime: number, volume = 0.22): void {
    const dest = this.musicGain;
    if (!this.ctx || !dest) return;
    const t0 = Math.max(startTime, this.ctx.currentTime + 0.005);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(96, t0);
    osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.14);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.19);

    osc.connect(gain);
    gain.connect(dest);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(t0);
    osc.stop(t0 + 0.21);
  }

  private playBluesSnare(startTime: number, volume = 0.1): void {
    const dest = this.musicGain;
    if (!this.ctx || !dest) return;
    const t0 = Math.max(startTime, this.ctx.currentTime + 0.005);
    const buf = this.getNoiseBuffer();
    if (buf) {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1150, t0);
      filter.Q.setValueAtTime(0.85, t0);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      src.onended = () => {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
      src.start(t0);
      src.stop(t0 + 0.17);
    }

    // Warm lofi snare/rim body
    const body = this.ctx.createOscillator();
    const bGain = this.ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(165, t0);
    body.frequency.exponentialRampToValueAtTime(92, t0 + 0.07);
    bGain.gain.setValueAtTime(volume * 0.6, t0);
    bGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
    body.connect(bGain);
    bGain.connect(dest);
    body.onended = () => {
      body.disconnect();
      bGain.disconnect();
    };
    body.start(t0);
    body.stop(t0 + 0.1);
  }

  private playBluesBrushHat(startTime: number, volume = 0.045, open = false): void {
    const dest = this.musicGain;
    if (!this.ctx || !dest) return;
    const t0 = Math.max(startTime, this.ctx.currentTime + 0.005);
    const buf = this.getNoiseBuffer();
    if (!buf) return;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(3800, t0);
    bp.Q.setValueAtTime(0.9, t0);

    const dur = open ? 0.15 : 0.055;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(dest);
    src.onended = () => {
      src.disconnect();
      bp.disconnect();
      gain.disconnect();
    };
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  private playLofiSaxNote(
    freq: number,
    startTime: number,
    duration: number,
    volume = 0.085,
    scoop = false
  ): void {
    const dest = this.musicGain;
    if (!this.ctx || !dest) return;
    const t0 = Math.max(startTime, this.ctx.currentTime + 0.005);
    const dur = Math.max(0.14, duration);
    const attackEnd = t0 + Math.min(0.065, dur * 0.28);
    const releaseStart = Math.max(attackEnd + 0.02, t0 + dur - 0.08);

    // Warm lofi lowpass filter (rolls off harsh reed harmonics for a velvety sax)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.2, t0);
    filter.frequency.setValueAtTime(Math.min(1020, freq * 2.1), t0);
    filter.frequency.linearRampToValueAtTime(Math.min(780, freq * 1.65), t0 + dur);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(volume, attackEnd);
    env.gain.setValueAtTime(volume * 0.88, releaseStart);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    // Soft reed sawtooth + dominant warm sine body (smooth lofi sax, no harsh buzz)
    const reed = this.ctx.createOscillator();
    reed.type = 'sawtooth';
    const reedGain = this.ctx.createGain();
    reedGain.gain.setValueAtTime(0.35, t0);
    if (scoop) {
      reed.frequency.setValueAtTime(freq * 0.96, t0);
      reed.frequency.exponentialRampToValueAtTime(freq, t0 + 0.06);
    } else {
      reed.frequency.setValueAtTime(freq, t0);
    }

    const body = this.ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(freq, t0);
    const bodyGain = this.ctx.createGain();
    bodyGain.gain.setValueAtTime(0.7, t0);

    // Gentle lofi vibrato
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4.5, t0);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0, t0);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.008, Math.min(t0 + dur * 0.5, t0 + 0.18));

    lfo.connect(lfoGain);
    lfoGain.connect(reed.frequency);
    lfoGain.connect(body.frequency);

    reed.connect(reedGain);
    reedGain.connect(filter);
    body.connect(bodyGain);
    bodyGain.connect(filter);

    filter.connect(env);
    env.connect(dest);

    // Subtle breath air texture
    const buf = this.getNoiseBuffer();
    let airSrc: AudioBufferSourceNode | null = null;
    let airFilter: BiquadFilterNode | null = null;
    let airGain: GainNode | null = null;
    if (buf) {
      airSrc = this.ctx.createBufferSource();
      airSrc.buffer = buf;
      airSrc.loop = true;
      airFilter = this.ctx.createBiquadFilter();
      airFilter.type = 'bandpass';
      airFilter.frequency.setValueAtTime(1100, t0);
      airFilter.Q.setValueAtTime(1.1, t0);
      airGain = this.ctx.createGain();
      airGain.gain.setValueAtTime(0.0001, t0);
      airGain.gain.linearRampToValueAtTime(volume * 0.12, attackEnd);
      airGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      airSrc.connect(airFilter);
      airFilter.connect(airGain);
      airGain.connect(dest);
      airSrc.start(t0);
      airSrc.stop(t0 + dur + 0.02);
    }

    reed.onended = () => {
      reed.disconnect();
      reedGain.disconnect();
      body.disconnect();
      bodyGain.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
      filter.disconnect();
      env.disconnect();
      if (airSrc && airFilter && airGain) {
        airSrc.disconnect();
        airFilter.disconnect();
        airGain.disconnect();
      }
    };

    const stopTime = t0 + dur + 0.03;
    reed.start(t0);
    body.start(t0);
    lfo.start(t0);
    reed.stop(stopTime);
    body.stop(stopTime);
    lfo.stop(stopTime);
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
        // Bar 0: Cmaj7 (1st inversion [E4, G4, B4, C5] - wistful & nostalgic)
        chord: [329.63, 392.0, 493.88, 523.25],
        altChord: [329.63, 392.0, 493.88],
        bass1: 130.81, // C3
        bass2: 98.0,   // G2
        melody: [
          { beat: 0.0, freq: 493.88, dur: 0.95, vol: 0.088 }, // B4 (wistful maj7)
          { beat: 1.0, freq: 392.0, dur: 0.72, vol: 0.082 },  // G4 (gentle sigh)
          { beat: 1 + swing, freq: 440.0, dur: 0.45, vol: 0.072 }, // A4
        ],
      },
      {
        // Bar 1: E7 (2nd inversion [B3, D4, E4, G#4], bittersweet pull)
        chord: [246.94, 329.63, 415.3],
        altChord: [246.94, 293.66, 329.63, 415.3], // E7 (2nd inv)
        bass1: 103.83, // G#2
        bass2: 123.47, // B2
        melody: [
          { beat: 0.0, freq: 493.88, dur: 0.9, vol: 0.088 },  // B4
          { beat: 1.0, freq: 415.3, dur: 0.62, vol: 0.082 },  // G#4
          { beat: 1 + swing, freq: 392.0, dur: 0.42, vol: 0.072 }, // G4 passing sigh
        ],
      },
      {
        // Bar 2: Fmaj7 (2nd inversion [C4, E4, F4, A4] - deep tender nostalgia)
        chord: [261.63, 329.63, 349.23, 440.0],
        altChord: [261.63, 329.63, 440.0],
        bass1: 110.0,  // A2
        bass2: 130.81, // C3
        melody: [
          { beat: 0.0, freq: 440.0, dur: 0.95, vol: 0.088 },  // A4
          { beat: 1.0, freq: 392.0, dur: 0.55, vol: 0.08 },   // G4
          { beat: 1 + swing, freq: 349.23, dur: 0.52, vol: 0.078 }, // F4
        ],
      },
      {
        // Bar 3: G6 -> G7 (1st inversion [B3, D4, E4, G4] -> [B3, F4, G4])
        chord: [246.94, 293.66, 329.63, 392.0],
        altChord: [246.94, 349.23, 392.0], // G7 1st inv
        bass1: 123.47, // B2
        bass2: 98.0,   // G2
        melody: [
          { beat: 0.0, freq: 329.63, dur: 0.85, vol: 0.085 }, // E4 (G6 yearning)
          { beat: 1.0, freq: 293.66, dur: 0.88, vol: 0.08 },  // D4
        ],
      },
      {
        // Bar 4: Cmaj7 (2nd inversion [G4, B4, C5, E5])
        chord: [392.0, 493.88, 523.25, 659.25],
        altChord: [392.0, 493.88, 659.25],
        bass1: 130.81, // C3
        bass2: 164.81, // E3
        melody: [
          { beat: 0.0, freq: 659.25, dur: 0.88, vol: 0.086 }, // E5
          { beat: 1.0, freq: 587.33, dur: 0.58, vol: 0.08 },  // D5
          { beat: 1 + swing, freq: 523.25, dur: 0.5, vol: 0.08 }, // C5
        ],
      },
      {
        // Bar 5: E7 (1st inversion [G#4, B4, D5, E5])
        chord: [415.3, 493.88, 659.25],
        altChord: [415.3, 493.88, 587.33],
        bass1: 164.81, // E3
        bass2: 103.83, // G#2
        melody: [
          { beat: 0.0, freq: 587.33, dur: 0.82, vol: 0.084 }, // D5 (bluesy 7th)
          { beat: 1.0, freq: 493.88, dur: 0.65, vol: 0.08 },  // B4
          { beat: 1 + swing, freq: 415.3, dur: 0.45, vol: 0.072 }, // G#4
        ],
      },
      {
        // Bar 6: Fmaj7 (1st inversion [A4, C5, E5, F5])
        chord: [440.0, 523.25, 659.25],
        altChord: [440.0, 523.25, 698.46],
        bass1: 174.61, // F3
        bass2: 110.0,  // A2
        melody: [
          { beat: 0.0, freq: 523.25, dur: 0.92, vol: 0.086 }, // C5
          { beat: 1.0, freq: 493.88, dur: 0.58, vol: 0.08 },  // B4
          { beat: 1 + swing, freq: 440.0, dur: 0.48, vol: 0.078 }, // A4
        ],
      },
      {
        // Bar 7: G6/Gsus4 (2nd inversion [D4, G4, A4, B4] -> tender turnaround)
        chord: [293.66, 392.0, 440.0, 493.88],
        altChord: [293.66, 349.23, 392.0, 493.88],
        bass1: 98.0,   // G2
        bass2: 146.83, // D3
        melody: [
          { beat: 0.0, freq: 440.0, dur: 0.88, vol: 0.084 },  // A4
          { beat: 1.0, freq: 392.0, dur: 0.92, vol: 0.08 },   // G4
        ],
      },
    ];

    const data = progression[bar];

    // Lush warm lofi pad underneath the piano chord (more presence + octave root)
    this.playSoftPad([data.bass1 * 2, ...data.chord], barStart, beatSec * 2.45, 0.042);

    // Piano Left Hand Bass (walking 2/4 with heavy sustain pedal)
    this.playPianoNote(data.bass1, barStart, beatSec * 1.65, 0.21);
    this.playPianoNote(data.bass2, barStart + beatSec, beatSec * 1.45, 0.18);

    // Piano Right Hand Chords (deep sustain pedal across the bar + swung blues comping)
    this.playPianoChord(data.chord, barStart, beatSec * 2.28, 0.115);
    this.playPianoChord(data.altChord, barStart + beatSec * (1 + swing), beatSec * 0.85, 0.08);

    // Expressive Blues-Kawaii Piano Melody (with generous sustain pedal tail)
    for (const note of data.melody) {
      const pedalDur = (note.dur + 0.5) * beatSec;
      this.playPianoNote(note.freq, barStart + note.beat * beatSec, pedalDur, (note.vol ?? 0.09) * 1.45);
    }

    // Blues Percussion in 2/4 Shuffle (soft nostalgic heartbeat)
    this.playBluesKick(barStart, 0.23);
    if (bar % 2 === 1) {
      this.playBluesKick(barStart + beatSec * (1 + swing), 0.14);
    }
    this.playBluesSnare(barStart + beatSec, 0.13); // Backbeat on beat 2

    // Triplet brush shuffle on ride/hi-hat
    this.playBluesBrushHat(barStart, 0.058, false);
    this.playBluesBrushHat(barStart + beatSec * swing, 0.044, false);
    this.playBluesBrushHat(barStart + beatSec, 0.062, false);
    this.playBluesBrushHat(barStart + beatSec * (1 + swing), 0.048, bar % 4 === 3);

    // Every 8 bars (bars 8..15 of each 16-bar cycle), add soft lofi saxophone accompaniment
    if (barIndex >= 8) {
      const saxPhrases: Array<Array<{ beat: number; freq: number; dur: number; scoop?: boolean }>> = [
        [
          { beat: 0.0, freq: 392.0, dur: 0.85, scoop: true }, // G4
          { beat: 1.0, freq: 329.63, dur: 0.55 },             // E4
          { beat: 1 + swing, freq: 392.0, dur: 0.38 },        // G4
        ],
        [
          { beat: 0.0, freq: 415.3, dur: 0.9, scoop: true },  // G#4
          { beat: 1.0, freq: 493.88, dur: 0.75 },             // B4
        ],
        [
          { beat: 0.0, freq: 523.25, dur: 0.85, scoop: true }, // C5
          { beat: 1.0, freq: 440.0, dur: 0.55 },              // A4
          { beat: 1 + swing, freq: 349.23, dur: 0.4 },        // F4
        ],
        [
          { beat: 0.0, freq: 392.0, dur: 0.7 },               // G4
          { beat: 1.0, freq: 349.23, dur: 0.55 },             // F4
          { beat: 1 + swing, freq: 293.66, dur: 0.42 },       // D4
        ],
        [
          { beat: 0.0, freq: 329.63, dur: 0.5, scoop: true }, // E4
          { beat: swing, freq: 392.0, dur: 0.4 },             // G4
          { beat: 1.0, freq: 523.25, dur: 0.88 },             // C5
        ],
        [
          { beat: 0.0, freq: 493.88, dur: 0.85, scoop: true }, // B4
          { beat: 1.0, freq: 415.3, dur: 0.55 },              // G#4
          { beat: 1 + swing, freq: 329.63, dur: 0.42 },       // E4
        ],
        [
          { beat: 0.0, freq: 440.0, dur: 0.8, scoop: true },  // A4
          { beat: 1.0, freq: 523.25, dur: 0.55 },             // C5
          { beat: 1 + swing, freq: 587.33, dur: 0.38 },       // D5
        ],
        [
          { beat: 0.0, freq: 493.88, dur: 0.9, scoop: true }, // B4
          { beat: 1.0, freq: 392.0, dur: 0.85 },              // G4
        ],
      ];

      for (const saxNote of saxPhrases[bar]) {
        this.playLofiSaxNote(
          saxNote.freq,
          barStart + saxNote.beat * beatSec,
          saxNote.dur * beatSec,
          0.095,
          saxNote.scoop
        );
      }
    }
  }

  public startMusic(): void {
    if (this.musicTimer !== null || !loadSave().options.music || this.isBackgrounded) return;
    if (!this.ctx) return;

    const BPM = 50;
    const BEAT_SEC = 60 / BPM;
    const BAR_SEC = BEAT_SEC * 2; // 2/4 time signature

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
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
        try {
          this.scheduleThemeBar(this.currentBar, this.nextBarTime, BEAT_SEC);
        } catch {
          // Keep scheduler alive
        }
        this.nextBarTime += BAR_SEC;
        this.currentBar = (this.currentBar + 1) % 16;
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
