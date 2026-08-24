import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceMicButtonProps {
  isListening: boolean;
  status: 'idle' | 'listening' | 'processing' | 'error';
  audioVolume: number;
  liveTranscript: string;
  silenceCountdown?: number;
  onToggleListening: () => void;
}

export const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  isListening,
  status,
  audioVolume,
  liveTranscript,
  silenceCountdown = 10,
  onToggleListening,
}) => {
  const micScale = isListening ? Math.max(1, 1 + audioVolume * 0.35) : 1;

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex flex-col items-center justify-center pointer-events-none px-4">
      {isListening && (
        <div className="pointer-events-auto mb-4 max-w-md w-full bg-[#202c33]/95 backdrop-blur-xl border border-[#2a3942] rounded-2xl p-4 shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#489fb5] animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#16697A] dark:text-[#489fb5]">
                Listening to voice...
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {silenceCountdown <= 10 && (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#16697A]/20 text-[#489fb5] border border-[#16697A]/30">
                  auto-complete in {silenceCountdown}s
                </span>
              )}
              <button
                type="button"
                onClick={onToggleListening}
                className="px-3 py-1 bg-[#16697A] hover:bg-[#1a7d91] text-white rounded-lg text-xs font-bold shadow transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
          <p className="text-sm font-medium text-[#e9edef] italic min-h-[1.5rem] bg-[#111b21]/80 rounded-xl p-2.5 border border-[#2a3942]">
            {liveTranscript ? `"${liveTranscript}"` : 'Keep speaking... (auto-completes after 10s of silence)'}
          </p>
        </div>
      )}

      <div className="relative pointer-events-auto">
        {isListening && (
          <>
            <div
              className="absolute inset-0 rounded-full bg-[#16697A]/30 animate-ping duration-1000"
              style={{ transform: 'scale(' + (1.2 + audioVolume * 0.5) + ')' }}
            />
            <div
              className="absolute inset-0 rounded-full bg-[#489fb5]/20 blur-xl animate-pulse"
              style={{ transform: 'scale(' + (1.4 + audioVolume * 0.8) + ')' }}
            />
          </>
        )}

        <button
          onClick={onToggleListening}
          style={{ transform: 'scale(' + micScale + ')' }}
          className={'relative w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-150 active:scale-95 ' + (isListening
            ? 'bg-gradient-to-tr from-red-500 to-rose-600 text-white ring-4 ring-red-500/40 shadow-red-500/50'
            : 'bg-[#16697A] hover:bg-[#1a7d91] text-white hover:shadow-[#16697A]/40 hover:scale-105 shadow-xl')}
          aria-label={isListening ? 'Stop listening' : 'Tap to speak reminder'}
        >
          {status === 'processing' ? (
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          ) : isListening ? (
            <MicOff className="w-8 h-8 animate-bounce text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white drop-shadow font-bold" />
          )}
          <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5 text-white">
            {isListening ? 'Stop' : 'Speak'}
          </span>
        </button>
      </div>
    </div>
  );
};
