import React from 'react';
import {
  X,
  Calendar,
  Landmark,
  Square,
  Play,
  Edit3,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import { SIPRecord, SIPSafetyEvaluation } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { formatRupee } from '../../utils/formatters';
import { formatDeductionDay } from '../../utils/sipDateUtils';
import { cn } from '../../utils/cn';

interface SIPDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sip: SIPRecord | null;
  safetyEval?: SIPSafetyEvaluation | null;
  onEdit: (sip: SIPRecord) => void;
  onToggleStatus: (sip: SIPRecord) => void;
  onDelete: (sip: SIPRecord) => void;
  onTransferFunds?: (bankId?: string) => void;
}

export const SIPDetailModal: React.FC<SIPDetailModalProps> = ({
  isOpen,
  onClose,
  sip,
  safetyEval,
  onEdit,
  onToggleStatus,
  onDelete,
  onTransferFunds,
}) => {
  if (!isOpen || !sip) return null;

  const isActive = sip.sipStatus === 'active';
  const isShortfall = safetyEval?.safetyStatus === 'CRITICAL_INSUFFICIENT';
  const isAtRisk = safetyEval?.safetyStatus === 'AT_RISK';
  const installmentAmount = Number(sip.amount || 0);
  const bankBalance = safetyEval?.bankCurrentBalance ?? safetyEval?.availableBalance;

  const calculatedShortfall =
    safetyEval?.shortfall && safetyEval.shortfall > 0
      ? safetyEval.shortfall
      : bankBalance !== undefined
      ? Math.max(0, installmentAmount - bankBalance)
      : 0;

  const remainingBuffer =
    bankBalance !== undefined ? Math.max(0, bankBalance - installmentAmount) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="sip-detail-modal"
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0d1c33] to-[#0d1629] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white font-heading truncate">
                {sip.fundName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className={cn('font-bold font-mono', isActive ? 'text-emerald-400' : 'text-slate-400')}>
                  {isActive ? '● Active Mandate' : '○ Paused Mandate'}
                </span>
                <span>•</span>
                <span className="capitalize">{sip.frequency || 'Monthly'}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Main Installment Amount Card */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">SIP Installment</span>
              <MoneyDisplay amount={sip.amount} size="xl" className="font-extrabold text-white mt-0.5" />
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Deduction Day</span>
              <span className="text-sm font-bold text-cyan-300 font-mono">
                {formatDeductionDay(sip.deductionDay)}
              </span>
            </div>
          </div>

          {/* 4-Tier Payment Risk Flag Card */}
          <div
            className={cn(
              'p-4 rounded-2xl border space-y-3',
              !isActive
                ? 'bg-slate-950/60 border-slate-800'
                : isShortfall
                ? 'bg-rose-950/40 border-rose-600/50'
                : isAtRisk
                ? 'bg-amber-950/30 border-amber-600/40'
                : 'bg-emerald-950/30 border-emerald-600/40'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading">
                Payment Risk
              </span>
              {!isActive ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/80 font-mono">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  <span>⚪ Paused</span>
                </div>
              ) : isShortfall ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm font-mono animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  <span>🔴 Critical Shortfall</span>
                </div>
              ) : isAtRisk ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span>🟠 Low Buffer</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>🟢 Safe</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
              <div>
                <span className="text-[11px] text-slate-400 block">Next Deduction Date:</span>
                <span className="text-white font-bold">
                  {safetyEval?.nextDeductionFormatted || 'Calculating...'}
                </span>
                {safetyEval?.relativeDaysLabel && (
                  <span className="text-[10px] text-cyan-400 block">
                    ({safetyEval.relativeDaysLabel})
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Available Bank Balance:</span>
                <span className="text-white font-bold">
                  {bankBalance !== undefined ? formatRupee(bankBalance) : 'N/A'}
                </span>
                {isShortfall && calculatedShortfall > 0 && (
                  <span className="text-[10px] text-rose-400 font-bold block">
                    Deficit: -{formatRupee(calculatedShortfall)}
                  </span>
                )}
                {isAtRisk && (
                  <span className="text-[10px] text-amber-400 font-bold block">
                    Buffer: +{formatRupee(remainingBuffer)}
                  </span>
                )}
              </div>
            </div>

            {/* Top Up / Transfer Funds Button */}
            {(isShortfall || isAtRisk) && onTransferFunds && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTransferFunds(safetyEval?.bankAccountId || sip.bankAccountId);
                }}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer min-h-[36px] font-heading mt-2',
                  isShortfall
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/40'
                    : 'bg-amber-600/90 hover:bg-amber-500 text-white shadow-amber-950/30'
                )}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>
                  {isShortfall
                    ? `Transfer Money to ${safetyEval?.bankDisplayName || sip.bankName || 'Bank'}`
                    : `Top Up Buffer (${safetyEval?.bankDisplayName || sip.bankName || 'Bank'})`}
                </span>
              </button>
            )}
          </div>

          {/* Linked Bank Details */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
              Deduction Bank Account
            </span>
            <div className="flex items-center gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-800 text-blue-400 border border-slate-700">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {safetyEval?.bankDisplayName || sip.bankName || 'No bank assigned'}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {safetyEval?.bankAccountNumberMasked || sip.accountNumberMasked || 'No account number'}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Grid: Broker, Folio, Category, Notes */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Asset Category:</span>
              <span className="text-slate-200">{sip.category || 'Equity Mutual Fund'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Platform / Broker:</span>
              <span className="text-slate-200">{sip.platform || 'Groww'}</span>
            </div>
            {sip.folioNumber && (
              <div className="flex justify-between text-slate-400">
                <span>Folio Number:</span>
                <span className="text-cyan-300 font-bold">{sip.folioNumber}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Mandate Created:</span>
              <span className="text-slate-300">{new Date(sip.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            {sip.notes && (
              <div className="pt-2 border-t border-slate-800/80 text-slate-300 italic">
                "{sip.notes}"
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(sip);
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onToggleStatus(sip);
                onClose();
              }}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                isActive
                  ? 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              )}
            >
              {isActive ? (
                <>
                  <Square className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause SIP</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-white fill-current" />
                  <span>Start SIP</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(sip);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-900/30 transition-all cursor-pointer font-heading flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit SIP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
