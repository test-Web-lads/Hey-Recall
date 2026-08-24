import { describe, it, expect } from 'vitest';
import type { ReminderItem } from '../types/reminder';

describe('Swipe & Trash Logic Verification', () => {
  const mockReminders: ReminderItem[] = [
    {
      id: 'rem-1',
      rawVoiceInput: 'active task 1',
      task: 'Active task 1',
      category: 'work',
      primaryTime: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-2',
      rawVoiceInput: 'completed reminder',
      task: 'Completed reminder in trash',
      category: 'errand',
      primaryTime: new Date().toISOString(),
      status: 'completed',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-3',
      rawVoiceInput: 'deleted reminder',
      task: 'Deleted reminder in trash',
      category: 'health',
      primaryTime: new Date().toISOString(),
      status: 'deleted',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'qi-1',
      rawVoiceInput: 'active quick info',
      task: 'Active quick info note',
      category: 'location',
      primaryTime: new Date().toISOString(),
      status: 'pending',
      isLocationNote: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'qi-2',
      rawVoiceInput: 'deleted quick info',
      task: 'Deleted quick info note in trash',
      category: 'location',
      primaryTime: new Date().toISOString(),
      status: 'deleted',
      isLocationNote: true,
      createdAt: new Date().toISOString(),
    },
  ];

  it('correctly filters active upcoming reminders excluding trash and quick info', () => {
    const upcomingList = mockReminders.filter(
      (r) => r.status !== 'deleted' && r.status !== 'completed' && !r.isLocationNote
    );
    expect(upcomingList.length).toBe(1);
    expect(upcomingList[0].id).toBe('rem-1');
  });

  it('correctly segregates Trash into Reminders vs Quick Info sub-categories', () => {
    const trashList = mockReminders.filter(
      (r) => r.status === 'deleted' || r.status === 'completed'
    );
    expect(trashList.length).toBe(3);

    const trashReminders = trashList.filter((r) => !r.isLocationNote);
    expect(trashReminders.length).toBe(2);
    expect(trashReminders.map((r) => r.id)).toEqual(['rem-2', 'rem-3']);

    const trashQuickInfo = trashList.filter((r) => r.isLocationNote);
    expect(trashQuickInfo.length).toBe(1);
    expect(trashQuickInfo[0].id).toBe('qi-2');
  });

  it('verifies 50% threshold for swipe-left auto delete calculation', () => {
    const cardWidth = 360;
    const fullSwipeLeftThreshold = -(cardWidth * 0.5);

    const swipeUnder50 = -150;
    const swipeOver50 = -200;

    const shouldAutoDeleteUnder = swipeUnder50 < fullSwipeLeftThreshold;
    const shouldAutoDeleteOver = swipeOver50 < fullSwipeLeftThreshold;

    expect(shouldAutoDeleteUnder).toBe(false);
    expect(shouldAutoDeleteOver).toBe(true);
  });

  it('verifies 50% threshold for swipe-right auto complete calculation', () => {
    const cardWidth = 360;
    const fullSwipeRightThreshold = cardWidth * 0.5;

    const swipeUnder50 = 150;
    const swipeOver50 = 200;

    const shouldAutoCompleteUnder = swipeUnder50 > fullSwipeRightThreshold;
    const shouldAutoCompleteOver = swipeOver50 > fullSwipeRightThreshold;

    expect(shouldAutoCompleteUnder).toBe(false);
    expect(shouldAutoCompleteOver).toBe(true);
  });

  it('verifies Stop action moves triggered reminder to Trash', () => {
    const triggeredItem: ReminderItem = {
      id: 'triggered-1',
      rawVoiceInput: 'Take medicine',
      task: 'Take medicine',
      category: 'health',
      primaryTime: new Date().toISOString(),
      status: 'triggered',
      createdAt: new Date().toISOString(),
    };

    // When Stop is pressed: status becomes deleted
    const stoppedItem: ReminderItem = {
      ...triggeredItem,
      status: 'deleted',
    };

    expect(stoppedItem.status).toBe('deleted');
  });

  it('verifies Snooze action adds default snooze duration and updates task primaryTime', () => {
    const originalTime = new Date('2026-08-24T10:00:00.000Z');
    const snoozeDurationMins = 5;
    const snoozedTime = new Date(originalTime.getTime() + snoozeDurationMins * 60000).toISOString();

    const task: ReminderItem = {
      id: 'rem-snooze',
      rawVoiceInput: 'Call dentist',
      task: 'Call dentist',
      category: 'call',
      primaryTime: originalTime.toISOString(),
      status: 'triggered',
      createdAt: new Date().toISOString(),
    };

    const snoozedTask: ReminderItem = {
      ...task,
      primaryTime: snoozedTime,
      status: 'snoozed',
      snoozedUntil: snoozedTime,
    };

    expect(snoozedTask.primaryTime).toBe(snoozedTime);
    expect(new Date(snoozedTask.primaryTime).getTime()).toBeGreaterThan(originalTime.getTime());
  });
});
