import type { FallbackRule, NLPParseResult, ReminderCategory } from '../types/reminder';
import { addHours, addMinutes, addDays, setHours, setMinutes, format, isBefore } from 'date-fns';

export class NLPParserService {
  /**
   * Parse a natural speech string into a structured reminder item
   */
  public static parse(input: string, baseDate: Date = new Date()): NLPParseResult {
    const raw = input.trim();
    const lower = raw.toLowerCase();

    // Check if it is a pure spatial/item location note
    const isLocationNote = this.detectLocationNote(lower);
    if (isLocationNote) {
      const task = this.cleanTaskString(raw);
      return {
        task,
        primaryTime: baseDate,
        category: 'location',
        spokenConfirmation: `Saved location note: "${task}". You can ask me where it is anytime.`,
        confidence: 0.95,
        isLocationNote: true,
      };
    }

    // 1. Extract Fallback / Nagging Rule ("if I forget...", "if not done...")
    const { fallbackRule, textWithoutFallback } = this.extractFallbackRule(raw);

    // 2. Extract Primary Time & Date
    const { primaryTime, textWithoutTime } = this.extractPrimaryTime(textWithoutFallback, baseDate);

    // 3. Extract Clean Task Description
    const task = this.cleanTaskString(textWithoutTime);

    // 4. Categorize task
    const category = this.detectCategory(task);

    // 5. Generate friendly spoken confirmation
    const spokenConfirmation = this.generateSpokenConfirmation(task, primaryTime, fallbackRule);

    return {
      task: task || 'Reminder',
      primaryTime,
      fallbackRule,
      category,
      spokenConfirmation,
      confidence: 0.9,
      isLocationNote: false,
    };
  }

  private static detectLocationNote(text: string): boolean {
    return (
      text.startsWith('remember my ') ||
      text.startsWith('remember i put ') ||
      text.startsWith('remember where ') ||
      text.includes('parked in ') ||
      text.includes('is located at ') ||
      text.includes('in the top drawer') ||
      text.includes('in the cabinet')
    );
  }

