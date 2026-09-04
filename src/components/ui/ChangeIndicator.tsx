import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface ChangeIndicatorProps {
  amount?: number;
  percentage?: number;
  label?: string;
  variant?: 'pill' | 'text' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({
  amount,
  percentage,
  label = 'this month',
  variant = 'pill',
  size = 'md',
  className,
}) => {
  const isPositive = (amount ?? 0) > 0 || (percentage ?? 0) > 0;
  const isNegative = (amount ?? 0) < 0 || (percentage ?? 0) < 0;
  const isZero = !isPositive && !isNegative;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-sm sm:text-base px-3 py-1.5 gap-2',
  };

  const getColors = () => {
    if (isPositive) {
      return variant === 'pill'
        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        : 'text-emerald-400';
    }
    if (isNegative) {
      return variant === 'pill'
        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
        : 'text-rose-400';
    }
    return variant === 'pill'
      ? 'bg-slate-800/60 text-slate-300 border border-slate-700/50'
      : 'text-slate-400';
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium tabular-nums transition-colors',
        variant === 'pill' && sizeClasses[size],
        getColors(),
        className
      )}
    >
      {isPositive && <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />}
      {isNegative && <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />}
      {isZero && <Minus className="w-3.5 h-3.5 flex-shrink-0" />}

      <span className="font-semibold whitespace-nowrap">
        {amount !== undefined && (
          <span>{formatRupee(amount, { showSign: true })}</span>
        )}
        {amount !== undefined && percentage !== undefined && <span className="mx-1 opacity-70">•</span>}
        {percentage !== undefined && (
          <span>{formatPercentage(percentage, true)}</span>
        )}
      </span>

      {label && <span className="text-slate-400 font-normal whitespace-nowrap text-[11px] ml-0.5">{label}</span>}
    </div>
  );
};
