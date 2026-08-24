export type AccentCode = 'US' | 'UK' | 'CA' | 'IN';

export interface AccentOption {
  id: AccentCode;
  label: string;
  subtitle: string;
  flag: string;
  samplePhrase: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'CA', label: 'Canadian Accent', subtitle: 'Natural Canadian English Voice', flag: '🇨🇦', samplePhrase: 'Hello! I will speak with a Canadian natural voice.' },
  { id: 'IN', label: 'Indian Accent', subtitle: 'Natural Indian English Voice', flag: '🇮🇳', samplePhrase: 'Hello! I will speak with an Indian natural voice.' },
  { id: 'US', label: 'American Accent', subtitle: 'Natural US English Voice', flag: '🇺🇸', samplePhrase: 'Hello! I will speak with an American natural voice.' },
  { id: 'UK', label: 'British Accent', subtitle: 'Natural British English Voice', flag: '🇬🇧', samplePhrase: 'Hello! I will speak with a British natural voice.' },
];

export class TTSService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static enabled = true;
  private static rate = 0.98;
  private static selectedVoiceURI: string = '';
  private static selectedAccent: AccentCode = (() => {
    try {
      const saved = localStorage.getItem('recallme_accent_code') as AccentCode;
      if (saved === 'US' || saved === 'UK' || saved === 'CA' || saved === 'IN') return saved;
    } catch (e) {}
    return 'US';
  })();
  private static isCurrentlySpeaking = false;

  public static setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  public static setRate(rate: number) {
    this.rate = rate;
  }

  public static getRate(): number {
    return this.rate;
  }

  public static setAccent(accent: AccentCode) {
    this.selectedAccent = accent;
    try {
      localStorage.setItem('recallme_accent_code', accent);
    } catch (e) {}

    const match = this.getBestVoiceForAccent(accent);
    if (match) {
      this.selectedVoiceURI = match.voiceURI;
      try {
        localStorage.setItem('recallme_voice_uri', match.voiceURI);
      } catch (e) {}
    }
  }

  public static getAccent(): AccentCode {
    return this.selectedAccent;
  }

  public static setVoiceURI(uri: string) {
    this.selectedVoiceURI = uri;
    try {
      localStorage.setItem('recallme_voice_uri', uri);
    } catch (e) {}
  }

  public static getVoiceURI(): string {
    if (!this.selectedVoiceURI && typeof localStorage !== 'undefined') {
      try {
        this.selectedVoiceURI = localStorage.getItem('recallme_voice_uri') || '';
      } catch (e) {}
    }
    return this.selectedVoiceURI;
  }

  public static isSpeaking(): boolean {
    return this.synth ? this.synth.speaking || this.isCurrentlySpeaking : false;
  }

  public static getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices().filter((v) => v.lang.startsWith('en') || v.lang.startsWith('EN'));
  }

  public static getBestVoiceForAccent(accent: AccentCode): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return null;

    let targetLang = 'en-US';
    let keywords: string[] = [];

    if (accent === 'UK') {
      targetLang = 'en-GB';
      keywords = ['united kingdom', 'uk', 'british', 'daniel', 'sonia', 'ryan', 'hazel', 'george', 'oliver', 'susan'];
    } else if (accent === 'CA') {
      targetLang = 'en-CA';
      keywords = ['canada', 'canadian', 'richard', 'clara', 'linda', 'heather'];
    } else if (accent === 'IN') {
      targetLang = 'en-IN';
      keywords = ['india', 'indian', 'neerja', 'rishi', 'sangeeta', 'ravi', 'veena', 'priya'];
    } else {
      targetLang = 'en-US';
      keywords = ['siri', 'jenny', 'aria', 'guy', 'samantha', 'ava', 'david', 'zira', 'natural', 'google us'];
    }

    // 1. Keyword match with natural prioritization
    for (const kw of keywords) {
      const match = voices.find(
        (v) => (v.lang.toLowerCase().includes(targetLang.toLowerCase()) || v.name.toLowerCase().includes(kw)) &&
               (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('enhanced') || v.name.toLowerCase().includes('online') || v.name.toLowerCase().includes('siri'))
      );
      if (match) return match;
    }

    // 2. Keyword match general
    for (const kw of keywords) {
      const match = voices.find((v) => v.name.toLowerCase().includes(kw) || v.lang.toLowerCase().includes(targetLang.toLowerCase()));
      if (match) return match;
    }

    // 3. Lang match fallback
    const langMatch = voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.toLowerCase()));
    if (langMatch) return langMatch;

    // 4. Default english fallback
    return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  }

  public static speak(text: string, onEnd?: () => void, customVoiceURI?: string): void {
    if (typeof window === 'undefined' || !window.speechSynthesis || !this.enabled) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    const allVoices = window.speechSynthesis.getVoices();
    let voiceToUse: SpeechSynthesisVoice | null = null;

    if (customVoiceURI && allVoices.length > 0) {
      voiceToUse = allVoices.find((v) => v.voiceURI === customVoiceURI) || null;
    }
    if (!voiceToUse) {
      voiceToUse = this.getBestVoiceForAccent(this.selectedAccent);
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang;
    }

    this.isCurrentlySpeaking = true;

    utterance.onend = () => {
      this.isCurrentlySpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isCurrentlySpeaking = false;
      if (onEnd) onEnd();
    };

    setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
      }
    }, 15);
  }

  public static stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.isCurrentlySpeaking = false;
  }
}
