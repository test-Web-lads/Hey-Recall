export type ReminderCategory =
  | 'general'
  | 'call'
  | 'errand'
  | 'finance'
  | 'health'
  | 'work'
  | 'location';

export type ReminderStatus =
  | 'pending'
  | 'triggered'
  | 'snoozed'
  | 'completed'
  | 'deleted'
  | 'fallback_active';

export interface FallbackRule {
  enabled: boolean;
  delayMinutes: number;
  triggerDescription: string;
  fallbackTriggerTime?: string;
  lastCheckedAt?: string;
}

export interface TaskLogEntry {
  timestamp: string;
  action: 'created' | 'triggered' | 'snoozed' | 'completed' | 'deleted' | 'restored' | 'edited' | 'uncompleted' | 'busy';
  description: string;
}

export interface ReminderItem {
  id: string;
  rawVoiceInput: string;
  task: string;
  notes?: string;
  category: ReminderCategory;
  primaryTime: string; // ISO string
  fallbackRule?: FallbackRule;
  status: ReminderStatus;
  createdAt: string;
  completedAt?: string;
  snoozedUntil?: string;
  spokenConfirmation?: string;
  isLocationNote?: boolean;
  activityLog?: TaskLogEntry[];
}

export interface NLPParseResult {
  task: string;
  category: ReminderCategory;
  primaryTime: Date;
  fallbackRule?: FallbackRule;
  spokenConfirmation?: string;
  confidence?: number;
  isLocationNote?: boolean;
}
