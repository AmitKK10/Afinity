import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ChevronRight,
  Building2,
  PieChart,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import { InvestmentHolding } from '../../types';
import { calculateInvestmentProfitLoss, calculateInvestmentReturnPercentage, calculateInvestmentAllocation } from '../../services/calculations';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { InvestmentBrandBadge } from '../brand/InvestmentBrandBadge';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface InvestmentPerformanceSectionProps {
  holdings: InvestmentHolding[];
  onSelectHolding?: (holding: InvestmentHolding) => void;
  onEditHolding?: (holding: InvestmentHolding) => void;
  onUpdatePrice?: (holding: InvestmentHolding) => void;
}

export const InvestmentPerformanceSection: React.FC<InvestmentPerformanceSectionProps> = ({
  holdings,
  onSelectHolding,
  onEditHolding,
  onUpdatePrice,
}) => {
  const activeHoldings = useMemo(
    () => holdings.filter((h) => h.status === 'active' || !h.status),
    [holdings]
  );

  // Computations for all active holdings
  const computedList = useMemo(() => {
    return activeHoldings.map((h) => {
      const qty = Number(h.quantity !== undefined ? h.quantity : h.unitsHeld || 0);
      const avg = Number(h.averageBuyPrice || 0);
      const currPrice = Number(h.currentPrice || 0);
      const invested = h.investedAmount !== undefined && h.investedAmount > 0 ? Number(h.investedAmount) : qty * avg;
      const current = h.currentValue !== undefined && h.currentValue > 0 ? Number(h.currentValue) : qty * currPrice;
      const pnl = calculateInvestmentProfitLoss(invested, current);
      const retPct = calculateInvestmentReturnPercentage(invested, current);

      return {
        holding: h,
        invested,
        current,
        pnl,
        retPct,
      };
    });
  }, [activeHoldings]);

  // Top Holdings (sorted by current value descending, top 4)
  const topHoldings = useMemo(() => {
    return [...computedList].sort((a, b) => b.current - a.current).slice(0, 4);
  }, [computedList]);

  // Best & Worst Performers (sorted by return percentage)
  const bestPerformer = useMemo(() => {
    if (computedList.length === 0) return null;
    const sorted = [...computedList].sort((a, b) => b.retPct - a.retPct);
    return sorted[0];
  }, [computedList]);

  const worstPerformer = useMemo(() => {
    if (computedList.length <= 1) return null;
    const sorted = [...computedList].sort((a, b) => a.retPct - b.retPct);
    // If the worst performer is the exact same as the best performer, return null
    if (bestPerformer && sorted[0].holding.id === bestPerformer.holding.id) return null;
    return sorted[0];
  }, [computedList, bestPerformer]);

  // Broker allocation
  const allocation = useMemo(() => {
    return calculateInvestmentAllocation(activeHoldings);
  }, [activeHoldings]);

  if (activeHoldings.length === 0) return null;

  return (
    <div id="investment-performance-section" className="space-y-4">
      {/* 1. Best vs Worst Performers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Top Performer Card */}
        {bestPerformer && (
          <div
            onClick={() => onSelectHolding?.(bestPerformer.holding)}
            className="rounded-3xl p-4 sm:p-4.5 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-heading uppercase tracking-wider">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Top Performer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  +{formatPercentage(bestPerformer.retPct, true)} Return
                </span>
                {onEditHolding && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditHolding(bestPerformer.holding);
                    }}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Edit holding"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <InvestmentBrandBadge
                name={bestPerformer.holding.name}
                symbol={bestPerformer.holding.symbol}
                assetType={bestPerformer.holding.assetType || bestPerformer.holding.type}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white font-heading truncate group-hover:text-emerald-300 transition-colors">
                  {bestPerformer.holding.displayName || bestPerformer.holding.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>Val: {formatRupee(bestPerformer.current)}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    +{formatRupee(bestPerformer.pnl)} P/L
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
            </div>
          </div>
        )}

        {/* Worst / Lagging Performer Card */}
        {worstPerformer && (
          <div
            onClick={() => onSelectHolding?.(worstPerformer.holding)}
            className="rounded-3xl p-4 sm:p-4.5 bg-gradient-to-br from-rose-950/30 via-slate-900/90 to-slate-900 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 font-heading uppercase tracking-wider">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Lowest Performer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono',
                  worstPerformer.retPct >= 0
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                )}>
                  {worstPerformer.retPct >= 0 ? '+' : ''}{formatPercentage(worstPerformer.retPct, true)} Return
                </span>
                {onEditHolding && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditHolding(worstPerformer.holding);
                    }}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Edit holding"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <InvestmentBrandBadge
                name={worstPerformer.holding.name}
                symbol={worstPerformer.holding.symbol}
                assetType={worstPerformer.holding.assetType || worstPerformer.holding.type}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white font-heading truncate group-hover:text-rose-300 transition-colors">
                  {worstPerformer.holding.displayName || worstPerformer.holding.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>Val: {formatRupee(worstPerformer.current)}</span>
                  <span>•</span>
                  <span className={worstPerformer.pnl >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-bold font-mono'}>
                    {worstPerformer.pnl >= 0 ? '+' : ''}{formatRupee(worstPerformer.pnl)} P/L
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Holdings Compact Table/List */}
      <div className="rounded-3xl p-4 sm:p-5 bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-heading">
              Top Portfolio Holdings
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Sorted by Market Value
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {topHoldings.map((item, idx) => {
            const isPos = item.pnl >= 0;
            return (
              <div
                key={item.holding.id}
                onClick={() => onSelectHolding?.(item.holding)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-500 w-4 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <InvestmentBrandBadge
                    name={item.holding.name}
                    symbol={item.holding.symbol}
                    assetType={item.holding.assetType || item.holding.type}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {item.holding.displayName || item.holding.name}
                    </h5>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span>{item.holding.broker || item.holding.platform || 'Direct'}</span>
                      {item.holding.symbol && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-slate-300">{item.holding.symbol}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-bold text-white font-mono">
                      {formatRupee(item.current)}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[11px] font-mono mt-0.5">
                      <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                        {isPos ? '+' : ''}{formatRupee(item.pnl)}
                      </span>
                      <span className={cn(
                        'text-[10px] px-1 rounded font-bold',
                        isPos ? 'bg-emerald-950/60 text-emerald-300' : 'bg-rose-950/60 text-rose-300'
                      )}>
                        {isPos ? '+' : ''}{formatPercentage(item.retPct, true)}
                      </span>
                    </div>
                  </div>

                  {onEditHolding && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditHolding(item.holding);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 border border-slate-700/60 transition-colors cursor-pointer"
                      title="Edit holding"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
