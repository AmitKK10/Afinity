import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Landmark,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { SIPSafetyReport, BankAccount, SIPRecord } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { Badge } from '../ui/Badge';
import { formatRupee } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { UpcomingPaymentRisksSection } from './UpcomingPaymentRisksSection';

interface PaymentSafetySectionProps {
  sips: SIPRecord[];
  safetyReport: SIPSafetyReport | null;
  bankAccounts: BankAccount[];
  onRefreshSafety: () => void;
  onTransferFunds?: (bankId?: string) => void;
  onEditSIP?: (sip: SIPRecord) => void;
}

export const PaymentSafetySection: React.FC<PaymentSafetySectionProps> = ({
  sips,
  safetyReport,
  bankAccounts,
  onRefreshSafety,
  onTransferFunds,
  onEditSIP,
}) => {
  const activeSIPs = sips.filter((s) => s.sipStatus === 'active');

  // Next SIP Payment calculation (earliest upcoming active SIP)
  const evalList = safetyReport?.sipEvaluations || safetyReport?.evaluations || [];
  const nextSIPEval = evalList
    .filter((e) => !e.isStopped)
    .sort((a, b) => (a.nextDeductionDate || '').localeCompare(b.nextDeductionDate || ''))[0];

  const totalMonthlyCommitment = activeSIPs.reduce((sum, s) => {
    if (s.frequency === 'quarterly') return sum + s.amount / 3;
    if (s.frequency === 'weekly') return sum + s.amount * 4.33;
    return sum + s.amount;
  }, 0);

  return (
    <div id="payment-safety-section" className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP SAFETY METRIC BANNER */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#0c1f36] via-[#0d1629] to-[#070b16] border border-blue-500/40 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Payment Safety & Liquidity Verification
              </h2>
              <p className="text-xs text-slate-400">
                Automated multi-mandate deficit protection & bank balance pre-checks
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-refresh-payment-safety"
            onClick={onRefreshSafety}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer font-heading min-h-[38px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Balances</span>
          </button>
        </div>

        {/* 5 Required Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {/* TOTAL ACTIVE SIPs */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              TOTAL ACTIVE SIPs
            </span>
            <div className="text-xl font-extrabold text-white mt-1 font-mono">
              {activeSIPs.length}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {sips.length - activeSIPs.length} paused
            </span>
          </div>

          {/* MONTHLY SIP COMMITMENT */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              MONTHLY COMMITMENT
            </span>
            <MoneyDisplay
              amount={totalMonthlyCommitment}
              size="lg"
              className="font-extrabold text-white mt-1"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Cumulative monthly</span>
          </div>

          {/* NEXT SIP PAYMENT */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              NEXT SIP PAYMENT
            </span>
            {nextSIPEval ? (
              <>
                <MoneyDisplay
                  amount={nextSIPEval.amount}
                  size="lg"
                  className="font-extrabold text-cyan-300 mt-1"
                />
                <span className="text-[10px] text-cyan-400 font-mono mt-0.5 block truncate">
                  {nextSIPEval.nextDeductionFormatted} ({nextSIPEval.relativeDaysLabel})
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-500 mt-2 block font-mono">No active SIP</span>
            )}
          </div>

          {/* TOTAL REQUIRED IN NEXT 7 DAYS */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              REQUIRED (NEXT 7 DAYS)
            </span>
            <MoneyDisplay
              amount={safetyReport?.requiredInNext7Days || 0}
              size="lg"
              className="font-extrabold text-amber-300 mt-1"
            />
            <span className="text-[10px] text-amber-400/80 mt-0.5 block">Immediate liquidity</span>
          </div>

          {/* TOTAL REQUIRED IN NEXT 30 DAYS */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              REQUIRED (NEXT 30 DAYS)
            </span>
            <MoneyDisplay
              amount={safetyReport?.requiredInNext30Days || 0}
              size="lg"
              className="font-extrabold text-slate-200 mt-1"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Full 30-day horizon</span>
          </div>
        </div>
      </div>

      {/* 2. UPCOMING PAYMENT RISKS SECTION */}
      <UpcomingPaymentRisksSection
        evaluations={evalList}
        sips={sips}
        bankAccounts={bankAccounts}
        onTransferFunds={onTransferFunds}
        onRefreshSafety={onRefreshSafety}
        onEditSIP={onEditSIP}
      />

      {/* 3. CRITICAL DEFICIT SHORTFALL ALERTS (If any bank account has insufficient balance) */}
      {safetyReport?.insufficientBankAccounts && safetyReport.insufficientBankAccounts.length > 0 && (
        <div className="space-y-3">
          {safetyReport.insufficientBankAccounts.map((be) => (
            <div
              key={be.bankAccountId}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-950 border border-rose-600/70 shadow-xl shadow-rose-950/40 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300">
                    <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-rose-200 tracking-wide font-heading">
                      ⚠️ SIP PAYMENT SHORTFALL
                    </h3>
                    <p className="text-xs text-rose-300">
                      Immediate action needed: Total upcoming SIPs exceed available bank balance.
                    </p>
                  </div>
                </div>

                {onTransferFunds && (
                  <button
                    type="button"
                    onClick={() => onTransferFunds(be.bankAccountId)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all active:scale-95 cursor-pointer font-heading"
                  >
                    Transfer Funds Now
                  </button>
                )}
              </div>

              {/* Exact Shortfall Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-rose-900/50 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Required</span>
                  <span className="text-sm font-bold text-white">
                    {formatRupee(be.totalCommittedNext30Days)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Available</span>
                  <span className="text-sm font-bold text-amber-300">
                    {formatRupee(be.availableBalance)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-300 uppercase font-bold block">Shortfall</span>
                  <span className="text-sm font-extrabold text-rose-400">
                    {formatRupee(be.shortfall)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Deduction Account</span>
                  <span className="text-xs font-semibold text-slate-200 block truncate">
                    {be.bankDisplayName} {be.accountNumberMasked}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. BANK-WISE LIQUIDITY BREAKDOWN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 font-heading">
            Bank-Wise Liquidity & SIP Allocation
          </h3>
          <span className="text-xs text-slate-500">
            Real-time balance comparison
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safetyReport?.bankEvaluations && safetyReport.bankEvaluations.length > 0 ? (
            safetyReport.bankEvaluations.map((be) => {
              const isInsufficient = be.isInsufficient;
              const remaining = be.availableBalance - be.totalCommittedNext30Days;

              return (
                <div
                  key={be.bankAccountId}
                  className={cn(
                    'rounded-2xl p-4 sm:p-5 border space-y-3.5 transition-all',
                    isInsufficient
                      ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-600/60 shadow-lg shadow-rose-950/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  )}
                >
                  {/* Bank Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'p-2.5 rounded-xl border shrink-0',
                          isInsufficient
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-slate-800 text-blue-400 border-slate-700'
                        )}
                      >
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate font-heading">
                          {be.bankDisplayName}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {be.accountNumberMasked}
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono',
                        isInsufficient
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      )}
                    >
                      {isInsufficient ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Shortfall</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>✓ Sufficient</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Required Liquidity Stats */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Available:</span>
                      <span className="text-white font-bold">{formatRupee(be.availableBalance)}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Upcoming SIPs:</span>
                      <span className="text-cyan-300 font-bold">{formatRupee(be.totalCommittedNext30Days)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="font-semibold text-slate-300">Remaining:</span>
                      <span
                        className={cn(
                          'font-extrabold',
                          isInsufficient ? 'text-rose-400' : 'text-emerald-400'
                        )}
                      >
                        {isInsufficient
                          ? `-${formatRupee(be.shortfall)}`
                          : formatRupee(remaining)}
                      </span>
                    </div>
                  </div>

                  {/* List of active SIPs linked to this bank */}
                  {(() => {
                    const bankName = be.bankDisplayName || be.bankName || be.accountDisplayName || 'Bank Account';
                    const sipsList = be.sipsDue || be.sips?.map((s) => ({ sipId: s.id, fundName: s.fundName, amount: s.amount })) || [];
                    return (
                      <>
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Linked Mandates ({sipsList.length}):
                          </span>
                          {sipsList.map((sip) => (
                            <div
                              key={sip.sipId}
                              className="flex items-center justify-between text-[11px] text-slate-300 p-1.5 rounded-lg bg-slate-950/40 border border-slate-900"
                            >
                              <span className="truncate max-w-[180px]">{sip.fundName}</span>
                              <span className="font-mono font-bold text-white">
                                {formatRupee(sip.amount)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action CTA if shortfall */}
                        {isInsufficient && onTransferFunds && (
                          <button
                            type="button"
                            onClick={() => onTransferFunds(be.bankAccountId)}
                            className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer font-heading"
                          >
                            Transfer Funds to {bankName}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No bank accounts linked to active SIPs yet. Create or edit an SIP to link your bank account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
