import React, { useMemo } from 'react';
import {
  Calendar,
  Clock,
  Landmark,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Play,
  Pause,
  Plus,
  ArrowRightLeft,
} from 'lucide-react';
import { SIPSafetyEvaluation } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { formatRupee } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface UpcomingSIPTimelineProps {
  evaluations: SIPSafetyEvaluation[];
  onEditSIP: (sipId: string) => void;
  onToggleSIPStatus: (sipId: string) => void;
  onAddSIP?: () => void;
  onTransferFunds?: (bankId?: string) => void;
}

export const UpcomingSIPTimeline: React.FC<UpcomingSIPTimelineProps> = ({
  evaluations,
  onEditSIP,
  onToggleSIPStatus,
  onAddSIP,
  onTransferFunds,
}) => {
  // Sort evaluations chronologically by next deduction date
  const sortedEvals = useMemo(() => {
    return [...evaluations].sort((a, b) => {
      if (a.isStopped && !b.isStopped) return 1;
      if (!a.isStopped && b.isStopped) return -1;
      return (a.nextDeductionDate || '').localeCompare(b.nextDeductionDate || '');
    });
  }, [evaluations]);

  // Group by Near-term: Next 7 days, Rest of Month, Next Month
  const groupedTimeline = useMemo(() => {
    const groups: {
      title: string;
      subtitle: string;
      items: SIPSafetyEvaluation[];
      totalAmount: number;
    }[] = [];

    const getDays = (e: SIPSafetyEvaluation) => e.daysUntil ?? e.daysUntilDeduction ?? 99;
    const getAmt = (e: SIPSafetyEvaluation) =>
      e.amount ?? e.requiredAmount ?? Number(e.sip?.amount || 0);

    const immediate = sortedEvals.filter((e) => !e.isStopped && getDays(e) <= 7);
    const thisMonth = sortedEvals.filter((e) => !e.isStopped && getDays(e) > 7 && getDays(e) <= 30);
    const laterOrStopped = sortedEvals.filter((e) => e.isStopped || getDays(e) > 30);

    if (immediate.length > 0) {
      groups.push({
        title: 'Upcoming in Next 7 Days (Immediate Action)',
        subtitle: 'Ensure sufficient liquid balance in deduction bank accounts',
        items: immediate,
        totalAmount: immediate.reduce((sum, i) => sum + getAmt(i), 0),
      });
    }

    if (thisMonth.length > 0) {
      groups.push({
        title: 'Scheduled Next (8 to 30 Days)',
        subtitle: 'Scheduled upcoming auto-debit mandates',
        items: thisMonth,
        totalAmount: thisMonth.reduce((sum, i) => sum + getAmt(i), 0),
      });
    }

    if (laterOrStopped.length > 0) {
      groups.push({
        title: 'Future & Paused Mandates',
        subtitle: 'Mandates scheduled beyond 30 days or paused',
        items: laterOrStopped,
        totalAmount: laterOrStopped.reduce((sum, i) => sum + (i.isStopped ? 0 : getAmt(i)), 0),
      });
    }

    return groups;
  }, [sortedEvals]);

  if (evaluations.length === 0) {
    return (
      <div className="p-10 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
        <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
        <div className="text-base font-bold text-slate-300 font-heading">
          No upcoming SIP payments
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Add an SIP mandate to see auto-scheduled payment timelines with bank balance verification.
        </p>
        {onAddSIP && (
          <button
            type="button"
            onClick={onAddSIP}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer font-heading min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add SIP</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div id="upcoming-sip-timeline" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 font-heading">
            Chronological Upcoming SIP Payments
          </h3>
          <p className="text-xs text-slate-400">
            Next scheduled auto-debits with live bank balance safety check
          </p>
        </div>
        {onAddSIP && (
          <button
            type="button"
            onClick={onAddSIP}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer font-heading min-h-[36px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add SIP</span>
          </button>
        )}
      </div>

      {groupedTimeline.map((group, gIdx) => (
        <div key={gIdx} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 font-heading">
                {group.title}
              </h4>
              <p className="text-[11px] text-slate-500">{group.subtitle}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">
                Group Total
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {formatRupee(group.totalAmount)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {group.items.map((item) => {
              const isStopped = Boolean(item.isStopped || item.safetyStatus === 'STOPPED');
              const isNoBank = Boolean(
                item.safetyStatus === 'NO_BANK_LINKED' ||
                  item.status === 'NO_BANK_LINKED' ||
                  (!item.bankAccount && !item.bankName && !item.bankDisplayName)
              );
              const amount = item.amount ?? item.requiredAmount ?? Number(item.sip?.amount || 0);
              const balance = item.availableBalance ?? item.bankCurrentBalance ?? 0;
              const hasExplicitShortfall = (item.shortfall ?? 0) > 0;

              // Accurate shortfall determination:
              const isShortfall =
                !isStopped &&
                (item.safetyStatus === 'CRITICAL_INSUFFICIENT' ||
                  item.status === 'INSUFFICIENT' ||
                  item.isInsufficient ||
                  hasExplicitShortfall ||
                  (balance < amount && !isNoBank));

              const isAtRisk =
                !isStopped &&
                !isShortfall &&
                !isNoBank &&
                (item.safetyStatus === 'AT_RISK' || balance < amount * 1.2);

              const calculatedShortfall =
                item.shortfall && item.shortfall > 0
                  ? item.shortfall
                  : Math.max(0, amount - balance);

              const daysUntil = item.daysUntil ?? item.daysUntilDeduction ?? 99;

              return (
                <div
                  key={item.sipId}
                  className={cn(
                    'p-4 sm:p-5 rounded-2xl border transition-all space-y-3 shadow-md',
                    isStopped
                      ? 'bg-slate-900/50 border-slate-800/80 opacity-75'
                      : isShortfall
                      ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/50 shadow-rose-950/20'
                      : isNoBank || isAtRisk
                      ? 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700/80'
                  )}
                >
                  {/* Card Eyebrow */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-bold uppercase tracking-wider font-mono text-[10px] sm:text-[11px]">
                      UPCOMING SIP
                    </span>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px]',
                        daysUntil <= 3
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : daysUntil <= 7
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800/90 text-slate-300 border border-slate-700/60'
                      )}
                    >
                      {item.relativeDaysLabel || item.relativeDateLabel}
                    </span>
                  </div>

                  {/* Fund Name & Amount */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-bold text-white leading-snug truncate font-heading">
                        {item.fundName || item.sip?.fundName}
                      </h4>
                      <div className="text-xs text-slate-400 font-mono mt-1">
                        {item.nextDeductionFormatted || item.nextDeductionDate}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <MoneyDisplay
                        amount={amount}
                        size="lg"
                        className="font-extrabold text-white"
                      />
                    </div>
                  </div>

                  {/* Deduction Bank & Account */}
                  <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <Landmark className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-slate-300 font-medium truncate">
                        {item.bankDisplayName ||
                          item.bankName ||
                          item.accountDisplayName ||
                          'Bank Account'}
                      </span>
                      {(item.bankAccountNumberMasked || item.accountNumberMasked) && (
                        <span className="text-slate-500 font-mono text-[11px] shrink-0">
                          {item.bankAccountNumberMasked || item.accountNumberMasked}
                        </span>
                      )}
                    </div>

                    {!isNoBank && (
                      <span className="text-slate-400 font-mono text-[11px] shrink-0">
                        Bal: {formatRupee(balance)}
                      </span>
                    )}
                  </div>

                  {/* Balance Safety Status & Action Controls */}
                  <div className="space-y-2 pt-1 border-t border-slate-800/40">
                    <div className="flex items-center justify-between gap-2">
                      {/* 4-Tier Payment Risk Flag */}
                      <div className="min-w-0 flex-1">
                        {isStopped ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/80 font-mono">
                            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                            <span>⚪ Paused</span>
                          </div>
                        ) : isNoBank ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                            <span>🟡 No Bank Linked</span>
                          </div>
                        ) : isShortfall ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-950/40 font-mono animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                            <span className="truncate">
                              🔴 Critical Shortfall (-{formatRupee(calculatedShortfall)})
                            </span>
                          </div>
                        ) : isAtRisk ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                            <span>
                              🟠 Low Buffer (+{formatRupee(Math.max(0, balance - amount))} left)
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                            <span>🟢 Safe</span>
                          </div>
                        )}
                      </div>

                      {/* Actions: Pause/Resume + Edit */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleSIPStatus(item.sipId)}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[34px]',
                            isStopped
                              ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-amber-300 border border-slate-700/60'
                          )}
                          title={isStopped ? 'Resume SIP mandate' : 'Pause SIP mandate'}
                          aria-label={isStopped ? 'Resume SIP mandate' : 'Pause SIP mandate'}
                        >
                          {isStopped ? (
                            <>
                              <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                              <span className="hidden xs:inline sm:inline">Resume</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3 h-3 text-slate-400" />
                              <span className="hidden xs:inline sm:inline">Pause</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditSIP(item.sipId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500/50 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer min-h-[34px]"
                          title="Edit SIP parameters"
                          aria-label="Edit SIP parameters"
                        >
                          <Pencil className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>

                    {/* Top Up Action Button for Critical Shortfall or Low Buffer */}
                    {(isShortfall || isAtRisk) && onTransferFunds && (
                      <button
                        type="button"
                        onClick={() => onTransferFunds(item.bankAccountId || item.bankAccount?.id)}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer min-h-[34px] font-heading',
                          isShortfall
                            ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/40'
                            : 'bg-amber-600/90 hover:bg-amber-500 text-white shadow-amber-950/30'
                        )}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>
                          {isShortfall
                            ? `Transfer Money to ${item.bankDisplayName || item.bankName || 'Bank'}`
                            : `Top Up Safety Buffer (${item.bankDisplayName || item.bankName || 'Bank'})`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

