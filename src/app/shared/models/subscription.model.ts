export type SubscriptionFrequency = 'MONTHLY' | 'ANNUAL';
export type SubscriptionType = 'GENERAL' | 'DIGITAL_SERVICE';

// Template categories for subscription templates
export type TemplateCategory =
  | 'STREAMING'
  | 'MUSIC'
  | 'CLOUD_STORAGE'
  | 'PRODUCTIVITY'
  | 'GAMING'
  | 'NEWS'
  | 'FITNESS'
  | 'FOOD'
  | 'TRANSPORT'
  | 'UTILITIES'
  | 'OTHER';

// Subscription template for pre-filled subscription data
export interface SubscriptionTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  defaultAmount: number;
  defaultFrequency: SubscriptionFrequency;
  iconUrl?: string;
  serviceUrl?: string;
}

// Prefill data when selecting a template
export interface SubscriptionTemplatePrefill {
  description: string;
  amount: number;
  frequency: SubscriptionFrequency;
  type: SubscriptionType;
  serviceUrl?: string;
  categoryId?: string;
}

export interface Subscription {
  id: string;
  description: string; // display name
  amount: number;
  billingDay: number; // 1–31
  startDate: string; // ISO 8601
  endDate: string | null; // ISO 8601, null = still active
  frequency: SubscriptionFrequency;
  type: SubscriptionType;
  serviceUrl?: string; // required when type = DIGITAL_SERVICE
  isActive: boolean;
  categoryId: string;
  parentId: string | null;
  category?: { id: string; name: string; type: string };
}

/** Monthly equivalent cost */
export function getMonthlyCost(s: Subscription): number {
  return s.frequency === 'ANNUAL' ? s.amount / 12 : s.amount;
}

/** Yearly equivalent cost */
export function getYearlyCost(s: Subscription): number {
  return s.frequency === 'ANNUAL' ? s.amount : s.amount * 12;
}

/** Days until the next billing day this month (or next month if already passed) */
export function getDaysUntilBilling(s: Subscription): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(today.getFullYear(), today.getMonth(), s.billingDay);
  if (next < today) next.setMonth(next.getMonth() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getFrequencyLabel(f: SubscriptionFrequency): string {
  return f === 'ANNUAL' ? 'Annual' : 'Monthly';
}

export function getStatusColorClass(isActive: boolean): string {
  return isActive
    ? 'bg-secondary-container/20 text-secondary'
    : 'bg-surface-container-high text-on-surface-variant';
}
