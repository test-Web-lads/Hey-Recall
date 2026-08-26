import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Volume1,
  VolumeX,
  Mic,
  Moon,
  Trash2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Sparkles,
  Camera,
  User,
  Edit3,
  X,
} from 'lucide-react';
import { TTSService, ACCENT_OPTIONS, type AccentCode } from '../services/ttsService';
import { ChimeService, RINGTONE_OPTIONS, type RingtoneId } from '../services/chimeService';
import { SpeechService } from '../services/speechService';

export interface PhrasingTemplate {
  id: string;
  label: string;
  text: string;
  timeHint: string;
}

export const DEFAULT_PHRASING_LIST: PhrasingTemplate[] = [
  { id: '1', label: 'Call someone', text: 'remind me to call Mom at 5 pm', timeHint: 'Today 5:00 PM' },
  { id: '2', label: 'Buy groceries', text: 'remind me tonight at 7 pm to buy groceries', timeHint: 'Tonight 7:00 PM' },
  { id: '3', label: 'Take medication', text: 'remind me to take blood pressure pill at 8 am', timeHint: 'Daily 8:00 AM' },
  { id: '4', label: 'Urgent task', text: 'remind me in 30 minutes to turn off oven', timeHint: '+30 Minutes' },
  { id: '5', label: 'Doctor Appointment', text: 'remind me tomorrow at 10 am for doctor visit', timeHint: 'Tomorrow 10 AM' },
];

interface SettingsViewProps {
  theme: 'off-white' | 'black';
  onSelectTheme: (theme: 'off-white' | 'black') => void;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  wakeWordEnabled?: boolean;
  onToggleWakeWord?: () => void;
  showFloatingMic: boolean;
  onToggleShowFloatingMic: () => void;
  onClearAllData: () => void;
  phrasingList: PhrasingTemplate[];
  onUpdatePhrasingList: (list: PhrasingTemplate[]) => void;
}

// Exact Pill Toggle Switch Component matching user reference image
const PillToggle: React.FC<{ checked: boolean; onChange: () => void; isDark: boolean }> = ({
  checked,
  onChange,
  isDark,
}) => {
  return (
    <div
      onClick={onChange}
      className={'w-14 h-8 p-1 rounded-full cursor-pointer transition-colors duration-200 ease-in-out relative flex-shrink-0 ' + (
        checked ? 'bg-[#16697A]' : isDark ? 'bg-slate-700' : 'bg-[#d1d5db]'
      )}
    >
      <div
        className={'w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ' + (
          checked ? 'translate-x-6' : 'translate-x-0'
        )}
      />
    </div>
  );
};