  private static extractFallbackRule(
    original: string
  ): { fallbackRule?: FallbackRule; textWithoutFallback: string } {
    // Patterns like:
    // "if i forget remind me after an hour"
    // "if i forget remind me in 30 minutes"
    // "if not done check again after 2 hours"
    // "if i don't do it remind me in 1 hour"
    // "if i miss it nag me in 15 mins"
    const fallbackRegex =
      /(?:,|\band\b)?\s*if\s+(?:i\s+(?:forget|miss(?:\s+it)?|ignore(?:\s+it)?|don'?t\s+do\s+it)|not\s+done)\s*,?\s*(?:remind\s+me|check\s+again|nag\s+me|alert\s+me)?\s*(?:after|in|every)?\s*(\d+|an?|half\s+an?)?\s*(hour|hours|hr|hrs|min|mins|minute|minutes)/i;

    const match = original.match(fallbackRegex);
    if (!match) {
      return { textWithoutFallback: original };
    }

    const matchedStr = match[0];
    const amountStr = (match[1] || '1').toLowerCase().trim();
    const unitStr = match[2].toLowerCase().trim();

    let delayMinutes = 60; // default 1 hour
    let count = 1;

    if (amountStr === 'a' || amountStr === 'an') {
      count = 1;
    } else if (amountStr.includes('half')) {
      count = 0.5;
    } else {
      const parsed = parseInt(amountStr, 10);
      if (!isNaN(parsed)) count = parsed;
    }

    if (unitStr.startsWith('hour') || unitStr.startsWith('hr')) {
      delayMinutes = Math.round(count * 60);
    } else if (unitStr.startsWith('min')) {
      delayMinutes = Math.round(count);
    }

    const textWithoutFallback = original.replace(matchedStr, '').trim();

    const triggerDescription =
      delayMinutes >= 60
        ? `Auto-nag after ${delayMinutes / 60 === 1 ? '1 hour' : `${delayMinutes / 60} hours`} if not done`
        : `Auto-nag after ${delayMinutes} minutes if not done`;

    return {
      fallbackRule: {
        enabled: true,
        delayMinutes,
        triggerDescription,
      },
      textWithoutFallback,
    };
  }

  private static extractPrimaryTime(
    text: string,
    baseDate: Date
  ): { primaryTime: Date; textWithoutTime: string } {
    let workingText = text;
    let targetDate = new Date(baseDate);
    let timeFound = false;

    // Relative minutes or hours: "in 10 minutes", "in 2 hours", "in an hour"
    const inRelativeRegex = /\b(?:in|after)\s+(\d+|an?|half\s+an?)\s+(minute|minutes|min|mins|hour|hours|hr|hrs)\b/i;
    const inMatch = workingText.match(inRelativeRegex);
    if (inMatch) {
      const amountStr = inMatch[1].toLowerCase().trim();
      const unitStr = inMatch[2].toLowerCase().trim();
      let count = 1;
      if (amountStr === 'a' || amountStr === 'an') count = 1;
      else if (amountStr.includes('half')) count = 0.5;
      else {
        const parsed = parseInt(amountStr, 10);
        if (!isNaN(parsed)) count = parsed;
      }

      if (unitStr.startsWith('min')) {
        targetDate = addMinutes(targetDate, Math.round(count));
      } else {
        targetDate = addMinutes(targetDate, Math.round(count * 60));
      }
      workingText = workingText.replace(inMatch[0], '');
      return { primaryTime: targetDate, textWithoutTime: workingText };
    }

    // Day offset: "tomorrow", "day after tomorrow", "today", "tonight"
    const lower = workingText.toLowerCase();
    if (lower.includes('day after tomorrow')) {
      targetDate = addDays(targetDate, 2);
      workingText = workingText.replace(/day after tomorrow/i, '');
    } else if (lower.includes('tomorrow')) {
      targetDate = addDays(targetDate, 1);
      workingText = workingText.replace(/\btomorrow\b/i, '');
    } else if (lower.includes('today')) {
      workingText = workingText.replace(/\btoday\b/i, '');
    }

    // Specific Clock Time: "around 10 a.m", "at 10:30 am", "at 4 pm", "10am", "4:15pm", "10 o'clock"
    const timeRegex =
      /\b(?:at|around|by|for)?\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|o'?clock)?\b/i;
    
    // Find matching time string that has am/pm or follows at/around
    const allMatches = Array.from(workingText.matchAll(new RegExp(timeRegex, 'gi')));
    for (const match of allMatches) {
      const full = match[0].trim();
      const rawHour = parseInt(match[1], 10);
      const rawMin = match[2] ? parseInt(match[2], 10) : 0;
      const meridiem = match[3] ? match[3].toLowerCase().replace(/\./g, '') : null;

      if (isNaN(rawHour) || rawHour < 1 || rawHour > 24) continue;
      // If no meridiem and no preposition and rawHour is just a small number in text, be cautious
      if (!meridiem && !full.startsWith('at') && !full.startsWith('around') && !match[2]) {
        continue;
      }

      let hour = rawHour;
      if (meridiem === 'pm' && hour < 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;
      if (!meridiem && hour >= 1 && hour <= 6) {
        // Assume afternoon for 1 to 6 if unspecified
        hour += 12;
      }

      targetDate = setHours(targetDate, hour);
      targetDate = setMinutes(targetDate, rawMin);
      targetDate.setSeconds(0);
      targetDate.setMilliseconds(0);

      // If target time has already passed today and day wasn't specified as tomorrow, push to tomorrow
      if (isBefore(targetDate, baseDate) && !lower.includes('tomorrow')) {
        targetDate = addDays(targetDate, 1);
      }

      workingText = workingText.replace(match[0], '');
      timeFound = true;
      break;
    }

    // Default time periods if explicit clock time not found
    if (!timeFound) {
      if (lower.includes('morning')) {
        targetDate = setHours(targetDate, 9);
        targetDate = setMinutes(targetDate, 0);
        workingText = workingText.replace(/\bmorning\b/i, '');
      } else if (lower.includes('afternoon')) {
        targetDate = setHours(targetDate, 14);
        targetDate = setMinutes(targetDate, 0);
        workingText = workingText.replace(/\bafternoon\b/i, '');
      } else if (lower.includes('evening') || lower.includes('tonight')) {
        targetDate = setHours(targetDate, 19);
        targetDate = setMinutes(targetDate, 0);
        workingText = workingText.replace(/\b(evening|tonight)\b/i, '');
      } else {
        // Fallback default: 1 hour from now
        targetDate = addHours(baseDate, 1);
      }
    }

    return { primaryTime: targetDate, textWithoutTime: workingText };
  }

  private static cleanTaskString(raw: string): string {
    let clean = raw
      .replace(/^remind me\s+(?:that\s+)?(?:i\s+have\s+to\s+|i\s+need\s+to\s+|to\s+)?/i, '')
      .replace(/^remember\s+(?:to\s+|that\s+)?/i, '')
      .replace(/^i\s+(?:have\s+to|need\s+to|must|should)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize first letter
    if (clean.length > 0) {
      clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return clean || 'Untitled Reminder';
  }

  private static detectCategory(task: string): ReminderCategory {
    const lower = task.toLowerCase();
    if (
      lower.includes('doctor') ||
      lower.includes('appointment') ||
      lower.includes('medicine') ||
      lower.includes('pills') ||
      lower.includes('hospital') ||
      lower.includes('clinic') ||
      lower.includes('health') ||
      lower.includes('dentist')
    ) {
      return 'health';
    }
    if (
      lower.includes('meeting') ||
      lower.includes('call') ||
      lower.includes('client') ||
      lower.includes('email') ||
      lower.includes('report') ||
      lower.includes('office') ||
      lower.includes('project')
    ) {
      return 'work';
    }
    if (
      lower.includes('buy') ||
      lower.includes('groceries') ||
      lower.includes('milk') ||
      lower.includes('store') ||
      lower.includes('pickup') ||
      lower.includes('clean') ||
      lower.includes('laundry')
    ) {
      return 'errand';
    }
    if (
      lower.includes('parked') ||
      lower.includes('drawer') ||
      lower.includes('keys') ||
      lower.includes('wallet') ||
      lower.includes('passport')
    ) {
      return 'location';
    }
    return 'general';
  }

  private static generateSpokenConfirmation(
    task: string,
    primaryTime: Date,
    fallback?: FallbackRule
  ): string {
    const timeFormatted = format(primaryTime, 'h:mm a');
    const dayFormatted =
      format(primaryTime, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
        ? 'today'
        : 'tomorrow';

    let confirmation = `Got it! I will remind you ${dayFormatted} at ${timeFormatted} to ${task.toLowerCase()}.`;

    if (fallback && fallback.enabled) {
      const fallbackTime = addMinutes(primaryTime, fallback.delayMinutes);
      const fallbackFormatted = format(fallbackTime, 'h:mm a');
      const delayText =
        fallback.delayMinutes >= 60
          ? `${fallback.delayMinutes / 60} hour`
          : `${fallback.delayMinutes} minutes`;

      confirmation += ` If you haven't marked it done, I'll check back with you ${delayText} later at ${fallbackFormatted}.`;
    }

    return confirmation;
  }
}
