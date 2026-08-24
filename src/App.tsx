import { useState, useEffect, useRef } from 'react';
import type { ReminderItem, TaskLogEntry, ReminderCategory } from './types/reminder';
import { StorageService } from './services/storageService';
import { NLPParserService } from './services/nlpParser';
import { SpeechService } from './services/speechService';
import { TTSService } from './services/ttsService';
import { AlarmSchedulerService } from './services/alarmScheduler';
import { ChimeService } from './services/chimeService';

import { HomePageView } from './components/HomePageView';
import { RemindersPageView } from './components/RemindersPageView';
import { SearchView } from './components/SearchView';
import { SettingsView, type PhrasingTemplate, DEFAULT_PHRASING_LIST } from './components/SettingsView';
import { BottomNavBar } from './components/BottomNavBar';
import { DraggableVoiceButton } from './components/DraggableVoiceButton';
import { AddReminderModal } from './components/AddReminderModal';
import { QuickInfoModal } from './components/QuickInfoModal';
import { MicPermissionModal } from './components/MicPermissionModal';
import { CheckInModal } from './components/CheckInModal';
import { LocationNotesModal } from './components/LocationNotesModal';

function loadAndSanitizePhrasingList(): PhrasingTemplate[] {
  try {
    const saved = localStorage.getItem('recallme_phrasing_guide');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out any obsolete location notes / quick info templates
        const cleaned = parsed.filter(
          (p: PhrasingTemplate) =>
            !p.text?.toLowerCase().startsWith('remember') &&
            !p.timeHint?.toLowerCase().includes('location') &&
            !p.label?.toLowerCase().includes('location')
        );
        if (cleaned.length === 5) {
          return cleaned;
        }
      }
    }
  } catch (e) {}
  try {
    localStorage.setItem('recallme_phrasing_guide', JSON.stringify(DEFAULT_PHRASING_LIST));
  } catch (e) {}
  return DEFAULT_PHRASING_LIST;
}

