import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReminderItem } from '../types/reminder';
import { X, Bookmark, StickyNote, Trash2, Edit3, Check, AlertTriangle, Calendar } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { ChimeService } from '../services/chimeService';

interface LocationNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: ReminderItem[];
  theme?: 'off-white' | 'black';
  onDelete: (id: string) => void;
  onUpdateReminder: (id: string, updates: Partial<ReminderItem>) => void;
}

interface QuickInfoRowProps {
  item: ReminderItem;
  theme?: 'off-white' | 'black';
  onDelete: (id: string) => void;
  onUpdateReminder: (id: string, updates: Partial<ReminderItem>) => void;
}

const QuickInfoRow: React.FC<QuickInfoRowProps> = ({ item, theme = 'black', onDelete, onUpdateReminder }) => {
  const isDark = theme === 'black';
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editTask, setEditTask] = useState(item.task);
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');
  const [editError, setEditError] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const hasSwiped = useRef(false);
  const isDeletedRef = useRef(false);

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = Array.from({ length: 60 }, (_, i) => i);

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

  useEffect(() => {
    if (isEditModalOpen) {
      setEditTask(item.task);
      setEditNotes(item.notes || '');
      setEditError(null);

      try {
        const itemDate = item.primaryTime ? parseISO(item.primaryTime) : null;
        const now = new Date();

        if (itemDate && !isNaN(itemDate.getTime()) && itemDate.getTime() > now.getTime()) {
          setSelectedDateStr(format(itemDate, 'yyyy-MM-dd'));
          const h24 = itemDate.getHours();
          setSelectedHour(h24 % 12 || 12);
          setSelectedMinute(itemDate.getMinutes());
          setSelectedPeriod(h24 >= 12 ? 'PM' : 'AM');
        } else {
          // Default to +30 min in future rounded to nearest 5 mins
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

  const triggerDelete = () => {
    if (isDeletedRef.current) return;
    isDeletedRef.current = true;
    const cardWidth = cardRef.current?.offsetWidth || 360;
    setSwipeOffset(-cardWidth);
    setTimeout(() => {
      onDelete(item.id);
    }, 180);
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (isDeletedRef.current || isEditModalOpen || isDeleteConfirmOpen) return;
    touchStartXRef.current = clientX;
    touchStartYRef.current = clientY;
    isHorizontalSwipeRef.current = null;
    hasSwiped.current = false;
    setIsSwiping(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isSwiping || isDeletedRef.current || isEditModalOpen || isDeleteConfirmOpen) return;
    const diffX = clientX - touchStartXRef.current;
    const diffY = clientY - touchStartYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (!isHorizontalSwipeRef.current) return;
    if (Math.abs(diffX) > 6) {
      hasSwiped.current = true;
    }

    const cardWidth = cardRef.current?.offsetWidth || 340;
    // Swipe left only
    if (diffX < 0) {
      const clamped = Math.max(-cardWidth, diffX);
      setSwipeOffset(clamped);

      if (clamped <= -(cardWidth * 0.80)) {
        setIsSwiping(false);
        triggerDelete();
      }
    } else {
      setSwipeOffset(0);
    }
  };

  const snapOnRelease = (offset: number) => {
    if (isDeletedRef.current) return;
    const cardWidth = cardRef.current?.offsetWidth || 340;
    const fullLeftThreshold = -(cardWidth * 0.55);

    if (offset < fullLeftThreshold) {
      triggerDelete();
    } else if (offset < -30) {
      // Partial swipe -> Snap open Edit + Delete buttons (130px total)
      setSwipeOffset(-130);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleEnd = () => {
    if (!isSwiping || isDeletedRef.current) return;
    setIsSwiping(false);
    snapOnRelease(swipeOffset);
  };

  const handlePointerDown = (e: React.PointerEvent) => handleStart(e.clientX, e.clientY);
  const handlePointerMove = (e: React.PointerEvent) => handleMove(e.clientX, e.clientY);
  const handlePointerUp = () => handleEnd();

  const handleTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const handleTouchEnd = () => handleEnd();

  const handleSaveModalEdit = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const cleanTitle = editTask.trim();
    if (!cleanTitle) {
      setEditError('Please enter a note title.');
      ChimeService.triggerHapticError();
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

    onUpdateReminder(item.id, {
      task: cleanTitle,
      notes: editNotes.trim() || undefined,
      primaryTime: chosenDate.toISOString(),
      status: 'pending',
      activityLog: [
        ...(item.activityLog || []),
        {
          timestamp: new Date().toISOString(),
          action: 'edited',
          description: `Updated task and set date/time to ${format(chosenDate, 'MMM d, yyyy h:mm a')}`,
        },
      ],
    });

    setIsEditModalOpen(false);
    ChimeService.playConfirmationBeep();
  };

  const isFullSwipeDelete = swipeOffset < (cardRef.current ? -(cardRef.current.offsetWidth * 0.55) : -180);

  return (
    <>
      <div
        ref={cardRef}
        className="relative overflow-hidden group rounded-2xl select-none"
      >
        {/* Right Action Tiles: Edit (Teal) + Delete (Red) matching ReminderCard */}
        <div
          className={
            'absolute inset-y-0 right-0 flex items-stretch transition-all duration-300 ease-out ' +
            (swipeOffset < 0 ? 'z-20 pointer-events-auto ' : 'z-0 pointer-events-none ') +
            (isFullSwipeDelete ? 'w-full bg-rose-600' : 'bg-transparent')
          }
        >
          {!isFullSwipeDelete && (
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
              className="w-[65px] bg-[#16697A] hover:bg-[#1a7d91] text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Edit Task"
            >
              <Edit3 className="w-5 h-5 stroke-[2.5px]" />
            </button>
          )}

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isFullSwipeDelete) {
                triggerDelete();
              } else {
                setSwipeOffset(0);
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
            <Trash2 className={'stroke-[2.5px] transition-transform duration-200 ' + (isFullSwipeDelete ? 'w-8 h-8 scale-110' : 'w-5 h-5')} />
          </button>
        </div>

        {/* Main Front Card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={(e) => {
            if (hasSwiped.current) {
              hasSwiped.current = false;
              return;
            }
            if (swipeOffset !== 0) {
              e.preventDefault();
              e.stopPropagation();
              setSwipeOffset(0);
              return;
            }
            // Tap directly opens edit modal
            setIsEditModalOpen(true);
          }}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.2, 0.9, 0.25, 1)',
            touchAction: 'pan-y',
          }}
          className={
            'relative z-10 p-3.5 sm:p-4 rounded-2xl border shadow-xs transition-all select-none cursor-pointer flex items-center justify-between gap-3 ' +
            (isDark
              ? 'bg-[#111b21] border-[#2a3942] hover:border-amber-500/40 text-[#e9edef]'
              : 'bg-white border-slate-200 hover:border-amber-500/40 text-slate-900 shadow-xs')
          }
        >
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold leading-snug break-words">
              {item.task}
            </h4>
            {item.notes && (
              <p className={'text-xs mt-1 leading-relaxed break-words line-clamp-2 ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
                {item.notes}
              </p>
            )}
            <span className={'text-[11px] mt-1.5 block ' + (isDark ? 'text-[#8696a0]' : 'text-slate-400')}>
              Saved on {format(new Date(item.createdAt), 'MMM d, yyyy • h:mm a')}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditModalOpen(true);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-[#16697A] dark:hover:text-[#489fb5] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer flex-shrink-0"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
                  <h3 className="text-lg font-extrabold mb-1">Delete Quick Info?</h3>
                  <p className={'text-sm ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
                    &quot;<span className="font-semibold">{item.task}</span>&quot; will be moved to Trash.
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

      {/* Edit Quick Info Modal matching regular task edit modal layout */}
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
              {/* Top Header Row */}
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

              {/* Form */}
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
                    placeholder="e.g. Passport in drawer, locker code..."
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

                {/* Description / Notes Field with Character Counter */}
                <div>
                  <div className="flex items-center justify-end mb-1">
                    <span className={'text-[11px] font-medium ' + (editNotes.length >= 500 ? 'text-amber-500 font-bold' : isDark ? 'text-[#8696a0]' : 'text-slate-400')}>
                      {editNotes.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Additional details / notes..."
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

                {editError && (
                  <p className="text-xs font-bold text-rose-500 pl-1 animate-in fade-in duration-150">
                    ⚠️ {editError}
                  </p>
                )}

                {/* Save and Cancel Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className={
                      'px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ' +
                      (isDark
                        ? 'border-[#2a3942] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100')
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-[#16697A] hover:bg-[#1a7d91] active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3px]" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export const LocationNotesModal: React.FC<LocationNotesModalProps> = ({
  isOpen,
  onClose,
  locations,
  theme = 'black',
  onDelete,
  onUpdateReminder,
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'black';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          'w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col ' +
          (isDark ? 'border-[#2a3942] bg-[#202c33] text-[#e9edef]' : 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50')
        }
      >
        {/* Header */}
        <div className={'px-5 py-4 border-b flex items-center justify-between flex-shrink-0 ' + (
          isDark ? 'border-[#2a3942] bg-[#111b21]' : 'border-slate-100 bg-slate-50'
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Bookmark className="w-5.5 h-5.5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">Quick Info Notes</h3>
              <p className={'text-xs ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>{locations.length} Saved notes</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={'p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ' + (
              isDark ? 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notes List: Swipe Left to Edit or Delete */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {locations.length === 0 ? (
            <div className="py-12 text-center">
              <StickyNote className={'w-10 h-10 mx-auto mb-2 opacity-40 ' + (isDark ? 'text-[#8696a0]' : 'text-slate-400')} />
              <h4 className={'text-sm font-bold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-800')}>No Quick Info Notes</h4>
              <p className={'text-xs mt-1 max-w-xs mx-auto ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
                Tap the + button on Home and select &quot;Quick Info&quot; to save text notes without dates or alarms.
              </p>
            </div>
          ) : (
            locations.map((loc) => (
              <QuickInfoRow
                key={loc.id}
                item={loc}
                theme={theme}
                onDelete={onDelete}
                onUpdateReminder={onUpdateReminder}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
