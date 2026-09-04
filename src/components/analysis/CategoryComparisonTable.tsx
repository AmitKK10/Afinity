import React, { useState } from 'react';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Coins,
  Building2,
  Landmark,
  Wallet,
  CreditCard,
  Receipt,
  PiggyBank,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { NetWorthComparisonResult, CategoryContribution } from '../../types';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface CategoryComparisonTableProps {
  comparison: NetWorthComparisonResult;
  className?: string;
}

export const CategoryComparisonTable: React.FC<CategoryComparisonTableProps> = ({
  comparison,
  className,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'assets' | 'liabilities'>('all');

  const { categoryBreakdown, contributionsList, periodLabel } = comparison;

  const getIcon = (key: string) => {
    switch (key) {
      case 'cash':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'banks':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'fixedDeposits':
        return <Landmark className="w-4 h-4 text-teal-400" />;
      case 'wallets':
        return <Wallet className="w-4 h-4 text-indigo-400" />;
      case 'investments':
        return <TrendingUp className="w-4 h-4 text-cyan-400" />;
      case 'receivables':
        return <Receipt className="w-4 h-4 text-purple-400" />;
      case 'creditCards':
        return <CreditCard className="w-4 h-4 text-rose-400" />;
      case 'overdrafts':
        return <PiggyBank className="w-4 h-4 text-red-400" />;
      case 'payables':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default:
        return <Coins className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredItems = contributionsList.filter((item) => {
    if (filterType === 'assets') return !item.isLiability;
    if (filterType === 'liabilities') return item.isLiability;
    return true;
  });

  return (
    <FinancialCard
      id="afinity-category-comparison-section"
      className={cn('p-4 sm:p-6 space-y-4', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white font-heading">
            Asset & Liability Category Comparison
          </h3>
          <p className="text-xs text-slate-400">
            Side-by-side comparison across all 9 portfolio sectors vs {periodLabel}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-bold font-heading transition-all cursor-pointer min-h-[32px]',
              filterType === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            All (9)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('assets')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-bold font-heading transition-all cursor-pointer min-h-[32px]',
              filterType === 'assets'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Assets
          </button>
          <button
            type="button"
            onClick={() => setFilterType('liabilities')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-bold font-heading transition-all cursor-pointer min-h-[32px]',
              filterType === 'liabilities'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Liabilities
          </button>
        </div>
      </div>

      {/* Desktop / Tablet Table View (hidden on very small screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-slate-950/60 border-b border-slate-800 font-heading">
            <tr>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3 text-right">Baseline (Then)</th>
              <th className="py-3 px-3 text-center w-8"></th>
              <th className="py-3 px-3 text-right">Current (Now)</th>
              <th className="py-3 px-3 text-right">Change Amount</th>
              <th className="py-3 px-3 text-right">Net Worth Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredItems.map((item) => {
              const isImpactPositive = item.impactOnNetWorth > 0;
              const isImpactZero = item.impactOnNetWorth === 0;

              return (
                <tr
                  key={item.categoryKey}
                  className="hover:bg-slate-900/60 transition-colors group"
                >
                  <td className="py-3 px-3 font-sans">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        {getIcon(item.categoryKey)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-200 block font-heading">
                          {item.categoryLabel}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {item.isLiability ? 'Liability / Debt' : 'Asset Holding'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right text-slate-400">
                    {formatRupee(item.baselineValue)}
                  </td>

                  <td className="py-3 px-3 text-center text-slate-600">
                    <ArrowRight className="w-3.5 h-3.5 mx-auto text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-white">
                    {formatRupee(item.currentValue)}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={cn(
                        'font-medium',
                        item.changeAmount > 0
                          ? 'text-slate-200'
                          : item.changeAmount < 0
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      )}
                    >
                      {item.changeAmount > 0 ? '+' : ''}{formatRupee(item.changeAmount)}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={cn(
                        'font-bold px-2 py-0.5 rounded text-xs',
                        isImpactZero
                          ? 'text-slate-500 bg-slate-900'
                          : isImpactPositive
                          ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/40'
                          : 'text-rose-300 bg-rose-950/60 border border-rose-800/40'
                      )}
                    >
                      {isImpactZero ? '₹0' : isImpactPositive ? `+${formatRupee(item.impactOnNetWorth)}` : `-${formatRupee(Math.abs(item.impactOnNetWorth))}`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (hidden on md+) */}
      <div className="md:hidden space-y-2.5">
        {filteredItems.map((item) => {
          const isImpactPositive = item.impactOnNetWorth > 0;
          const isImpactZero = item.impactOnNetWorth === 0;

          return (
            <div
              key={item.categoryKey}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {getIcon(item.categoryKey)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block font-heading">
                      {item.categoryLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.isLiability ? 'Liability' : 'Asset'}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={isImpactZero ? 'default' : isImpactPositive ? 'emerald' : 'rose'}
                  size="sm"
                >
                  {isImpactZero ? '₹0 Impact' : isImpactPositive ? `+${formatRupee(item.impactOnNetWorth)}` : `-${formatRupee(Math.abs(item.impactOnNetWorth))}`}
                </Badge>
              </div>

              {/* Values Transition Row */}
              <div className="pt-1 flex items-center justify-between font-mono bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">Then</span>
                  <span className="text-slate-400 font-medium">{formatRupee(item.baselineValue)}</span>
                </div>

                <ArrowRight className="w-4 h-4 text-cyan-400/80" />

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block font-sans">Now</span>
                  <span className="text-white font-bold">{formatRupee(item.currentValue)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </FinancialCard>
  );
};