export function App() {
  const [reminders, setReminders] = useState<ReminderItem[]>(() => StorageService.getReminders());
  const [currentView, setCurrentView] = useState<'home' | 'reminders' | 'search' | 'settings'>('home');
  const [theme, setTheme] = useState<'off-white' | 'black'>(() => {
    try {
      const saved = localStorage.getItem('recallme_theme');
      if (saved === 'black' || saved === 'off-white') return saved;
    } catch (e) {}
    return 'off-white';
  });

  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => TTSService.isEnabled());
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(() => false);
  const [phrasingList, setPhrasingList] = useState<PhrasingTemplate[]>(() => loadAndSanitizePhrasingList());

  const handleUpdatePhrasingList = (newList: PhrasingTemplate[]) => {
    setPhrasingList(newList);
    try {
      localStorage.setItem('recallme_phrasing_guide', JSON.stringify(newList));
    } catch (e) {}
  };

  // Floating mic visibility setting (defaults to false / hidden)
  const [showFloatingMic, setShowFloatingMic] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('recallme_show_floating_mic');
      return saved === 'true';
    } catch (e) {}
    return false;
  });

  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickInfoModalOpen, setIsQuickInfoModalOpen] = useState(false);
  const [isMicPermModalOpen, setIsMicPermModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [triggeredReminder, setTriggeredReminder] = useState<ReminderItem | null>(null);
  const [focusedReminderId, setFocusedReminderId] = useState<string | null>(null);

  const handleSelectReminderFromSearch = (id: string) => {
    setFocusedReminderId(id);
    setCurrentView('reminders');
  };

  const speechServiceRef = useRef<SpeechService | null>(null);

  // Sync theme
  useEffect(() => {
    try {
      localStorage.setItem('recallme_theme', theme);
    } catch (e) {}
    if (theme === 'black') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // First time open: Ask for microphone permission if not yet decided
  useEffect(() => {
    SpeechService.getPermissionState().then((state) => {
      if (state === 'prompt') {
        const hasPrompted = localStorage.getItem('recallme_mic_prompted');
        if (!hasPrompted) {
          setIsMicPermModalOpen(true);
        }
      }
    });
  }, []);

  // Alarm Scheduler
  useEffect(() => {
    AlarmSchedulerService.startScheduler();

    // Alarm Trigger: Pure Music Chime + Vibration
    AlarmSchedulerService.setOnTriggerListener((reminder: ReminderItem) => {
      if (reminder.isLocationNote) return;
      setTriggeredReminder(reminder);
      ChimeService.playReminderMusic(undefined, 60);

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Reminder Time!', {
          body: reminder.task,
          icon: '/favicon.ico',
        });
      }
    });

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      AlarmSchedulerService.stopScheduler();
    };
  }, []);

  // Speech Service
  useEffect(() => {
    const speech = new SpeechService();
    speechServiceRef.current = speech;

    speech.onStatusCallback = (status) => {
      setSpeechStatus(status);
      setIsListening(status === 'listening');
      if (status === 'idle') {
        setAudioVolume(0);
      }
    };

    speech.onVolumeCallback = (vol) => {
      setAudioVolume(vol);
    };

    speech.onResultCallback = (transcript) => {
      setLiveTranscript(transcript);
    };

    speech.onWakeWordDetectedCallback = () => {
      ChimeService.stopAllAudio();
      ChimeService.playConfirmationBeep();
    };

    speech.onFinalSubmitCallback = (finalTranscript) => {
      if (finalTranscript.trim()) {
        processVoiceCommand(finalTranscript);
      }
    };

    return () => {
      speech.stop();
    };
  }, []);

  const processVoiceCommand = (commandText: string) => {
    if (!commandText.trim()) return;

    ChimeService.stopAllAudio();
    setSpeechStatus('processing');

    const parsed = NLPParserService.parse(commandText);
    const initialLog: TaskLogEntry = {
      timestamp: new Date().toISOString(),
      action: 'created',
      description: 'Created via voice command: "' + commandText + '"',
    };

    const newReminder: ReminderItem = {
      id: 'rem_' + Date.now(),
      rawVoiceInput: commandText,
      task: parsed.task,
      category: parsed.category,
      primaryTime: parsed.primaryTime.toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      spokenConfirmation: 'Reminder added.',
      isLocationNote: parsed.isLocationNote,
      activityLog: [initialLog],
    };

    const updatedList = StorageService.addReminder(newReminder);
    setReminders(updatedList);

    // Done Chime Tone only (NO voice text)
    ChimeService.playConfirmationBeep();
    setLiveTranscript('');
    setSpeechStatus('idle');
  };

  const toggleListening = async () => {
    ChimeService.stopAllAudio();
    if (!speechServiceRef.current) return;
    if (isListening) {
      speechServiceRef.current.stop();
    } else {
      const perm = await SpeechService.getPermissionState();
      if (perm === 'denied') {
        setIsMicPermModalOpen(true);
        return;
      }
      setLiveTranscript('');
      speechServiceRef.current.start();
    }
  };

  const handleGrantMicPermission = async () => {
    try {
      localStorage.setItem('recallme_mic_prompted', 'true');
    } catch (e) {}
    setIsMicPermModalOpen(false);
    await SpeechService.requestPermission();
  };

  const handleDismissMicPermission = () => {
    try {
      localStorage.setItem('recallme_mic_prompted', 'true');
    } catch (e) {}
    setIsMicPermModalOpen(false);
  };

  const handleToggleComplete = (id: string) => {
    ChimeService.stopAllAudio();
    const item = reminders.find((r) => r.id === id);
    if (!item) return;

    const isNowCompleted = item.status !== 'completed';
    const logEntry: TaskLogEntry = {
      timestamp: new Date().toISOString(),
      action: isNowCompleted ? 'completed' : 'uncompleted',
      description: isNowCompleted ? 'Marked task as Completed' : 'Marked task as Pending',
    };

    const updated = StorageService.updateReminder(id, {
      status: isNowCompleted ? 'completed' : 'pending',
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
      activityLog: [...(item.activityLog || []), logEntry],
    });
    setReminders(updated);
    ChimeService.playConfirmationBeep();
  };

  const handleSnooze = (id: string, minutes?: number) => {
    ChimeService.stopAllAudio();
    const item = reminders.find((r) => r.id === id);
    if (!item) return;

    let snoozeMins = minutes || 5;
    try {
      const saved = localStorage.getItem('recallme_default_snooze_delay');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) snoozeMins = parsed;
      }
    } catch (e) {}

    const newTargetTime = new Date(Date.now() + snoozeMins * 60000).toISOString();

    const logEntry: TaskLogEntry = {
      timestamp: new Date().toISOString(),
      action: 'snoozed',
      description: `Snoozed for ${snoozeMins} minutes (new time: ${new Date(newTargetTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})`,
    };

    const updated = StorageService.updateReminder(id, {
      primaryTime: newTargetTime,
      status: 'snoozed',
      snoozedUntil: newTargetTime,
      activityLog: [...(item.activityLog || []), logEntry],
    });
    setReminders(updated);
    ChimeService.playConfirmationBeep();
  };

  const handleUpdateReminder = (id: string, updates: Partial<ReminderItem>) => {
    ChimeService.stopAllAudio();
    const item = reminders.find((r) => r.id === id);
    if (!item) return;

    const logEntry: TaskLogEntry = {
      timestamp: new Date().toISOString(),
      action: 'edited',
      description: 'Edited task content / time',
    };

    const updated = StorageService.updateReminder(id, {
      ...updates,
      activityLog: [...(item.activityLog || []), logEntry],
    });
    setReminders(updated);
  };

  const handleDelete = (id: string) => {
    ChimeService.stopAllAudio();
    const item = reminders.find((r) => r.id === id);
    if (!item) return;

    if (item.status === 'deleted') {
      const updated = StorageService.deleteReminder(id);
      setReminders(updated);
    } else {
      const logEntry: TaskLogEntry = {
        timestamp: new Date().toISOString(),
        action: 'deleted',
        description: 'Moved task to Trash',
      };
      const updated = StorageService.updateReminder(id, {
        status: 'deleted',
        activityLog: [...(item.activityLog || []), logEntry],
      });
      setReminders(updated);
    }
  };

  const handleRestore = (id: string) => {
    ChimeService.stopAllAudio();
    const item = reminders.find((r) => r.id === id);
    if (!item) return;

    const logEntry: TaskLogEntry = {
      timestamp: new Date().toISOString(),
      action: 'restored',
      description: 'Restored task to active list',
    };

    const updated = StorageService.updateReminder(id, {
      status: 'pending',
      activityLog: [...(item.activityLog || []), logEntry],
    });
    setReminders(updated);
  };

  const handleManualAddReminder = (
    title: string,
    description: string,
    timeIso: string,
    category: ReminderCategory
  ) => {
    ChimeService.stopAllAudio();
    const initialLog: TaskLogEntry = {
      timestamp: new Date().toISOString(),
      action: 'created',
      description: 'Created reminder: "' + title + '"',
    };

    const newReminder: ReminderItem = {
      id: 'rem_' + Date.now(),
      rawVoiceInput: title + (description ? ' - ' + description : ''),
      task: title,
      notes: description || undefined,
      category,
      primaryTime: timeIso,
      status: 'pending',
      createdAt: new Date().toISOString(),
      spokenConfirmation: 'Reminder added.',
      isLocationNote: false,
      activityLog: [initialLog],
    };
    const updated = StorageService.addReminder(newReminder);
    setReminders(updated);

    // Done Chime Tone only
    ChimeService.playConfirmationBeep();
  };

  const handleAddQuickInfo = (infoText: string) => {
    ChimeService.stopAllAudio();
    const initialLog: TaskLogEntry = {
      timestamp: new Date().toISOString(),
      action: 'created',
      description: 'Created Quick Info note: "' + infoText + '"',
    };

    const newNote: ReminderItem = {
      id: 'info_' + Date.now(),
      rawVoiceInput: infoText,
      task: infoText,
      category: 'location',
      primaryTime: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      spokenConfirmation: 'Quick info saved.',
      isLocationNote: true,
      activityLog: [initialLog],
    };

    const updated = StorageService.addReminder(newNote);
    setReminders(updated);
    ChimeService.playConfirmationBeep();
  };

  const handleToggleShowFloatingMic = () => {
    const nextVal = !showFloatingMic;
    setShowFloatingMic(nextVal);
    try {
      localStorage.setItem('recallme_show_floating_mic', nextVal.toString());
    } catch (e) {}
    ChimeService.triggerVibration([50]);
  };

  const handleClearAllData = () => {
    try {
      localStorage.removeItem('recallme_reminders_v1');
      localStorage.setItem('recallme_reminders_v1', '[]');
    } catch (e) {}
    setReminders([]);
  };

  const locationItems = reminders.filter((r) => r.isLocationNote && r.status !== 'deleted');
  const isDark = theme === 'black';

  return (
    <div
      className={'min-h-screen pb-28 flex flex-col transition-colors duration-200 ' + (
        isDark
          ? 'bg-[#0b141a] text-[#e9edef] selection:bg-[#16697A] selection:text-white'
          : 'bg-[#f0f2f5] text-slate-900 selection:bg-[#16697A]/20 selection:text-[#16697A]'
      )}
    >
      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-2">
        {currentView === 'home' ? (
          <HomePageView
            reminders={reminders}
            theme={theme}
            prompts={phrasingList}
            onSelectPrompt={(prompt) => processVoiceCommand(prompt)}
            onOpenLocations={() => setIsLocationModalOpen(true)}
            locationCount={locationItems.length}
            onToggleComplete={handleToggleComplete}
            onSnooze={handleSnooze}
            onDelete={handleDelete}
            onUpdateReminder={handleUpdateReminder}
          />
        ) : currentView === 'reminders' ? (
          <RemindersPageView
            reminders={reminders}
            theme={theme}
            focusedReminderId={focusedReminderId}
            onClearFocusedReminder={() => setFocusedReminderId(null)}
            onOpenQuickInfo={() => setIsQuickInfoModalOpen(true)}
            onToggleComplete={handleToggleComplete}
            onSnooze={handleSnooze}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onUpdateReminder={handleUpdateReminder}
          />
        ) : currentView === 'search' ? (
          <SearchView
            reminders={reminders}
            theme={theme}
            onSelectReminder={handleSelectReminderFromSearch}
            onToggleComplete={handleToggleComplete}
            onSnooze={handleSnooze}
            onDelete={handleDelete}
            onBusy={() => {}}
            onUpdateReminder={handleUpdateReminder}
          />
        ) : (
          <SettingsView
            theme={theme}
            onSelectTheme={setTheme}
            ttsEnabled={ttsEnabled}
            onToggleTTS={() => {
              const next = !ttsEnabled;
              setTtsEnabled(next);
              TTSService.setEnabled(next);
            }}
            wakeWordEnabled={wakeWordEnabled}
            onToggleWakeWord={() => {
              const next = !wakeWordEnabled;
              setWakeWordEnabled(next);
              speechServiceRef.current?.setWakeWordMode(next);
            }}
            showFloatingMic={showFloatingMic}
            onToggleShowFloatingMic={handleToggleShowFloatingMic}
            onClearAllData={handleClearAllData}
            phrasingList={phrasingList}
            onUpdatePhrasingList={handleUpdatePhrasingList}
          />
        )}
      </main>

      {/* Floating Microphone: ONLY shown if enabled in Settings */}
      {showFloatingMic && (
        <DraggableVoiceButton
          isListening={isListening}
          status={speechStatus}
          audioVolume={audioVolume}
          liveTranscript={liveTranscript}
          onToggleListening={toggleListening}
          theme={theme}
        />
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNavBar
        currentView={currentView}
        onSelectView={(tab) => {
          ChimeService.stopAllAudio();
          setCurrentView(tab);
        }}
        onOpenAddTask={() => setIsAddModalOpen(true)}
        onOpenQuickInfo={() => setIsQuickInfoModalOpen(true)}
        theme={theme}
      />

      {/* Add Reminder Modal */}
      <AddReminderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddReminder={handleManualAddReminder}
        theme={theme}
      />

      {/* Quick Info Modal */}
      <QuickInfoModal
        isOpen={isQuickInfoModalOpen}
        onClose={() => setIsQuickInfoModalOpen(false)}
        onAddQuickInfo={handleAddQuickInfo}
        theme={theme}
      />

      {/* Mic Permission Modal */}
      <MicPermissionModal
        isOpen={isMicPermModalOpen}
        onGrant={handleGrantMicPermission}
        onDismiss={handleDismissMicPermission}
        theme={theme}
      />

      {/* Check-In Modal: Stop moves to Trash, Snooze reschedules */}
      <CheckInModal
        reminder={triggeredReminder}
        theme={theme}
        onDone={(item) => {
          ChimeService.stopAllAudio();
          handleDelete(item.id);
          setTriggeredReminder(null);
        }}
        onSnooze={(item, mins) => {
          ChimeService.stopAllAudio();
          handleSnooze(item.id, mins);
          setTriggeredReminder(null);
        }}
        onBusy={() => {
          ChimeService.stopAllAudio();
          setTriggeredReminder(null);
        }}
        onDismiss={() => {
          ChimeService.stopAllAudio();
          setTriggeredReminder(null);
        }}
      />

      {/* Saved Quick Info Modal */}
      <LocationNotesModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        locations={locationItems}
        theme={theme}
        onDelete={handleDelete}
        onUpdateReminder={handleUpdateReminder}
      />
    </div>
  );
}

export default App;
