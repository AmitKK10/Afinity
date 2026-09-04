/**
 * CreditDashboardHero.tsx — Premium Credit Summary Command Center (Step 6B)
 * Displays deduplicated total credit limits, portfolio outstanding dues,
 * available credit, overall utilization, and owner/manager breakdown.
 */

import React from 'react';
import {
  CreditCard as CreditCardIcon,
  ShieldCheck,
  AlertTriangle,
  Users,
  Plus,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  FileText,
} from 'lucide-react';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { ProgressBar } from '../ui/ProgressBar';
import { formatRupee } from '../../utils/formatters';
import { CreditPositionSummary, getCreditUtilizationInfo } from '../../services/calculations';

interface CreditDashboardHeroProps {
  creditPosition: CreditPositionSummary;
  onAddCardClick: () => void;
  onManageGroupsClick: () => void;
  onPayCardClick?: () => void;
  onExportPdfClick?: () => void;
}

export const CreditDashboardHero: React.FC<CreditDashboardHeroProps> = ({
  creditPosition,
  onAddCardClick,
  onManageGroupsClick,
  onPayCardClick,
  onExportPdfClick,
}) => {
  const {
    totalCreditLimit,
    totalOutstanding,
    totalAvailableCredit,
    totalUtilization,
    totalCreditLiability,
    totalCreditBalanceRefund,
    activeCardsCount,
    sharedGroupsCount,
    ownerSummary,
    managedSummary,
  } = creditPosition;

  const utilInfo = getCreditUtilizationInfo(totalUtilization);

  return (
    <div
      id="credit-dashboard-hero"
      className="rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#260f1b] via-[#161226] to-[#0a0d18] border border-rose-500/30 shadow-2xl relative overflow-hidden text-white"
    >
      {/* Background ambient glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Header Strip: Title, Active Cards Badge, and Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 font-heading block">
                Credit Command Center
              </span>
              <span className="text-[11px] text-slate-400 block">
                {activeCardsCount} Active Cards {sharedGroupsCount > 0 && `• ${sharedGroupsCount} Shared Limit Pools`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExportPdfClick && (
              <button
                type="button"
                id="btn-credit-export-pdf"
                onClick={onExportPdfClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold shadow-sm cursor-pointer font-heading transition-all"
                title="Export Credit Statement PDF"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            )}

            {onPayCardClick && (
              <button
                type="button"
                onClick={onPayCardClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 cursor-pointer font-heading transition-all"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Pay Dues</span>
              </button>
            )}

            <button
              type="button"
              onClick={onManageGroupsClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-bold border border-slate-700 shadow-sm cursor-pointer font-heading transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Shared Pools</span>
              <span className="sm:hidden">Pools</span>
            </button>

            <button
              type="button"
              onClick={onAddCardClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-sm cursor-pointer font-heading transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Card</span>
            </button>
          </div>
        </div>

        {/* Primary Metrics Row: Total Outstanding Dues */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-1">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Net Outstanding Liabilities
            </span>
            <div className="flex items-baseline gap-3">
              <MoneyDisplay amount={totalCreditLiability} size="2xl" colorOverride="coral" />
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${utilInfo.badgeClass}`}>
                {totalUtilization}% • {utilInfo.label}
              </span>
            </div>

            {totalCreditBalanceRefund > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ ₹{formatRupee(totalCreditBalanceRefund, { includeSymbol: false })} Refund / Credit Balance</span>
              </div>
            )}
          </div>

          {/* Quick Portfolio Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Total Credit Pool</span>
              <span className="text-sm sm:text-base font-bold text-slate-100 tabular-nums">
                {formatRupee(totalCreditLimit)}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Deduplicated limits
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Available Limit</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
                {formatRupee(totalAvailableCredit)}
              </span>
              <span className="text-[10px] text-emerald-500/80 block truncate">
                Ready to spend
              </span>
            </div>
          </div>
        </div>

        {/* Portfolio Utilization Progress Bar */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <ProgressBar
            value={Math.max(0, totalCreditLiability)}
            max={totalCreditLimit}
            label="Overall Utilization"
            sublabel={`₹${formatRupee(totalAvailableCredit, { includeSymbol: false })} available`}
            showPercentage
            variant="dynamic"
            size="md"
          />
        </div>

        {/* Owner and Responsibility Quick Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 block">My Cards (Self)</span>
            <div className="font-bold text-slate-200 mt-0.5 tabular-nums">
              {formatRupee(ownerSummary.self.totalOutstanding)}
            </div>
            <span className="text-[10px] text-cyan-400 block">{ownerSummary.self.cardCount} cards</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 block">Parent Cards</span>
            <div className="font-bold text-slate-200 mt-0.5 tabular-nums">
              {formatRupee(ownerSummary.parent.totalOutstanding)}
            </div>
            <span className="text-[10px] text-amber-400 block">{ownerSummary.parent.cardCount} cards</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 block">Cards I Pay</span>
            <div className="font-bold text-slate-200 mt-0.5 tabular-nums">
              {formatRupee(managedSummary.iPay.totalOutstanding)}
            </div>
            <span className="text-[10px] text-rose-300 block">{managedSummary.iPay.cardCount} cards</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 block">Parent Pays</span>
            <div className="font-bold text-slate-200 mt-0.5 tabular-nums">
              {formatRupee(managedSummary.iDontPay.totalOutstanding)}
            </div>
            <span className="text-[10px] text-slate-400 block">{managedSummary.iDontPay.cardCount} cards</span>
          </div>
        </div>
      </div>
    </div>
  );
};

