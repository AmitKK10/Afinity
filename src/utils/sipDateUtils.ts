/**
 * Afinity SIP Date & Calendar Calculation Utilities
 * Handles month boundaries, leap years, short months, and relative day math safely.
 */

import { SIPFrequency, SIPRecord } from '../types';

/**
 * Returns the maximum safe day for a given year and 0-indexed month.
 * e.g., for Feb 2026 returns 28, for Sep returns 30, for Aug returns 31.
 */
export function getSafeDayForMonth(year: number, monthIndex: number, targetDay: number): number {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const clampedTarget = Math.max(1, Math.min(31, targetDay || 1));
  return Math.min(clampedTarget, daysInMonth);
}

/**
 * Formats a day number into ordinal format (e.g. 1st, 2nd, 3rd, 5th, 21st, 31st).
 */
export function formatDayOrdinal(day: number): string {
  const d = Math.max(1, Math.min(31, Math.round(day || 1)));
  const j = d % 10;
  const k = d % 100;
  if (j === 1 && k !== 11) {
    return `${d}st`;
  }
  if (j === 2 && k !== 12) {
    return `${d}nd`;
  }
  if (j === 3 && k !== 13) {
    return `${d}rd`;
  }
  return `${d}th`;
}

/**
 * Formats deduction day into readable label e.g., "5th of every month"
 */
export function formatDeductionDay(day: number): string {
  return `${formatDayOrdinal(day)} of month`;
}

/**
 * Formats SIP period / date range
 */
export function formatSIPDateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return 'Perpetual';
  if (startDate && !endDate) return `Since ${startDate}`;
  return `${startDate} to ${endDate}`;
}

export interface NextSIPDateResult {
  nextDate: Date;
  nextDateString: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "5 Sep 2026"
  shortFormattedDate: string; // e.g. "5 Sep"
  daysUntil: number;
  relativeLabel: string;
  isToday: boolean;
  isTomorrow: boolean;
  isDueWithin7Days: boolean;
  isDueWithin30Days: boolean;
  frequencyLabel: string;
}

/**
 * Deterministically calculates the next upcoming SIP installment date.
 * Safely wraps across year boundaries and clamps day values for shorter months.
 */
export function calculateNextSIPDeductionDate(
  deductionDay: number,
  frequency: SIPFrequency = 'monthly',
  sipStatus: 'active' | 'stopped' | string = 'active',
  referenceDate: Date = new Date()
): NextSIPDateResult {
  const ref = new Date(referenceDate);
  const currentYear = ref.getFullYear();
  const currentMonth = ref.getMonth(); // 0-indexed
  const currentDay = ref.getDate();

  const dayTarget = Math.max(1, Math.min(31, deductionDay || 1));

  let targetYear = currentYear;
  let targetMonth = currentMonth;

  const normalizedFreq = (frequency || 'monthly').toString().toLowerCase();

  if (normalizedFreq === 'weekly') {
    // For weekly, calculate next 7 days step based on deduction day of week (1=Mon..7=Sun or day of month)
    const targetDate = new Date(currentYear, currentMonth, currentDay);
    targetDate.setDate(targetDate.getDate() + 7);
    targetYear = targetDate.getFullYear();
    targetMonth = targetDate.getMonth();
  } else if (normalizedFreq === 'quarterly') {
    // Check if target day in current month is in future or today, otherwise jump to next quarter month
    const safeDayCurrent = getSafeDayForMonth(currentYear, currentMonth, dayTarget);
    if (currentDay <= safeDayCurrent) {
      targetMonth = currentMonth;
    } else {
      targetMonth = currentMonth + 3;
    }
  } else {
    // Default: monthly
    const safeDayCurrentMonth = getSafeDayForMonth(currentYear, currentMonth, dayTarget);
    if (currentDay <= safeDayCurrentMonth) {
      // Still upcoming or due today in this current month
      targetMonth = currentMonth;
    } else {
      // Already passed this month; schedule next month's installment
      targetMonth = currentMonth + 1;
    }
  }

  // Normalize month overflow (e.g. month 12 -> Jan of next year)
  const normalizedDateObj = new Date(targetYear, targetMonth, 1);
  const finalYear = normalizedDateObj.getFullYear();
  const finalMonth = normalizedDateObj.getMonth();
  const finalSafeDay = getSafeDayForMonth(finalYear, finalMonth, dayTarget);

  const nextDate = new Date(finalYear, finalMonth, finalSafeDay, 0, 0, 0, 0);

  // Pad numbers
  const yyyy = finalYear;
  const mm = String(finalMonth + 1).padStart(2, '0');
  const dd = String(finalSafeDay).padStart(2, '0');
  const nextDateString = `${yyyy}-${mm}-${dd}`;

  // Formatted date
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${finalSafeDay} ${monthNamesShort[finalMonth]} ${finalYear}`;
  const shortFormattedDate = `${finalSafeDay} ${monthNamesShort[finalMonth]}`;

  // Days until calculation (midnight to midnight)
  const refMidnight = new Date(currentYear, currentMonth, currentDay, 0, 0, 0, 0);
  const diffTime = nextDate.getTime() - refMidnight.getTime();
  const daysUntil = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;
  const isDueWithin7Days = daysUntil <= 7;
  const isDueWithin30Days = daysUntil <= 30;

  const isStopped = (sipStatus || '').toString().toLowerCase() === 'stopped';

  let relativeLabel = '';
  if (isStopped) {
    relativeLabel = 'SIP Stopped';
  } else if (isToday) {
    relativeLabel = 'Today';
  } else if (isTomorrow) {
    relativeLabel = 'Tomorrow';
  } else if (daysUntil <= 30) {
    relativeLabel = `In ${daysUntil} days`;
  } else {
    relativeLabel = formattedDate;
  }

  let frequencyLabel = 'Monthly';
  if (normalizedFreq === 'weekly') frequencyLabel = 'Weekly';
  else if (normalizedFreq === 'quarterly') frequencyLabel = 'Quarterly';
  else if (normalizedFreq === 'fortnightly') frequencyLabel = 'Fortnightly';

  return {
    nextDate,
    nextDateString,
    formattedDate,
    shortFormattedDate,
    daysUntil,
    relativeLabel,
    isToday,
    isTomorrow,
    isDueWithin7Days,
    isDueWithin30Days,
    frequencyLabel,
  };
}

/**
 * Sorts an array of SIPs chronologically by their next deduction date.
 */
export function sortSIPsByUpcomingDate(sips: SIPRecord[], referenceDate: Date = new Date()): SIPRecord[] {
  return [...sips].sort((a, b) => {
    // Put active SIPs before stopped
    const aActive = a.sipStatus === 'active';
    const bActive = b.sipStatus === 'active';
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;

    const nextA = calculateNextSIPDeductionDate(a.deductionDay, a.frequency, a.sipStatus, referenceDate);
    const nextB = calculateNextSIPDeductionDate(b.deductionDay, b.frequency, b.sipStatus, referenceDate);

    return nextA.daysUntil - nextB.daysUntil;
  });
}
