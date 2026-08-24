import React, { useState, useEffect } from 'react';
import { ChimeService } from '../services/chimeService';
import { X, Bookmark, AlertCircle } from 'lucide-react';

interface QuickInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuickInfo: (text: string) => void;
  theme: 'off-white' | 'black';
}

export const QuickInfoModal: React.FC<QuickInfoModalProps> = ({
  isOpen,
  onClose,
  onAddQuickInfo,
  theme,
}) => {
  const isDark = theme === 'black';
  const [text, setText] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setHasError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanText = text.trim();
    if (!cleanText) {
      setHasError(true);
      ChimeService.triggerHapticError();
      return;
    }

    onAddQuickInfo(cleanText);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={'w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ' + (
          isDark
            ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]'
            : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Header */}
        <div
          className={'px-5 py-4 border-b flex items-center justify-between ' + (
            isDark ? 'border-[#2a3942] bg-[#111b21]' : 'border-slate-100 bg-slate-50'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">Quick Info / Note</h3>
              <p className="text-xs text-slate-500">Save text info without date or time</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={'w-7 h-7 rounded-full flex items-center justify-center border shadow-xs transition-all cursor-pointer active:scale-90 ' + (
              isDark
                ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] hover:bg-[#2a3942] hover:text-white shadow-black/40'
                : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 hover:text-black shadow-slate-200'
            )}
            title="Close"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5 stroke-[2.8px]" />
          </button>
        </div>

        {/* Body Form */}
        <form noValidate onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <textarea
              autoFocus
              rows={5}
              placeholder="e.g. Car is parked in Lot B Spot 42, Locker code 1234, Flight AC872..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (hasError) setHasError(false);
              }}
              className={'w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all ' + (
                hasError
                  ? 'border-rose-500 ring-2 ring-rose-500/30'
                  : isDark
                  ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] focus:border-amber-400'
                  : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500'
              )}
            />
            {hasError && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Please enter quick info text.</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e)}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-extrabold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
