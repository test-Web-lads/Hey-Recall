import { describe, it, expect } from 'vitest';
import { NLPParserService } from './nlpParser';
import { format } from 'date-fns';

describe('NLPParserService (Offline Natural Language & Condition Parser)', () => {
  const baseDate = new Date('2026-08-20T08:00:00.000Z');

  it('accurately parses user command with tomorrow time and fallback auto-nag', () => {
    const input = 'remind me i have to book appointment tomorrow for doctor around 10 a.m if i forget remind me after an hour';
    const result = NLPParserService.parse(input, baseDate);

    expect(result.task).toContain('Book appointment for doctor');
    expect(result.category).toBe('health');
    expect(result.fallbackRule).toBeDefined();
    expect(result.fallbackRule?.enabled).toBe(true);
    expect(result.fallbackRule?.delayMinutes).toBe(60);
    expect(result.fallbackRule?.triggerDescription).toContain('Auto-nag after 1 hour');
    expect(result.spokenConfirmation).toContain('book appointment for doctor');
  });

  it('parses relative minute reminder with custom fallback', () => {
    const input = 'remind me to take blood pressure pills in 15 minutes if i ignore check again in 30 minutes';
    const result = NLPParserService.parse(input, baseDate);

    expect(result.task).toContain('Take blood pressure pills');
    expect(result.category).toBe('health');
    expect(result.fallbackRule?.delayMinutes).toBe(30);
  });

  it('detects and categorizes spatial item location note', () => {
    const input = 'remember my car is parked in slot B4 near elevator';
    const result = NLPParserService.parse(input, baseDate);

    expect(result.isLocationNote).toBe(true);
    expect(result.category).toBe('location');
    expect(result.task).toContain('car is parked in slot B4');
  });

  it('handles clock time without explicit am/pm', () => {
    const input = 'remind me today at 4:30 pm to submit project report';
    const result = NLPParserService.parse(input, baseDate);

    expect(result.task).toContain('Submit project report');
    expect(result.category).toBe('work');
    expect(format(result.primaryTime, 'h:mm a')).toBe('4:30 PM');
  });
});
