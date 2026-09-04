import React from 'react';
import {
  Wallet,
  Plus,
  ShieldCheck,
  EyeOff,
  AlertCircle,
  ArrowLeftRight,
  History,
} from 'lucide-react';
import { WalletPositionSummary } from '../../services/calculations';

interface WalletDashboardHeroProps {
  summary: WalletPositionSummary;
  onAddWallet: () => void;
  onTransfer?: () => void;
  onViewTransferHistory?: () => void;
}

export const WalletDashboardHero: React.FC<WalletDashboardHeroProps> = ({
  summary,
  onAddWallet,
  onTransfer,
  onViewTransferHistory,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.abs(val));
  };

  const hasNegative = summary.negativeBalancesLiability > 0;

  return (
    <div
      id="wallet-dashboard-hero"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800/80 p-5 sm:p-6 md:p-8 shadow-2xl"
    >
      {/* Background ambient glows */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Main Balance display */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              DIGITAL WALLETS
            </span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
              {summary.totalBalance < 0 ? '-' : ''}
              {formatCurrency(summary.totalBalance)}
            </h1>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              {summary.activeWalletsCount} Active {summary.activeWalletsCount === 1 ? 'Wallet' : 'Wallets'}
            </span>
          </div>

          {/* Sub-breakdowns: Net worth vs Excluded & Negative */}
          <div className="mt-4 flex items-center gap-2.5 sm:gap-3 flex-wrap text-xs">
            {/* Included in Net Worth */}
            <div className="flex items-center gap-1.5 bg-neutral-800/70 border border-neutral-700/60 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-neutral-400">Included in Net Worth:</span>
              <strong className="text-emerald-400 font-mono">
                {summary.includedInNetWorth < 0 ? '-' : ''}
                {formatCurrency(summary.includedInNetWorth)}
              </strong>
            </div>

            {/* Excluded Balance */}
            <div className="flex items-center gap-1.5 bg-neutral-800/70 border border-neutral-700/60 px-3 py-1.5 rounded-xl">
              <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-neutral-400">Excluded Balance:</span>
              <strong className="text-neutral-300 font-mono">
                {formatCurrency(summary.excludedFromNetWorth)}
              </strong>
            </div>

            {/* Negative Liability (if any) */}
            {hasNegative && (
              <div className="flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/30 px-3 py-1.5 rounded-xl text-rose-300">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Overdraft Liability:</span>
                <strong className="text-rose-400 font-mono">
                  -{formatCurrency(summary.negativeBalancesLiability)}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {onTransfer && (
            <button
              id="btn-hero-transfer-wallet"
              onClick={onTransfer}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white font-semibold text-xs border border-neutral-700 transition-all"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>Transfer</span>
            </button>
          )}

          {onViewTransferHistory && (
            <button
              id="btn-hero-history-wallet"
              onClick={onViewTransferHistory}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white font-semibold text-xs border border-neutral-700 transition-all"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Transfer Logs</span>
            </button>
          )}

          <button
            id="btn-hero-add-wallet"
            onClick={onAddWallet}
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
