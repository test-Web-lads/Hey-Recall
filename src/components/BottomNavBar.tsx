import React, { useState } from 'react';
import { Clock, Home, Settings, Plus, CheckSquare, Bookmark } from 'lucide-react';

interface BottomNavBarProps {
  currentView: 'home' | 'reminders' | 'search' | 'settings';
  onSelectView: (view: 'home' | 'reminders' | 'settings') => void;
  onOpenAddTask: () => void;
  onOpenQuickInfo: () => void;
  theme: 'off-white' | 'black';
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentView,
  onSelectView,
  onOpenAddTask,
  onOpenQuickInfo,
  theme,
}) => {
  const isDark = theme === 'black';
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe select-none pointer-events-none">
      {/* Floating Circular "+" Action Button Fixed Closely Above Menu Bar (Only on Home Screen) */}
      {currentView === 'home' && (
        <div className="max-w-md mx-auto relative px-4 pointer-events-auto">
          <div className="absolute right-3.5 bottom-[52px] z-50">
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className={'w-11 h-11 rounded-full bg-[#16697A] hover:bg-[#1a7d91] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer border-2 ' + (
                isDark ? 'border-[#202c33] shadow-black/60' : 'border-white shadow-slate-400/50'
              )}
              title="Add Task or Quick Info"
            >
              <Plus className={'w-5.5 h-5.5 stroke-[2.8px] transition-transform duration-200 ' + (isPlusMenuOpen ? 'rotate-45' : '')} />
            </button>

            {/* Popover Action Menu Above "+" Button */}
            {isPlusMenuOpen && (
              <>
                <div
                  onClick={() => setIsPlusMenuOpen(false)}
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                />
                <div
                  className={'absolute bottom-14 right-0 z-50 w-48 rounded-2xl border shadow-2xl p-2 space-y-1.5 animate-in zoom-in-95 duration-150 ' + (
                    isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenAddTask();
                    }}
                    className={'w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 text-left transition-all cursor-pointer ' + (
                      isDark ? 'hover:bg-[#111b21] text-[#489fb5]' : 'hover:bg-slate-100 text-[#16697A]'
                    )}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Add Task</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenQuickInfo();
                    }}
                    className={'w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 text-left transition-all cursor-pointer ' + (
                      isDark ? 'hover:bg-[#111b21] text-amber-400' : 'hover:bg-slate-100 text-amber-700'
                    )}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                    <span>Quick Info</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation Bar - 3-Column Grid */}
      <div
        className={'max-w-md mx-auto border-t backdrop-blur-xl px-2 py-1.5 shadow-lg transition-colors relative grid grid-cols-3 items-center pointer-events-auto ' + (
          isDark
            ? 'bg-[#202c33]/95 border-[#2a3942] text-[#e9edef]'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50'
        )}
      >
        {/* 1. Reminders */}
        <button
          type="button"
          onClick={() => {
            setIsPlusMenuOpen(false);
            onSelectView('reminders');
          }}
          className={'flex flex-col items-center justify-center py-1 rounded-2xl transition-all active:scale-95 cursor-pointer ' + (
            currentView === 'reminders'
              ? isDark
                ? 'text-[#489fb5]'
                : 'text-[#16697A] font-extrabold'
              : isDark
              ? 'text-[#8696a0] hover:text-[#e9edef]'
              : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <Clock className={'w-5 h-5 ' + (currentView === 'reminders' ? 'stroke-[2.5px]' : 'stroke-[1.8px]')} />
          <span className={'text-[10px] mt-0.5 ' + (currentView === 'reminders' ? 'font-bold' : 'font-medium')}>
            Reminders
          </span>
        </button>

        {/* 2. Home */}
        <button
          type="button"
          onClick={() => {
            setIsPlusMenuOpen(false);
            onSelectView('home');
          }}
          className={'flex flex-col items-center justify-center py-1 rounded-2xl transition-all active:scale-95 cursor-pointer ' + (
            currentView === 'home'
              ? isDark
                ? 'text-[#489fb5]'
                : 'text-[#16697A] font-extrabold'
              : isDark
              ? 'text-[#8696a0] hover:text-[#e9edef]'
              : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <Home className={'w-5 h-5 ' + (currentView === 'home' ? 'stroke-[2.5px]' : 'stroke-[1.8px]')} />
          <span className={'text-[10px] mt-0.5 ' + (currentView === 'home' ? 'font-bold' : 'font-medium')}>
            Home
          </span>
        </button>

        {/* 3. Settings */}
        <button
          type="button"
          onClick={() => {
            setIsPlusMenuOpen(false);
            onSelectView('settings');
          }}
          className={'flex flex-col items-center justify-center py-1 rounded-2xl transition-all active:scale-95 cursor-pointer ' + (
            currentView === 'settings'
              ? isDark
                ? 'text-[#489fb5]'
                : 'text-[#16697A] font-extrabold'
              : isDark
              ? 'text-[#8696a0] hover:text-[#e9edef]'
              : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <Settings className={'w-5 h-5 ' + (currentView === 'settings' ? 'stroke-[2.5px]' : 'stroke-[1.8px]')} />
          <span className={'text-[10px] mt-0.5 ' + (currentView === 'settings' ? 'font-bold' : 'font-medium')}>
            Settings
          </span>
        </button>
      </div>
    </div>
  );
};
