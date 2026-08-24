import React from 'react';
import { Mic, ShieldCheck, Check } from 'lucide-react';

interface MicPermissionModalProps {
  isOpen: boolean;
  onGrant: () => void;
  onDismiss: () => void;
  theme: 'off-white' | 'black';
}

export const MicPermissionModal: React.FC<MicPermissionModalProps> = ({
  isOpen,
  onGrant,
  onDismiss,
  theme,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'black';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={'w-full max-w-sm rounded-3xl border shadow-2xl p-5 text-center animate-in zoom-in-95 duration-150 ' + (
          isDark
            ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]'
            : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        <div className="w-16 h-16 rounded-full bg-[#16697A] text-white mx-auto flex items-center justify-center shadow-lg shadow-[#16697A]/40 mb-4 animate-bounce duration-1000">
          <Mic className="w-8 h-8" />
        </div>

        <h3 className="text-base font-extrabold tracking-tight mb-1">
          Enable Microphone Access
        </h3>

        <p className={'text-xs leading-relaxed mb-4 ' + (isDark ? 'text-[#8696a0]' : 'text-slate-600')}>
          RecallMe is a voice-first assistant. Allow microphone access so you can speak reminders and wake the app hands-free.
        </p>

        <div
          className={'p-3 rounded-2xl border text-left text-xs mb-5 space-y-1.5 ' + (
            isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-slate-50 border-slate-200 text-slate-700'
          )}
        >
          <div className="flex items-center gap-1.5 text-[#16697A] dark:text-[#489fb5] font-bold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% On-Device & Private
          </div>
          <p className="text-[11px] text-slate-400">
            Audio stays in your browser. No voice recordings are stored or sent to remote servers.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onGrant}
            className="w-full py-3 rounded-2xl bg-[#16697A] hover:bg-[#1a7d91] text-white text-xs font-extrabold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            <span>Allow Microphone</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className={'w-full py-2.5 rounded-2xl text-xs font-semibold transition-all ' + (
              isDark ? 'text-[#8696a0] hover:text-[#e9edef]' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            Not Now (Type Reminders Instead)
          </button>
        </div>
      </div>
    </div>
  );
};
