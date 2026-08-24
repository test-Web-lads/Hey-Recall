import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AlarmSchedulerService } from './alarmScheduler';
import { StorageService } from './storageService';
import { ChimeService } from './chimeService';
import { TTSService } from './ttsService';
import type { ReminderItem } from '../types/reminder';
import { addMinutes, subMinutes } from 'date-fns';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('AlarmSchedulerService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(ChimeService, 'playGentleReminderChime').mockImplementation(() => {});
    vi.spyOn(TTSService, 'speak').mockImplementation(() => {});
    AlarmSchedulerService.stopScheduler();
  });

  afterEach(() => {
    AlarmSchedulerService.stopScheduler();
  });

  it('does NOT trigger alarms for location notes / quick info notes', () => {
    const triggerSpy = vi.fn();
    AlarmSchedulerService.setOnTriggerListener(triggerSpy);

    const quickInfoNote: ReminderItem = {
      id: 'quick-1',
      rawVoiceInput: 'car parked in slot B4',
      task: 'Car parked in slot B4',
      category: 'location',
      primaryTime: subMinutes(new Date(), 5).toISOString(),
      status: 'completed',
      isLocationNote: true,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveReminders([quickInfoNote]);

    // @ts-ignore
    AlarmSchedulerService.checkAlarms();

    expect(triggerSpy).not.toHaveBeenCalled();
  });

  it('triggers alarms for pending reminders when due time matches or has passed', () => {
    const triggerSpy = vi.fn();
    AlarmSchedulerService.setOnTriggerListener(triggerSpy);

    const dueReminder: ReminderItem = {
      id: 'due-1',
      rawVoiceInput: 'call the doctor',
      task: 'Call the doctor',
      category: 'health',
      primaryTime: subMinutes(new Date(), 1).toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    StorageService.saveReminders([dueReminder]);

    // @ts-ignore
    AlarmSchedulerService.checkAlarms();

    expect(triggerSpy).toHaveBeenCalledTimes(1);
    expect(triggerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'due-1',
        task: 'Call the doctor',
        status: 'triggered',
      })
    );
  });

  it('does NOT trigger future pending reminders', () => {
    const triggerSpy = vi.fn();
    AlarmSchedulerService.setOnTriggerListener(triggerSpy);

    const futureReminder: ReminderItem = {
      id: 'future-1',
      rawVoiceInput: 'meeting tomorrow',
      task: 'Meeting tomorrow',
      category: 'work',
      primaryTime: addMinutes(new Date(), 60).toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    StorageService.saveReminders([futureReminder]);

    // @ts-ignore
    AlarmSchedulerService.checkAlarms();

    expect(triggerSpy).not.toHaveBeenCalled();
  });
});
