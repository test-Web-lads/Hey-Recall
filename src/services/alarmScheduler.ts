import type { ReminderItem } from '../types/reminder';
import { StorageService } from './storageService';
import { ChimeService } from './chimeService';
import { TTSService } from './ttsService';
import { addMinutes, isBefore } from 'date-fns';

export class AlarmSchedulerService {
  private static timerId: any = null;
  private static onTriggerCallback?: (reminder: ReminderItem) => void;

  public static setOnTriggerListener(cb: (reminder: ReminderItem) => void) {
    this.onTriggerCallback = cb;
  }

  public static startScheduler(): void {
    if (this.timerId) return;

    this.timerId = setInterval(() => {
      this.checkAlarms();
    }, 1000); // check every second
  }

  public static stopScheduler(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private static checkAlarms(): void {
    const reminders = StorageService.getReminders();
    const now = new Date();

    for (const reminder of reminders) {
      // Quick Info notes are pure text bookmarks and NEVER trigger alarms
      if (reminder.isLocationNote) {
        continue;
      }

      // 1. Check Primary or Snoozed Reminder
      if (reminder.status === 'pending' || reminder.status === 'snoozed') {
        const targetTime = reminder.snoozedUntil
          ? new Date(reminder.snoozedUntil)
          : new Date(reminder.primaryTime);

        if (isBefore(targetTime, now) || Math.abs(targetTime.getTime() - now.getTime()) < 1500) {
          this.triggerReminder(reminder);
          return;
        }
      }

      // 2. Check Fallback Auto-Nag Trigger
      if (
        reminder.status === 'fallback_active' &&
        reminder.fallbackRule &&
        reminder.fallbackRule.fallbackTriggerTime
      ) {
        const fallbackTarget = new Date(reminder.fallbackRule.fallbackTriggerTime);
        if (isBefore(fallbackTarget, now) || Math.abs(fallbackTarget.getTime() - now.getTime()) < 1500) {
          this.triggerFallbackReminder(reminder);
          return;
        }
      }
    }
  }

  private static triggerReminder(reminder: ReminderItem): void {
    // Update status to triggered
    StorageService.updateReminder(reminder.id, {
      status: 'triggered',
    });

    // Play soothing chime with 10s auto ducking
    ChimeService.playGentleReminderChime(10);

    // Speak proactive check-in voice
    const checkInSpeech = `Hey! Just checking in: Have you had a chance to ${reminder.task.toLowerCase()}?`;
    TTSService.speak(checkInSpeech);

    // If browser notification permission is granted, send system notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('RecallMe Check-in', {
        body: `Did you: ${reminder.task}?`,
        icon: '/vite.svg',
      });
    }

    if (this.onTriggerCallback) {
      this.onTriggerCallback({ ...reminder, status: 'triggered' });
    }
  }

  private static triggerFallbackReminder(reminder: ReminderItem): void {
    StorageService.updateReminder(reminder.id, {
      status: 'triggered',
    });

    ChimeService.playGentleReminderChime(10);

    const checkInSpeech = `Follow-up check-in: You asked me to remind you again about: ${reminder.task.toLowerCase()}.`;
    TTSService.speak(checkInSpeech);

    if (this.onTriggerCallback) {
      this.onTriggerCallback({ ...reminder, status: 'triggered' });
    }
  }

  /**
   * Called when user presses "Busy" or ignores: initiates the secondary fallback nag rule
   */
  public static activateFallbackNag(reminder: ReminderItem, customMinutes?: number): void {
    const delay = customMinutes || reminder.fallbackRule?.delayMinutes || 60;
    const fallbackTime = addMinutes(new Date(), delay).toISOString();

    StorageService.updateReminder(reminder.id, {
      status: 'fallback_active',
      fallbackRule: {
        enabled: true,
        delayMinutes: delay,
        triggerDescription: `Auto-nag after ${delay >= 60 ? `${delay / 60} hour` : `${delay} mins`} if not done`,
        fallbackTriggerTime: fallbackTime,
        lastCheckedAt: new Date().toISOString(),
      },
    });
  }
}
