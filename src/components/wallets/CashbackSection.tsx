import React from 'react';
import {
  Gift,
  PlusCircle,
  MinusCircle,
  History,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Building2,
  Wallet as WalletIcon,
  ShieldCheck,
  EyeOff,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { CashbackSummary } from '../../services/calculations';
import { DigitalWallet, WalletTransaction } from '../../types';

interface CashbackSectionProps {
  summary: CashbackSummary;
  wallets: DigitalWallet[];
  transactions: WalletTransaction[];
  onAddCashback: () => void;
  onUseCashback: () => void;
  onAdjustCashback: () => void;
  onViewHistory: () => void;
}

export const CashbackSection: React.FC<CashbackSectionProps> = ({
  summary,
  wallets,
  transactions,
  onAddCashback,
  onUseCashback,
  onAdjustCashback,
  onViewHistory,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.abs(val));
  };

  // Extract recent 3 cashback transactions
  const recentCashbackTx = transactions
    .filter(
      (tx) =>
        tx.type === 'CASHBACK_EARNED' ||
        tx.type === 'CASHBACK_USED' ||
        tx.type === 'CASHBACK_ADJUSTMENT' ||
        tx.type === 'CASHBACK' ||
        tx.type === 'cashback' ||
        tx.type === 'cashback_earned' ||
        tx.type === 'cashback_used'
    )
    .slice(0, 3);

  return (
    <div
      id="cashback-tracking-section"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-emerald-500/20 p-5 sm:p-6 shadow-xl"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Cashback & Rewards</h3>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {summary.walletCount} {summary.walletCount === 1 ? 'Source' : 'Sources'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Accumulated cashbacks from Credit Cards, Shopping, Banks & UPI
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-cashback-history"
            onClick={onViewHistory}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700/80 transition-all active:scale-95"
          >
            <History className="w-3.5 h-3.5 text-neutral-400" />
            <span>History</span>
          </button>

          <button
            id="btn-use-cashback"
            onClick={onUseCashback}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white text-xs font-semibold border border-rose-500/30 transition-all active:scale-95"
          >
            <MinusCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>- Use Cashback</span>
          </button>

          <button
            id="btn-add-cashback"
            onClick={onAddCashback}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Cashback</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-4">
        {/* Metric 1: Current Available Cashback */}
        <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 relative overflow-hidden">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
            Current Cashback Balance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {formatCurrency(summary.currentCashback)}
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            {summary.contributesToNetWorth ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Contributes to Net Worth
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <EyeOff className="w-3 h-3" />
                Excluded from Net Worth
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Total Cashback Earned */}
        <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
            Total Cashback Earned
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              +{formatCurrency(summary.totalEarned)}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2.5">
            Cumulative reward earnings tracked
          </p>
        </div>

        {/* Metric 3: Total Cashback Used */}
        <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 block mb-1">
            Total Cashback Used
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400 tracking-tight">
              -{formatCurrency(summary.totalUsed)}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2.5">
            Redemptions, bill discounts & shopping offsets
          </p>
        </div>
      </div>

      {/* Recent Activity Mini-Feed */}
      {recentCashbackTx.length > 0 && (
        <div className="mt-4 pt-3 border-t border-neutral-800/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Recent Cashback Activity
            </span>
            <button
              onClick={onViewHistory}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {recentCashbackTx.map((tx) => {
              const isEarned =
                tx.type === 'CASHBACK_EARNED' ||
                tx.type === 'cashback_earned' ||
                ((tx.type === 'CASHBACK' || tx.type === 'cashback') && tx.direction === 'in');
              return (
                <div
                  key={tx.id}
                  className="p-2 rounded-xl bg-neutral-950/40 border border-neutral-800/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isEarned
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isEarned ? 'EARNED' : 'USED'}
                    </span>
                    <span className="text-neutral-300 truncate font-medium">
                      {tx.reason || (isEarned ? 'Cashback Credit' : 'Cashback Redemption')}
                    </span>
                    {tx.source && (
                      <span className="text-[10px] text-neutral-500 shrink-0">({tx.source})</span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-bold ${
                        isEarned ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isEarned ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
