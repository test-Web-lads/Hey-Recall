import React, { useState, useEffect } from 'react';
import type { ReminderItem } from '../types/reminder';
import { UnifiedTimeWeather } from './UnifiedTimeWeather';
import { QuickPromptBar } from './QuickPromptBar';
import { ReminderCard } from './ReminderCard';
import {
  Clock,
  Trash2,
  ChevronDown,
  Inbox,
  Bookmark,
  Edit3,
  Check,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

import type { PhrasingTemplate } from './SettingsView';

interface TrashCardProps {
  item: ReminderItem;
  theme: 'off-white' | 'black';
  isEditMode: boolean;
  isSelected: boolean;
  isHighlighted?: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const TrashReminderCard: React.FC<TrashCardProps> = ({
  item,
  theme,
  isEditMode,
  isSelected,
  onToggleSelect,
  onDelete,
}) => {
  const isDark = theme === 'black';
  const [isExpanded, setIsExpanded] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  let dayFormatted = '';
  let timeFormatted = '';
  let fullDateFormatted = '';
  try {
    const rawTime = item.completedAt || item.primaryTime || item.createdAt;
    const d = parseISO(rawTime);
    dayFormatted = isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEE, MMM d');
    timeFormatted = format(d, 'h:mm a');
    fullDateFormatted = format(d, 'EEEE, MMMM d, yyyy • h:mm a');
  } catch (e) {
    dayFormatted = '';
    timeFormatted = item.completedAt || item.primaryTime || item.createdAt;
    fullDateFormatted = timeFormatted;
  }

  const isShifted = isEditMode && isSelected;

  return (
    <div id={`reminder-card-${item.id}`} className="relative overflow-hidden group rounded-2xl">
      {/* Background Delete Button */}
      <div className="absolute inset-0 flex items-center justify-end pr-3 z-0 bg-transparent">
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="h-10 w-10 rounded-xl flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white shadow-xs active:scale-95 cursor-pointer"
          title="Delete Forever"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Front Card */}
      <div
        onClick={() => {
          if (swipeOffset !== 0) {
            setSwipeOffset(0);
          } else if (isEditMode) {
            onToggleSelect(item.id);
          } else {
            setIsExpanded(!isExpanded);
          }
        }}
        style={{
          transform: `translateX(${isShifted ? -60 : swipeOffset}px)`,
          transition: 'transform 0.3s ease-out',
        }}
        className={
          'relative z-10 p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none ' +
          (isDark
            ? 'bg-[#202c33] border-[#2a3942] hover:border-[#16697A]/50 text-[#e9edef]'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs')
        }
      >
        <div className="flex items-center gap-3">
          {/* Red Circle on Left in Edit Mode */}
          {isEditMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(item.id);
              }}
              className="w-5.5 h-5.5 rounded-full bg-rose-500/20 dark:bg-rose-500/25 border border-rose-500/40 dark:border-rose-400/50 flex items-center justify-center flex-shrink-0 self-center active:scale-90 cursor-pointer"
              title="Delete item"
            />
          )}

          <div className="flex-1 min-w-0">
            <h4 className={'text-xs sm:text-sm font-extrabold tracking-tight break-words leading-snug ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
              {item.task}
            </h4>

            {/* When Closed: Date & Time */}
            <div className={'grid transition-all duration-300 ease-out ' + (!isExpanded || isEditMode ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 pointer-events-none')}>
              <div className="overflow-hidden min-h-0">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-[#8696a0]">
                  {item.isLocationNote ? `Saved note • ${timeFormatted}` : `${dayFormatted ? `${dayFormatted} • ` : ''}${timeFormatted}`}
                </p>
              </div>
            </div>

            {/* When Open: Notes + Full Date & Time */}
            {!isEditMode && (
              <div className={'grid transition-all duration-300 ease-out ' + (isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1.5' : 'grid-rows-[0fr] opacity-0 pointer-events-none')}>
                <div className="overflow-hidden min-h-0 space-y-1.5">
                  {item.notes && (
                    <p className={'text-xs sm:text-sm font-normal break-words leading-relaxed ' + (isDark ? 'text-[#8696a0]' : 'text-slate-600')}>
                      {item.notes}
                    </p>
                  )}
                  <p className={'text-[11px] sm:text-xs font-normal ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
                    {fullDateFormatted}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  onOpenSettings: () => void;
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
  onOpenSettings,
}) => {
  const isDark = theme === 'black';

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Accordion Section Expanded States (Upcoming starts open by default)
  const [expandedSections, setExpandedSections] = useState<{ upcoming: boolean; trash: boolean }>({
    upcoming: true,
    trash: false,
  });

  // Trash sub-sections
  const [expandedTrashSubsections, setExpandedTrashSubsections] = useState<{ reminders: boolean; quickInfo: boolean }>({
    reminders: false,
    quickInfo: false,
  });

  const [isRemindersTrashEditMode, setIsRemindersTrashEditMode] = useState(false);
  const [isQuickInfoTrashEditMode, setIsQuickInfoTrashEditMode] = useState(false);
  const [selectedRemindersTrashIds, setSelectedRemindersTrashIds] = useState<string[]>([]);
  const [selectedQuickInfoTrashIds, setSelectedQuickInfoTrashIds] = useState<string[]>([]);
  const [clearTarget, setClearTarget] = useState<'reminders' | 'quickInfo' | null>(null);

  const toggleSection = (key: 'upcoming' | 'trash') => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleTrashSubsection = (key: 'reminders' | 'quickInfo') => {
    setExpandedTrashSubsections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filterItem = (r: ReminderItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const taskMatch = r.task.toLowerCase().includes(q);
    const notesMatch = r.notes ? r.notes.toLowerCase().includes(q) : false;
    const voiceMatch = r.rawVoiceInput ? r.rawVoiceInput.toLowerCase().includes(q) : false;
    const dateMatch = r.primaryTime ? r.primaryTime.toLowerCase().includes(q) : false;
    return taskMatch || notesMatch || voiceMatch || dateMatch;
  };

  const rawUpcomingList = reminders.filter(
    (r) => r.status !== 'deleted' && r.status !== 'completed' && !r.isLocationNote
  );
  
  const rawTrashList = reminders.filter(
    (r) => r.status === 'deleted' || r.status === 'completed'
  );

  const upcomingList = rawUpcomingList.filter(filterItem);
  const trashList = rawTrashList.filter(filterItem);

  const trashReminders = trashList.filter((r) => !r.isLocationNote);
  const trashQuickInfo = trashList.filter((r) => r.isLocationNote);

  // When searching, auto-expand matching categories
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedSections({
        upcoming: upcomingList.length > 0,
        trash: trashList.length > 0,
      });
      setExpandedTrashSubsections({
        reminders: trashReminders.length > 0,
        quickInfo: trashQuickInfo.length > 0,
      });
    }
  }, [searchQuery, upcomingList.length, trashList.length, trashReminders.length, trashQuickInfo.length]);

  const handleToggleSelectReminderTrash = (id: string) => {
    setSelectedRemindersTrashIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectQuickInfoTrash = (id: string) => {
    setSelectedQuickInfoTrashIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmClearCategory = () => {
    if (clearTarget === 'reminders') {
      trashReminders.forEach((t) => onDelete(t.id));
      setSelectedRemindersTrashIds([]);
      setIsRemindersTrashEditMode(false);
    } else if (clearTarget === 'quickInfo') {
      trashQuickInfo.forEach((t) => onDelete(t.id));
      setSelectedQuickInfoTrashIds([]);
      setIsQuickInfoTrashEditMode(false);
    }
    setClearTarget(null);
  };

  return (
    <div className="relative space-y-3.5 pb-20">
      {/* Quick Voice Scenarios Header with Search and Settings on Top Right */}
      <QuickPromptBar
        prompts={prompts}
        onSelectPrompt={onSelectPrompt}
        theme={theme}
        onOpenSettings={onOpenSettings}
        onToggleSearch={() => {
          setIsSearchOpen((prev) => !prev);
          if (isSearchOpen) setSearchQuery('');
        }}
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Unified Single Section: Time & Weather (50% / 50% split) */}
      <UnifiedTimeWeather theme={theme} />

      {/* Quick Info / Location Notes Bookmark Strip */}
      <div className="flex items-center justify-between px-1">
        <div className={'flex items-center gap-1.5 text-xs sm:text-sm font-semibold ' + (
          isDark ? 'text-[#8696a0]' : 'text-slate-500'
        )}>
          <Clock className="w-4 h-4 text-[#16697A] dark:text-[#489fb5]" />
          <span>Reminders & Notes</span>
        </div>

        {/* Quick Info Notes Button with Count Badge */}
        <button
          type="button"
          onClick={onOpenLocations}
          className={'relative px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ' + (
            isDark
              ? 'bg-[#202c33] border-[#2a3942] text-amber-400 hover:text-amber-300'
              : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-50 shadow-xs'
          )}
          title="Quick Info Notes"
        >
          <Bookmark className="w-3.5 h-3.5 fill-current" />
          <span>Quick Info</span>
          {locationCount > 0 && (
            <span className="min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center shadow-xs">
              {locationCount}
            </span>
          )}
        </button>
      </div>

      {/* Full Reminders Section directly on Home Screen */}
      <div
        className={'rounded-2xl border overflow-hidden divide-y shadow-xs transition-all ' + (
          isDark ? 'bg-[#202c33] border-[#2a3942] divide-[#2a3942]' : 'bg-white border-slate-200 divide-slate-100 shadow-slate-200/50'
        )}
      >
        {/* 1. Upcoming Reminders Category (Collapsible Accordion) */}
        <div>
          <div
            onClick={() => toggleSection('upcoming')}
            className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-[#16697A] dark:text-[#489fb5]">
                <Clock className="w-5.5 h-5.5 text-[#16697A] dark:text-[#489fb5]" />
              </div>
              <h3 className={'text-base sm:text-lg font-extrabold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                Upcoming Reminders
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <span className={'text-xs font-bold px-2.5 py-0.5 rounded-full ' + (
                isDark ? 'bg-[#16697A]/25 text-[#489fb5]' : 'bg-[#16697A]/15 text-[#16697A]'
              )}>
                {upcomingList.length}
              </span>
              <div className="p-1 text-slate-400 flex items-center justify-center">
                <ChevronDown className={'w-5.5 h-5.5 transition-transform duration-300 ease-out ' + (expandedSections.upcoming ? 'rotate-180' : 'rotate-0')} />
              </div>
            </div>
          </div>

          {/* Smooth Expandable Inset Inside Area */}
          <div
            className={
              'grid transition-all duration-300 ease-out ' +
              (expandedSections.upcoming ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none')
            }
          >
            <div className="overflow-hidden min-h-0">
              <div className={'p-3 sm:p-4 border-t space-y-2.5 ' + (
                isDark ? 'border-[#2a3942] bg-[#111b21]/70' : 'border-slate-200 bg-slate-100/70'
              )}>
                {upcomingList.length === 0 ? (
                  <div className="p-6 text-center">
                    <Inbox className="w-9 h-9 mx-auto mb-2 text-slate-400 opacity-60" />
                    <p className="text-xs sm:text-sm text-slate-400 font-medium">No upcoming reminders</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingList.map((item) => (
                      <ReminderCard
                        key={item.id}
                        item={item}
                        theme={theme}
                        isAttached={false}
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
          </div>
        </div>

        {/* 2. Trash Main Section */}
        <div>
          <div
            onClick={() => toggleSection('trash')}
            className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-500">
                <Trash2 className="w-5.5 h-5.5 text-rose-500" />
              </div>
              <h3 className={'text-base sm:text-lg font-extrabold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                Trash
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <span className={'text-xs font-bold px-2.5 py-0.5 rounded-full ' + (
                isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-800'
              )}>
                {trashList.length}
              </span>
              <div className="p-1 text-slate-400 flex items-center justify-center">
                <ChevronDown className={'w-5.5 h-5.5 transition-transform duration-300 ease-out ' + (expandedSections.trash ? 'rotate-180' : 'rotate-0')} />
              </div>
            </div>
          </div>

          {/* Expandable Inset Inside Trash Area */}
          <div
            className={
              'grid transition-all duration-300 ease-out ' +
              (expandedSections.trash ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none')
            }
          >
            <div className="overflow-hidden min-h-0">
              <div className={'p-3 sm:p-4 border-t space-y-3 ' + (
                isDark ? 'border-[#2a3942] bg-[#111b21]/70' : 'border-slate-200 bg-slate-100/70'
              )}>
                {trashList.length === 0 ? (
                  <div className="p-6 text-center">
                    <Trash2 className="w-9 h-9 mx-auto mb-2 text-slate-400 opacity-60" />
                    <p className="text-xs sm:text-sm text-slate-400 font-medium">Trash is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Dropdown 1: Reminders Trash */}
                    <div className={'rounded-2xl border overflow-hidden transition-all ' + (
                      isDark ? 'bg-[#202c33]/90 border-[#2a3942]' : 'bg-white border-slate-200 shadow-xs'
                    )}>
                      <div
                        onClick={() => toggleTrashSubsection('reminders')}
                        className="p-3 sm:p-3.5 flex items-center justify-between gap-2 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#16697A]/15 text-[#16697A] dark:text-[#489fb5] flex-shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <h4 className={'text-sm font-extrabold truncate ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                            Reminders
                          </h4>
                          <span className={'text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ' + (
                            isDark ? 'bg-[#16697A]/25 text-[#489fb5]' : 'bg-[#16697A]/15 text-[#16697A]'
                          )}>
                            {trashReminders.length}
                          </span>
                        </div>

                        <div className="p-1 text-slate-400 flex items-center justify-center flex-shrink-0">
                          <ChevronDown className={'w-5 h-5 transition-transform duration-300 ease-out ' + (expandedTrashSubsections.reminders ? 'rotate-180' : 'rotate-0')} />
                        </div>
                      </div>

                      {/* Reminders Inset Content */}
                      <div
                        className={
                          'grid transition-all duration-300 ease-out ' +
                          (expandedTrashSubsections.reminders ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none')
                        }
                      >
                        <div className="overflow-hidden min-h-0">
                          <div className={'p-2.5 sm:p-3 border-t space-y-2.5 ' + (
                            isDark ? 'border-[#2a3942] bg-[#111b21]/40' : 'border-slate-100 bg-slate-50/50'
                          )}>
                            {trashReminders.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-3">No deleted reminders</p>
                            ) : (
                              <>
                                <div className="flex items-center justify-between px-1 pb-1 h-10">
                                  <div className="flex items-center">
                                    {isRemindersTrashEditMode && (
                                      <button
                                        type="button"
                                        onClick={() => setClearTarget('reminders')}
                                        className="text-xs sm:text-sm font-extrabold text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                                      >
                                        Clear All
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center">
                                    {!isRemindersTrashEditMode ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsRemindersTrashEditMode(true);
                                          setSelectedRemindersTrashIds([]);
                                        }}
                                        className={'px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-extrabold flex items-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap ' + (
                                          isDark
                                            ? 'border-[#2a3942] text-slate-200 hover:bg-[#111b21]'
                                            : 'border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs'
                                        )}
                                      >
                                        <Edit3 className="w-4 h-4 text-[#16697A] dark:text-[#489fb5]" />
                                        <span>Edit</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsRemindersTrashEditMode(false);
                                          setSelectedRemindersTrashIds([]);
                                        }}
                                        className="p-1.5 rounded-xl text-white bg-[#16697A] hover:bg-[#1a7d91] active:scale-95 cursor-pointer flex items-center justify-center shadow-xs"
                                        title="Done"
                                      >
                                        <Check className="w-5 h-5 stroke-[3px]" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {trashReminders.map((item) => (
                                    <TrashReminderCard
                                      key={item.id}
                                      item={item}
                                      theme={theme}
                                      isEditMode={isRemindersTrashEditMode}
                                      isSelected={selectedRemindersTrashIds.includes(item.id)}
                                      onToggleSelect={handleToggleSelectReminderTrash}
                                      onDelete={onDelete}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown 2: Quick Info Trash */}
                    <div className={'rounded-2xl border overflow-hidden transition-all ' + (
                      isDark ? 'bg-[#202c33]/90 border-[#2a3942]' : 'bg-white border-slate-200 shadow-xs'
                    )}>
                      <div
                        onClick={() => toggleTrashSubsection('quickInfo')}
                        className="p-3 sm:p-3.5 flex items-center justify-between gap-2 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-500 flex-shrink-0">
                            <Bookmark className="w-4 h-4 fill-current" />
                          </div>
                          <h4 className={'text-sm font-extrabold truncate ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                            Quick Info
                          </h4>
                          <span className={'text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ' + (
                            isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                          )}>
                            {trashQuickInfo.length}
                          </span>
                        </div>

                        <div className="p-1 text-slate-400 flex items-center justify-center flex-shrink-0">
                          <ChevronDown className={'w-5 h-5 transition-transform duration-300 ease-out ' + (expandedTrashSubsections.quickInfo ? 'rotate-180' : 'rotate-0')} />
                        </div>
                      </div>

                      {/* Quick Info Inset Content */}
                      <div
                        className={
                          'grid transition-all duration-300 ease-out ' +
                          (expandedTrashSubsections.quickInfo ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none')
                        }
                      >
                        <div className="overflow-hidden min-h-0">
                          <div className={'p-2.5 sm:p-3 border-t space-y-2.5 ' + (
                            isDark ? 'border-[#2a3942] bg-[#111b21]/40' : 'border-slate-100 bg-slate-50/50'
                          )}>
                            {trashQuickInfo.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-3">No deleted notes</p>
                            ) : (
                              <>
                                <div className="flex items-center justify-between px-1 pb-1 h-10">
                                  <div className="flex items-center">
                                    {isQuickInfoTrashEditMode && (
                                      <button
                                        type="button"
                                        onClick={() => setClearTarget('quickInfo')}
                                        className="text-xs sm:text-sm font-extrabold text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                                      >
                                        Clear All
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center">
                                    {!isQuickInfoTrashEditMode ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsQuickInfoTrashEditMode(true);
                                          setSelectedQuickInfoTrashIds([]);
                                        }}
                                        className={'px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-extrabold flex items-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap ' + (
                                          isDark
                                            ? 'border-[#2a3942] text-slate-200 hover:bg-[#111b21]'
                                            : 'border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs'
                                        )}
                                      >
                                        <Edit3 className="w-4 h-4 text-[#16697A] dark:text-[#489fb5]" />
                                        <span>Edit</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsQuickInfoTrashEditMode(false);
                                          setSelectedQuickInfoTrashIds([]);
                                        }}
                                        className="p-1.5 rounded-xl text-white bg-[#16697A] hover:bg-[#1a7d91] active:scale-95 cursor-pointer flex items-center justify-center shadow-xs"
                                        title="Done"
                                      >
                                        <Check className="w-5 h-5 stroke-[3px]" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {trashQuickInfo.map((item) => (
                                    <TrashReminderCard
                                      key={item.id}
                                      item={item}
                                      theme={theme}
                                      isEditMode={isQuickInfoTrashEditMode}
                                      isSelected={selectedQuickInfoTrashIds.includes(item.id)}
                                      onToggleSelect={handleToggleSelectQuickInfoTrash}
                                      onDelete={onDelete}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {clearTarget && (
        <div
          onClick={() => setClearTarget(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={'w-full max-w-sm rounded-3xl p-5 shadow-2xl border transition-all animate-in zoom-in-95 duration-150 ' + (
              isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-center mb-1">
              Clear All {clearTarget === 'reminders' ? 'Deleted Reminders' : 'Deleted Quick Info'}?
            </h3>
            <p className={'text-xs text-center mb-5 ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
              This action cannot be undone. All items in this trash folder will be permanently deleted.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setClearTarget(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCategory}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md active:scale-95 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
