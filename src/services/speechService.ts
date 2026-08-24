export class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private isWakeWordMode = false;
  private isCapturingCommand = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private accumulatedTranscript = '';
  private silenceTimer: any = null;
  private countdownInterval: any = null;
  private secondsUntilAutoSubmit = 5;

  public onResultCallback?: (transcript: string, isFinal: boolean) => void;
  public onVolumeCallback?: (volume: number) => void;
  public onStatusCallback?: (status: 'idle' | 'listening' | 'processing' | 'error', errorMsg?: string) => void;
  public onFinalSubmitCallback?: (finalTranscript: string) => void;
  public onSilenceCountdownCallback?: (secondsLeft: number) => void;
  public onWakeWordDetectedCallback?: (phrase: string) => void;

  constructor() {
    this.initRecognition();
  }

  public setWakeWordMode(enabled: boolean) {
    this.isWakeWordMode = enabled;
    if (enabled && !this.isListening) {
      this.start();
    } else if (!enabled && !this.isCapturingCommand) {
      this.stop();
    }
  }

  public getWakeWordMode(): boolean {
    return this.isWakeWordMode;
  }

  private resetSilenceTimer() {
    this.clearSilenceTimer();
    this.secondsUntilAutoSubmit = 10;
    this.onSilenceCountdownCallback?.(10);

    // 1-second tick countdown
    this.countdownInterval = setInterval(() => {
      this.secondsUntilAutoSubmit -= 1;
      this.onSilenceCountdownCallback?.(Math.max(0, this.secondsUntilAutoSubmit));
      if (this.secondsUntilAutoSubmit <= 0) {
        this.clearSilenceTimer();
        // 5 seconds of silence reached -> auto complete
        this.finishCommand();
      }
    }, 1000);
  }

  private clearSilenceTimer() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private initRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onStatusCallback?.('listening');
          if (this.isCapturingCommand || !this.isWakeWordMode) {
            this.resetSilenceTimer();
          }
        };

        this.recognition.onresult = (event: any) => {
          let interim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const part = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              currentFinal += part;
            } else {
              interim += part;
            }
          }

          const rawHeard = (currentFinal || interim).toLowerCase().trim();

          // Wake-word Spotter: "Hey Recall", "Hey Memory", "Recall Me", "Remind me"
          if (this.isWakeWordMode && !this.isCapturingCommand) {
            const wakeWords = ['hey recall', 'hey memory', 'recall me', 'hey assistant', 'remind me'];
            const detected = wakeWords.find((w) => rawHeard.includes(w));
            if (detected) {
              this.isCapturingCommand = true;
              this.accumulatedTranscript = '';
              this.onWakeWordDetectedCallback?.(detected);
              this.resetSilenceTimer();
            } else {
              return;
            }
          }

          this.resetSilenceTimer();

          if (currentFinal) {
            this.accumulatedTranscript = (this.accumulatedTranscript + ' ' + currentFinal).trim();
          }

          const display = (this.accumulatedTranscript + ' ' + interim).trim();
          this.onResultCallback?.(display, false);
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition error event:', event.error);
          if (event.error === 'no-speech') {
            return;
          }

          let userMessage = 'Voice recognition error: ' + event.error;
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            userMessage = 'Microphone permission was denied. Please allow microphone access in browser settings.';
          } else if (event.error === 'audio-capture') {
            userMessage = 'No microphone was detected on your device.';
          } else if (event.error === 'network') {
            userMessage = 'Speech recognition network timeout. You can also type your command directly.';
          }

          this.onStatusCallback?.('error', userMessage);
          this.stop();
        };

        this.recognition.onend = () => {
          if (this.isListening || this.isWakeWordMode) {
            try {
              this.recognition.start();
              return;
            } catch (e) {
              // ignore
            }
          }

          this.finishCommand();
        };
      } catch (e) {
        console.error('Failed to instantiate SpeechRecognition:', e);
      }
    }
  }

  private finishCommand() {
    this.clearSilenceTimer();
    const finalText = this.accumulatedTranscript.trim();
    this.isCapturingCommand = false;

    if (!this.isWakeWordMode) {
      this.isListening = false;
      this.stopAudioVisualizer();
      this.onStatusCallback?.('idle');
    }

    if (finalText) {
      this.onFinalSubmitCallback?.(finalText);
      this.accumulatedTranscript = '';
    }
  }

  public isSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public async start(): Promise<void> {
    if (this.isListening) return;

    // Check browser support
    if (!this.isSupported()) {
      this.onStatusCallback?.(
        'error',
        'Web Speech API is not supported in this browser. Please use Chrome, Edge, Safari, or type below.'
      );
      return;
    }

    try {
      // 1. Explicitly request microphone stream for permissions & visualizer
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.startAudioVisualizer(this.micStream);
        } catch (micErr: any) {
          console.warn('Mic permission error:', micErr);
          this.onStatusCallback?.(
            'error',
            'Microphone access is blocked. Please allow microphone permission in browser address bar.'
          );
          return;
        }
      }

      // 2. Start speech recognition engine
      if (!this.recognition) {
        this.initRecognition();
      }

      this.accumulatedTranscript = '';
      this.recognition.start();
    } catch (e: any) {
      console.warn('Recognition start exception:', e);
      if (e.name === 'InvalidStateError') {
        // Already started
        this.isListening = true;
        this.onStatusCallback?.('listening');
      } else {
        this.onStatusCallback?.('error', 'Could not start microphone: ' + (e.message || e));
      }
    }
  }

  public stop(): void {
    this.clearSilenceTimer();
    if (!this.isListening) {
      this.stopAudioVisualizer();
      return;
    }

    this.isListening = false;
    try {
      this.recognition?.stop();
    } catch (e) {
      // ignore
    }
    this.stopAudioVisualizer();
    this.onStatusCallback?.('idle');

    const finalText = this.accumulatedTranscript.trim();
    if (finalText) {
      this.onFinalSubmitCallback?.(finalText);
      this.accumulatedTranscript = '';
    }
  }

  private startAudioVisualizer(stream: MediaStream) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!this.analyser || !this.isListening) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(1, average / 128);
        this.onVolumeCallback?.(normalized);
        this.animFrameId = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn('Audio visualizer init error:', e);
    }
  }

  private stopAudioVisualizer() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
    this.onVolumeCallback?.(0);
  }

  public static async requestPermission(): Promise<{ granted: boolean; error?: string }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { granted: false, error: 'Microphone API not supported on this browser/device.' };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return { granted: true };
    } catch (err: any) {
      return { granted: false, error: err?.message || 'Microphone permission denied.' };
    }
  }

  public static async getPermissionState(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
    if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
      try {
        const result = await (navigator as any).permissions.query({ name: 'microphone' });
        return result.state;
      } catch (e) {}
    }
    return 'unknown';
  }
}

