import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Landmark,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { SIPSafetyReport } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { formatRupee } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface SIPSafetyAlertBannerProps {
  report: SIPSafetyReport | null;
  onRefresh?: () => void;
  onNavigateToTransfer?: (bankId?: string) => void;
  onNavigateToSIPs?: () => void;
  className?: string;
}

export const SIPSafetyAlertBanner: React.FC<SIPSafetyAlertBannerProps> = ({
  report,
  onRefresh,
  onNavigateToTransfer,
  onNavigateToSIPs,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!report || isDismissed) return null;

  const hasInsufficient = report.insufficientBankAccounts.length > 0;
  const hasAtRisk = report.atRiskSIPsCount > 0;

  // If everything is completely safe, no persistent banner is needed (or we show a subtle clean indicator)
  if (!hasInsufficient && !hasAtRisk) {
    return null;
  }

  const isCritical = hasInsufficient;

  return (
    <div
      id="sip-safety-alert-banner"
      className={cn(
        'rounded-2xl p-4 sm:p-5 border transition-all shadow-lg',
        isCritical
          ? 'bg-gradient-to-r from-rose-950/80 via-[#1c0d16] to-rose-950/80 border-rose-600/60 shadow-rose-950/30'
          : 'bg-gradient-to-r from-amber-950/80 via-[#1e1507] to-amber-950/80 border-amber-600/60 shadow-amber-950/30',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'p-2.5 rounded-xl border shrink-0',
              isCritical
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            )}
          >
            {isCritical ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold text-white font-heading">
                {isCritical
                  ? `Insufficient Balance for Upcoming SIPs (Deficit: ${formatRupee(report.totalShortfall)})`
                  : `${report.atRiskSIPsCount} Upcoming SIP(s) Require Balance Attention`}
              </h4>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide font-mono',
                  isCritical ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                )}
              >
                {isCritical ? 'Action Required' : 'Payment Alert'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isCritical
                ? `${report.insufficientBankAccounts.length} bank account(s) have upcoming SIP deductions within 30 days that exceed available funds. Add funds or transfer money to prevent auto-debit bounce fees.`
                : `Total required for next 7 days: ${formatRupee(report.requiredInNext7Days)}. Check your account balances to ensure smooth execution.`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onRefresh && (
            <button
              type="button"
              id="btn-refresh-sip-safety"
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Re-check Balances & Safety"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Hide' : 'Details'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss alert for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Breakdown per Bank Account */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading block">
            Affected Accounts & Shortfall Analysis
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.insufficientBankAccounts.map((item) => (
              <div
                key={item.bankAccountId}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-900/40 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Landmark className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {item.bankDisplayName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                    Shortfall: {formatRupee(item.shortfall)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-900/80 p-2 rounded-lg font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Available</span>
                    <span className="text-slate-300 font-bold">{formatRupee(item.availableBalance)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Due (30d)</span>
                    <span className="text-amber-400 font-bold">{formatRupee(item.totalCommitted)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Deficit</span>
                    <span className="text-rose-400 font-bold">-{formatRupee(item.shortfall)}</span>
                  </div>
                </div>

                {item.sipsDue.length > 0 && (
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Due SIPs:</span>
                    {item.sipsDue.map((s) => (
                      <div key={s.sipId} className="flex justify-between text-xs">
                        <span className="text-slate-300 truncate max-w-[180px]">{s.fundName}</span>
                        <span className="text-slate-400 font-mono">
                          {formatRupee(s.amount)} on {s.nextDeductionDate.split('-').slice(1).join('/')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {onNavigateToTransfer && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTransfer(item.bankAccountId)}
                    className="w-full py-1.5 px-3 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600/40 text-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Fund Account via Transfer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-400">
              Tip: Transfer funds from other high-balance savings accounts or cancel non-essential SIPs to avoid auto-debit failure fees.
            </span>
            {onNavigateToSIPs && (
              <button
                type="button"
                onClick={onNavigateToSIPs}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
              >
                View all SIP commitments →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
