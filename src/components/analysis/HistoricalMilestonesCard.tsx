import React from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { FinancialSnapshot } from '../../types';
import {
  calculateHistoricalExtremes,
  calculateMultiPeriodGrowth,
  HistoricalExtremes,
  PeriodGrowthStat,
} from '../../services/calculations';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface HistoricalMilestonesCardProps {
  snapshots: FinancialSnapshot[];
  currentNetWorth: number;
  className?: string;
}

export const HistoricalMilestonesCard: React.FC<HistoricalMilestonesCardProps> = ({
  snapshots,
  currentNetWorth,
  className,
}) => {
  const extremes: HistoricalExtremes = calculateHistoricalExtremes(snapshots);
  const multiPeriodStats: PeriodGrowthStat[] = calculateMultiPeriodGrowth(currentNetWorth, snapshots);

  return (
    <div className={cn('space-y-4', className)} id="afinity-historical-milestones-section">
      {/* 1. Historical Peaks & Valleys */}
      <FinancialCard className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Historical Valuation Extremes
              </h3>
              <p className="text-xs text-slate-400">
                All-time peak, valley, and balance sheet records
              </p>
            </div>
          </div>

          <Badge variant="cyan" size="sm">
            {extremes.totalSnapshotsCount} Data Points
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Highest Net Worth */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block font-heading">
              Peak Net Worth
            </span>
            <div className="text-sm sm:text-base font-black font-mono text-cyan-300">
              {extremes.highestNetWorth ? formatRupee(extremes.highestNetWorth.value) : '—'}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {extremes.highestNetWorth ? extremes.highestNetWorth.date : 'Awaiting history'}
            </span>
          </div>

          {/* Lowest Net Worth */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-heading">
              Lowest Net Worth
            </span>
            <div className="text-sm sm:text-base font-black font-mono text-slate-200">
              {extremes.lowestNetWorth ? formatRupee(extremes.lowestNetWorth.value) : '—'}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {extremes.lowestNetWorth ? extremes.lowestNetWorth.date : 'Awaiting history'}
            </span>
          </div>

          {/* Peak Assets */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block font-heading">
              Peak Assets
            </span>
            <div className="text-sm sm:text-base font-black font-mono text-emerald-300">
              {extremes.highestAssets ? formatRupee(extremes.highestAssets.value) : '—'}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {extremes.highestAssets ? extremes.highestAssets.date : 'Awaiting history'}
            </span>
          </div>

          {/* Peak Liabilities */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-400 block font-heading">
              Peak Liabilities
            </span>
            <div className="text-sm sm:text-base font-black font-mono text-rose-300">
              {extremes.highestLiabilities ? formatRupee(extremes.highestLiabilities.value) : '—'}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {extremes.highestLiabilities ? extremes.highestLiabilities.date : 'Awaiting history'}
            </span>
          </div>
        </div>
      </FinancialCard>

      {/* 2. Multi-Period Growth Matrix (Requirement 21) */}
      <FinancialCard className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-heading">
              Multi-Timeframe Growth Velocity
            </h3>
            <p className="text-xs text-slate-400">
              Comprehensive valuation change rates across standardized time horizons
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {multiPeriodStats.map((stat) => (
            <div
              key={stat.period}
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 font-heading">{stat.label}</span>
                {stat.hasData && (
                  <span className={cn('text-[10px] font-bold font-mono', stat.isPositive ? 'text-emerald-400' : 'text-rose-400')}>
                    {stat.isPositive ? '+' : ''}{formatPercentage(stat.changePercentage, true)}
                  </span>
                )}
              </div>

              {stat.hasData && stat.changeAmount !== null ? (
                <>
                  <div className={cn('text-sm font-bold font-mono', stat.isPositive ? 'text-emerald-400' : 'text-rose-400')}>
                    {stat.isPositive ? '+' : ''}{formatRupee(stat.changeAmount)}
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Base: {stat.baselineDate}
                  </span>
                </>
              ) : (
                <div className="pt-1">
                  <span className="text-[11px] text-slate-500 italic block">
                    Insufficient data
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </FinancialCard>
    </div>
  );
};
