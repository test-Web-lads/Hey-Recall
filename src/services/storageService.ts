import type { ReminderItem } from '../types/reminder';
import { addHours, addMinutes } from 'date-fns';

const STORAGE_KEY = 'recallme_reminders_v1';

export class StorageService {
  public static getReminders(): ReminderItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        const seed = this.getInitialSeedData();
        this.saveReminders(seed);
        return seed;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load reminders:', e);
      return this.getInitialSeedData();
    }
  }

  public static saveReminders(items: ReminderItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save reminders:', e);
    }
  }

  public static addReminder(item: ReminderItem): ReminderItem[] {
    const items = this.getReminders();
    const updated = [item, ...items];
    this.saveReminders(updated);
    return updated;
  }

  public static updateReminder(id: string, updates: Partial<ReminderItem>): ReminderItem[] {
    const items = this.getReminders();
    const updated = items.map((r) => (r.id === id ? { ...r, ...updates } : r));
    this.saveReminders(updated);
    return updated;
  }

  public static deleteReminder(id: string): ReminderItem[] {
    const items = this.getReminders();
    const updated = items.filter((r) => r.id !== id);
    this.saveReminders(updated);
    return updated;
  }

  private static getInitialSeedData(): ReminderItem[] {
    const now = new Date();
    return [
      {
        id: 'seed-1',
        rawVoiceInput: 'remind me i have to book appointment tomorrow for doctor around 10 a.m if i forget remind me after an hour',
        task: 'Book appointment for doctor',
        category: 'health',
        primaryTime: addMinutes(now, 2).toISOString(), // Set for 2 mins in future for instant test
        fallbackRule: {
          enabled: true,
          delayMinutes: 60,
          triggerDescription: 'Auto-nag after 1 hour if not done',
        },
        status: 'pending',
        createdAt: now.toISOString(),
        spokenConfirmation: "Got it! I will remind you at 10:00 AM to book appointment for doctor, and check back after 1 hour if not done.",
      },
      {
        id: 'seed-2',
        rawVoiceInput: 'remember my car is parked in slot B4 near elevator',
        task: 'Car parked in slot B4 near elevator',
        category: 'location',
        primaryTime: now.toISOString(),
        status: 'completed',
        createdAt: now.toISOString(),
        isLocationNote: true,
        spokenConfirmation: 'Saved location note for car parking spot B4.',
      },
      {
        id: 'seed-3',
        rawVoiceInput: 'remind me to take blood pressure medicine after dinner at 8 pm',
        task: 'Take blood pressure medicine after dinner',
        category: 'health',
        primaryTime: addHours(now, 4).toISOString(),
        fallbackRule: {
          enabled: true,
          delayMinutes: 30,
          triggerDescription: 'Auto-nag after 30 minutes if not done',
        },
        status: 'pending',
        createdAt: now.toISOString(),
        spokenConfirmation: 'Got it! Reminding you at 8:00 PM to take medicine, with follow-up in 30 mins.',
      }
    ];
  }
}
