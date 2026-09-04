import React from 'react';
import { formatRupee, getFinancialSentiment } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface MoneyDisplayProps {
  amount: number | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  sentimentColor?: boolean;
  colorOverride?: 'emerald' | 'coral' | 'blue' | 'gold' | 'white' | 'slate';
  showSign?: boolean;
  compact?: boolean;
  decimals?: number;
  className?: string;
  id?: string;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amount,
  size = 'md',
  sentimentColor = false,
  colorOverride,
  showSign = false,
  compact = false,
  decimals = 0,
  className,
  id,
}) => {
  const sentiment = getFinancialSentiment(amount ?? 0);
  const formatted = formatRupee(amount, {
    showSign,
    includeSymbol: true,
    compact,
    decimals,
  });

  const sizeClasses = {
    xs: 'text-xs font-semibold',
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-lg font-bold',
    xl: 'text-xl font-extrabold',
    '2xl': 'text-2xl sm:text-3xl font-extrabold',
    hero: 'text-3xl sm:text-4xl md:text-5xl font-black tracking-tight',
  };

  const getColorClass = () => {
    if (colorOverride) {
      switch (colorOverride) {
        case 'emerald': return 'text-emerald-600 dark:text-emerald-400';
        case 'coral': return 'text-rose-600 dark:text-rose-400';
        case 'blue': return 'text-cyan-600 dark:text-cyan-400';
        case 'gold': return 'text-amber-600 dark:text-amber-400';
        case 'slate': return 'text-slate-600 dark:text-slate-400';
        case 'white': return 'text-white';
      }
    }
    if (sentimentColor) {
      if (sentiment === 'positive') return 'text-emerald-600 dark:text-emerald-400';
      if (sentiment === 'negative') return 'text-rose-600 dark:text-rose-400';
      return 'text-slate-600 dark:text-slate-300';
    }
    return 'text-slate-900 dark:text-white';
  };

  return (
    <span
      id={id}
      className={cn(
        'tabular-nums inline-flex items-baseline select-text tracking-tight',
        sizeClasses[size],
        getColorClass(),
        className
      )}
    >
      {formatted}
    </span>
  );
};
