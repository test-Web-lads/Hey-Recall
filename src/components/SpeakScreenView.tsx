import React from 'react';
import type { ReminderItem } from '../types/reminder';
import { DigitalClock } from './DigitalClock';
import { ReminderCard } from './ReminderCard';
import { Plus, Sparkles, Clock } from 'lucide-react';

interface SpeakScreenViewProps {
  currentReminder: ReminderItem | null;
  todayReminders: ReminderItem[];
  theme: 'off-white' | 'black';
  onOpenAddModal: () => void;
  onToggleComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onDelete: (id: string) => void;
  onBusy: (item: ReminderItem) => void;
  onUpdateReminder: (id: string, updates: Partial<ReminderItem>) => void;
}

export const SpeakScreenView: React.FC<SpeakScreenViewProps> = ({
  currentReminder,
  todayReminders,
  theme,
  onOpenAddModal,
  onToggleComplete,
  onSnooze,
  onDelete,
  onBusy,
  onUpdateReminder,
}) => {
  const isDark = theme === 'black';

  return (
    <div className="max-w-xl mx-auto px-4 py-3 space-y-4 animate-in fade-in duration-200">
      {/* Top Action Bar with Plus Add Sign */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#16697A] dark:text-[#489fb5]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Voice & Current Status</span>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-3 py-1.5 rounded-xl bg-[#16697A] hover:bg-[#1a7d91] text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
          title="Add New Reminder"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
          <span>Add</span>
        </button>
      </div>

      {/* Main Center Display: Current Reminder OR Digital Clock */}
      {currentReminder ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={'text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ' + (
              isDark ? 'text-amber-400' : 'text-amber-700'
            )}>
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              Current / Next Due Reminder:
            </span>
          </div>

          <ReminderCard
            item={currentReminder}
            theme={theme}
            onToggleComplete={onToggleComplete}
            onSnooze={onSnooze}
            onDelete={onDelete}
            onBusy={onBusy}
            onUpdateReminder={onUpdateReminder}
          />
        </div>
      ) : (
        <div
          className={'rounded-3xl border p-6 shadow-xs ' + (
            isDark ? 'bg-[#202c33] border-[#2a3942]' : 'bg-white border-slate-200'
          )}
        >
          <DigitalClock theme={theme} />
          <div className="text-center pt-1 pb-2">
            <p className={'text-xs max-w-xs mx-auto ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
              No reminders due right now. Tap the <strong>Mic</strong> below or click <strong>[+ Add]</strong> to speak or schedule a reminder.
            </p>
          </div>
        </div>
      )}

      {/* Today's Other Reminders list if any */}
      {todayReminders.length > 0 && (
        <div className="pt-2 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={isDark ? 'text-[#e9edef]' : 'text-slate-800'}>
              Today's Schedule ({todayReminders.length})
            </span>
          </div>
          <div className="space-y-2">
            {todayReminders.map((item) => (
              <ReminderCard
                key={item.id}
                item={item}
                theme={theme}
                onToggleComplete={onToggleComplete}
                onSnooze={onSnooze}
                onDelete={onDelete}
                onBusy={onBusy}
                onUpdateReminder={onUpdateReminder}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
