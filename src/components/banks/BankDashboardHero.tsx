import React from 'react';
import { Landmark, ArrowUpRight, ArrowDownRight, ShieldCheck, Percent, Layers, PiggyBank, FileText } from 'lucide-react';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { BankPositionSummary } from '../../services/calculations';

interface BankDashboardHeroProps {
  bankPosition: BankPositionSummary;
  onNewTransferClick: () => void;
  onNewAccountClick: () => void;
  onNewFDClick: () => void;
  onExportPdfClick?: () => void;
}

export const BankDashboardHero: React.FC<BankDashboardHeroProps> = ({
  bankPosition,
  onNewTransferClick,
  onNewAccountClick,
  onNewFDClick,
  onExportPdfClick,
}) => {
  return (
    <div
      id="afinity-bank-dashboard-hero"
      className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#0c1427] via-[#09101f] to-[#050913] border border-blue-900/40 shadow-2xl"
    >
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10 space-y-5">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider font-heading">
              <Landmark className="w-3.5 h-3.5 text-blue-400" />
              Banking & Term Deposits
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bank Position & Liquidity
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Aggregated savings, salary, overdrafts, and fixed deposits across all institutions
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            {onExportPdfClick && (
              <button
                id="btn-bank-export-pdf"
                onClick={onExportPdfClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Export Bank Statements PDF"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Export PDF</span>
              </button>
            )}
            <button
              id="btn-bank-transfer"
              onClick={onNewTransferClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowUpRight className="w-4 h-4" />
              Transfer Funds
            </button>
            <button
              id="btn-add-fd"
              onClick={onNewFDClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PiggyBank className="w-4 h-4" />
              + Add / Track FD
            </button>
            <button
              id="btn-add-account"
              onClick={onNewAccountClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Landmark className="w-4 h-4" />
              + Add Account
            </button>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Net Liquid Bank Balance */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Net Bank Balance</span>
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Landmark className="w-3.5 h-3.5 text-blue-400" />
              </div>
            </div>
            <MoneyDisplay
              amount={bankPosition?.netBankBalance ?? 0}
              size="lg"
              className={(bankPosition?.netBankBalance ?? 0) < 0 ? 'text-rose-400' : 'text-white'}
            />
            <div className="text-[11px] text-slate-400">
              {bankPosition?.activeAccountCount ?? 0} active account{(bankPosition?.activeAccountCount ?? 0) === 1 ? '' : 's'}
            </div>
          </div>

          {/* Fixed Deposits */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Fixed Deposits</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <MoneyDisplay
              amount={bankPosition?.totalFDBalance ?? 0}
              size="lg"
              className="text-emerald-400"
            />
            <div className="text-[11px] text-emerald-300/80 flex items-center gap-1">
              <span>{bankPosition?.activeFDCount ?? 0} deposit{(bankPosition?.activeFDCount ?? 0) === 1 ? '' : 's'}</span>
              <span>• Avg {(bankPosition?.weightedAvgFDRate ?? 0).toFixed(2)}% p.a.</span>
            </div>
          </div>

          {/* Overdraft Liability */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Overdrafts (Dues)</span>
              <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              </div>
            </div>
            <MoneyDisplay
              amount={bankPosition?.totalOverdraftLiabilities ?? 0}
              size="lg"
              className={(bankPosition?.totalOverdraftLiabilities ?? 0) > 0 ? 'text-rose-400' : 'text-slate-400'}
            />
            <div className="text-[11px] text-slate-400">
              {(bankPosition?.totalOverdraftLiabilities ?? 0) > 0 ? 'Treated as Liability' : 'No active overdraft'}
            </div>
          </div>

          {/* Total Bank Net Position */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 to-indigo-950/40 border border-blue-800/40 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-300 uppercase tracking-wide">Total Bank Position</span>
              <div className="w-6 h-6 rounded-lg bg-blue-400/20 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              </div>
            </div>
            <MoneyDisplay
              amount={bankPosition?.totalBankNetPosition ?? 0}
              size="lg"
              className="text-blue-300 font-bold"
            />
            <div className="text-[11px] text-blue-400/80">
              Contributes to Net Worth
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
