import React from 'react';
import { Sparkles } from 'lucide-react';
import { type PhrasingTemplate, DEFAULT_PHRASING_LIST } from './SettingsView';

interface QuickPromptBarProps {
  prompts?: PhrasingTemplate[];
  onSelectPrompt: (prompt: string) => void;
  theme: 'off-white' | 'black';
}

export const QuickPromptBar: React.FC<QuickPromptBarProps> = ({ prompts = DEFAULT_PHRASING_LIST, onSelectPrompt, theme }) => {
  const isDark = theme === 'black';

  return (
    <div
      className={'sticky top-0 z-30 -mx-4 px-4 pt-2 pb-2 transition-all ' + (
        isDark ? 'bg-[#0b141a]/95 backdrop-blur-md' : 'bg-[#f0f2f5]/95 backdrop-blur-md'
      )}
    >
      <div className={'flex items-center gap-1.5 mb-1.5 text-xs sm:text-sm font-semibold ' + (
        isDark ? 'text-[#8696a0]' : 'text-slate-500'
      )}>
        <Sparkles className="w-4 h-4 text-[#16697A] dark:text-[#489fb5]" />
        <span>Quick Scenarios:</span>
      </div>
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
