import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReminderItem } from '../types/reminder';
import {
  Trash2,
  Edit3,
  Check,
  PhoneCall,
  Car,
  BookOpen,
  Pill,
  ShoppingCart,
  CreditCard,
  Briefcase,
  Plane,
  Dumbbell,
  Utensils,
  Mail,
  Sparkles,
  AlertCircle,
  X,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, addDays } from 'date-fns';

interface ReminderCardProps {
  item: ReminderItem;
  theme: 'off-white' | 'black';
  isAttached?: boolean;
  isHighlighted?: boolean;
  onCardClick?: () => void;
  onToggleComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onDelete: (id: string) => void;
  onBusy?: (item: ReminderItem) => void;
  onUpdateReminder: (id: string, updates: Partial<ReminderItem>) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  item,
  theme,
  isAttached = false,
  isHighlighted = false,
  onCardClick,
  onToggleComplete,
  onDelete,
  onUpdateReminder,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Auto-expand when highlighted from search navigation
  useEffect(() => {
    if (isHighlighted) {
      setIsExpanded(true);
    }
  }, [isHighlighted]);

  // Swipe state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const hasSwiped = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Edit modal fields
  const [editTask, setEditTask] = useState(item.task);
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');

  const isDark = theme === 'black';
  const isCompleted = item.status === 'completed';

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = Array.from({ length: 60 }, (_, i) => i);

