export type RingerMode = 'full' | 'normal' | 'silent_vibrate';
export type RingtoneId = 'marimba' | 'zen' | 'digital' | 'flute' | 'radar' | 'sunrise' | 'crystal';

export interface RingtoneOption {
  id: RingtoneId;
  name: string;
  description: string;
}

export const RINGTONE_OPTIONS: RingtoneOption[] = [
  { id: 'marimba', name: 'Marimba Chime', description: 'Upbeat modern marimba arpeggio' },
  { id: 'zen', name: 'Zen Bell', description: 'Deep calming meditation singing bowl' },
  { id: 'digital', name: 'Digital Pulse', description: 'Modern sleek electronic synth melody' },
  { id: 'flute', name: 'Echo Flute', description: 'Warm soothing melodic flute chord' },
  { id: 'radar', name: 'Radar Ping', description: 'Crisp attention-grabbing alert' },
  { id: 'sunrise', name: 'Gentle Sunrise', description: 'Uplifting morning chord harmony' },
  { id: 'crystal', name: 'Crystal Drops', description: 'High sparkling bell tones' },
];

export class ChimeService {
  private static audioCtx: AudioContext | null = null;
  private static activeGainNode: GainNode | null = null;
  private static activeOscillators: OscillatorNode[] = [];
  private static loopTimer: any = null;

  private static volumeLevel: number = (() => {
    try {
      const saved = localStorage.getItem('recallme_volume_level');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    } catch (e) {}
    return 1.0; // 100% full volume default
  })();

  private static ringerMode: RingerMode = (() => {
    try {
      const saved = localStorage.getItem('recallme_ringer_mode');
      if (saved === 'full' || saved === 'normal' || saved === 'silent_vibrate') {
        return saved;
      }
    } catch (e) {}
    return 'full';
  })();

  private static currentRingtone: RingtoneId = (() => {
    try {
      const saved = localStorage.getItem('recallme_ringtone') as RingtoneId;
      if (saved && RINGTONE_OPTIONS.some((r) => r.id === saved)) {
        return saved;
      }
    } catch (e) {}
    return 'marimba';
  })();

  public static setVolume(level: number) {
    const clamped = Math.max(0, Math.min(1, level));
    this.volumeLevel = clamped;
    if (clamped === 0) {
      this.ringerMode = 'silent_vibrate';
    } else {
      this.ringerMode = 'full';
    }
    try {
      localStorage.setItem('recallme_volume_level', clamped.toString());
      localStorage.setItem('recallme_ringer_mode', this.ringerMode);
    } catch (e) {}
  }

  public static getVolume(): number {
    if (this.ringerMode === 'silent_vibrate') return 0;
    return this.volumeLevel;
  }

  public static setRingerMode(mode: RingerMode) {
    this.ringerMode = mode;
    if (mode === 'silent_vibrate') {
      this.volumeLevel = 0;
    } else if (this.volumeLevel === 0) {
      this.volumeLevel = 1.0;
    }
    try {
      localStorage.setItem('recallme_ringer_mode', mode);
      localStorage.setItem('recallme_volume_level', this.volumeLevel.toString());
    } catch (e) {}
  }

  public static getRingerMode(): RingerMode {
    return this.ringerMode;
  }

  public static setRingtone(ringtone: RingtoneId) {
    this.currentRingtone = ringtone;
    try {
      localStorage.setItem('recallme_ringtone', ringtone);
    } catch (e) {}
  }

  public static getRingtone(): RingtoneId {
    return this.currentRingtone;
  }

