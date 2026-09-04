import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number; // Current value or percentage
  max?: number;
  label?: string;
  sublabel?: string;
  variant?: 'emerald' | 'blue' | 'gold' | 'coral' | 'dynamic';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  sublabel,
  variant = 'dynamic',
  showPercentage = false,
  size = 'md',
  className,
  id,
}) => {
  const safeVal = typeof value === 'number' && !isNaN(value) ? value : 0;
  const safeMax = typeof max === 'number' && !isNaN(max) && max > 0 ? max : 100;
  const percentage = Math.min(100, Math.max(0, (safeVal / safeMax) * 100));

  const getDynamicColor = (pct: number) => {
    if (pct >= 75) return 'from-rose-500 to-red-600';
    if (pct >= 40) return 'from-amber-500 to-amber-600';
    return 'from-emerald-500 to-teal-500';
  };

  const getTrackColor = () => {
    switch (variant) {
      case 'emerald': return 'from-emerald-500 to-teal-400';
      case 'blue': return 'from-cyan-500 to-blue-600';
      case 'gold': return 'from-amber-400 to-yellow-500';
      case 'coral': return 'from-rose-500 to-red-500';
      case 'dynamic': return getDynamicColor(percentage);
    }
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div id={id} className={cn('w-full flex flex-col gap-1.5', className)}>
      {(label || sublabel || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-300">{label}</span>
          <div className="flex items-center gap-2">
            {sublabel && <span className="text-slate-400">{sublabel}</span>}
            {showPercentage && (
              <span className="text-slate-200 font-semibold tabular-nums">
                {percentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      )}
      <div className={cn('w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/40', sizeClasses[size])}>
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out', getTrackColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
