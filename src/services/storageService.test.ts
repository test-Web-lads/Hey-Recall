import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from './storageService';
import type { ReminderItem } from '../types/reminder';

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

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads seed data when storage is empty', () => {
    const reminders = StorageService.getReminders();
    expect(reminders.length).toBeGreaterThan(0);
    expect(reminders[0]).toHaveProperty('id');
    expect(reminders[0]).toHaveProperty('task');
  });

  it('adds a new reminder to the top of the list and persists it', () => {
    const newItem: ReminderItem = {
      id: 'test-123',
      rawVoiceInput: 'buy groceries today',
      task: 'Buy groceries',
      category: 'errand',
      primaryTime: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const result = StorageService.addReminder(newItem);
    expect(result[0].id).toBe('test-123');

    const loaded = StorageService.getReminders();
    expect(loaded[0].id).toBe('test-123');
    expect(loaded[0].task).toBe('Buy groceries');
  });

  it('updates an existing reminder by ID', () => {
    const newItem: ReminderItem = {
      id: 'test-update',
      rawVoiceInput: 'initial task',
      task: 'Initial Task',
      category: 'work',
      primaryTime: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    StorageService.addReminder(newItem);

    const updated = StorageService.updateReminder('test-update', {
      task: 'Updated Task Name',
      status: 'completed',
    });

    const target = updated.find((r) => r.id === 'test-update');
    expect(target?.task).toBe('Updated Task Name');
    expect(target?.status).toBe('completed');
  });

  it('deletes a reminder by ID permanently from storage', () => {
    const newItem: ReminderItem = {
      id: 'test-delete',
      rawVoiceInput: 'to be removed',
      task: 'To be removed',
      category: 'general',
      primaryTime: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    StorageService.addReminder(newItem);

    const remaining = StorageService.deleteReminder('test-delete');
    expect(remaining.some((r) => r.id === 'test-delete')).toBe(false);

    const reloaded = StorageService.getReminders();
    expect(reloaded.some((r) => r.id === 'test-delete')).toBe(false);
  });
});
