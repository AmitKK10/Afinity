import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Landmark,
  Play,
  Pause,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  Eye,
  ArrowRightLeft,
} from 'lucide-react';
import { SIPRecord, SIPSafetyEvaluation, BankAccount } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { formatRupee } from '../../utils/formatters';
import { formatDeductionDay } from '../../utils/sipDateUtils';
import { cn } from '../../utils/cn';

interface SIPCardProps {
  sip: SIPRecord;
  safetyEval?: SIPSafetyEvaluation;
  bankAccounts?: BankAccount[];
  onEdit: (sip: SIPRecord) => void;
  onToggleStatus: (sip: SIPRecord) => void;
  onDelete: (sip: SIPRecord) => void;
  onViewDetails?: (sip: SIPRecord) => void;
  onTransferFunds?: (bankId?: string) => void;
  className?: string;
}

export const SIPCard: React.FC<SIPCardProps> = ({
  sip,
  safetyEval,
  bankAccounts,
  onEdit,
  onToggleStatus,
  onDelete,
  onViewDetails,
  onTransferFunds,
  className,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isActive = sip.sipStatus === 'active';
  const isStopped = !isActive;

  // Resolve Bank Account information
  const linkedBank = useMemo(() => {
    if (!bankAccounts || bankAccounts.length === 0) return null;
    if (sip.bankAccountId) {
      const found = bankAccounts.find(
        (b) => b.id === sip.bankAccountId || (b.bankId && b.bankId === sip.bankAccountId)
      );
      if (found) return found;
    }
    if (sip.bankName) {
      const bName = sip.bankName.toLowerCase();
      const found = bankAccounts.find(
        (b) =>
          (b.institutionName && b.institutionName.toLowerCase() === bName) ||
          (b.bankName && b.bankName.toLowerCase() === bName) ||
          (b.displayName && b.displayName.toLowerCase() === bName)
      );
      if (found) return found;
    }
    return null;
  }, [bankAccounts, sip.bankAccountId, sip.bankName]);

  const bankName =
    safetyEval?.bankDisplayName ||
    safetyEval?.bankName ||
    linkedBank?.institutionName ||
    linkedBank?.displayName ||
    linkedBank?.bankName ||
    linkedBank?.name ||
    sip.bankName ||
    '';

  const maskedAccount =
    safetyEval?.bankAccountNumberMasked ||
    safetyEval?.accountNumberMasked ||
    linkedBank?.accountNumberMasked ||
    (linkedBank?.last4 ? `•••• ${linkedBank.last4}` : '') ||
    sip.accountNumberMasked ||
    '';

  const bankCurrentBalance =
    safetyEval?.bankCurrentBalance !== undefined
      ? safetyEval.bankCurrentBalance
      : safetyEval?.availableBalance !== undefined
      ? safetyEval.availableBalance
      : linkedBank?.balance !== undefined
      ? Number(linkedBank.balance)
      : undefined;

  const installmentAmount = Number(sip.amount || 0);
  const isNoBank = !bankName && !linkedBank;
  
  // 4-Tier Risk Categorization
  const hasShortfall =
    !isStopped &&
    bankCurrentBalance !== undefined &&
    bankCurrentBalance < installmentAmount &&
    !isNoBank;

  const isAtRisk =
    !isStopped &&
    !hasShortfall &&
    !isNoBank &&
    (safetyEval?.safetyStatus === 'AT_RISK' ||
      (bankCurrentBalance !== undefined && bankCurrentBalance < installmentAmount * 1.2));

  const isSafe = !isStopped && !hasShortfall && !isAtRisk && !isNoBank;

  const calculatedShortfall =
    safetyEval?.shortfall && safetyEval.shortfall > 0
      ? safetyEval.shortfall
      : bankCurrentBalance !== undefined
      ? Math.max(0, installmentAmount - bankCurrentBalance)
      : 0;

  const remainingBuffer =
    bankCurrentBalance !== undefined ? Math.max(0, bankCurrentBalance - installmentAmount) : 0;

  const daysUntil = safetyEval?.daysUntil ?? safetyEval?.daysUntilDeduction;
  const nextDeductionFormatted =
    safetyEval?.nextDeductionFormatted ||
    safetyEval?.nextDeductionDate ||
    `Day ${sip.deductionDay} of month`;

  const countdownLabel =
    safetyEval?.relativeDaysLabel ||
    safetyEval?.relativeDateLabel ||
    (daysUntil !== undefined
      ? daysUntil === 0
        ? 'Due Today'
        : daysUntil === 1
        ? 'Due Tomorrow'
        : `In ${daysUntil} days`
      : `Every month`);

  const targetBankIdForTransfer = sip.bankAccountId || linkedBank?.id;

  // 4-Tier Payment Risk Flag Badge
  const renderPaymentRiskFlag = () => {
    if (isStopped) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/80 font-mono">
          <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
          <span>⚪ Paused</span>
        </div>
      );
    }

    if (isNoBank) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
          <span>🟡 No Bank Linked</span>
        </div>
      );
    }

    if (hasShortfall || safetyEval?.safetyStatus === 'CRITICAL_INSUFFICIENT') {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-950/40 font-mono animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          <span className="truncate">
            🔴 Critical Shortfall{calculatedShortfall > 0 ? ` (-${formatRupee(calculatedShortfall)})` : ''}
          </span>
        </div>
      );
    }

    if (isAtRisk || safetyEval?.safetyStatus === 'AT_RISK') {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span>
            🟠 Low Buffer (+{formatRupee(remainingBuffer)} left)
          </span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        <span>🟢 Safe</span>
      </div>
    );
  };

  return (
    <div
      id={`sip-card-${sip.id}`}
      className={cn(
        'relative rounded-2xl p-5 border transition-all duration-200 shadow-md flex flex-col justify-between',
        isStopped
          ? 'bg-slate-900/40 border-slate-800/80 opacity-80 hover:opacity-100'
          : hasShortfall
          ? 'bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-950 border-rose-600/50 shadow-rose-950/30 ring-1 ring-rose-500/20'
          : isAtRisk || isNoBank
          ? 'bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950 border-amber-600/40'
          : 'bg-gradient-to-br from-[#0f172a] via-[#0d1629] to-[#0a0f1d] border-slate-700/60 hover:border-slate-600',
        className
      )}
    >
      <div className="space-y-3.5">
        {/* Top Header: Fund Info & 3-Dot Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight font-heading truncate">
                {sip.fundName}
              </h3>
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  Paused
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {sip.category && <span>{sip.category}</span>}
              {sip.platform && (
                <>
                  <span>•</span>
                  <span className="text-slate-300 font-medium">{sip.platform}</span>
                </>
              )}
              {sip.folioNumber && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-400">Folio: {sip.folioNumber}</span>
                </>
              )}
            </div>
          </div>

          {/* Action Menu button */}
          <div className="relative shrink-0">
            <button
              type="button"
              id={`btn-sip-menu-${sip.id}`}
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="More Actions"
              aria-label="More Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-9 z-30 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 text-xs divide-y divide-slate-800">
                  <div className="py-1">
                    <button
                      type="button"
                      id={`btn-edit-sip-${sip.id}`}
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(sip);
                      }}
                      className="w-full px-3.5 py-2 text-left text-white hover:bg-blue-600 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Edit Parameters</span>
                    </button>

                    <button
                      type="button"
                      id={`btn-toggle-sip-${sip.id}`}
                      onClick={() => {
                        setShowMenu(false);
                        onToggleStatus(sip);
                      }}
                      className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pause SIP</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Resume SIP</span>
                        </>
                      )}
                    </button>

                    {onViewDetails && (
                      <button
                        type="button"
                        id={`btn-view-sip-${sip.id}`}
                        onClick={() => {
                          setShowMenu(false);
                          onViewDetails(sip);
                        }}
                        className="w-full px-3.5 py-2 text-left text-cyan-300 hover:bg-cyan-950/40 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Details</span>
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      id={`btn-delete-sip-${sip.id}`}
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(sip);
                      }}
                      className="w-full px-3.5 py-2 text-left text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete Mandate</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2-Column Details: Installment Amount + Next Deduction */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          {/* Installment Amount & Frequency */}
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
              Installment Amount
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <MoneyDisplay amount={sip.amount} size="lg" className="font-extrabold text-white" />
              <span className="text-xs text-slate-400 font-medium capitalize">
                / {sip.frequency || 'month'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
              <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{formatDeductionDay(sip.deductionDay)}</span>
            </span>
          </div>

          {/* Next Deduction Date + Countdown */}
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
              Next Deduction Date
            </span>
            <div className="text-sm font-bold text-slate-100 mt-0.5 font-mono">
              {nextDeductionFormatted}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-md font-mono',
                  daysUntil !== undefined && daysUntil <= 3
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : daysUntil !== undefined && daysUntil <= 7
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                )}
              >
                {countdownLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Bank Account & Bank Current Balance */}
        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            {/* Bank Name & Account Number */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                <Landmark className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-slate-200 font-semibold truncate block">
                  {bankName || 'No Bank Linked'}
                </span>
                {maskedAccount && (
                  <span className="text-[11px] text-slate-500 font-mono block">
                    {maskedAccount}
                  </span>
                )}
              </div>
            </div>

            {/* Current Bank Balance */}
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                Bank Balance
              </span>
              {bankCurrentBalance !== undefined ? (
                <span
                  className={cn(
                    'text-xs font-bold font-mono',
                    bankCurrentBalance < installmentAmount
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  )}
                >
                  {formatRupee(bankCurrentBalance)}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-mono">Not synced</span>
              )}
            </div>
          </div>
        </div>

        {/* Payment Risk Flag Badge */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-slate-400 font-medium">Payment Risk:</span>
          {renderPaymentRiskFlag()}
        </div>

        {/* Critical Shortfall or Low Buffer Alert Box & Top Up Action */}
        {(hasShortfall || isAtRisk) && (
          <div
            className={cn(
              'p-3 rounded-xl border space-y-2',
              hasShortfall
                ? 'bg-rose-950/40 border-rose-600/50'
                : 'bg-amber-950/30 border-amber-600/40'
            )}
          >
            <div className="flex items-start gap-2">
              {hasShortfall ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs min-w-0 flex-1">
                <div className={cn('font-bold', hasShortfall ? 'text-rose-300' : 'text-amber-300')}>
                  {hasShortfall
                    ? `Deficit of ${formatRupee(calculatedShortfall)} on ${nextDeductionFormatted}`
                    : `Low buffer (+${formatRupee(remainingBuffer)} remaining) for ${nextDeductionFormatted}`}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Linked Bank: <span className="text-slate-200 font-medium">{bankName || 'Account'}</span>
                </div>
              </div>
            </div>

            {onTransferFunds && (
              <button
                type="button"
                onClick={() => onTransferFunds(targetBankIdForTransfer)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer min-h-[36px] font-heading',
                  hasShortfall
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/40'
                    : 'bg-amber-600/90 hover:bg-amber-500 text-white shadow-amber-950/30'
                )}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>
                  {hasShortfall
                    ? `Transfer Money to ${bankName || 'Bank'}`
                    : `Top Up Buffer (${bankName || 'Bank'})`}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Action Buttons: Edit and Pause/Resume */}
      <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800/80">
        {/* Pause / Resume Button */}
        <button
          type="button"
          id={`btn-card-toggle-${sip.id}`}
          onClick={() => onToggleStatus(sip)}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer min-h-[36px]',
            isActive
              ? 'bg-slate-800/90 hover:bg-slate-700/90 text-amber-300 hover:text-amber-200 border border-slate-700/80'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/30'
          )}
          title={isActive ? 'Pause SIP mandate' : 'Resume SIP mandate'}
          aria-label={isActive ? 'Pause SIP mandate' : 'Resume SIP mandate'}
        >
          {isActive ? (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Pause SIP</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-white fill-current" />
              <span>Resume SIP</span>
            </>
          )}
        </button>

        {/* Edit Button */}
        <button
          type="button"
          id={`btn-card-edit-${sip.id}`}
          onClick={() => onEdit(sip)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500/50 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer min-h-[36px]"
          title="Edit SIP parameters"
          aria-label="Edit SIP parameters"
        >
          <Pencil className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Edit</span>
        </button>
      </div>

      {/* Optional Notes */}
      {sip.notes && (
        <div className="mt-2.5 pt-2 text-[11px] text-slate-400 italic bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-900">
          "{sip.notes}"
        </div>
      )}
    </div>
  );
};
