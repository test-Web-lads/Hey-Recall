import React, { useState } from 'react';
import type { ReminderItem } from '../types/reminder';
import { ReminderCard } from './ReminderCard';
import { QuickPromptBar } from './QuickPromptBar';
import {
  Clock,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Inbox,
  Send,
} from 'lucide-react';

interface HomeScreenViewProps {
  reminders: ReminderItem[];
  theme: 'off-white' | 'black';
  textInput: string;
  onChangeTextInput: (text: string) => void;
  onSubmitTextInput: (e: React.FormEvent) => void;
  onSelectPrompt: (prompt: string) => void;
  onToggleComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onBusy: (item: ReminderItem) => void;
  onUpdateReminder: (id: string, updates: Partial<ReminderItem>) => void;
}

export const HomeScreenView: React.FC<HomeScreenViewProps> = ({
  reminders,
  theme,
  textInput,
  onChangeTextInput,
  onSubmitTextInput,
  onSelectPrompt,
  onToggleComplete,
  onSnooze,
  onDelete,
  onRestore,
  onBusy,
  onUpdateReminder,
}) => {
  const isDark = theme === 'black';

  // 4 Accordion Section Expanded States
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    upcoming: true,
    autonag: true,
    done: false,
    deleted: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Group Reminders into 4 categories
  const nonDeleted = reminders.filter((r) => r.status !== 'deleted' && !r.isLocationNote);

  const upcomingList = nonDeleted.filter(
    (r) => r.status === 'pending' || r.status === 'triggered' || r.status === 'snoozed'
  );
  const autoNagList = nonDeleted.filter(
    (r) => r.fallbackRule?.enabled || r.status === 'fallback_active'
  );
  const doneList = nonDeleted.filter((r) => r.status === 'completed');
  const deletedList = reminders.filter((r) => r.status === 'deleted');

  const categories = [
    {
      key: 'upcoming',
      title: 'Upcoming Reminders',
      count: upcomingList.length,
      icon: <Clock className="w-4 h-4 text-[#16697A] dark:text-[#489fb5]" />,
      items: upcomingList,
      accentColor: isDark ? 'border-[#16697A]/40 bg-[#202c33]' : 'border-[#16697A]/30 bg-white',
      badgeClass: isDark ? 'bg-[#16697A]/20 text-[#489fb5]' : 'bg-[#16697A]/15 text-[#16697A]',
    },
    {
      key: 'autonag',
      title: 'Auto-Nag Follow-ups',
      count: autoNagList.length,
      icon: <RotateCcw className="w-4 h-4 text-amber-500" />,
      items: autoNagList,
      accentColor: isDark ? 'border-amber-500/40 bg-[#202c33]' : 'border-amber-300 bg-white',
      badgeClass: isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800',
    },
    {
      key: 'done',
      title: 'Completed (Done)',
      count: doneList.length,
      icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
      items: doneList,
      accentColor: isDark ? 'border-blue-500/30 bg-[#202c33]' : 'border-blue-200 bg-white',
      badgeClass: isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800',
    },
    {
      key: 'deleted',
      title: 'Deleted / Trash',
      count: deletedList.length,
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      items: deletedList,
      accentColor: isDark ? 'border-rose-500/30 bg-[#202c33]' : 'border-rose-200 bg-white',
      badgeClass: isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-800',
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <QuickPromptBar onSelectPrompt={onSelectPrompt} theme={theme} />

      {/* Manual Input Bar */}
      <form onSubmit={onSubmitTextInput} className="relative mb-2 flex items-center">
        <input
          type="text"
          value={textInput}
          onChange={(e) => onChangeTextInput(e.target.value)}
          placeholder="Type reminder or speak below..."
          className={'w-full border rounded-2xl py-2.5 pl-4 pr-11 text-xs sm:text-sm transition-all outline-none shadow-xs ' + (
            isDark
              ? 'bg-[#202c33] border-[#2a3942] focus:border-[#16697A] text-[#e9edef] placeholder-[#8696a0]'
              : 'bg-white border-slate-200 focus:border-[#16697A] text-slate-900 placeholder-slate-400'
          )}
        />
        <button
          type="submit"
          disabled={!textInput.trim()}
          className="absolute right-1.5 p-1.5 rounded-xl bg-[#16697A] hover:bg-[#1a7d91] disabled:opacity-30 text-white font-bold transition-all shadow-xs"
          title="Submit"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* 4 Collapsible Category Sections */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const isExpanded = !!expandedSections[cat.key];

          return (
            <div
              key={cat.key}
              className={'rounded-2xl border transition-all overflow-hidden shadow-xs ' + cat.accentColor}
            >
              {/* Category Header (Click to Expand / Collapse) */}
              <div
                onClick={() => toggleSection(cat.key)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-black/10 dark:bg-white/5">
                    {cat.icon}
                  </div>
                  <h3 className={'text-xs sm:text-sm font-extrabold tracking-tight ' + (
                    isDark ? 'text-[#e9edef]' : 'text-slate-900'
                  )}>
                    {cat.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + cat.badgeClass}>
                    {cat.count}
                  </span>
                  <button
                    type="button"
                    className={'p-1 rounded-lg ' + (isDark ? 'text-[#8696a0]' : 'text-slate-400')}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div
                  className={'p-3 border-t space-y-2.5 animate-in fade-in duration-150 ' + (
                    isDark ? 'border-[#2a3942] bg-[#111b21]/50' : 'border-slate-100 bg-slate-50/70'
                  )}
                >
                  {cat.items.length === 0 ? (
                    <div className="text-center py-6">
                      <Inbox className={'w-7 h-7 mx-auto mb-1 opacity-30 ' + (isDark ? 'text-[#8696a0]' : 'text-slate-400')} />
                      <p className={'text-xs font-medium ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
                        No items in {cat.title}.
                      </p>
                    </div>
                  ) : (
                    cat.items.map((item) => (
                      <div key={item.id} className="relative group">
                        <ReminderCard
                          item={item}
                          theme={theme}
                          onToggleComplete={onToggleComplete}
                          onSnooze={onSnooze}
                          onDelete={onDelete}
                          onBusy={onBusy}
                          onUpdateReminder={onUpdateReminder}
                        />
                        {cat.key === 'deleted' && (
                          <div className="mt-1 flex items-center justify-end gap-2 px-2">
                            <span className="text-[10px] text-slate-500 capitalize">
                              Category: {item.category}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRestore(item.id)}
                              className="text-[11px] font-bold text-[#16697A] dark:text-[#489fb5] hover:underline"
                            >
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(item.id)}
                              className="text-[11px] font-bold text-rose-500 hover:underline ml-2"
                            >
                              Delete Forever
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
