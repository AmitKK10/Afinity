/**
 * Centralized Indian Financial Number Formatting Utility
 * Standard: Indian Numbering System (Lakhs & Crores)
 * e.g., ₹1,28,023 / ₹4,82,875 / -₹5,000 / ₹4.82 L
 */

/**
 * Format a number using the Indian currency system
 * @param amount Number to format
 * @param options Configuration options
 */
export function formatRupee(
  amount: number | null | undefined,
  options?: {
    showSign?: boolean;
    includeSymbol?: boolean;
    decimals?: number;
    compact?: boolean;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return options?.includeSymbol !== false ? '₹0' : '0';
  }

  const {
    showSign = false,
    includeSymbol = true,
    decimals = 0,
    compact = false,
  } = options || {};

  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const symbol = includeSymbol ? '₹' : '';

  // Compact Indian notation for large numbers
  if (compact) {
    if (absVal >= 10000000) {
      const cr = (absVal / 10000000).toFixed(2).replace(/\.?0+$/, '');
      const signStr = isNegative ? '-' : showSign && amount > 0 ? '+' : '';
      return `${signStr}${symbol}${cr} Cr`;
    }
    if (absVal >= 100000) {
      const lakh = (absVal / 100000).toFixed(2).replace(/\.?0+$/, '');
      const signStr = isNegative ? '-' : showSign && amount > 0 ? '+' : '';
      return `${signStr}${symbol}${lakh} L`;
    }
    if (absVal >= 1000) {
      const k = (absVal / 1000).toFixed(1).replace(/\.?0+$/, '');
      const signStr = isNegative ? '-' : showSign && amount > 0 ? '+' : '';
      return `${signStr}${symbol}${k} K`;
    }
  }

  // Format integer with Indian numbering system (2,2,3 grouping)
  const fixed = absVal.toFixed(decimals);
  const parts = fixed.split('.');
  let intPart = parts[0];
  const decPart = parts.length > 1 && decimals > 0 ? `.${parts[1]}` : '';

  // Indian format: last 3 digits, then groups of 2 digits
  if (intPart.length > 3) {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  let formatted = `${symbol}${intPart}${decPart}`;

  if (isNegative) {
    formatted = `-${formatted}`;
  } else if (showSign && amount > 0) {
    formatted = `+${formatted}`;
  }

  return formatted;
}

/**
 * Format percentage with positive/negative signs
 */
export function formatPercentage(
  percent: number | null | undefined,
  showSign: boolean = true,
  decimals: number = 2
): string {
  if (percent === null || percent === undefined || isNaN(percent)) {
    return '0.00%';
  }
  const sign = percent > 0 && showSign ? '+' : '';
  return `${sign}${percent.toFixed(decimals)}%`;
}

/**
 * Format relative or formatted timestamp
 */
export function formatFinancialDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format price update timestamp with friendly relative format:
 * e.g. "Today, 3:30 PM", "Yesterday, 11:00 AM", "18 Aug, 9:30 PM"
 */
export function formatPriceUpdatedTime(dateString?: string): string {
  if (!dateString) return 'Not updated';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 5) return `${diffHours}h ago`;

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;

    return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${timeStr}`;
  } catch {
    return 'Recently';
  }
}

export function formatRelativeTime(dateString?: string): string {
  return formatPriceUpdatedTime(dateString);
}

/**
 * Format last synced timestamp for dashboard header and status indicators.
 * Produces crisp, friendly local status: e.g. "Synced just now", "Synced 2m ago", "Synced today at 3:30 PM"
 */
export function formatLastSyncedTime(date?: Date | string | null): string {
  if (!date) return 'Synced just now';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Synced just now';

    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - d.getTime());
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 6) return `${diffHours}h ago`;

    const timeStr = d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) return `Today at ${timeStr}`;

    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${timeStr}`;
  } catch {
    return 'Just now';
  }
}

/**
 * Get color token name according to financial value
 */
export function getFinancialSentiment(
  value: number
): 'positive' | 'negative' | 'neutral' {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}