  // Format date display: "Today Friday 21, 2026", "Tomorrow Saturday 22, 2026", etc.
  const getFormattedDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0])) return dateString;

    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    const isToday =
      dateObj.getFullYear() === today.getFullYear() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getDate() === today.getDate();

    const tomorrow = addDays(today, 1);
    const isTomorrow =
      dateObj.getFullYear() === tomorrow.getFullYear() &&
      dateObj.getMonth() === tomorrow.getMonth() &&
      dateObj.getDate() === tomorrow.getDate();

    const baseFormat = format(dateObj, 'EEEE d, yyyy');
    if (isToday) return `Today ${baseFormat}`;
    if (isTomorrow) return `Tomorrow ${baseFormat}`;
    return baseFormat;
  };

  // Realtime past-time check
  const isSelectedTimeInPast = (() => {
    const now = new Date();
    let hour24 = selectedHour % 12;
    if (selectedPeriod === 'PM') hour24 += 12;

    const parts = selectedDateStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0])) {
      const candidate = new Date(parts[0], parts[1] - 1, parts[2], hour24, selectedMinute, 0, 0);
      return candidate.getTime() <= now.getTime();
    }
    return false;
  })();

  // Load item data into edit fields when modal opens
  useEffect(() => {
    if (isEditModalOpen) {
      setEditTask(item.task);
      setEditNotes(item.notes || '');
      setEditError(null);

      try {
        const itemDate = parseISO(item.primaryTime);
        const now = new Date();

        if (itemDate.getTime() > now.getTime()) {
          setSelectedDateStr(format(itemDate, 'yyyy-MM-dd'));
          const h24 = itemDate.getHours();
          setSelectedHour(h24 % 12 || 12);
          setSelectedMinute(itemDate.getMinutes());
          setSelectedPeriod(h24 >= 12 ? 'PM' : 'AM');
        } else {
          // Past/overdue — default to +30 min in future
          const futureDate = new Date(now.getTime() + 30 * 60000);
          const roundedMinutes = Math.ceil(futureDate.getMinutes() / 5) * 5;
          futureDate.setMinutes(roundedMinutes, 0, 0);
          setSelectedDateStr(format(futureDate, 'yyyy-MM-dd'));
          const h24 = futureDate.getHours();
          setSelectedHour(h24 % 12 || 12);
          setSelectedMinute(futureDate.getMinutes());
          setSelectedPeriod(h24 >= 12 ? 'PM' : 'AM');
        }
      } catch {
        setSelectedDateStr(format(new Date(), 'yyyy-MM-dd'));
        setSelectedHour(12);
        setSelectedMinute(0);
        setSelectedPeriod('PM');
      }
    }
  }, [isEditModalOpen, item]);

  const getSmartTaskIcon = () => {
    const text = (item.task + ' ' + (item.rawVoiceInput || '')).toLowerCase();
    if (text.includes('call') || text.includes('phone') || text.includes('dial')) return <PhoneCall className="w-5 h-5 text-emerald-500" />;
    if (text.includes('pill') || text.includes('medicine') || text.includes('medication') || text.includes('doctor') || text.includes('pharmacy')) return <Pill className="w-5 h-5 text-rose-500" />;
    if (text.includes('car') || text.includes('drive') || text.includes('park') || text.includes('gas')) return <Car className="w-5 h-5 text-blue-500" />;
    if (text.includes('buy') || text.includes('grocery') || text.includes('groceries') || text.includes('shop') || text.includes('store')) return <ShoppingCart className="w-5 h-5 text-amber-500" />;
    if (text.includes('read') || text.includes('book') || text.includes('study') || text.includes('homework')) return <BookOpen className="w-5 h-5 text-indigo-500" />;
    if (text.includes('pay') || text.includes('bill') || text.includes('bank') || text.includes('rent') || text.includes('money')) return <CreditCard className="w-5 h-5 text-teal-500" />;
    if (text.includes('work') || text.includes('meeting') || text.includes('office') || text.includes('client')) return <Briefcase className="w-5 h-5 text-sky-500" />;
    if (text.includes('flight') || text.includes('airport') || text.includes('travel') || text.includes('trip')) return <Plane className="w-5 h-5 text-cyan-500" />;
    if (text.includes('gym') || text.includes('workout') || text.includes('exercise') || text.includes('run')) return <Dumbbell className="w-5 h-5 text-orange-500" />;
    if (text.includes('dinner') || text.includes('lunch') || text.includes('breakfast') || text.includes('food') || text.includes('restaurant')) return <Utensils className="w-5 h-5 text-lime-500" />;
    if (text.includes('email') || text.includes('mail') || text.includes('send') || text.includes('message')) return <Mail className="w-5 h-5 text-violet-500" />;
    return <Sparkles className="w-5 h-5 text-[#16697A] dark:text-[#489fb5]" />;
  };

  let dayFormatted = '';
  let timeFormatted = '';
  let fullDateFormatted = '';
  try {
    const d = parseISO(item.primaryTime);
    dayFormatted = isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEE, MMM d');
    timeFormatted = format(d, 'h:mm a');
    fullDateFormatted = format(d, 'EEEE, MMMM d, yyyy • h:mm a');
  } catch {
    dayFormatted = 'Scheduled';
    timeFormatted = item.primaryTime;
    fullDateFormatted = item.primaryTime;
  }

  // ─── Swipe Handlers ────────────────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditModalOpen || isDeleteConfirmOpen) return;
    touchStartXRef.current = e.clientX;
    touchStartYRef.current = e.clientY;
    isHorizontalSwipeRef.current = null;
    hasSwiped.current = false;
    setIsSwiping(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSwiping || isEditModalOpen || isDeleteConfirmOpen) return;
    const diffX = e.clientX - touchStartXRef.current;
    const diffY = e.clientY - touchStartYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }
    if (!isHorizontalSwipeRef.current) return;
    if (Math.abs(diffX) > 8) hasSwiped.current = true;

    const cardWidth = cardRef.current?.offsetWidth || 360;
    if (diffX < 0) {
      setSwipeOffset(Math.max(-cardWidth, diffX));
    } else {
      setSwipeOffset(Math.min(cardWidth, diffX));
    }
  };

  const snapOnRelease = (offset: number) => {
    const cardWidth = cardRef.current?.offsetWidth || 360;
    const fullLeft = -(cardWidth * 0.55);
    const fullRight = cardWidth * 0.55;

    if (offset < fullLeft) {
      // Full swipe left (>55%) → auto-delete with slide off
      setSwipeOffset(-cardWidth);
      setTimeout(() => onDelete(item.id), 200);
    } else if (offset > fullRight) {
      // Full swipe right (>55%) → auto-complete with slide off
      setSwipeOffset(cardWidth);
      setTimeout(() => onToggleComplete(item.id), 200);
    } else if (offset < -30) {
      // Partial swipe left (>30px) → Snap open Edit + Delete tiles (130px total)
      setSwipeOffset(-130);
    } else if (offset > 30) {
      // Partial swipe right (>30px) → Snap open Done tile (75px)
      setSwipeOffset(75);
    } else {
      setSwipeOffset(0);
    }
  };

  const handlePointerUp = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    snapOnRelease(swipeOffset);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditModalOpen || isDeleteConfirmOpen) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    hasSwiped.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isEditModalOpen || isDeleteConfirmOpen) return;
    const diffX = e.touches[0].clientX - touchStartXRef.current;
    const diffY = e.touches[0].clientY - touchStartYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }
    if (!isHorizontalSwipeRef.current) return;
    if (Math.abs(diffX) > 8) hasSwiped.current = true;

    const cardWidth = cardRef.current?.offsetWidth || 360;
    if (diffX < 0) {
      setSwipeOffset(Math.max(-cardWidth, diffX));
    } else {
      setSwipeOffset(Math.min(cardWidth, diffX));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    snapOnRelease(swipeOffset);
  };

  // ─── Save Edit ─────────────────────────────────────────────────────────────

  const handleSaveModalEdit = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const cleanTitle = editTask.trim();
    if (!cleanTitle) {
      setEditError('Please enter a reminder title.');
      return;
    }

    const now = new Date();
    let hour24 = selectedHour % 12;
    if (selectedPeriod === 'PM') hour24 += 12;

    const parts = selectedDateStr.split('-').map(Number);
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth();
    let targetDate = now.getDate();

    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      targetYear = parts[0];
      targetMonth = parts[1] - 1;
      targetDate = parts[2];
    }

    const chosenDate = new Date(
      targetYear,
      targetMonth,
      targetDate,
      hour24,
      selectedMinute,
      0,
      0
    );

    // Auto advance to tomorrow if today's chosen time already passed
    const isToday =
      targetYear === now.getFullYear() &&
      targetMonth === now.getMonth() &&
      targetDate === now.getDate();

    if (isToday && chosenDate.getTime() <= now.getTime()) {
      chosenDate.setDate(chosenDate.getDate() + 1);
    }

    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

    onUpdateReminder(item.id, {
      task: cleanTitle,
      notes: editNotes.trim() || undefined,
      primaryTime: chosenDate.toISOString(),
      status: 'pending',
    });

    setIsEditModalOpen(false);
  };

  // ─── Derived state ─────────────────────────────────────────────────────────

  const isFullSwipeDelete = swipeOffset < (cardRef.current ? -(cardRef.current.offsetWidth * 0.55) : -180);
  const isFullSwipeComplete = swipeOffset > (cardRef.current ? (cardRef.current.offsetWidth * 0.55) : 180);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={cardRef}
      id={`reminder-card-${item.id}`}
      className={'relative overflow-hidden group select-none ' + (isAttached ? 'rounded-2xl' : 'rounded-2xl mb-2.5')}
    >
      {/* ── WhatsApp Style Right Action Tiles: Edit (Blue) + Delete (Red) - Icons Only ── */}
      <div
        className={
          'absolute inset-y-0 right-0 flex items-stretch transition-all duration-300 ease-out ' +
          (swipeOffset < 0 ? 'z-20 pointer-events-auto ' : 'z-0 pointer-events-none ') +
          (isFullSwipeDelete ? 'w-full bg-rose-600' : 'bg-transparent')
        }
      >
        {/* Edit Action Tile */}
        <div
          className={
            'transition-all duration-300 ease-out overflow-hidden flex items-stretch ' +
            (!isFullSwipeDelete ? 'w-[65px] opacity-100' : 'w-0 opacity-0 pointer-events-none')
          }
        >
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSwipeOffset(0);
              setIsEditModalOpen(true);
            }}
            className="w-[65px] bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center active:opacity-85 transition-all cursor-pointer flex-shrink-0"
            title="Edit"
          >
            <Edit3 className="w-6 h-6 stroke-[2.5px]" />
          </button>
        </div>

        {/* Delete Action Tile */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSwipeOffset(0);
            if (isFullSwipeDelete) {
              onDelete(item.id);
            } else {
              setIsDeleteConfirmOpen(true);
            }
          }}
          className={
            'flex items-center justify-center transition-all duration-300 ease-out active:opacity-85 cursor-pointer overflow-hidden ' +
            (isFullSwipeDelete
              ? 'flex-1 bg-rose-600 text-white'
              : 'w-[65px] bg-[#e11d48] hover:bg-[#be123c] text-white')
          }
          title="Delete"
        >
          <Trash2 className={'stroke-[2.5px] transition-transform duration-200 ' + (isFullSwipeDelete ? 'w-8 h-8 scale-110' : 'w-6 h-6')} />
        </button>
      </div>

      {/* ── Left Action Tile: Complete / Done (Theme Color #16697A) - Icon Only ── */}
      <div
        className={
          'absolute inset-y-0 left-0 flex items-stretch transition-all duration-300 ease-out ' +
          (swipeOffset > 0 ? 'z-20 pointer-events-auto ' : 'z-0 pointer-events-none ') +
          (isFullSwipeComplete ? 'w-full bg-[#16697A]' : 'bg-transparent')
        }
      >
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSwipeOffset(0);
            onToggleComplete(item.id);
          }}
          className={
            'flex items-center justify-center transition-all duration-300 ease-out active:opacity-85 cursor-pointer overflow-hidden ' +
            (isFullSwipeComplete
              ? 'flex-1 bg-[#16697A] text-white'
              : 'w-[75px] bg-[#16697A] hover:bg-[#1a7d91] text-white')
          }
          title="Done"
        >
          <Check className={'stroke-[3.2px] transition-transform duration-200 ' + (isFullSwipeComplete ? 'w-9 h-9 scale-110' : 'w-7 h-7')} />
        </button>
      </div>

      {/* ── Front Card with WhatsApp-grade Spring Physics ── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (hasSwiped.current) {
            hasSwiped.current = false;
            return;
          }
          if (swipeOffset !== 0) {
            setSwipeOffset(0);
            return;
          }
          if (onCardClick) {
            onCardClick();
            return;
          }
          setIsExpanded(!isExpanded);
        }}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.9, 0.25, 1)',
          touchAction: 'pan-y',
        }}
        className={
          'relative z-10 p-3.5 sm:p-4 rounded-2xl transition-all duration-300 cursor-pointer select-none ' +
          (isHighlighted
            ? 'border-2 border-[#16697A] dark:border-[#489fb5] ring-4 ring-[#16697A]/30 dark:ring-[#489fb5]/35 shadow-xl shadow-[#16697A]/25 scale-[1.01] '
            : 'border ') +
          (isDark
            ? 'bg-[#202c33] ' + (!isHighlighted ? 'border-[#2a3942] ' : '') + 'text-[#e9edef]'
            : 'bg-white ' + (!isHighlighted ? 'border-slate-200 ' : '') + 'text-slate-800 shadow-xs')
        }
      >
        <div className="flex items-center gap-3">
          {/* Category Icon */}
          <div
            className={
              'transition-all duration-300 ease-out overflow-hidden flex-shrink-0 flex items-center justify-center self-center ' +
              (!isExpanded ? 'w-9 opacity-100' : 'w-0 opacity-0 -mr-3')
            }
          >
            <span className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
              {getSmartTaskIcon()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className={
                'text-xs sm:text-sm font-extrabold tracking-tight break-words leading-snug ' +
                (isCompleted
                  ? 'line-through text-slate-400 dark:text-[#8696a0]'
                  : isDark
                  ? 'text-[#e9edef]'
                  : 'text-slate-900')
              }
            >
              {item.task}
            </h4>

            {/* Collapsed: date+time */}
            <div
              className={
                'grid transition-all duration-300 ease-out ' +
                (!isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 pointer-events-none')
              }
            >
              <div className="overflow-hidden min-h-0">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-[#8696a0]">
                  {dayFormatted} • {timeFormatted}
                </p>
              </div>
            </div>

            {/* Expanded: notes + full date */}
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
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal (Rendered to body via portal) ── */}
      {isDeleteConfirmOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsDeleteConfirmOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={
                'w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ' +
                (isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-slate-200 text-slate-900')
              }
            >
              <div className="p-6 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold mb-1">Delete Reminder?</h3>
                  <p className={'text-sm ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
                    "<span className="font-semibold">{item.task}</span>" will be moved to Trash.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className={
                      'flex-1 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer border ' +
                      (isDark
                        ? 'border-[#2a3942] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteConfirmOpen(false);
                      onDelete(item.id);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-extrabold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Edit Modal (Identical Layout to AddReminderModal via portal) ── */}
      {isEditModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => {
              if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
              setIsEditModalOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={
                'w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-150 ' +
                (isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-slate-200 text-slate-900')
              }
            >
              {/* Top Header Row: Modal Title aligned next to Cross Button */}
              <div className={'flex items-center justify-between px-5 pt-3.5 pb-2.5 border-b ' + (isDark ? 'border-[#2a3942]' : 'border-slate-100')}>
                <h3 className="text-sm font-extrabold text-[#16697A] dark:text-[#489fb5]">
                  Edit Task
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                    setIsEditModalOpen(false);
                  }}
                  className={
                    'w-7 h-7 rounded-full flex items-center justify-center border shadow-xs transition-all cursor-pointer active:scale-90 ' +
                    (isDark
                      ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] hover:bg-[#2a3942] hover:text-white shadow-black/40'
                      : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 hover:text-black shadow-slate-200')
                  }
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.8px]" />
                </button>
              </div>

              {/* Clean Form without extra section headers */}
              <form noValidate onSubmit={handleSaveModalEdit} className="p-5 pt-3 space-y-3">
                {/* Title Field with Character Counter */}
                <div>
                  <div className="flex items-center justify-end mb-1">
                    <span className={'text-[11px] font-medium ' + (editTask.length >= 40 ? 'text-amber-500 font-bold' : isDark ? 'text-[#8696a0]' : 'text-slate-400')}>
                      {editTask.length}/40
                    </span>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    maxLength={40}
                    placeholder="e.g. Doctor appointment, buy groceries..."
                    value={editTask}
                    onChange={(e) => {
                      setEditTask(e.target.value);
                      if (editError) setEditError(null);
                    }}
                    className={
                      'w-full px-3.5 py-2 rounded-2xl border text-xs sm:text-sm outline-none transition-all ' +
                      (editError
                        ? 'border-rose-500 ring-2 ring-rose-500/30'
                        : isDark
                        ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] focus:border-[#16697A]'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-[#16697A]')
                    }
                  />
                </div>

                {/* Description Field with Character Counter */}
                <div>
                  <div className="flex items-center justify-end mb-1">
                    <span className={'text-[11px] font-medium ' + (editNotes.length >= 500 ? 'text-amber-500 font-bold' : isDark ? 'text-[#8696a0]' : 'text-slate-400')}>
                      {editNotes.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Additional details..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className={
                      'w-full px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm outline-none ' +
                      (isDark
                        ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] focus:border-[#16697A]'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-[#16697A]')
                    }
                  />
                </div>

                {/* Date Picker (Clickable to change up to 9999/12/31) */}
                <div className="relative">
                  <div
                    className={'w-full px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between transition-all ' + (
                      isDark
                        ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#16697A] dark:text-[#489fb5]" />
                      <span>{getFormattedDateDisplay(selectedDateStr)}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">📅 Tap to change date</span>
                  </div>

                  {/* Native Calendar Picker Overlay */}
                  <input
                    type="date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    max="9999-12-31"
                    value={selectedDateStr}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDateStr(e.target.value);
                        if (editError) setEditError(null);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                </div>

                {/* Time Picker */}
                <div className="grid grid-cols-7 gap-2 items-center">
                      {/* Hour (01-12) */}
                      <div className="col-span-3">
                        <select
                          value={selectedHour}
                          onChange={(e) => {
                            setSelectedHour(Number(e.target.value));
                            if (editError) setEditError(null);
                          }}
                          className={
                            'w-full px-3 py-2 rounded-2xl border text-xs sm:text-sm font-bold outline-none text-center ' +
                            (isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-slate-50 border-slate-200 text-slate-900')
                          }
                        >
                          {hoursList.map((h) => (
                            <option key={h} value={h}>
                              {h < 10 ? '0' + h : h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Minute (00-59) */}
                      <div className="col-span-2">
                        <select
                          value={selectedMinute}
                          onChange={(e) => {
                            setSelectedMinute(Number(e.target.value));
                            if (editError) setEditError(null);
                          }}
                          className={
                            'w-full px-2 py-2 rounded-2xl border text-xs sm:text-sm font-bold outline-none text-center ' +
                            (isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-slate-50 border-slate-200 text-slate-900')
                          }
                        >
                          {minutesList.map((m) => (
                            <option key={m} value={m}>
                              {m < 10 ? '0' + m : m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Period AM/PM */}
                      <div className="col-span-2">
                        <select
                          value={selectedPeriod}
                          onChange={(e) => {
                            setSelectedPeriod(e.target.value as 'AM' | 'PM');
                            if (editError) setEditError(null);
                          }}
                          className={
                            'w-full px-2 py-2 rounded-2xl border text-xs sm:text-sm font-extrabold outline-none text-center ' +
                            (isDark ? 'bg-[#111b21] border-[#2a3942] text-[#16697A] dark:text-[#489fb5]' : 'bg-slate-50 border-slate-200 text-[#16697A]')
                          }
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>

                  {/* In-past Realtime Alert */}
                  {isSelectedTimeInPast && (
                    <p className="text-[11px] font-bold text-amber-500 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Selected time is in the past for today. Please pick an upcoming time.</span>
                    </p>
                  )}

                {/* Error Message */}
                {editError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSaveModalEdit(e)}
                    className="px-6 py-2.5 rounded-2xl bg-[#16697A] hover:bg-[#1a7d91] text-white text-xs sm:text-sm font-extrabold shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
