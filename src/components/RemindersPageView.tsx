import React, { useState, useRef, useEffect } from 'react';
import type { ReminderItem } from '../types/reminder';
import { ReminderCard } from './ReminderCard';
import {
  Clock,
  Trash2,
  ChevronDown,
  Inbox,
  Bookmark,
  Edit3,
  Check,
  Search,
  X,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

interface RemindersPageViewProps {
  reminders: ReminderItem[];
  theme: 'off-white' | 'black';
  focusedReminderId?: string | null;
  onClearFocusedReminder?: () => void;
  onOpenQuickInfo: () => void;
  onToggleComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onBusy?: (item: ReminderItem) => void;
  onUpdateReminder: (id: string, updates: Partial<ReminderItem>) => void;
}

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
  isHighlighted = false,
  onToggleSelect,
  onDelete,
}) => {
  const isDark = theme === 'black';
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when highlighted from search navigation
  useEffect(() => {
    if (isHighlighted) {
      setIsExpanded(true);
    }
  }, [isHighlighted]);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

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

  // Reset slide offset when edit mode is exited (e.g. tick clicked)
  useEffect(() => {
    if (!isEditMode) {
      setSwipeOffset(0);
    }
  }, [isEditMode]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditMode) return;
    touchStartXRef.current = e.clientX;
    touchStartYRef.current = e.clientY;
    isHorizontalSwipeRef.current = null;
    setIsSwiping(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSwiping || isEditMode) return;
    const diffX = e.clientX - touchStartXRef.current;
    const diffY = e.clientY - touchStartYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (!isHorizontalSwipeRef.current) return;

    if (diffX < 0) {
      const cardWidth = cardRef.current?.offsetWidth || 340;
      const clampedOffset = Math.max(-cardWidth, diffX);
      setSwipeOffset(clampedOffset);
    } else {
      setSwipeOffset(0);
    }
  };

  const handlePointerUp = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    const cardWidth = cardRef.current?.offsetWidth || 340;
    const fullSwipeThreshold = -(cardWidth * 0.5);

    if (swipeOffset < fullSwipeThreshold) {
      // > 50% Swipe Left -> Auto Delete
      setSwipeOffset(-cardWidth);
      onDelete(item.id);
    } else if (swipeOffset < -45) {
      setSwipeOffset(-80);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditMode) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isEditMode) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (!isHorizontalSwipeRef.current) return;

    if (diffX < 0) {
      const cardWidth = cardRef.current?.offsetWidth || 340;
      const clampedOffset = Math.max(-cardWidth, diffX);
      setSwipeOffset(clampedOffset);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    const cardWidth = cardRef.current?.offsetWidth || 340;
    const fullSwipeThreshold = -(cardWidth * 0.5);

    if (swipeOffset < fullSwipeThreshold) {
      // > 50% Swipe Left -> Auto Delete
      setSwipeOffset(-cardWidth);
      onDelete(item.id);
    } else if (swipeOffset < -45) {
      setSwipeOffset(-80);
    } else {
      setSwipeOffset(0);
    }
  };

  const isFullSwipeDelete = swipeOffset < (cardRef.current ? -(cardRef.current.offsetWidth * 0.5) : -170);
  const isShifted = swipeOffset < -40 || (isEditMode && isSelected);

  return (
    <div ref={cardRef} id={`reminder-card-${item.id}`} className="relative overflow-hidden group rounded-2xl">
      {/* Background Full Swipe Delete Bar with Smooth Transition */}
      <div
        className={
          'absolute inset-0 flex items-center justify-end pr-3 z-0 transition-all duration-300 ease-out ' +
          (isFullSwipeDelete ? 'bg-rose-600' : 'bg-transparent')
        }
      >
        <button
          type="button"
          onClick={() => {
            setSwipeOffset(0);
            onDelete(item.id);
          }}
          className={
            'h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ease-out active:scale-95 cursor-pointer ' +
            (isFullSwipeDelete
              ? 'bg-transparent text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs')
          }
          title="Delete Forever"
        >
          <Trash2 className="w-5.5 h-5.5" />
        </button>
      </div>

      {/* Main Front Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
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
          transform: `translateX(${isShifted ? -75 : swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
          touchAction: 'pan-y',
        }}
        className={
          'relative z-10 p-3.5 sm:p-4 rounded-2xl transition-all duration-300 cursor-pointer select-none ' +
          (isHighlighted
            ? 'border-2 border-rose-500 dark:border-rose-400 ring-4 ring-rose-500/30 dark:ring-rose-400/35 shadow-xl shadow-rose-500/25 scale-[1.01] '
            : 'border ') +
          (isDark
            ? 'bg-[#202c33] ' + (!isHighlighted ? 'border-[#2a3942] hover:border-[#16697A]/50 ' : '') + 'text-[#e9edef]'
            : 'bg-white ' + (!isHighlighted ? 'border-slate-200 hover:border-slate-300 ' : '') + 'text-slate-800 shadow-xs')
        }
      >
        <div className="flex items-center gap-3">
          {/* Red Circle on Left in Edit Mode (Light Red Glass Transparent) */}
          {isEditMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(item.id);
                if (isShifted) {
                  setSwipeOffset(0);
                } else {
                  setSwipeOffset(-75);
                }
              }}
              className="w-5.5 h-5.5 rounded-full bg-rose-500/20 dark:bg-rose-500/25 border border-rose-500/40 dark:border-rose-400/50 backdrop-blur-xs hover:bg-rose-500/35 flex items-center justify-center flex-shrink-0 self-center transition-all active:scale-90 cursor-pointer shadow-xs"
              title="Delete item"
            />
          )}

          <div className="flex-1 min-w-0">
            {/* Title Header */}
            <h4
              className={
                'text-xs sm:text-sm font-extrabold tracking-tight break-words leading-snug ' +
                (isDark ? 'text-[#e9edef]' : 'text-slate-900')
              }
            >
              {item.task}
            </h4>

            {/* When Closed: Date & Time */}
            <div
              className={
                'grid transition-all duration-300 ease-out ' +
                (!isExpanded || isEditMode ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 pointer-events-none')
              }
            >
              <div className="overflow-hidden min-h-0">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-[#8696a0]">
                  {item.isLocationNote ? `Saved note • ${timeFormatted}` : `${dayFormatted ? `${dayFormatted} • ` : ''}${timeFormatted}`}
                </p>
              </div>
            </div>

            {/* When Open: Details / Notes + Full Date & Time */}
            {!isEditMode && (
              <div
                className={
                  'grid transition-all duration-300 ease-out ' +
                  (isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1.5' : 'grid-rows-[0fr] opacity-0 pointer-events-none')
                }
              >
                <div className="overflow-hidden min-h-0 space-y-1.5">
                  {item.notes && (
                    <p
                      className={
                        'text-xs sm:text-sm font-normal break-words leading-relaxed ' +
                        (isDark ? 'text-[#8696a0]' : 'text-slate-600')
                      }
                    >
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

export const RemindersPageView: React.FC<RemindersPageViewProps> = ({
  reminders,
  theme,
  focusedReminderId,
  onClearFocusedReminder,
  onOpenQuickInfo,
  onToggleComplete,
  onSnooze,
  onDelete,
  onUpdateReminder,
}) => {
  const isDark = theme === 'black';

  // Inside Trash: sub-dropdowns start closed by default
  const [expandedTrashSubsections, setExpandedTrashSubsections] = useState<{ [key: string]: boolean }>({
    reminders: false,
    quickInfo: false,
  });

  const toggleTrashSubsection = (key: string) => {
    setExpandedTrashSubsections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Independent edit modes for each dropdown inside Trash
  const [isRemindersTrashEditMode, setIsRemindersTrashEditMode] = useState(false);
  const [isQuickInfoTrashEditMode, setIsQuickInfoTrashEditMode] = useState(false);

  const [selectedRemindersTrashIds, setSelectedRemindersTrashIds] = useState<string[]>([]);
  const [selectedQuickInfoTrashIds, setSelectedQuickInfoTrashIds] = useState<string[]>([]);

  const [clearTarget, setClearTarget] = useState<'reminders' | 'quickInfo' | null>(null);

  // Outer Accordion Categories: can open both simultaneously during search or user toggle
  const [expandedSections, setExpandedSections] = useState<{ upcoming: boolean; trash: boolean }>({
    upcoming: false,
    trash: false,
  });

  // Search state in header
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (key: 'upcoming' | 'trash') => {
    setExpandedSections((prev) => ({
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

  // Group into Reminders and Quick Info categories
  const trashReminders = trashList.filter((r) => !r.isLocationNote);
  const trashQuickInfo = trashList.filter((r) => r.isLocationNote);

  // Automatically open BOTH Upcoming and Trash if search matches letters/words in both; keep closed if blank
  useEffect(() => {
    if (searchQuery.trim()) {
      const hasUpcoming = upcomingList.length > 0;
      const hasTrashRem = trashReminders.length > 0;
      const hasTrashQI = trashQuickInfo.length > 0;
      const hasTrash = hasTrashRem || hasTrashQI;

      setExpandedSections({
        upcoming: hasUpcoming,
        trash: hasTrash,
      });

      setExpandedTrashSubsections({
        reminders: hasTrashRem,
        quickInfo: hasTrashQI,
      });
    } else {
      // If search field is blank, keep both dropdowns closed
      setExpandedSections({
        upcoming: false,
        trash: false,
      });
      setExpandedTrashSubsections({
        reminders: false,
        quickInfo: false,
      });
    }
  }, [searchQuery, upcomingList.length, trashReminders.length, trashQuickInfo.length]);

  // Handle focus & scroll when navigating from Search View
  useEffect(() => {
    if (!focusedReminderId) return;

    const target = reminders.find((r) => r.id === focusedReminderId);
    if (!target) return;

    const isTrash = target.status === 'deleted' || target.status === 'completed';

    if (isTrash) {
      setExpandedSections((prev) => ({ ...prev, trash: true }));
      if (target.isLocationNote) {
        setExpandedTrashSubsections((prev) => ({ ...prev, quickInfo: true }));
      } else {
        setExpandedTrashSubsections((prev) => ({ ...prev, reminders: true }));
      }
    } else {
      setExpandedSections((prev) => ({ ...prev, upcoming: true }));
    }

    const scrollToCard = () => {
      const el = document.getElementById(`reminder-card-${focusedReminderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Immediate attempt + settled attempt once accordion finishes animation (320ms)
    const timer1 = setTimeout(scrollToCard, 60);
    const timer2 = setTimeout(scrollToCard, 320);

    // Highlight borders remain active for exactly 3 seconds
    const clearTimer = setTimeout(() => {
      onClearFocusedReminder?.();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(clearTimer);
    };
  }, [focusedReminderId, reminders, onClearFocusedReminder]);

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

  // Auto exit edit mode if items reach 0
  useEffect(() => {
    if (trashReminders.length === 0 && isRemindersTrashEditMode) {
      setIsRemindersTrashEditMode(false);
      setSelectedRemindersTrashIds([]);
    }
  }, [trashReminders.length, isRemindersTrashEditMode]);

  useEffect(() => {
    if (trashQuickInfo.length === 0 && isQuickInfoTrashEditMode) {
      setIsQuickInfoTrashEditMode(false);
      setSelectedQuickInfoTrashIds([]);
    }
  }, [trashQuickInfo.length, isQuickInfoTrashEditMode]);

  return (
    <div className="max-w-xl mx-auto space-y-2.5 animate-in fade-in duration-200">
      {/* Sticky Header Bar */}
      <div
        className={'sticky top-0 z-30 -mt-3 -mx-4 px-4 pt-3 pb-2 transition-all ' + (
          isDark ? 'bg-[#0b141a]/95 backdrop-blur-md' : 'bg-[#f0f2f5]/95 backdrop-blur-md'
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className={'text-xl sm:text-2xl font-black tracking-tight ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
              Reminders
            </h2>
          </div>

          {/* Action Buttons: Search & Quick Info */}
          <div className="flex items-center gap-2">
            {/* Search Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (isSearchOpen) setSearchQuery('');
              }}
              className={'w-10 h-10 rounded-2xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center ' + (
                isSearchOpen
                  ? 'bg-[#16697A] border-[#16697A] text-white shadow-xs'
                  : isDark
                  ? 'bg-[#202c33] border-[#2a3942] text-slate-300 hover:text-white hover:border-[#16697A]'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-[#16697A] hover:bg-slate-50 shadow-xs'
              )}
              title={isSearchOpen ? 'Close Search' : 'Search Reminders'}
            >
              <Search className="w-5 h-5 stroke-[2.2px]" />
            </button>

            {/* Quick Info Button */}
            <button
              type="button"
              onClick={onOpenQuickInfo}
              className={'w-10 h-10 rounded-2xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center ' + (
                isDark
                  ? 'bg-[#202c33] border-[#2a3942] text-amber-400 hover:text-amber-300'
                  : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-50 shadow-xs'
              )}
              title="Quick Info"
            >
              <Bookmark className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Expandable Search Input Bar */}
        {isSearchOpen && (
          <div className="mt-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reminders by title, note, or date..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-medium outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mr-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Unified Attached Rectangular Container */}
      <div
        className={'rounded-2xl border overflow-hidden divide-y shadow-xs transition-all ' + (
          isDark ? 'bg-[#202c33] border-[#2a3942] divide-[#2a3942]' : 'bg-white border-slate-200 divide-slate-100 shadow-slate-200/50'
        )}
      >
        {/* 1. Upcoming Reminders Category */}
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
                        isHighlighted={item.id === focusedReminderId}
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

        {/* 2. Trash Main Section (with Reminders & Quick Info sub-dropdowns) */}
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

          {/* Smooth Expandable Inset Inside Trash Area */}
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
                    {/* Dropdown 1: Reminders Trash Sub-Dropdown */}
                    <div className={'rounded-2xl border overflow-hidden transition-all ' + (
                      isDark ? 'bg-[#202c33]/90 border-[#2a3942]' : 'bg-white border-slate-200 shadow-xs'
                    )}>
                      {/* Header: Click to toggle dropdown with opening chevron on top right */}
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

                        {/* Opening sign (Chevron) on top right */}
                        <div className="p-1 text-slate-400 flex items-center justify-center flex-shrink-0">
                          <ChevronDown className={'w-5 h-5 transition-transform duration-300 ease-out ' + (expandedTrashSubsections.reminders ? 'rotate-180' : 'rotate-0')} />
                        </div>
                      </div>

                      {/* Reminders Inset Content (when open) */}
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
                                {/* Toolbar inside the opened dropdown: Edit / Clear All + Tick */}
                                <div className="flex items-center justify-between px-1 pb-1 h-10">
                                  {/* Left Side: Clear All button (in edit mode) */}
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

                                  {/* Right Side: Edit vs Tick (Instant switch, no sliding transition) */}
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
                                        <Check className="w-6 h-6 stroke-[3px]" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* List of reminder cards */}
                                <div className="space-y-2">
                                  {trashReminders.map((item) => (
                                    <TrashReminderCard
                                      key={item.id}
                                      item={item}
                                      theme={theme}
                                      isEditMode={isRemindersTrashEditMode}
                                      isSelected={selectedRemindersTrashIds.includes(item.id)}
                                      isHighlighted={item.id === focusedReminderId}
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

                    {/* Dropdown 2: Quick Info Trash Sub-Dropdown */}
                    <div className={'rounded-2xl border overflow-hidden transition-all ' + (
                      isDark ? 'bg-[#202c33]/90 border-[#2a3942]' : 'bg-white border-slate-200 shadow-xs'
                    )}>
                      {/* Header: Click to toggle dropdown with opening chevron on top right */}
                      <div
                        onClick={() => toggleTrashSubsection('quickInfo')}
                        className="p-3 sm:p-3.5 flex items-center justify-between gap-2 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-400 flex-shrink-0">
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

                        {/* Opening sign (Chevron) on top right */}
                        <div className="p-1 text-slate-400 flex items-center justify-center flex-shrink-0">
                          <ChevronDown className={'w-5 h-5 transition-transform duration-300 ease-out ' + (expandedTrashSubsections.quickInfo ? 'rotate-180' : 'rotate-0')} />
                        </div>
                      </div>

                      {/* Quick Info Inset Content (when open) */}
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
                              <p className="text-xs text-slate-400 text-center py-3">No deleted quick notes</p>
                            ) : (
                              <>
                                {/* Toolbar inside the opened dropdown: Edit / Clear All + Tick */}
                                <div className="flex items-center justify-between px-1 pb-1 h-10">
                                  {/* Left Side: Clear All button (in edit mode) */}
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

                                  {/* Right Side: Edit vs Tick (Instant switch, no sliding transition) */}
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
                                        <Check className="w-6 h-6 stroke-[3px]" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* List of quick note cards */}
                                <div className="space-y-2">
                                  {trashQuickInfo.map((item) => (
                                    <TrashReminderCard
                                      key={item.id}
                                      item={item}
                                      theme={theme}
                                      isEditMode={isQuickInfoTrashEditMode}
                                      isSelected={selectedQuickInfoTrashIds.includes(item.id)}
                                      isHighlighted={item.id === focusedReminderId}
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

      {/* Warning Confirmation Modal: Clear category history */}
      {clearTarget && (
        <div
          onClick={() => setClearTarget(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={'w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 p-6 text-center ' + (
              isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-3.5">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base sm:text-lg font-extrabold mb-1.5">
              Clear {clearTarget === 'reminders' ? 'Reminder' : 'Quick Info'} History?
            </h3>

            <p className={'text-xs sm:text-sm mb-6 leading-relaxed ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
              This will permanently remove all {clearTarget === 'reminders' ? 'reminders' : 'quick notes'} in trash. This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setClearTarget(null)}
                className={'flex-1 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer ' + (
                  isDark ? 'border-[#2a3942] text-slate-300 hover:bg-[#111b21]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmClearCategory}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-extrabold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
