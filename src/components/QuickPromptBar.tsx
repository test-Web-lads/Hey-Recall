import React from 'react';
import { Sparkles, Search, Settings, X } from 'lucide-react';
import { type PhrasingTemplate, DEFAULT_PHRASING_LIST } from './SettingsView';

interface QuickPromptBarProps {
  prompts?: PhrasingTemplate[];
  onSelectPrompt: (prompt: string) => void;
  theme: 'off-white' | 'black';
  onOpenSettings?: () => void;
  onToggleSearch?: () => void;
  isSearchOpen?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const QuickPromptBar: React.FC<QuickPromptBarProps> = ({
  prompts = DEFAULT_PHRASING_LIST,
  onSelectPrompt,
  theme,
  onOpenSettings,
  onToggleSearch,
  isSearchOpen = false,
  searchQuery = '',
  onSearchChange,
}) => {
  const isDark = theme === 'black';

  return (
    <div
      className={'sticky top-0 z-30 -mx-4 px-4 pt-2 pb-2 transition-all ' + (
        isDark ? 'bg-[#0b141a]/95 backdrop-blur-md' : 'bg-[#f0f2f5]/95 backdrop-blur-md'
      )}
    >
      {/* Top Row: Quick Scenarios Label on Left, Search & Settings on Right */}
      <div className="flex items-center justify-between mb-1.5">
        <div className={'flex items-center gap-1.5 text-xs sm:text-sm font-semibold ' + (
          isDark ? 'text-[#8696a0]' : 'text-slate-500'
        )}>
          <Sparkles className="w-4 h-4 text-[#16697A] dark:text-[#489fb5]" />
          <span>Quick Scenarios:</span>
        </div>

        {/* Action Buttons: Search (left) & Settings (right) */}
        <div className="flex items-center gap-1.5">
          {/* Search Button */}
          {onToggleSearch && (
            <button
              type="button"
              onClick={onToggleSearch}
              className={'w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-95 cursor-pointer ' + (
                isSearchOpen
                  ? 'bg-[#16697A] border-[#16697A] text-white shadow-xs'
                  : isDark
                  ? 'bg-[#202c33] border-[#2a3942] text-slate-300 hover:text-white hover:border-[#16697A]'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-[#16697A] hover:bg-slate-50 shadow-xs'
              )}
              title={isSearchOpen ? 'Close Search' : 'Search Reminders'}
              aria-label="Search"
            >
              <Search className="w-4 h-4 stroke-[2.2px]" />
            </button>
          )}

          {/* Settings Button (on right top next to quick scenarios) */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className={'w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-95 cursor-pointer ' + (
                isDark
                  ? 'bg-[#202c33] border-[#2a3942] text-slate-300 hover:text-white hover:border-[#16697A]'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-[#16697A] hover:bg-slate-50 shadow-xs'
              )}
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 stroke-[2.2px]" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Search Input Bar when Search is active */}
      {isSearchOpen && (
        <div className="mb-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div
            className={
              'relative flex items-center rounded-2xl border transition-all ' +
              (isDark
                ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] focus-within:border-[#16697A]'
                : 'bg-white border-slate-200 text-slate-900 focus-within:border-[#16697A] shadow-xs')
            }
          >
            <Search className="w-4 h-4 ml-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search reminders by title, note, or date..."
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-medium outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="mr-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Horizontally Scrollable Prompt Scenario Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {prompts.slice(0, 5).map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPrompt(p.text)}
            className={'px-3.5 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer ' + (
              isDark
                ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef] hover:border-[#16697A] hover:text-[#489fb5]'
                : 'bg-white border-slate-200 text-slate-700 hover:border-[#16697A] hover:text-[#16697A] shadow-xs'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
