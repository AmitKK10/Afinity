import React from 'react';
import { ComparisonPeriod } from '../../types';
import { cn } from '../../utils/cn';

interface PeriodSelectorProps {
  selectedPeriod: ComparisonPeriod;
  onSelectPeriod: (period: ComparisonPeriod) => void;
  baselineDateString?: string | null;
  className?: string;
}

const PERIOD_OPTIONS: { id: ComparisonPeriod; label: string; shortLabel: string }[] = [
  { id: '1M', label: '1 Month', shortLabel: '1M' },
  { id: '3M', label: '3 Months', shortLabel: '3M' },
  { id: '6M', label: '6 Months', shortLabel: '6M' },
  { id: '1Y', label: '1 Year', shortLabel: '12M' },
  { id: '24M', label: '2 Years', shortLabel: '24M' },
  { id: 'ALL', label: 'All Time', shortLabel: 'ALL' },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onSelectPeriod,
  baselineDateString,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)} id="analysis-period-selector">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading">
          Comparison Timeframe
        </span>
        {baselineDateString && (
          <span className="text-[11px] text-cyan-400 font-mono font-medium">
            Baseline: {baselineDateString}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner gap-1">
        {PERIOD_OPTIONS.map((opt) => {
          const isActive = selectedPeriod === opt.id || (opt.id === '1Y' && selectedPeriod === '12M');
          return (
            <button
              key={opt.id}
              type="button"
              id={`period-btn-${opt.shortLabel.toLowerCase()}`}
              onClick={() => onSelectPeriod(opt.id)}
              className={cn(
                'min-h-[44px] py-2 px-1 text-xs font-bold font-heading rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center select-none',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-950/50 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              <span>{opt.shortLabel}</span>
              <span className="text-[9px] opacity-80 font-normal">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
