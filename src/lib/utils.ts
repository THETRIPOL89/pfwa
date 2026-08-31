import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format integer cents → EUR currency string. */
export function formatCurrency(
  cents: number,
  currency: string = 'EUR',
  locale: string = 'it-IT',
  options?: { compact?: boolean },
) {
  const value = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: options?.compact ? 'compact' : 'standard',
    maximumFractionDigits: options?.compact ? 1 : 2,
  }).format(value);
}

/** Format a number with thousand separators. */
export function formatNumber(value: number, locale: string = 'it-IT', fractionDigits = 2) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

/** Format a percentage. Pass a fraction (0.235) and it prints "23,5%". */
export function formatPercent(fraction: number, locale: string = 'it-IT', fractionDigits = 1) {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(fraction);
}

/** Relative time-ago string in Italian. */
export function timeAgo(date: Date | string, locale: string = 'it-IT'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 604_800) return rtf.format(Math.round(diffSec / 86_400), 'day');
  if (abs < 2_592_000) return rtf.format(Math.round(diffSec / 604_800), 'week');
  if (abs < 31_536_000) return rtf.format(Math.round(diffSec / 2_592_000), 'month');
  return rtf.format(Math.round(diffSec / 31_536_000), 'year');
}

/** Short Italian date (e.g. "12 mar 2025"). */
export function formatDate(date: Date | string, locale: string = 'it-IT') {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/** Returns YYYY-MM-DD for a Date. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns first day of the month for a Date. */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Returns last day of the month for a Date. */
export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Random id generator used by mocks and optimistic mutations. */
export function uid(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Safe divide (returns 0 when divisor is 0). */
export function safeDivide(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

/** Sum helper. */
export function sum(values: Array<number | undefined | null>): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

/** Group an array by a key extractor. */
export function groupBy<T, K extends string | number>(
  list: T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of list) {
    const k = key(item);
    (out[k] ||= []).push(item);
  }
  return out;
}

/** Sleep helper used by tests and loading skeletons. */
export function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}