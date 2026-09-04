/**
 * CreditCardItem.tsx — Interactive Credit Card Dashboard Card (Step 6B)
 * Displays realistic visual card, explicit owner & manager breakdown,
 * utilization progress, refund credit handling, statement due dates, and action controls.
 */

import React, { useState } from 'react';
import {
  MoreVertical,
  Edit3,
  History,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Archive,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { CreditCard, CreditLimitGroup } from '../../types';
import { CreditCardVisual } from './CreditCardVisual';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { formatRupee } from '../../utils/formatters';
import {
  calculateCardAvailableCredit,
  calculateCardUtilization,
  calculateCardBillingCycle,
} from '../../services/calculations';

interface CreditCardItemProps {
  card: CreditCard;
  sharedGroup?: CreditLimitGroup;
  onPayCard?: (card: CreditCard) => void;
  onUpdateOutstanding: (card: CreditCard) => void;
  onEditCard: (card: CreditCard) => void;
  onViewHistory: (card: CreditCard) => void;
  onArchiveCard: (card: CreditCard) => void;
  onRestoreCard: (card: CreditCard) => void;
  onDeleteCard?: (card: CreditCard) => void;
  onManageGroup?: (card: CreditCard) => void;
}

export const CreditCardItem: React.FC<CreditCardItemProps> = ({
  card,
  sharedGroup,
  onPayCard,
  onUpdateOutstanding,
  onEditCard,
  onViewHistory,
  onArchiveCard,
  onRestoreCard,
  onDeleteCard,
  onManageGroup,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const outstanding = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
  const isCreditBalance = outstanding < 0;
  const isArchived = card.status === 'archived';

  // Use Step 6A centralized calculations
  const availableCredit = calculateCardAvailableCredit(card);
  const utilization = calculateCardUtilization(card);
  const billingCycle = calculateCardBillingCycle(card);

  // Format owner and managed by badges
  const ownerLabel = (card.owner || 'SELF').toUpperCase();
  const managedLabel = (card.managedBy || (ownerLabel === 'PARENT' ? 'ME' : 'ME')).toUpperCase();
  const iPay = card.iPayThisCard !== undefined ? card.iPayThisCard : managedLabel === 'ME' || managedLabel === 'SELF';

  // Determine due badge styling
  const getDueBadge = () => {
    if (billingCycle.cycleStatus === 'not_set') {
      return null;
    }
    if (billingCycle.isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
          <AlertCircle className="w-3 h-3" />
          Overdue by {Math.abs(billingCycle.daysUntilDue)}d
        </span>
      );
    }
    if (billingCycle.cycleStatus === 'due_soon') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
          <Clock className="w-3 h-3" />
          Due in {billingCycle.daysUntilDue} {billingCycle.daysUntilDue === 1 ? 'day' : 'days'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
        <Calendar className="w-3 h-3" />
        Due in {billingCycle.daysUntilDue} days
      </span>
    );
  };

  return (
    <div
      id={`credit-card-item-${card.id}`}
      className={`rounded-3xl p-4 sm:p-5 bg-slate-900/90 border transition-all duration-300 relative ${
        isArchived
          ? 'border-slate-800 opacity-70 bg-slate-950/60'
          : 'border-slate-800/80 hover:border-slate-700 hover:shadow-xl hover:shadow-cyan-950/20'
      }`}
    >
      {/* 1. Card Visual representation on top */}
      <div className="mb-4">
        <CreditCardVisual
          card={card}
          onClick={() => onUpdateOutstanding(card)}
          className="cursor-pointer"
        />
      </div>

      {/* 2. Top Info Row: Card Name, Owner & Managed By, Action Menu */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Owner badge */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                ownerLabel === 'SELF'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              Owner: {ownerLabel === 'SELF' ? 'Self' : ownerLabel === 'PARENT' ? 'Parent' : card.owner}
            </span>

            {/* Managed by badge */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                managedLabel === 'ME' || managedLabel === 'SELF'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-700/40 text-slate-300 border border-slate-700'
              }`}
            >
              Paid By: {iPay ? 'Me' : 'Parent'}
            </span>

            {/* Net Worth Impact info */}
            {card.includeInNetWorth === false && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                Excluded from Net Worth
              </span>
            )}
          </div>
        </div>

        {/* Action Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Card Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 text-xs text-slate-200 space-y-0.5 font-medium animate-in fade-in-50 zoom-in-95">
                {onPayCard && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onPayCard(card);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 cursor-pointer font-heading font-bold"
                  >
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span>Pay Card Bill</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onUpdateOutstanding(card);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2 cursor-pointer font-heading text-slate-200"
                >
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  <span>Update Outstanding</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEditCard(card);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2 cursor-pointer font-heading"
                >
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  <span>Edit Card Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onViewHistory(card);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2 cursor-pointer font-heading"
                >
                  <History className="w-4 h-4 text-amber-400" />
                  <span>View Balance History</span>
                </button>

                {onManageGroup && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onManageGroup(card);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2 cursor-pointer font-heading"
                  >
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>{sharedGroup ? 'Shared Limit Pool' : 'Assign Shared Pool'}</span>
                  </button>
                )}

                <div className="border-t border-slate-800 my-1" />

                {isArchived ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRestoreCard(card);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-emerald-400 flex items-center gap-2 cursor-pointer font-heading"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore Card</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onArchiveCard(card);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-amber-400 flex items-center gap-2 cursor-pointer font-heading"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive Card</span>
                  </button>
                )}

                {onDeleteCard && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDeleteCard(card);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-950/60 text-rose-400 flex items-center gap-2 cursor-pointer font-heading"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Shared Limit Group indicator */}
      {(sharedGroup || card.sharedLimitGroupName) && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center gap-1.5 truncate">
            <Layers className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
            <span className="truncate font-semibold">
              {sharedGroup?.name || card.sharedLimitGroupName}
            </span>
          </div>
          <span className="text-[10px] text-cyan-200/80 font-bold">
            Shared Pool
          </span>
        </div>
      )}

      {/* 3. Primary Financial Metrics: Outstanding vs Available */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-3">
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">
            {isCreditBalance ? 'Credit Balance (Refund)' : 'Current Outstanding'}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            {isCreditBalance ? (
              <span className="text-base font-extrabold text-emerald-400 tabular-nums">
                ₹{formatRupee(Math.abs(outstanding), { includeSymbol: false })} Credit
              </span>
            ) : (
              <span className="text-base font-extrabold text-rose-300 tabular-nums">
                {formatRupee(outstanding)}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-medium">
            Available Limit
          </span>
          <div className="text-base font-bold text-emerald-400 mt-0.5 tabular-nums">
            {formatRupee(availableCredit)}
          </div>
        </div>
      </div>

      {/* 4. Utilization Progress Bar */}
      <div className="space-y-1.5 mb-3">
        <ProgressBar
          value={Math.max(0, outstanding)}
          max={card.creditLimit}
          label="Credit Utilization"
          sublabel={`Limit: ${formatRupee(card.creditLimit)}`}
          showPercentage
          variant="dynamic"
          size="sm"
        />
      </div>

      {/* 5. Statement & Due Dates Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Statement:</span>
          <span className="text-slate-200 font-semibold">
            {card.statementDay || card.billingCycleDate ? `${card.statementDay || card.billingCycleDate}th` : 'Not set'}
          </span>
        </div>

        <div>
          {getDueBadge()}
        </div>
      </div>

      {/* 6. Quick Action Row */}
      {!isArchived && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-2">
          {onPayCard && (
            <button
              type="button"
              onClick={() => onPayCard(card)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-600/90 to-amber-600/90 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-[11px] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer font-heading transition-all"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Pay Bill</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onUpdateOutstanding(card)}
            className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer font-heading transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Update Dues</span>
          </button>
        </div>
      )}
    </div>
  );
};
