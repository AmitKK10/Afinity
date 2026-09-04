import React from 'react';
import { PieChart, TrendingUp, Sparkles, Coins, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { InvestmentHolding } from '../../types';
import { calculateInvestmentAllocation } from '../../services/calculations';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface InvestmentAllocationCardProps {
  holdings: InvestmentHolding[];
}

export const InvestmentAllocationCard: React.FC<InvestmentAllocationCardProps> = ({ holdings }) => {
  const activeHoldings = holdings.filter((h) => h.status === 'active' || !h.status);
  const allocation = calculateInvestmentAllocation(activeHoldings);

  const getStyleForType = (key: string) => {
    switch (key) {
      case 'STOCK':
        return {
          barColor: 'bg-cyan-500',
          textColor: 'text-cyan-300',
          borderColor: 'border-cyan-500/30',
          bgGrad: 'from-cyan-950/40 to-slate-900/60',
        };
      case 'ETF':
        return {
          barColor: 'bg-blue-500',
          textColor: 'text-blue-300',
          borderColor: 'border-blue-500/30',
          bgGrad: 'from-blue-950/40 to-slate-900/60',
        };
      case 'MUTUAL_FUND':
        return {
          barColor: 'bg-emerald-500',
          textColor: 'text-emerald-300',
          borderColor: 'border-emerald-500/30',
          bgGrad: 'from-emerald-950/40 to-slate-900/60',
        };
      case 'GOLD':
      case 'SGB':
        return {
          barColor: 'bg-amber-400',
          textColor: 'text-amber-300',
          borderColor: 'border-amber-500/30',
          bgGrad: 'from-amber-950/40 to-slate-900/60',
        };
      default:
        return {
          barColor: 'bg-indigo-500',
          textColor: 'text-indigo-300',
          borderColor: 'border-indigo-500/30',
          bgGrad: 'from-indigo-950/40 to-slate-900/60',
        };
    }
  };

  const list = allocation.assetTypeList;

  return (
    <div
      id="investment-allocation-card"
      className="rounded-3xl p-5 bg-gradient-to-br from-[#0c192e] via-[#091222] to-[#060a14] border border-slate-800 shadow-xl space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white font-heading">
            Portfolio Allocation & Diversification
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Total Valuation: <strong className="text-white font-mono">{formatRupee(allocation.totalValue)}</strong>
        </span>
      </div>

      {/* Multi-segment progress bar */}
      <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden flex shadow-inner">
        {list.map((item) => {
          const style = getStyleForType(item.key);
          return item.percentage > 0 ? (
            <div
              key={item.key}
              style={{ width: `${item.percentage}%` }}
              className={cn('h-full transition-all duration-500', style.barColor)}
              title={`${item.label}: ${item.percentage.toFixed(1)}%`}
            />
          ) : null;
        })}
      </div>

      {/* Allocation breakdown tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {list.map((item) => {
          const style = getStyleForType(item.key);
          return (
            <div
              key={item.key}
              className={cn(
                'p-3 rounded-2xl border bg-gradient-to-br transition-colors',
                style.borderColor,
                style.bgGrad
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-semibold text-slate-300 truncate">
                  {item.label}
                </span>
                <span className={cn('text-xs font-bold font-mono', style.textColor)}>
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
              <span className="text-sm font-bold text-white font-mono block">
                {formatRupee(item.currentValue)}
              </span>
              <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-slate-400">
                <span>{item.count} items</span>
                <span className={item.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {item.profitLoss >= 0 ? '+' : ''}
                  {formatPercentage(item.returnPercentage, true)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Broker Wise Distribution summary */}
      {allocation.brokerList.length > 1 && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-semibold shrink-0">By Platform:</span>
          {allocation.brokerList.map((b) => (
            <div key={b.key} className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-300 font-medium">{b.brokerName}:</span>
              <span className="text-cyan-300 font-bold font-mono">{formatRupee(b.currentValue)}</span>
              <span className="text-slate-400 text-[10px]">({b.percentage.toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
