import React from 'react';
import type { ReminderItem } from '../types/reminder';
import { UnifiedTimeWeather } from './UnifiedTimeWeather';
import { QuickPromptBar } from './QuickPromptBar';
import { ReminderCard } from './ReminderCard';
import { CheckCircle2, Clock, Bookmark } from 'lucide-react';

import type { PhrasingTemplate } from './SettingsView';

interface HomePageViewProps {
  reminders: ReminderItem[];
  theme: 'off-white' | 'black';
  prompts: PhrasingTemplate[];
  onSelectPrompt: (prompt: string) => void;
  onOpenLocations: () => void;
  locationCount: number;
  onToggleComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onDelete: (id: string) => void;
  onBusy?: (item: ReminderItem) => void;
  onUpdateReminder: (id: string, updates: Partial<ReminderItem>) => void;
}

export const HomePageView: React.FC<HomePageViewProps> = ({
  reminders,
  theme,
  prompts,
  onSelectPrompt,
  onOpenLocations,
  locationCount,
  onToggleComplete,
  onSnooze,
  onDelete,
  onUpdateReminder,
}) => {
  const isDark = theme === 'black';

  const activeReminders = reminders.filter(
    (r) => r.status !== 'deleted' && r.status !== 'completed' && !r.isLocationNote
  );
  return (
    <div className="relative space-y-3.5">
      {/* Quick Voice Scenarios */}
      <QuickPromptBar prompts={prompts} onSelectPrompt={onSelectPrompt} theme={theme} />

      {/* Unified Single Section: Time & Weather (50% / 50% split) */}
      <UnifiedTimeWeather theme={theme} />

      {/* Active Reminders Section Header (Clean style matching Quick Scenarios) */}
      <div className="space-y-2 pt-1">
        <div className={'flex items-center justify-between px-1 text-xs sm:text-sm font-semibold ' + (
          isDark ? 'text-[#8696a0]' : 'text-slate-500'
        )}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#16697A] dark:text-[#489fb5]" />
              <span>Active Reminders:</span>
            </div>
            {activeReminders.length > 0 && (
              <span className={'text-[11px] font-bold px-2 py-0.5 rounded-full ' + (
                isDark ? 'bg-[#16697A]/25 text-[#489fb5]' : 'bg-[#16697A]/15 text-[#16697A]'
              )}>
                {activeReminders.length}
              </span>
            )}
          </div>

          {/* Quick Info Notes Button */}
          <button
            type="button"
            onClick={onOpenLocations}
            className={'relative w-8 h-8 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center ' + (
              isDark
                ? 'bg-[#202c33] border-[#2a3942] text-amber-400 hover:text-amber-300'
                : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-50 shadow-xs'
            )}
            title="Quick Info Notes"
          >
            <Bookmark className="w-4 h-4 fill-current" />
            {locationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                {locationCount}
              </span>
            )}
          </button>
        </div>

        {/* Direct Focus on Reminder Cards Display */}
        {activeReminders.length === 0 ? (
          <div className={'p-6 rounded-2xl border text-center ' + (
            isDark ? 'bg-[#202c33] border-[#2a3942]' : 'bg-white border-slate-200 shadow-xs'
          )}>
            <div className="w-10 h-10 rounded-2xl bg-[#16697A]/15 border border-[#16697A]/30 flex items-center justify-center text-[#16697A] dark:text-[#489fb5] mx-auto mb-2.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className={'text-sm sm:text-base font-extrabold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
              All caught up!
            </h4>
            <p className={'text-xs mt-1 max-w-xs mx-auto ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
              No pending reminders right now. Tap + to add a task or quick info.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                item={reminder}
                theme={theme}
                onToggleComplete={onToggleComplete}
                onSnooze={onSnooze}
                onDelete={onDelete}
                onUpdateReminder={onUpdateReminder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
