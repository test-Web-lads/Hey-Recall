import React, { useEffect } from 'react';
import type { ReminderItem } from '../types/reminder';
import { Bell, Square, Clock, X } from 'lucide-react';
import { ChimeService } from '../services/chimeService';

interface CheckInModalProps {
  reminder: ReminderItem | null;
  onDone: (reminder: ReminderItem) => void;
  onSnooze: (reminder: ReminderItem, minutes: number) => void;
  onBusy?: (reminder: ReminderItem) => void;
  onDismiss: () => void;
  theme?: 'off-white' | 'black';
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  reminder,
  onDone,
  onSnooze,
  onDismiss,
}) => {
  const defaultSnoozeDelay = (() => {
    try {
      const saved = localStorage.getItem('recallme_default_snooze_delay');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {}
    return 5;
  })();

  useEffect(() => {
    if (!reminder) return;

    return () => {
      ChimeService.stopAllAudio();
    };
  }, [reminder]);

  if (!reminder || reminder.isLocationNote) return null;

  const handleStop = () => {
    ChimeService.stopAllAudio();
    onDone(reminder);
  };

  const handleSnooze = () => {
    ChimeService.stopAllAudio();
    onSnooze(reminder, defaultSnoozeDelay);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Light Transparent Glass Container */}
      <div className="relative w-full max-w-xs sm:max-w-sm backdrop-blur-2xl bg-white/75 dark:bg-[#1a2730]/75 border border-white/60 dark:border-white/15 rounded-3xl p-5 shadow-2xl shadow-black/20 dark:shadow-black/60 text-left animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Dismiss X */}
        <button
          onClick={onDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Section: Bell Icon on LEFT, Title NEXT to it */}
        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-2xl bg-[#16697A]/15 dark:bg-[#16697A]/25 border border-[#16697A]/30 flex items-center justify-center text-[#16697A] dark:text-[#489fb5] flex-shrink-0 shadow-xs">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-[#e9edef] tracking-tight leading-snug break-words">
            {reminder.task}
          </h2>
        </div>

        {/* Text / Notes Below Both */}
        {reminder.notes && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 p-2.5 rounded-2xl my-2.5 leading-relaxed">
            {reminder.notes}
          </p>
        )}

        {/* Small Light Glass Buttons */}
        <div className="flex items-center gap-2.5 pt-3">
          {/* Stop Button */}
          <button
            type="button"
            onClick={handleStop}
            className="flex-1 py-2 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs shadow-xs"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>

          {/* Snooze Button */}
          <button
            type="button"
            onClick={handleSnooze}
            className="flex-1 py-2 px-3.5 rounded-xl bg-[#16697A]/15 hover:bg-[#16697A]/25 active:scale-95 text-[#16697A] dark:text-[#489fb5] border border-[#16697A]/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs shadow-xs"
          >
            <Clock className="w-3.5 h-3.5 stroke-[2.5px]" />
            <span>Snooze</span>
          </button>
        </div>
      </div>
    </div>
  );
};