  /**
   * Initializes or unlocks the AudioContext synchronously for immediate browser playback
   */
  private static getContext(): AudioContext {
    if (typeof window === 'undefined') {
      throw new Error('AudioContext not supported on server');
    }
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public static triggerVibration(pattern: number[] = [400, 200, 400, 200, 600]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  public static triggerHapticError(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch (e) {}
    }
  }

  public static playGentleReminderChime(durationSeconds: number = 60): void {
    this.playReminderMusic(this.currentRingtone, durationSeconds);
  }

  /**
   * Preview a ringtone explicitly (at chosen or full volume for testing in browser and mobile)
   */
  public static previewRingtone(ringtoneId: RingtoneId, durationSeconds: number = 4, customVol?: number, onEnd?: () => void): void {
    this.stopAllAudio();
    this.triggerVibration([60]);

    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      this.activeGainNode = masterGain;

      const effectiveVol = customVol !== undefined ? customVol : (this.volumeLevel > 0 ? this.volumeLevel : 1.0);
      const peakGain = Math.max(0.12, effectiveVol * 0.95);

      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.exponentialRampToValueAtTime(peakGain, now + 0.1);
      masterGain.gain.setValueAtTime(peakGain, now + durationSeconds - 0.7);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);
      masterGain.connect(ctx.destination);

      const notes = this.getNotesForRingtone(ringtoneId);
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = note.type || 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        const decay = note.decay || 1.0;
        noteGain.gain.setValueAtTime(0, now + note.time);
        noteGain.gain.linearRampToValueAtTime(0.5, now + note.time + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.005, now + note.time + decay);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + note.time);
        osc.stop(now + note.time + decay + 0.1);
        this.activeOscillators.push(osc);
      });

      if (onEnd) {
        setTimeout(onEnd, durationSeconds * 1000);
      }
    } catch (e) {
      console.warn('Preview error:', e);
      if (onEnd) onEnd();
    }
  }

  private static getNotesForRingtone(ringtoneId: RingtoneId): { freq: number; time: number; type?: OscillatorType; decay?: number }[] {
    switch (ringtoneId) {
      case 'zen':
        return [
          { freq: 440.0, time: 0, decay: 3.2 },
          { freq: 659.25, time: 0.1, decay: 3.2 },
          { freq: 880.0, time: 1.6, decay: 2.8 },
        ];
      case 'digital':
        return [
          { freq: 523.25, time: 0, type: 'triangle', decay: 0.2 },
          { freq: 659.25, time: 0.12, type: 'triangle', decay: 0.2 },
          { freq: 783.99, time: 0.24, type: 'triangle', decay: 0.2 },
          { freq: 1046.5, time: 0.36, type: 'triangle', decay: 0.6 },
          { freq: 783.99, time: 1.5, type: 'triangle', decay: 0.2 },
          { freq: 1046.5, time: 1.62, type: 'triangle', decay: 0.6 },
        ];
      case 'flute':
        return [
          { freq: 587.33, time: 0, type: 'sine', decay: 1.2 },
          { freq: 739.99, time: 0.2, type: 'sine', decay: 1.2 },
          { freq: 880.0, time: 0.4, type: 'sine', decay: 1.5 },
          { freq: 1174.66, time: 0.65, type: 'sine', decay: 1.8 },
        ];
      case 'radar':
        return [
          { freq: 987.77, time: 0, type: 'sine', decay: 0.4 },
          { freq: 1318.51, time: 0.2, type: 'sine', decay: 0.7 },
          { freq: 987.77, time: 1.2, type: 'sine', decay: 0.4 },
          { freq: 1318.51, time: 1.4, type: 'sine', decay: 0.7 },
        ];
      case 'sunrise':
        return [
          { freq: 523.25, time: 0, decay: 1.0 },
          { freq: 659.25, time: 0.18, decay: 1.0 },
          { freq: 783.99, time: 0.36, decay: 1.2 },
          { freq: 1046.5, time: 0.54, decay: 1.5 },
          { freq: 1318.51, time: 0.72, decay: 2.0 },
        ];
      case 'crystal':
        return [
          { freq: 1046.5, time: 0, type: 'triangle', decay: 0.5 },
          { freq: 1318.51, time: 0.15, type: 'triangle', decay: 0.5 },
          { freq: 1567.98, time: 0.3, type: 'triangle', decay: 0.7 },
          { freq: 2093.0, time: 0.5, type: 'triangle', decay: 1.2 },
        ];
      case 'marimba':
      default:
        return [
          { freq: 698.46, time: 0, decay: 0.6 },
          { freq: 880.0, time: 0.15, decay: 0.6 },
          { freq: 1046.5, time: 0.3, decay: 0.7 },
          { freq: 1318.51, time: 0.48, decay: 1.1 },
          { freq: 880.0, time: 1.8, decay: 0.6 },
          { freq: 1046.5, time: 1.95, decay: 0.7 },
          { freq: 1318.51, time: 2.1, decay: 1.1 },
        ];
    }
  }

  /**
   * Continuous ringing up to 60 seconds (1 minute) for alarm triggers
   */
  public static playReminderMusic(ringtoneId: RingtoneId = this.currentRingtone, durationSeconds: number = 60): void {
    this.stopAllAudio();
    this.triggerVibration([500, 200, 500, 200, 600]);

    if (this.ringerMode === 'silent_vibrate' || this.volumeLevel === 0) {
      let elapsed = 0;
      this.loopTimer = setInterval(() => {
        elapsed += 4;
        if (elapsed >= durationSeconds) {
          clearInterval(this.loopTimer);
          this.loopTimer = null;
        } else {
          this.triggerVibration([500, 200, 500]);
        }
      }, 4000);
      return;
    }

    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      this.activeGainNode = masterGain;

      const peakVol = Math.max(0.12, this.volumeLevel * 0.95);

      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.exponentialRampToValueAtTime(peakVol, now + 0.15);
      masterGain.gain.setValueAtTime(peakVol, now + durationSeconds - 1.5);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);
      masterGain.connect(ctx.destination);

      const baseMelody = this.getNotesForRingtone(ringtoneId);
      const loopInterval = 3.2;
      const totalLoops = Math.floor(durationSeconds / loopInterval);

      for (let l = 0; l < totalLoops; l++) {
        const loopOffset = l * loopInterval;

        baseMelody.forEach((note) => {
          const noteTime = now + loopOffset + note.time;
          if (noteTime >= now + durationSeconds - 0.5) return;

          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();

          osc.type = note.type || 'sine';
          osc.frequency.setValueAtTime(note.freq, noteTime);

          const decay = note.decay || 1.0;
          noteGain.gain.setValueAtTime(0, noteTime);
          noteGain.gain.linearRampToValueAtTime(0.45, noteTime + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.005, noteTime + decay);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(noteTime);
          osc.stop(noteTime + decay + 0.1);
          this.activeOscillators.push(osc);
        });
      }
    } catch (err) {
      console.warn('Audio play error:', err);
    }
  }

  public static playConfirmationBeep(): void {
    if (this.ringerMode === 'silent_vibrate' || this.volumeLevel === 0) {
      this.triggerVibration([50]);
      return;
    }

    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.0, now + 0.08); // A5

      const beepVol = Math.max(0.08, this.volumeLevel * 0.4);
      gain.gain.setValueAtTime(beepVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Confirmation beep error:', e);
    }
  }

  public static stopAllAudio(): void {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }

    if (this.activeGainNode && this.audioCtx) {
      try {
        this.activeGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      } catch (e) {}
      this.activeGainNode = null;
    }

    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.activeOscillators = [];
  }
}