// Apple Control Center-style Smooth Volume Slider Component
const AppleVolumeSlider: React.FC<{
  volumePercent: number;
  isDark: boolean;
  onChange: (percent: number) => void;
  onDragEnd: (percent: number) => void;
}> = ({ volumePercent, isDark, onChange, onDragEnd }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculatePercent = (clientX: number) => {
    if (!barRef.current) return volumePercent;
    const rect = barRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const clampedRatio = Math.max(0, Math.min(1, rawX / rect.width));
    return Math.round(clampedRatio * 100);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    const newPercent = calculatePercent(e.clientX);
    onChange(newPercent);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newPercent = calculatePercent(e.clientX);
    onChange(newPercent);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) { }
    const finalPercent = calculatePercent(e.clientX);
    onDragEnd(finalPercent);
  };

  const isSilent = volumePercent === 0;

  return (
    <div className="space-y-1.5 select-none">
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={
          'relative h-13 w-full rounded-2xl overflow-hidden cursor-pointer touch-none shadow-xs border transition-all ' +
          (isDark ? 'bg-[#111b21] border-[#2a3942]' : 'bg-slate-200/80 border-slate-300')
        }
      >
        {/* Filled Track (Apple style) */}
        <div
          style={{
            width: `${volumePercent}%`,
            transition: isDragging ? 'none' : 'width 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          className={
            'absolute inset-y-0 left-0 transition-colors ' +
            (isSilent ? 'bg-rose-500/20' : 'bg-[#16697A]')
          }
        />

        {/* Content Overlay */}
        <div className="absolute inset-0 px-4 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2.5">
            {isSilent ? (
              <VolumeX className="w-5 h-5 text-rose-500 flex-shrink-0 animate-in zoom-in-75 duration-150" />
            ) : volumePercent <= 50 ? (
              <Volume1 className={'w-5 h-5 flex-shrink-0 ' + (volumePercent > 18 ? 'text-white' : (isDark ? 'text-white' : 'text-slate-800'))} />
            ) : (
              <Volume2 className={'w-5 h-5 flex-shrink-0 ' + (volumePercent > 18 ? 'text-white' : (isDark ? 'text-white' : 'text-slate-800'))} />
            )}
            <span
              className={
                'text-xs sm:text-sm font-extrabold ' +
                (isSilent
                  ? 'text-rose-500'
                  : volumePercent > 35
                    ? 'text-white'
                    : isDark
                      ? 'text-[#e9edef]'
                      : 'text-slate-900')
              }
            >
              {isSilent ? 'Silent' : 'Volume'}
            </span>
          </div>

          <span
            className={
              'text-xs sm:text-sm font-extrabold ' +
              (isSilent
                ? 'text-rose-500'
                : volumePercent > 85
                  ? 'text-white'
                  : isDark
                    ? 'text-[#e9edef]'
                    : 'text-slate-900')
            }
          >
            {isSilent ? 'Vibrate Only' : `${volumePercent}%`}
          </span>
        </div>
      </div>
    </div>
  );
};

