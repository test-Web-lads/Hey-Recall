import React, { useState, useEffect, useRef } from 'react';
import type { ReminderCategory } from '../types/reminder';
import { ChimeService } from '../services/chimeService';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReminder: (
    title: string,
    description: string,
    timeIso: string,
    category: ReminderCategory
  ) => void;
  theme: 'off-white' | 'black';
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  onAddReminder,
  theme,
}) => {
  const isDark = theme === 'black';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected date object (defaults to current date, allows up to 9999-12-31)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');

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

  // Compute if selected date/time is in the past
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

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setErrorMessage(null);

      const now = new Date();
      setSelectedDateStr(format(now, 'yyyy-MM-dd'));

      // Default to 30 minutes in future (rounded to nearest 5 min)
      const futureDate = new Date(now.getTime() + 30 * 60000);
      const roundedMinutes = Math.ceil(futureDate.getMinutes() / 5) * 5;
      futureDate.setMinutes(roundedMinutes, 0, 0);

      const h24 = futureDate.getHours();
      const h12 = h24 % 12 || 12;
      setSelectedHour(h12);
      setSelectedMinute(futureDate.getMinutes());
      setSelectedPeriod(h24 >= 12 ? 'PM' : 'AM');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('Please enter a reminder title.');
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

    const chosenDayObj = new Date(
      targetYear,
      targetMonth,
      targetDate,
      hour24,
      selectedMinute,
      0,
      0
    );

    // If today and time has passed, roll forward to next day
    const isToday =
      targetYear === now.getFullYear() &&
      targetMonth === now.getMonth() &&
      targetDate === now.getDate();

    if (isToday && chosenDayObj.getTime() <= now.getTime()) {
      chosenDayObj.setDate(chosenDayObj.getDate() + 1);
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setErrorMessage(null);
    const timeIso = chosenDayObj.toISOString();

    onAddReminder(
      cleanTitle,
      description.trim(),
      timeIso,
      'general'
    );
    onClose();
  };

  const handleClose = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={'w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-150 ' + (
          isDark
            ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]'
            : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Top Header Row: Modal Title aligned next to Cross Button */}
        <div className={'flex items-center justify-between px-5 pt-3.5 pb-2.5 border-b ' + (isDark ? 'border-[#2a3942]' : 'border-slate-100')}>
          <h3 className="text-sm font-extrabold text-[#16697A] dark:text-[#489fb5]">
            New Task
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className={'w-7 h-7 rounded-full flex items-center justify-center border shadow-xs transition-all cursor-pointer active:scale-90 ' + (
              isDark
                ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] hover:bg-[#2a3942] hover:text-white shadow-black/40'
                : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 hover:text-black shadow-slate-200'
            )}
            title="Close"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5 stroke-[2.8px]" />
          </button>
        </div>

        {/* Clean Form without extra section headers */}
        <form noValidate onSubmit={handleManualSubmit} className="p-5 pt-3 space-y-3">
          {/* Title Field with Character Counter */}
          <div>
            <div className="flex items-center justify-end mb-1">
              <span className={'text-[11px] font-medium ' + (title.length >= 40 ? 'text-amber-500 font-bold' : isDark ? 'text-[#8696a0]' : 'text-slate-400')}>
                {title.length}/40
              </span>
            </div>
            <input
              type="text"
              autoFocus
              maxLength={40}
              placeholder="e.g. Doctor appointment, buy groceries..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className={'w-full px-3.5 py-2 rounded-2xl border text-xs sm:text-sm outline-none transition-all ' + (
                errorMessage
                  ? 'border-rose-500 ring-2 ring-rose-500/30'
                  : isDark
                  ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] focus:border-[#16697A]'
                  : 'bg-white border-slate-200 text-slate-900 focus:border-[#16697A]'
              )}
            />
          </div>

          {/* Description Field with Character Counter */}
          <div>
            <div className="flex items-center justify-end mb-1">
              <span className={'text-[11px] font-medium ' + (description.length >= 500 ? 'text-amber-500 font-bold' : isDark ? 'text-[#8696a0]' : 'text-slate-400')}>
                {description.length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Additional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={'w-full px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm outline-none ' + (
                isDark
                  ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] focus:border-[#16697A]'
                  : 'bg-white border-slate-200 text-slate-900 focus:border-[#16697A]'
              )}
            />
          </div>

          {/* Date Picker (Current date selected by default, clickable to change up to 9999/12/31) */}
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
              ref={dateInputRef}
              type="date"
              min={format(new Date(), 'yyyy-MM-dd')}
              max="9999-12-31"
              value={selectedDateStr}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDateStr(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>

          {/* Time Picker (Current/upcoming time selected by default) */}
          <div className="grid grid-cols-7 gap-2 items-center">
            {/* Hour (01-12) */}
            <div className="col-span-3">
              <select
                value={selectedHour}
                onChange={(e) => {
                  setSelectedHour(Number(e.target.value));
                  if (errorMessage) setErrorMessage(null);
                }}
                className={'w-full px-3 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold outline-none text-center ' + (
                  isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-slate-50 border-slate-200 text-slate-900'
                )}
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
                  if (errorMessage) setErrorMessage(null);
                }}
                className={'w-full px-2 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold outline-none text-center ' + (
                  isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-slate-50 border-slate-200 text-slate-900'
                )}
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
                  if (errorMessage) setErrorMessage(null);
                }}
                className={'w-full px-2 py-2.5 rounded-2xl border text-xs sm:text-sm font-extrabold outline-none text-center ' + (
                  isDark ? 'bg-[#111b21] border-[#2a3942] text-[#16697A] dark:text-[#489fb5]' : 'bg-slate-50 border-slate-200 text-[#16697A]'
                )}
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
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>

            {/* Submit button: text only, without plus sign */}
            <button
              type="button"
              onClick={(e) => handleManualSubmit(e)}
              className="px-6 py-2.5 rounded-2xl bg-[#16697A] hover:bg-[#1a7d91] text-white text-xs sm:text-sm font-extrabold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
