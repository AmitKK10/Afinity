import React, { useState } from 'react';
import {
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Info,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Coins,
  Building2,
  Landmark,
  Wallet,
  CreditCard,
  Receipt,
  PiggyBank,
} from 'lucide-react';
import { NetWorthComparisonResult, CategoryContribution } from '../../types';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface ChangeBreakdownCardProps {
  comparison: NetWorthComparisonResult;
  className?: string;
}

export const ChangeBreakdownCard: React.FC<ChangeBreakdownCardProps> = ({
  comparison,
  className,
}) => {
  const [showNeutralityInfo, setShowNeutralityInfo] = useState(false);

  const {
    netWorthChangeAmount,
    netWorthChangePercentage,
    periodLabel,
    contributionsList,
    isPositive,
  } = comparison;

  // Filter contributions to non-zero items for concise breakdown
  const activeContributions = contributionsList.filter(
    (c) => Math.abs(c.changeAmount) > 0 || Math.abs(c.impactOnNetWorth) > 0
  );

  const getCategoryIcon = (categoryKey: string) => {
    switch (categoryKey) {
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
      case 'payables':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'overdrafts':
        return <PiggyBank className="w-4 h-4 text-red-400" />;
      default:
        return <Coins className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <FinancialCard
      id="afinity-change-breakdown-card"
      className={cn('p-4 sm:p-6 space-y-4', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white font-heading">
              Why Did My Net Worth Change?
            </h3>
            <Badge variant={isPositive ? 'emerald' : 'rose'} size="sm">
              {isPositive ? '+' : ''}{formatRupee(netWorthChangeAmount)}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Granular factor contribution vs {periodLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNeutralityInfo(!showNeutralityInfo)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-cyan-400 font-medium cursor-pointer transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Accounting Rules</span>
        </button>
      </div>

      {/* Neutrality Information Banner (Requirement 12, 13, 14, 15) */}
      {showNeutralityInfo && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-slate-300 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-cyan-300 font-heading">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Mathematical Net Worth Neutrality Principles</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-white">Internal Transfers (₹0 Impact):</strong> Moving money between Bank ↔ Cash ↔ Digital Wallet shifts asset sub-classes without changing overall Net Worth.
            </li>
            <li>
              <strong className="text-white">Credit Card Payments (₹0 Impact):</strong> Paying card dues reduces your bank balance and credit liability by the identical amount.
            </li>
            <li>
              <strong className="text-white">Dues & Receivables Settlements (₹0 Impact):</strong> Settling a receivable converts an asset into cash/bank; paying a payable lowers cash/bank and eliminates debt simultaneously.
            </li>
            <li>
              <strong className="text-white">Investment Valuation:</strong> Reflects live market price movements across equities, mutual funds, gold, and SGB holdings.
            </li>
          </ul>
        </div>
      )}

      {/* Contributions List */}
      {activeContributions.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-xs text-slate-400">
          No category balance movements recorded between these snapshot checkpoints.
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeContributions.map((item) => {
            const isImpactPositive = item.impactOnNetWorth > 0;
            const isImpactZero = item.impactOnNetWorth === 0;

            return (
              <div
                key={item.categoryKey}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs hover:border-slate-700/80 transition-colors"
              >
                {/* Left: Icon + Label */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {getCategoryIcon(item.categoryKey)}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-200 block truncate font-heading">
                      {item.categoryLabel}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {item.isLiability ? 'Liability: ' : 'Asset: '}
                      {item.changeAmount > 0 ? '+' : ''}{formatRupee(item.changeAmount)}
                    </span>
                  </div>
                </div>

                {/* Right: Net Worth Impact */}
                <div className="text-right shrink-0 font-mono">
                  <span className="text-[10px] text-slate-400 block">Net Worth Impact</span>
                  <span
                    className={cn(
                      'font-bold text-sm',
                      isImpactZero
                        ? 'text-slate-400'
                        : isImpactPositive
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    )}
                  >
                    {isImpactZero ? '₹0' : isImpactPositive ? `+${formatRupee(item.impactOnNetWorth)}` : `-${formatRupee(Math.abs(item.impactOnNetWorth))}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Total Check */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0d1629] to-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <span className="font-sans font-bold text-slate-300">
          Total Net Worth Delta:
        </span>
        <span
          className={cn(
            'text-base font-black',
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          )}
        >
          {isPositive ? '+' : ''}{formatRupee(netWorthChangeAmount)} ({formatPercentage(netWorthChangePercentage, true)})
        </span>
      </div>
    </FinancialCard>
  );
};
