/**
 * @file date.utils.ts
 * @description A collection of pure TypeScript utility functions for date and time
 * manipulation, formatting, and comparison. Framework-agnostic, works with Angular,
 * React, Vue, or plain TypeScript projects.
 *
 * @author Arul Cornelious
 * @license MIT
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type DateInput = Date | string | number;

export interface DateRange {
  start: Date;
  end: Date;
}

export type TimeUnit =
  | 'milliseconds'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years';

// ─── Parsing ─────────────────────────────────────────────────────────────────

/**
 * Normalises any date-like value into a native Date object.
 * @throws {RangeError} if the input produces an invalid date.
 */
export function toDate(input: DateInput): Date {
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    throw new RangeError(`Invalid date input: "${input}"`);
  }
  return date;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Formats a date using the Intl.DateTimeFormat API.
 *
 * @example
 * formatDate(new Date(), 'en-GB', { dateStyle: 'long' })
 * // => '15 January 2025'
 */
export function formatDate(
  input: DateInput,
  locale: string = 'en-GB',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  return new Intl.DateTimeFormat(locale, options).format(toDate(input));
}

/**
 * Returns an ISO-8601 date string (YYYY-MM-DD) for the given input.
 */
export function toISODateString(input: DateInput): string {
  return toDate(input).toISOString().split('T')[0];
}

// ─── Relative time ───────────────────────────────────────────────────────────

/**
 * Returns a human-readable relative-time string using Intl.RelativeTimeFormat.
 *
 * @example
 * timeAgo(Date.now() - 90_000) // => '2 minutes ago'
 */
export function timeAgo(input: DateInput, locale: string = 'en'): string {
  const diff = toDate(input).getTime() - Date.now(); // negative = past
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const thresholds: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'seconds'],
    [3_600, 'minutes'],
    [86_400, 'hours'],
    [2_592_000, 'days'],
    [31_536_000, 'months'],
    [Infinity, 'years'],
  ];

  const absDiff = Math.abs(diff) / 1000;
  let prev = 1;

  for (const [limit, unit] of thresholds) {
    if (absDiff < limit) {
      return rtf.format(Math.round(diff / 1000 / prev), unit);
    }
    prev = limit;
  }

  return rtf.format(Math.round(diff / 1000 / 31_536_000), 'years');
}

// ─── Arithmetic ──────────────────────────────────────────────────────────────

/**
 * Adds a given amount of a time unit to a date.
 *
 * @example
 * addTime(new Date('2025-01-15'), 3, 'days') // => Date('2025-01-18')
 */
export function addTime(input: DateInput, amount: number, unit: TimeUnit): Date {
  const date = toDate(input);
  const d = new Date(date);

  switch (unit) {
    case 'milliseconds': d.setMilliseconds(d.getMilliseconds() + amount); break;
    case 'seconds':      d.setSeconds(d.getSeconds() + amount);           break;
    case 'minutes':      d.setMinutes(d.getMinutes() + amount);           break;
    case 'hours':        d.setHours(d.getHours() + amount);               break;
    case 'days':         d.setDate(d.getDate() + amount);                 break;
    case 'weeks':        d.setDate(d.getDate() + amount * 7);             break;
    case 'months':       d.setMonth(d.getMonth() + amount);               break;
    case 'years':        d.setFullYear(d.getFullYear() + amount);         break;
  }

  return d;
}

/**
 * Returns the difference between two dates in the specified unit.
 */
export function diffTime(a: DateInput, b: DateInput, unit: TimeUnit): number {
  const msA = toDate(a).getTime();
  const msB = toDate(b).getTime();
  const diffMs = msA - msB;

  const msPerUnit: Record<TimeUnit, number> = {
    milliseconds: 1,
    seconds:      1_000,
    minutes:      60_000,
    hours:        3_600_000,
    days:         86_400_000,
    weeks:        604_800_000,
    months:       2_592_000_000,
    years:        31_536_000_000,
  };

  return diffMs / msPerUnit[unit];
}

// ─── Comparison ──────────────────────────────────────────────────────────────

/** Returns true if `a` is strictly before `b`. */
export function isBefore(a: DateInput, b: DateInput): boolean {
  return toDate(a).getTime() < toDate(b).getTime();
}

/** Returns true if `a` is strictly after `b`. */
export function isAfter(a: DateInput, b: DateInput): boolean {
  return toDate(a).getTime() > toDate(b).getTime();
}

/** Returns true if the two dates fall on the same calendar day. */
export function isSameDay(a: DateInput, b: DateInput): boolean {
  const da = toDate(a);
  const db = toDate(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** Returns true if the given date falls within the given range (inclusive). */
export function isWithinRange(input: DateInput, range: DateRange): boolean {
  const t = toDate(input).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

// ─── Calendar helpers ────────────────────────────────────────────────────────

/** Returns the first day (Monday) of the ISO week containing the given date. */
export function startOfWeek(input: DateInput): Date {
  const d = toDate(input);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day); // adjust for Sunday
  return addTime(d, diff, 'days');
}

/** Returns the number of days in the given month (handles leap years). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Returns true if the given year is a leap year. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
