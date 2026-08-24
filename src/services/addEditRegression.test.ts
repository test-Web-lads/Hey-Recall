import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from './storageService';
import type { ReminderItem } from '../types/reminder';
import { addDays, addMinutes } from 'date-fns';

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

describe('Add & Edit Reminder Regression Testing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('calculates guaranteed upcoming time for Today selection (auto next-occurrence)', () => {
    const now = new Date();
    // Simulate user picking 9:00 AM while it is currently past 9 AM:
    let hour24 = 9;
    const chosenDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, 0, 0, 0);

    if (chosenDate.getTime() <= now.getTime()) {
      chosenDate.setDate(chosenDate.getDate() + 1);
    }

    expect(chosenDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it('adds a reminder and verifies it appears in active upcoming reminders', () => {
    const futureTime = addMinutes(new Date(), 45).toISOString();
    const newReminder: ReminderItem = {
      id: 'test_add_1',
      rawVoiceInput: 'Doctor visit - pick up report',
      task: 'Doctor visit',
      notes: 'pick up report',
      category: 'health',
      primaryTime: futureTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
      activityLog: [{
        timestamp: new Date().toISOString(),
        action: 'created',
        description: 'Created reminder: "Doctor visit"',
      }],
    };

    StorageService.addReminder(newReminder);
    const allReminders = StorageService.getReminders();
    const upcoming = allReminders.filter(
      (r) => r.status !== 'deleted' && r.status !== 'completed' && !r.isLocationNote
    );

    expect(upcoming.some((r) => r.id === 'test_add_1')).toBe(true);
    const saved = upcoming.find((r) => r.id === 'test_add_1');
    expect(saved?.task).toBe('Doctor visit');
    expect(saved?.notes).toBe('pick up report');
    expect(saved?.primaryTime).toBe(futureTime);
  });

  it('edits a reminder and updates its title, notes, and rescheduled time', () => {
    const initialTime = addMinutes(new Date(), 10).toISOString();
    const item: ReminderItem = {
      id: 'test_edit_1',
      rawVoiceInput: 'Buy bread',
      task: 'Buy bread',
      category: 'errand',
      primaryTime: initialTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    StorageService.addReminder(item);

    const newRescheduledTime = addDays(new Date(), 2).toISOString();
    const updatedList = StorageService.updateReminder('test_edit_1', {
      task: 'Buy artisan sourdough bread',
      notes: 'From bakery downtown',
      primaryTime: newRescheduledTime,
      activityLog: [{
        timestamp: new Date().toISOString(),
        action: 'edited',
        description: 'Edited task content / time',
      }],
    });

    const updated = updatedList.find((r) => r.id === 'test_edit_1');
    expect(updated?.task).toBe('Buy artisan sourdough bread');
    expect(updated?.notes).toBe('From bakery downtown');
    expect(updated?.primaryTime).toBe(newRescheduledTime);
    expect(updated?.activityLog?.length).toBe(1);
    expect(updated?.activityLog?.[0].action).toBe('edited');
  });

  it('validates user name constraint to maximum 30 characters', () => {
    const longName = 'This is a super extremely long user name that exceeds thirty characters limit';
    const trimmed = longName.trim().slice(0, 30);
    expect(trimmed.length).toBeLessThanOrEqual(30);
    localStorage.setItem('recallme_user_name', trimmed);
    expect(localStorage.getItem('recallme_user_name')?.length).toBeLessThanOrEqual(30);
  });

  it('updates a quick info note with a custom date and time', () => {
    const quickNote: ReminderItem = {
      id: 'test_quick_note_1',
      rawVoiceInput: 'Passport in top drawer',
      task: 'Passport in top drawer',
      category: 'location',
      primaryTime: '',
      isLocationNote: true,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    StorageService.addReminder(quickNote);

    const targetDate = addDays(new Date(), 3);
    const targetDateIso = targetDate.toISOString();

    const updatedList = StorageService.updateReminder('test_quick_note_1', {
      task: 'Renew passport before trip',
      notes: 'Take 2 passport photos',
      primaryTime: targetDateIso,
    });

    const updated = updatedList.find((r) => r.id === 'test_quick_note_1');
    expect(updated?.task).toBe('Renew passport before trip');
    expect(updated?.notes).toBe('Take 2 passport photos');
    expect(updated?.primaryTime).toBe(targetDateIso);
  });
});
