import React from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Award,
  AlertCircle,
} from 'lucide-react';
import { MonthOverMonthComparison } from '../../types';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface MonthlyReviewCardProps {
  mom: MonthOverMonthComparison;
  className?: string;
}

export const MonthlyReviewCard: React.FC<MonthlyReviewCardProps> = ({
  mom,
  className,
}) => {
  const {
    currentMonthLabel,
    previousMonthLabel,
    netWorthChange,
    netWorthPercentageChange,
    assetsChange,
    liabilitiesChange,
    topGrowthCategory,
    topDeclineCategory,
    previousSnapshot,
  } = mom;

  const isNwPositive = netWorthChange >= 0;

  if (!previousSnapshot) {
    return (
      <FinancialCard className={cn('p-4 sm:p-5 space-y-2', className)}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-white font-heading">
            Monthly Financial Review ({currentMonthLabel})
          </h4>
        </div>
        <p className="text-xs text-slate-400">
          Prior monthly baseline snapshot will appear here as your financial timeline matures.
        </p>
      </FinancialCard>
    );
  }

  return (
    <FinancialCard
      id="afinity-monthly-review-card"
      className={cn('p-4 sm:p-5 space-y-4 bg-gradient-to-br from-slate-900 via-slate-900/95 to-[#0e172e] border border-cyan-500/20', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-heading">
              Monthly Financial Review
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {previousMonthLabel} → {currentMonthLabel}
            </p>
          </div>
        </div>

        <Badge variant={isNwPositive ? 'emerald' : 'rose'} size="md">
          {isNwPositive ? '+' : ''}{formatRupee(netWorthChange)} MoM
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Net Worth Delta */}
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Net Worth Shift</span>
          <div className={cn('text-base font-bold font-mono', isNwPositive ? 'text-emerald-400' : 'text-rose-400')}>
            {isNwPositive ? '+' : ''}{formatRupee(netWorthChange)}
          </div>
          <span className="text-[10px] text-slate-500 block font-mono">
            {formatPercentage(netWorthPercentageChange, true)} change
          </span>
        </div>

        {/* Assets Delta */}
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Asset Expansion</span>
          <div className="text-base font-bold font-mono text-emerald-400">
            {assetsChange >= 0 ? '+' : ''}{formatRupee(assetsChange)}
          </div>
          <span className="text-[10px] text-slate-500 block font-mono">
            Combined active assets
          </span>
        </div>

        {/* Liabilities Delta */}
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Liability Movement</span>
          <div className={cn('text-base font-bold font-mono', liabilitiesChange <= 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {liabilitiesChange >= 0 ? `+${formatRupee(liabilitiesChange)}` : formatRupee(liabilitiesChange)}
          </div>
          <span className="text-[10px] text-slate-500 block font-mono">
            {liabilitiesChange <= 0 ? 'Debt Repaid ✓' : 'Debt Added'}
          </span>
        </div>
      </div>

      {/* Highlights: Largest Growth & Largest Drag */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        {topGrowthCategory && (
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-heading">
                  Largest Growth Sector
                </span>
                <span className="font-bold text-white">{topGrowthCategory.categoryLabel}</span>
              </div>
            </div>
            <span className="font-mono font-bold text-emerald-400 shrink-0">
              +{formatRupee(topGrowthCategory.impactOnNetWorth)}
            </span>
          </div>
        )}

        {topDeclineCategory && (
          <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-heading">
                  Largest Drag / Debt
                </span>
                <span className="font-bold text-white">{topDeclineCategory.categoryLabel}</span>
              </div>
            </div>
            <span className="font-mono font-bold text-rose-400 shrink-0">
              -{formatRupee(Math.abs(topDeclineCategory.impactOnNetWorth))}
            </span>
          </div>
        )}
      </div>
    </FinancialCard>
  );
};
