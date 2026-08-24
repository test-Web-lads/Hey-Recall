import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Send, X, Volume2, ShieldCheck } from 'lucide-react';
import { ChimeService } from '../services/chimeService';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCommand: (command: string) => void;
  isNativeSupported: boolean;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onSubmitCommand,
  isNativeSupported,
}) => {
  const [spokenText, setSpokenText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const suggestedCommands = [
    {
      title: 'Doctor Appointment (Multi-condition)',
      text: 'remind me i have to book appointment tomorrow for doctor around 10 a.m if i forget remind me after an hour',
    },
    {
      title: 'Blood Pressure Pills (in 2 mins)',
      text: 'remind me to take blood pressure pills in 2 minutes if i forget check again in 5 minutes',
    },
    {
      title: 'Car Parking Location',
      text: 'remember my car is parked in slot B4 near elevator',
    },
    {
      title: 'Submit Project Report (at 5 PM)',
      text: 'remind me today at 5 pm to submit project report if not done remind me in 1 hour',
    },
  ];

  const toggleMicRecording = async () => {
    if (isRecording) {
      stopMicRecording();
    } else {
      await startMicRecording();
    }
  };

  const startMicRecording = async () => {
    setMicError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setIsRecording(true);
        ChimeService.playConfirmationBeep();

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(1, avg / 100));
          animFrameRef.current = requestAnimationFrame(update);
        };
        update();
      } else {
        setMicError('Microphone not supported on this device.');
      }
    } catch (e: any) {
      console.warn('Microphone stream access error:', e);
      setMicError('Microphone permission was denied. Please allow microphone access in your browser.');
    }
  };

  const stopMicRecording = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    if (!isOpen) {
      stopMicRecording();
      setSpokenText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (commandToSend?: string) => {
    const text = commandToSend || spokenText;
    if (!text.trim()) return;
    stopMicRecording();
    onSubmitCommand(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#202c33] border border-[#2a3942] rounded-3xl p-6 shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[#2a3942]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#16697A] flex items-center justify-center text-white shadow-lg shadow-[#16697A]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#e9edef] tracking-tight">Voice Assistant Dictation</h2>
              <div className="flex items-center gap-1.5 text-xs text-[#8696a0]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#489fb5]" />
                <span>100% Offline & Private</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isNativeSupported && (
          <div className="mt-3 bg-[#16697A]/10 border border-[#16697A]/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-[#489fb5]">
            <Sparkles className="w-4 h-4 text-[#16697A] dark:text-[#489fb5] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">iPhone / Safari Voice Tip:</span> Tap inside the box below and tap the <span className="font-bold text-white">Microphone 🎙️ icon</span> on your iPhone keyboard to speak naturally! Or tap any scenario preset below.
            </div>
          </div>
        )}

        {micError && (
          <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 text-xs text-rose-300">
            {micError}
          </div>
        )}

        <div className="my-5 flex flex-col items-center justify-center">
          <div className="relative mb-3">
            {isRecording && (
              <div
                className="absolute inset-0 rounded-full bg-[#16697A]/30 animate-ping duration-1000"
                style={{ transform: `scale(${1.2 + audioLevel * 0.6})` }}
              />
            )}
            <button
              onClick={toggleMicRecording}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all active:scale-95 ${
                isRecording
                  ? 'bg-gradient-to-tr from-red-500 to-rose-600 text-white ring-4 ring-red-500/40 shadow-red-500/50'
                  : 'bg-[#16697A] text-white hover:bg-[#1a7d91] hover:scale-105 shadow-[#16697A]/30'
              }`}
            >
              {isRecording ? <MicOff className="w-8 h-8 animate-bounce text-white" /> : <Mic className="w-8 h-8 text-white" />}
              <span className={`text-[10px] font-extrabold uppercase tracking-wider mt-0.5 ${isRecording ? 'text-white' : 'text-white'}`}>
                {isRecording ? 'Stop' : 'Mic Test'}
              </span>
            </button>
          </div>

          <p className="text-xs font-medium text-[#8696a0]">
            {isRecording
              ? `Microphone Active (Audio Level: ${Math.round(audioLevel * 100)}%)`
              : 'Tap to test microphone stream'}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8696a0] mb-1.5">
            Voice Command / Spoken Instruction:
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
              placeholder="e.g. remind me i have to book appointment tomorrow for doctor around 10 a.m if i forget remind me after an hour"
              className="w-full bg-[#111b21] border border-[#2a3942] focus:border-[#16697A] focus:ring-2 focus:ring-[#16697A]/20 rounded-2xl p-3.5 text-sm text-[#e9edef] placeholder-[#8696a0] outline-none resize-none"
            />
          </div>
        </div>

        <div className="mb-5 overflow-y-auto">
          <span className="text-xs font-semibold text-[#8696a0] mb-2 block">
            Tap a Voice Command Scenario:
          </span>
          <div className="space-y-1.5">
            {suggestedCommands.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSpokenText(item.text);
                  handleSubmit(item.text);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-[#111b21] hover:bg-[#16697A]/30 border border-[#2a3942] hover:border-[#16697A]/40 transition-all flex items-start gap-2.5 group"
              >
                <Volume2 className="w-4 h-4 text-[#16697A] dark:text-[#489fb5] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#e9edef] group-hover:text-[#489fb5]">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#8696a0] truncate italic">"{item.text}"</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleSubmit()}
          disabled={!spokenText.trim()}
          className="w-full py-3 px-4 rounded-2xl bg-[#16697A] hover:bg-[#1a7d91] disabled:opacity-40 text-white font-extrabold text-sm shadow-lg shadow-[#16697A]/30 flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Send className="w-4 h-4" />
          Process Voice Command
        </button>
      </div>
    </div>
  );
};
