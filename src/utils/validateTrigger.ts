import type { Trigger } from '@/types/featureTracking';

const VALID_TRIGGER_TYPES = ['browser_support', 'browser_version', 'usage_threshold', 'baseline_status'] as const;
const VALID_TARGET_STATUSES = ['full', 'partial'] as const;
const VALID_USAGE_TYPES = ['full', 'partial', 'combined'] as const;
const VALID_BASELINE_STATUSES = ['low', 'high'] as const;
const MAX_TRIGGERS = 7;
const MAX_STRING_LENGTH = 50;

function isValidBrowserSupportTrigger(trigger: Record<string, unknown>): boolean {
  return (
    typeof trigger.browser === 'string' &&
    trigger.browser.length > 0 &&
    trigger.browser.length <= MAX_STRING_LENGTH &&
    VALID_TARGET_STATUSES.includes(trigger.targetStatus as 'full' | 'partial')
  );
}

function isValidBrowserVersionTrigger(trigger: Record<string, unknown>): boolean {
  return (
    typeof trigger.browser === 'string' &&
    trigger.browser.length > 0 &&
    trigger.browser.length <= MAX_STRING_LENGTH &&
    typeof trigger.version === 'string' &&
    trigger.version.length > 0 &&
    trigger.version.length <= MAX_STRING_LENGTH &&
    /^\d+$/.test(trigger.version) &&
    VALID_TARGET_STATUSES.includes(trigger.targetStatus as 'full' | 'partial')
  );
}

function isValidUsageThresholdTrigger(trigger: Record<string, unknown>): boolean {
  return (
    VALID_USAGE_TYPES.includes(trigger.usageType as 'full' | 'partial' | 'combined') &&
    typeof trigger.threshold === 'number' &&
    Number.isInteger(trigger.threshold) &&
    trigger.threshold >= 1 &&
    trigger.threshold <= 100
  );
}

function isValidBaselineStatusTrigger(trigger: Record<string, unknown>): boolean {
  return VALID_BASELINE_STATUSES.includes(trigger.targetStatus as 'low' | 'high');
}

function isValidTrigger(trigger: unknown): trigger is Trigger {
  if (typeof trigger !== 'object' || trigger === null) return false;

  const triggerRecord = trigger as Record<string, unknown>;

  if (!VALID_TRIGGER_TYPES.includes(triggerRecord.type as typeof VALID_TRIGGER_TYPES[number])) return false;

  if (triggerRecord.type === 'browser_support') return isValidBrowserSupportTrigger(triggerRecord);
  if (triggerRecord.type === 'browser_version') return isValidBrowserVersionTrigger(triggerRecord);
  if (triggerRecord.type === 'usage_threshold') return isValidUsageThresholdTrigger(triggerRecord);
  if (triggerRecord.type === 'baseline_status') return isValidBaselineStatusTrigger(triggerRecord);

  return false;
}

export function validateTriggers(triggers: unknown[]): void {
  if (triggers.length === 0) {
    throw new Error('At least one trigger is required');
  }

  if (triggers.length > MAX_TRIGGERS) {
    throw new Error(`Maximum ${MAX_TRIGGERS} triggers allowed`);
  }

  for (const trigger of triggers) {
    if (!isValidTrigger(trigger)) {
      throw new Error('Invalid trigger configuration');
    }
  }
}