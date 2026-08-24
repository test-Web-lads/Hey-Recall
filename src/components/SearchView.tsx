import React, { useState } from 'react';
import type { ReminderItem } from '../types/reminder';
import { ReminderCard } from './ReminderCard';
import { Search, X, SearchCheck } from 'lucide-react';

interface SearchViewProps {
  reminders: ReminderItem[];
  theme: 'off-white' | 'black';
  onSelectReminder: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onDelete: (id: string) => void;
  onBusy: (item: ReminderItem) => void;
  onUpdateReminder: (id: string, updates: Partial<ReminderItem>) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  reminders,
  theme,
  onSelectReminder,
  onToggleComplete,
  onSnooze,
  onDelete,
  onBusy,
  onUpdateReminder,
}) => {
  const isDark = theme === 'black';
  const [searchQuery, setSearchQuery] = useState('');

  const matchesSearch = (r: ReminderItem) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return r.task.toLowerCase().includes(q) || (r.notes && r.notes.toLowerCase().includes(q));
  };

  const searchResults = reminders.filter((r) => !r.isLocationNote && matchesSearch(r));

  return (
    <div className="max-w-xl mx-auto px-1 py-1 space-y-3.5 animate-in fade-in duration-200">
      {/* Sticky Top Search Header */}
      <div
        className={'sticky top-0 z-30 -mx-4 px-4 pt-2 pb-2.5 transition-all ' + (
          isDark ? 'bg-[#0b141a]/95 backdrop-blur-md' : 'bg-[#f0f2f5]/95 backdrop-blur-md'
        )}
      >
        <div
          className={'flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all ' + (
            isDark
              ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef] focus-within:border-[#16697A]'
              : 'bg-white border-slate-200 text-slate-900 focus-within:border-[#16697A] shadow-xs'
          )}
        >
          <Search className="w-5 h-5 text-[#16697A] dark:text-[#489fb5] flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search tasks, notes, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Content */}
      <div className="space-y-3 pt-1">
        {searchQuery.trim() === '' ? (
          <div
            className={'py-16 px-4 rounded-3xl border text-center transition-all ' + (
              isDark ? 'bg-[#202c33] border-[#2a3942]' : 'bg-white border-slate-200'
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#16697A]/15 border border-[#16697A]/30 flex items-center justify-center text-[#16697A] dark:text-[#489fb5] mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className={'text-sm sm:text-base font-extrabold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
              Search All Reminders
            </h4>
            <p className={'text-xs mt-1.5 max-w-xs mx-auto ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
              Type any task name, grocery item, person, or note to instantly find it.
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div
            className={'py-14 px-4 rounded-3xl border text-center ' + (
              isDark ? 'bg-[#202c33] border-[#2a3942]' : 'bg-white border-slate-200'
            )}
          >
            <SearchCheck className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
            <h4 className={'text-sm sm:text-base font-bold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
              No results found
            </h4>
            <p className={'text-xs mt-1 max-w-xs mx-auto ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
              We couldn't find any reminders matching "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#16697A] dark:text-[#489fb5]">
                Found {searchResults.length} {searchResults.length === 1 ? 'Match' : 'Matches'}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Tap to view in Reminders
              </span>
            </div>

            {searchResults.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                item={reminder}
                theme={theme}
                onCardClick={() => onSelectReminder(reminder.id)}
                onToggleComplete={onToggleComplete}
                onSnooze={onSnooze}
                onDelete={onDelete}
                onBusy={onBusy}
                onUpdateReminder={onUpdateReminder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