// WhatsApp/iOS-style Full-Swipe-to-Delete Quick Task Row Card
const SwipeableQuickTaskRow: React.FC<{
  template: PhrasingTemplate;
  isDark: boolean;
  onEdit: (template: PhrasingTemplate) => void;
  onDelete: (id: string) => void;
}> = ({ template, isDark, onEdit, onDelete }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDeleting) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || isDeleting) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipeRef.current) {
      if (diffX < 0) {
        // Allow dragging smoothly all the way to the left
        setSwipeOffset(diffX);
      } else {
        setSwipeOffset(0);
      }
    }
  };

  const triggerDelete = () => {
    setIsDeleting(true);
    setSwipeOffset(-500); // Fly off screen to the left
    ChimeService.triggerVibration([50]);
    setTimeout(() => {
      onDelete(template.id);
    }, 220);
  };

  const handleTouchEnd = () => {
    if (!isSwiping || isDeleting) return;
    setIsSwiping(false);

    // Full swipe all the way left (past -140px) triggers auto deletion
    if (swipeOffset < -140) {
      triggerDelete();
    } else if (swipeOffset < -40) {
      // Partial swipe snaps open to show the Delete button
      setSwipeOffset(-75);
    } else {
      setSwipeOffset(0);
    }
  };

  const isFullSwipeThreshold = swipeOffset < -140;

  return (
    <div
      className={
        'relative overflow-hidden rounded-2xl group mb-2 select-none transition-all duration-200 ' +
        (isDeleting ? 'opacity-0 scale-95 h-0 my-0 py-0 overflow-hidden' : '')
      }
    >
      {/* Background Swipe Action Bar */}
      <div
        className={
          'absolute inset-0 flex items-center justify-end pr-5 z-0 transition-colors ' +
          (isFullSwipeThreshold ? 'bg-rose-600' : 'bg-rose-600/90')
        }
      >
        <button
          type="button"
          onClick={() => triggerDelete()}
          className="flex items-center justify-center text-white cursor-pointer"
        >
          <Trash2
            className={
              'w-5 h-5 transition-transform ' +
              (isFullSwipeThreshold ? 'scale-125' : 'scale-100')
            }
          />
        </button>
      </div>

      {/* Main Front Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (swipeOffset !== 0) {
            setSwipeOffset(0);
          } else {
            onEdit(template);
          }
        }}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className={'relative z-10 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ' + (
          isDark
            ? 'bg-[#111b21] border-[#2a3942] hover:border-[#16697A]/50 text-[#e9edef]'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs'
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className={'text-sm sm:text-base font-extrabold truncate ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
              {template.label}
            </h4>
            <p className={'text-xs sm:text-sm mt-0.5 truncate ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
              "{template.text}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onSelectTheme,
  ttsEnabled,
  onToggleTTS,
  wakeWordEnabled: _wakeWordEnabled,
  onToggleWakeWord: _onToggleWakeWord,
  showFloatingMic,
  onToggleShowFloatingMic,
  onClearAllData,
  phrasingList,
  onUpdatePhrasingList,
}) => {
  const isDark = theme === 'black';

  // Only ONE section open at a time, start closed by default
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setActiveSection((prev) => (prev === key ? null : key));
  };

  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('recallme_user_name') || 'User';
    } catch (e) {
      return 'User';
    }
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [nameError, setNameError] = useState('');

  const [userPhoto, setUserPhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem('recallme_user_photo');
    } catch (e) {
      return null;
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [defaultSnoozeDelay, setDefaultSnoozeDelay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('recallme_default_snooze_delay');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) { }
    return 5;
  });

  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneId>(() => ChimeService.getRingtone());
  const [volumePercent, setVolumePercent] = useState<number>(() => Math.round(ChimeService.getVolume() * 100));
  const [showAllRingtones, setShowAllRingtones] = useState(false);

  const [selectedAccent, setSelectedAccent] = useState<AccentCode>(() => TTSService.getAccent());
  const [micPermState, setMicPermState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('prompt');

  // Quick Task Pop-up Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activePhraseId, setActivePhraseId] = useState<string | null>(null);
  const [inputTitle, setInputTitle] = useState('');
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    SpeechService.getPermissionState().then((state) => {
      setMicPermState(state);
    });

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUserPhoto(base64);
      try {
        localStorage.setItem('recallme_user_photo', base64);
      } catch (err) { }
    };
    reader.readAsDataURL(file);
    setIsPhotoMenuOpen(false);
  };

  const handleRemovePhoto = () => {
    setUserPhoto(null);
    try {
      localStorage.removeItem('recallme_user_photo');
    } catch (e) { }
    setIsPhotoMenuOpen(false);
    ChimeService.triggerVibration([50]);
  };

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (!trimmed) {
      setNameError('Name cannot be left blank');
      ChimeService.triggerHapticError();
      return;
    }
    if (trimmed.length > 30) {
      setNameError('Name cannot be longer than 30 characters');
      ChimeService.triggerHapticError();
      return;
    }
    setNameError('');
    setUserName(trimmed);
    setIsEditingName(false);
    try {
      localStorage.setItem('recallme_user_name', trimmed);
    } catch (e) { }
    ChimeService.triggerVibration([50]);
  };

  const handleSelectSnoozeDelay = (mins: number) => {
    setDefaultSnoozeDelay(mins);
    try {
      localStorage.setItem('recallme_default_snooze_delay', mins.toString());
    } catch (e) { }
    ChimeService.triggerVibration([50]);
  };

  /*
   * [HIDDEN FEATURE - CUSTOM SNOOZE DELAY]
   * Uncomment below to re-enable custom snooze handler:
   * const [customSnoozeInput, setCustomSnoozeInput] = useState('');
   * const handleSetCustomSnooze = () => {
   *   let parsed = parseInt(customSnoozeInput.trim(), 10);
   *   if (!isNaN(parsed) && parsed > 0) {
   *     parsed = Math.min(1440, parsed);
   *     handleSelectSnoozeDelay(parsed);
   *     setCustomSnoozeInput('');
   *   }
   * };
   */


  const handleVolumeDrag = (newPercent: number) => {
    setVolumePercent(newPercent);
    const vol = newPercent / 100;
    ChimeService.setVolume(vol);
    if (newPercent === 0) {
      ChimeService.stopAllAudio();
      ChimeService.triggerVibration([50]);
    }
  };

  const handleVolumeDragEnd = (finalPercent: number) => {
    setVolumePercent(finalPercent);
    const vol = finalPercent / 100;
    ChimeService.setVolume(vol);

    if (finalPercent === 0) {
      ChimeService.stopAllAudio();
      ChimeService.triggerVibration([100]);
    } else {
      // Play a crisp test ring upon release at the chosen volume
      ChimeService.previewRingtone(selectedRingtone, 2, vol);
    }
  };

  const handleSelectRingtone = (id: RingtoneId) => {
    setSelectedRingtone(id);
    ChimeService.setRingtone(id);
    // Rings with the selected melody at full test volume
    ChimeService.previewRingtone(id, 3, Math.max(0.3, volumePercent / 100));
  };

  const handleSelectAccent = (acc: AccentCode, phrase: string) => {
    setSelectedAccent(acc);
    TTSService.setAccent(acc);
    TTSService.speak(phrase);
  };

  const handleToggleMicPermission = async () => {
    ChimeService.triggerVibration([50]);
    if (micPermState === 'granted') {
      setMicPermState('denied');
      ChimeService.stopAllAudio();
      return;
    }

    const res = await SpeechService.requestPermission();
    if (res.granted) {
      setMicPermState('granted');
      ChimeService.playConfirmationBeep();
      TTSService.speak('Microphone access granted.');
    } else {
      setMicPermState('denied');
      alert(res.error || 'Microphone access was denied in browser settings.');
    }
  };

  const handleOpenEditModal = (p: PhrasingTemplate) => {
    setModalMode('edit');
    setActivePhraseId(p.id);
    setInputTitle(p.label);
    setInputText(p.text);
    setIsTaskModalOpen(true);
  };

  const handleSaveModal = () => {
    const cleanTitle = inputTitle.trim() || 'Quick Task';
    const cleanText = inputText.trim() || 'remind me to...';

    if (activePhraseId) {
      const updated = phrasingList.map((p) =>
        p.id === activePhraseId
          ? { ...p, label: cleanTitle, text: cleanText }
          : p
      );
      onUpdatePhrasingList(updated);
    }

    setIsTaskModalOpen(false);
    ChimeService.playConfirmationBeep();
  };

  const handleDeletePhrase = (id: string) => {
    const updated = phrasingList.filter((p) => p.id !== id);
    onUpdatePhrasingList(updated);
  };

  const displayedRingtones = showAllRingtones ? RINGTONE_OPTIONS : RINGTONE_OPTIONS.slice(0, 3);
  const isMicGranted = micPermState === 'granted';

  return (
    <div className="max-w-xl mx-auto px-1 py-1 space-y-3.5 animate-in fade-in duration-200">
      {/* 0. Sticky Profile Photo & Editable Name Card */}
      <div
        className={'sticky top-0 z-30 -mx-4 px-4 pt-2 pb-2.5 transition-all ' + (
          isDark ? 'bg-[#0b141a]/95 backdrop-blur-md' : 'bg-[#f0f2f5]/95 backdrop-blur-md'
        )}
      >
        <div
          className={'p-4 sm:p-5 rounded-2xl border shadow-xs transition-all flex items-center gap-4 sm:gap-5 ' + (
            isDark ? 'bg-[#202c33] border-[#2a3942]' : 'bg-white border-slate-200 shadow-slate-200/50'
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          {/* Avatar */}
          <div
            onClick={() => setIsPhotoMenuOpen(true)}
            className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden cursor-pointer group flex-shrink-0 border-2 border-[#16697A] shadow-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Profile photo options"
          >
            {userPhoto ? (
              <img src={userPhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#16697A]/15 flex items-center justify-center text-[#16697A] dark:text-[#489fb5]">
                <User className="w-9 h-9 sm:w-10 sm:h-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-0.5">
              <Camera className="w-5 h-5" />
              <span className="text-[9px] font-bold">Edit</span>
            </div>
          </div>

          {/* User Details & Edit Icon */}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="space-y-1.5 w-full max-w-sm">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    maxLength={30}
                    value={tempName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= 30) {
                        setTempName(val);
                        if (val.trim()) setNameError('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') {
                        setIsEditingName(false);
                        setTempName(userName);
                        setNameError('');
                      }
                    }}
                    className={'px-3.5 py-1.5 rounded-xl border text-sm sm:text-base font-bold outline-none w-full ' + (
                      nameError
                        ? 'border-red-500 bg-red-500/10 text-red-400'
                        : isDark ? 'bg-[#111b21] border-[#16697A] text-[#e9edef]' : 'bg-white border-[#16697A] text-slate-900 shadow-xs'
                    )}
                    placeholder="Enter name (max 30 chars)"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="p-2 rounded-xl bg-[#16697A] text-white hover:bg-[#1a7d91] active:scale-95 transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
                    title="Save Name"
                  >
                    <Check className="w-4 h-4 stroke-[3px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setTempName(userName);
                      setNameError('');
                    }}
                    className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {nameError ? (
                  <p className="text-xs font-bold text-red-400 text-left pl-1 animate-in fade-in duration-150">
                    ⚠️ {nameError}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 pl-1">
                    {tempName.length}/30 characters
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className={'text-base sm:text-xl font-black tracking-tight leading-snug break-words break-all sm:break-normal ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                  {userName}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setTempName(userName);
                    setNameError('');
                    setIsEditingName(true);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-[#16697A] dark:hover:text-[#489fb5] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                  title="Edit Name"
                >
                  <Edit3 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Photo Options Modal */}
      {isPhotoMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsPhotoMenuOpen(false)}
        >
          <div
            className={'w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl border transition-all animate-in zoom-in-95 duration-200 space-y-4 ' + (
              isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-slate-200 text-slate-900'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-700/20">
              <h3 className="text-base sm:text-lg font-black">Profile Photo Options</h3>
              <button
                type="button"
                onClick={() => setIsPhotoMenuOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Option: Upload Photo */}
              <button
                type="button"
                onClick={() => {
                  setIsPhotoMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className={'w-full px-4 py-3 rounded-2xl border text-sm font-bold flex items-center gap-3 transition-all cursor-pointer ' + (
                  isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] hover:bg-[#16697A]/15 hover:border-[#16697A]' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-[#16697A]/10 hover:border-[#16697A]'
                )}
              >
                <div className="w-8 h-8 rounded-xl bg-[#16697A]/20 text-[#16697A] dark:text-[#489fb5] flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <span className="block font-extrabold">{userPhoto ? 'Upload New Photo' : 'Upload Profile Photo'}</span>
                  <span className="block text-[11px] opacity-75 font-normal">Choose from camera or gallery</span>
                </div>
              </button>

              {/* Option: Remove Photo */}
              {userPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className={'w-full px-4 py-3 rounded-2xl border text-sm font-bold flex items-center gap-3 transition-all cursor-pointer ' + (
                    isDark ? 'bg-[#111b21] border-red-900/40 text-red-400 hover:bg-red-950/40' : 'bg-red-50/60 border-red-200 text-red-600 hover:bg-red-100'
                  )}
                >
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="block font-extrabold">Remove Photo</span>
                    <span className="block text-[11px] opacity-75 font-normal">Reset to default user avatar</span>
                  </div>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsPhotoMenuOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-black/10 dark:bg-white/5 hover:bg-black/15 text-xs sm:text-sm font-bold text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Unified Attached Settings Group */}
      <div
        className={'rounded-2xl border overflow-hidden divide-y shadow-xs transition-all ' + (
          isDark ? 'bg-[#202c33] border-[#2a3942] divide-[#2a3942]' : 'bg-white border-slate-200 divide-slate-100 shadow-slate-200/50'
        )}
      >
        {/* 1. Snooze Duration */}
        <div>
          <div
            onClick={() => toggleSection('snooze')}
            className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-[#16697A] dark:text-[#489fb5]">
                <RotateCcw className="w-5 h-5 text-[#16697A] dark:text-[#489fb5]" />
              </div>
              <h3 className={'text-base sm:text-lg font-extrabold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                Snooze
              </h3>
            </div>

            <div className="p-1 text-slate-400">
              {activeSection === 'snooze' ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {activeSection === 'snooze' && (
            <div className={'p-4 border-t space-y-3.5 animate-in fade-in duration-150 ' + (
              isDark ? 'border-[#2a3942] bg-[#111b21]/40' : 'border-slate-100 bg-slate-50/50'
            )}>
              <p className="text-sm text-slate-400 font-medium">
                Default delay when snoozing an alarm
              </p>

              {/* Preset Delay Options */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((mins) => {
                  const isSelected = defaultSnoozeDelay === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleSelectSnoozeDelay(mins)}
                      className={'py-3 rounded-2xl border text-sm font-extrabold transition-all active:scale-95 cursor-pointer ' + (
                        isSelected
                          ? 'bg-[#16697A] border-[#16697A] text-white shadow-xs'
                          : isDark
                            ? 'bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:text-[#e9edef]'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {mins}m
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Theme */}
        <div>
          <div
            onClick={() => toggleSection('theme')}
            className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-[#16697A] dark:text-[#489fb5]">
                <Moon className="w-5 h-5 text-[#16697A] dark:text-[#489fb5]" />
              </div>
              <h3 className={'text-base sm:text-lg font-extrabold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                Theme
              </h3>
            </div>

            <div className="p-1 text-slate-400">
              {activeSection === 'theme' ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {activeSection === 'theme' && (
            <div className={'p-4 border-t space-y-4 animate-in fade-in duration-150 ' + (
              isDark ? 'border-[#2a3942] bg-[#111b21]/40' : 'border-slate-100 bg-slate-50/50'
            )}>
              <p className="text-sm text-slate-400 font-medium">
                Dark and Light color scheme
              </p>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className={'text-sm sm:text-base font-bold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                    {isDark ? 'Dark Mode' : 'Off-White'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {isDark ? 'OLED black dark theme' : 'Soft off-white light theme'}
                  </p>
                </div>

                <PillToggle
                  checked={isDark}
                  onChange={() => onSelectTheme(isDark ? 'off-white' : 'black')}
                  isDark={isDark}
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Ringtone */}
        <div>
          <div
            onClick={() => toggleSection('ringtone')}
            className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-[#16697A] dark:text-[#489fb5]">
                <Volume2 className="w-5 h-5 text-[#16697A] dark:text-[#489fb5]" />
              </div>
              <h3 className={'text-base sm:text-lg font-extrabold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                Ringtone
              </h3>
            </div>

            <div className="p-1 text-slate-400">
              {activeSection === 'ringtone' ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {activeSection === 'ringtone' && (
            <div className={'p-4 border-t space-y-4 animate-in fade-in duration-150 ' + (
              isDark ? 'border-[#2a3942] bg-[#111b21]/40' : 'border-slate-100 bg-slate-50/50'
            )}>
              <p className="text-sm text-slate-400 font-medium">
                Ringtone melody and volume control
              </p>

              {/* Apple-style Smooth Volume Slider Bar */}
              <AppleVolumeSlider
                volumePercent={volumePercent}
                isDark={isDark}
                onChange={handleVolumeDrag}
                onDragEnd={handleVolumeDragEnd}
              />

              <div className="space-y-3 pt-2">
                <div className="pt-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-400">Select Chime Melody</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {displayedRingtones.map((rt) => {
                    const isSelected = selectedRingtone === rt.id;
                    return (
                      <button
                        key={rt.id}
                        type="button"
                        onClick={() => handleSelectRingtone(rt.id)}
                        className={'w-full px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ' + (
                          isSelected
                            ? 'bg-[#16697A] border-[#16697A] text-white shadow-xs'
                            : isDark
                              ? 'bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:text-[#e9edef]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        )}
                      >
                        <span>{rt.name}</span>
                        {isSelected && <Check className="w-4 h-4 stroke-[3px]" />}
                      </button>
                    );
                  })}
                </div>

                {RINGTONE_OPTIONS.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRingtones(!showAllRingtones)}
                    className="text-xs sm:text-sm font-bold text-[#16697A] dark:text-[#489fb5] hover:underline pt-1 cursor-pointer block"
                  >
                    {showAllRingtones ? 'Show Less' : `See More (${RINGTONE_OPTIONS.length - 3} more)`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Microphone */}
        <div>
          <div
            onClick={() => toggleSection('micsettings')}
            className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-[#16697A] dark:text-[#489fb5]">
                <Mic className="w-5 h-5 text-[#16697A] dark:text-[#489fb5]" />
              </div>
              <h3 className={'text-base sm:text-lg font-extrabold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                Microphone
              </h3>
            </div>

            <div className="p-1 text-slate-400">
              {activeSection === 'micsettings' ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {activeSection === 'micsettings' && (
            <div className={'p-4 border-t space-y-3.5 animate-in fade-in duration-150 ' + (
              isDark ? 'border-[#2a3942] bg-[#111b21]/40' : 'border-slate-100 bg-slate-50/50'
            )}>
              <p className="text-sm text-slate-400 font-medium">
                Manage on-screen mic visibility and device microphone permission
              </p>

              {/* Toggle 1: On-screen Mic */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <h4 className={'text-sm sm:text-base font-bold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                    On-screen Mic
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500">Show floating voice button on screen</p>
                </div>

                <PillToggle
                  checked={showFloatingMic}
                  onChange={onToggleShowFloatingMic}
                  isDark={isDark}
                />
              </div>

              {/* Divider between mic toggles */}
              <div className={'pt-2 border-t ' + (isDark ? 'border-slate-700/40' : 'border-slate-200')} />

              {/* Toggle 2: Microphone Permission Status */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className={'text-sm sm:text-base font-bold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                    Microphone Permission
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500">Access for voice recording and commands</p>
                </div>

                <PillToggle
                  checked={isMicGranted}
                  onChange={handleToggleMicPermission}
                  isDark={isDark}
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Quick Task (Editable Phrasing Guide) */}
        <div>
          <div
            onClick={() => toggleSection('quicktask')}
            className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-[#16697A] dark:text-[#489fb5]">
                <Sparkles className="w-5 h-5 text-[#16697A] dark:text-[#489fb5]" />
              </div>
              <h3 className={'text-base sm:text-lg font-extrabold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                Quick Task
              </h3>
            </div>

            <div className="p-1 text-slate-400">
              {activeSection === 'quicktask' ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {activeSection === 'quicktask' && (
            <div className={'p-4 border-t space-y-3.5 animate-in fade-in duration-150 ' + (
              isDark ? 'border-[#2a3942] bg-[#111b21]/40' : 'border-slate-100 bg-slate-50/50'
            )}>
              <div>
                <p className="text-sm text-slate-400 font-medium">
                  5 default voice task templates (tap to customize)
                </p>
              </div>

              {/* Task Items List (5 Quick Tasks, 3 visible right away, scroll for rest) */}
              <div className="space-y-2 max-h-[225px] overflow-y-auto pr-1">
                {phrasingList.slice(0, 5).map((item) => (
                  <SwipeableQuickTaskRow
                    key={item.id}
                    template={item}
                    isDark={isDark}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeletePhrase}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. Voice */}
        <div>
          <div
            onClick={() => toggleSection('voice')}
            className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-[#16697A] dark:text-[#489fb5]">
                <Volume2 className="w-5 h-5 text-[#16697A] dark:text-[#489fb5]" />
              </div>
              <h3 className={'text-base sm:text-lg font-extrabold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                Voice
              </h3>
            </div>

            <div className="p-1 text-slate-400">
              {activeSection === 'voice' ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {activeSection === 'voice' && (
            <div className={'p-4 border-t space-y-3 animate-in fade-in duration-150 ' + (
              isDark ? 'border-[#2a3942] bg-[#111b21]/40' : 'border-slate-100 bg-slate-50/50'
            )}>
              <p className="text-sm text-slate-400 font-medium">
                Text-to-speech audio voice configuration
              </p>

              {/* Toggle: Voice Synthesis */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={'text-sm sm:text-base font-bold ' + (isDark ? 'text-[#e9edef]' : 'text-slate-900')}>
                    Voice Synthesis
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500">Spoken audio feedback</p>
                </div>

                <PillToggle
                  checked={ttsEnabled}
                  onChange={onToggleTTS}
                  isDark={isDark}
                />
              </div>

              {ttsEnabled && (
                <div className={'space-y-2.5 pt-2.5 border-t ' + (
                  isDark ? 'border-slate-700/40' : 'border-slate-200'
                )}>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-400">Select Voice Accent</span>
                  </div>

                  {/* 4 Clean Accent Cards */}
                  <div className="space-y-2">
                    {ACCENT_OPTIONS.map((acc) => {
                      const isSelected = selectedAccent === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleSelectAccent(acc.id, acc.samplePhrase)}
                          className={'w-full px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ' + (
                            isSelected
                              ? 'bg-[#16697A] border-[#16697A] text-white shadow-xs'
                              : isDark
                                ? 'bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:text-[#e9edef]'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          )}
                        >
                          <div className="flex items-center gap-2.5 text-left min-w-0">
                            <span className="text-base flex-shrink-0">{acc.flag}</span>
                            <div className="min-w-0">
                              <span className="block font-extrabold truncate">{acc.label}</span>
                              <span className="block text-[11px] opacity-75 font-normal">{acc.subtitle}</span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 stroke-[3px] flex-shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 7. Reset & Clear Data (Centered in middle with reset icon and no background box) */}
        <div>
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to clear all reminders and reset all settings to defaults?')) {
                onClearAllData();
              }
            }}
            className="w-full py-4 px-4 flex items-center justify-center gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 active:bg-rose-500/10 font-bold text-sm sm:text-base transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>Reset & Clear Data</span>
          </button>
        </div>
      </div>

      {/* Pop-up Window / Modal for Quick Task Add & Edit */}
      {isTaskModalOpen && (
        <div
          onClick={() => setIsTaskModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={'w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ' + (
              isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            {/* Modal Header */}
            <div className={'px-6 py-4.5 border-b flex items-center justify-between ' + (
              isDark ? 'border-[#2a3942] bg-[#111b21]' : 'border-slate-100 bg-slate-50'
            )}>
              <h3 className="text-lg font-extrabold">
                {modalMode === 'add' ? 'Add Quick Task' : 'Edit Quick Task'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Sleek input fields without bulky headers */}
            <div className="p-6 space-y-4">
              <input
                type="text"
                autoFocus
                placeholder="Task name (e.g. Call Mom, Buy groceries)..."
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                className={'w-full px-4 py-3 rounded-2xl border text-sm sm:text-base outline-none transition-all ' + (
                  isDark
                    ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] focus:border-[#16697A]'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-[#16697A] shadow-xs'
                )}
              />

              <textarea
                rows={3}
                placeholder="Voice command phrase (e.g. remind me to call Mom at 5 pm)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className={'w-full px-4 py-3 rounded-2xl border text-sm sm:text-base outline-none transition-all ' + (
                  isDark
                    ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] focus:border-[#16697A]'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-[#16697A] shadow-xs'
                )}
              />

              {/* Action Buttons: Bigger with generous spacing */}
              <div className="flex items-center justify-end gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="py-3 px-6 rounded-2xl text-sm sm:text-base font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="py-3 px-7 rounded-2xl bg-[#16697A] hover:bg-[#1a7d91] text-white text-sm sm:text-base font-extrabold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
