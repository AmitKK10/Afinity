import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { NetWorthComparisonResult } from '../../types';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface AssetLiabilityComparisonCardsProps {
  comparison: NetWorthComparisonResult;
  className?: string;
}

export const AssetLiabilityComparisonCards: React.FC<AssetLiabilityComparisonCardsProps> = ({
  comparison,
  className,
}) => {
  const {
    baselineAssets,
    currentAssets,
    assetsChangeAmount,
    assetsChangePercentage,
    baselineLiabilities,
    currentLiabilities,
    liabilitiesChangeAmount,
    liabilitiesChangePercentage,
    contributionsList,
    periodLabel,
  } = comparison;

  const isAssetsPositive = assetsChangeAmount >= 0;
  const isLiabilitiesReduced = liabilitiesChangeAmount <= 0; // Reducing liability is positive!

  // Top positive contributors to Net Worth
  const positiveContributors = contributionsList
    .filter((c) => c.impactOnNetWorth > 0)
    .sort((a, b) => b.impactOnNetWorth - a.impactOnNetWorth)
    .slice(0, 3);

  // Top negative factors to Net Worth
  const negativeContributors = contributionsList
    .filter((c) => c.impactOnNetWorth < 0)
    .sort((a, b) => a.impactOnNetWorth - b.impactOnNetWorth)
    .slice(0, 3);

  return (
    <div className={cn('space-y-4', className)} id="asset-liability-comparison-section">
      {/* 1. Asset & Liability Growth Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asset Growth Card */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-gradient-to-br from-slate-900/90 via-slate-900 to-emerald-950/20 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-heading">
                Total Asset Expansion
              </span>
              <p className="text-[11px] text-slate-400">
                Combined holdings & valuation growth vs {periodLabel}
              </p>
            </div>
            <Badge variant={isAssetsPositive ? 'emerald' : 'rose'} size="sm">
              {isAssetsPositive ? '+' : ''}{formatPercentage(assetsChangePercentage, true)}
            </Badge>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">Assets Then</span>
              <span className="text-slate-300 font-bold">{formatRupee(baselineAssets)}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block font-sans">Assets Now</span>
              <span className="text-emerald-400 font-black text-base">{formatRupee(currentAssets)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Total Asset Delta:</span>
            <span className={cn('font-mono font-bold', isAssetsPositive ? 'text-emerald-400' : 'text-rose-400')}>
              {isAssetsPositive ? '+' : ''}{formatRupee(assetsChangeAmount)}
            </span>
          </div>
        </FinancialCard>

        {/* Liability Growth/Reduction Card */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-gradient-to-br from-slate-900/90 via-slate-900 to-rose-950/20 border border-rose-500/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-heading">
                Total Liability Movement
              </span>
              <p className="text-[11px] text-slate-400">
                Credit dues, overdrafts & payables vs {periodLabel}
              </p>
            </div>
            <Badge variant={isLiabilitiesReduced ? 'emerald' : 'rose'} size="sm">
              {isLiabilitiesReduced ? 'Liability Reduced ✓' : 'Debt Increased'}
            </Badge>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">Liabilities Then</span>
              <span className="text-slate-300 font-bold">{formatRupee(baselineLiabilities)}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-rose-400" />
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block font-sans">Liabilities Now</span>
              <span className="text-rose-400 font-black text-base">{formatRupee(currentLiabilities)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">
              {isLiabilitiesReduced ? 'Debt Repaid (Positive):' : 'Debt Added (Drag):'}
            </span>
            <span className={cn('font-mono font-bold', isLiabilitiesReduced ? 'text-emerald-400' : 'text-rose-400')}>
              {liabilitiesChangeAmount > 0 ? `+${formatRupee(liabilitiesChangeAmount)}` : formatRupee(liabilitiesChangeAmount)}
            </span>
          </div>
        </FinancialCard>
      </div>

      {/* 2. Top Contribution Insights (Requirement 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top Growth Drivers */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-heading">
            <TrendingUp className="w-4 h-4" />
            <span>Top Positive Drivers</span>
          </div>

          {positiveContributors.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No asset expansions in this period.</p>
          ) : (
            <div className="space-y-1.5">
              {positiveContributors.map((item, idx) => (
                <div
                  key={item.categoryKey}
                  className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-200">{item.categoryLabel}</span>
                  </div>
                  <span className="font-bold font-mono text-emerald-400">
                    +{formatRupee(item.impactOnNetWorth)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Negative Factors / Drags */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 font-heading">
            <TrendingDown className="w-4 h-4" />
            <span>Top Negative Factors</span>
          </div>

          {negativeContributors.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No net worth drags or added debt in this period.</p>
          ) : (
            <div className="space-y-1.5">
              {negativeContributors.map((item, idx) => (
                <div
                  key={item.categoryKey}
                  className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-rose-950 text-rose-400 text-[10px] font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-200">{item.categoryLabel}</span>
                  </div>
                  <span className="font-bold font-mono text-rose-400">
                    -{formatRupee(Math.abs(item.impactOnNetWorth))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
