/**
 * SharedLimitGroupCard.tsx — Shared Credit Limit Pool Card (Step 6B)
 * Displays unified pool limits, combined dues, available limit, and member cards.
 */

import React from 'react';
import { Layers, ShieldCheck, CreditCard as CardIcon, Plus, Edit2 } from 'lucide-react';
import { CreditLimitGroup, CreditCard } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { formatRupee } from '../../utils/formatters';
import {
  calculateCreditLimitGroupOutstanding,
  calculateCreditLimitGroupAvailableCredit,
  calculateCreditLimitGroupUtilization,
} from '../../services/calculations';

interface SharedLimitGroupCardProps {
  group: CreditLimitGroup;
  memberCards: CreditCard[];
  onEditGroup: (group: CreditLimitGroup) => void;
  onCardClick?: (card: CreditCard) => void;
}

export const SharedLimitGroupCard: React.FC<SharedLimitGroupCardProps> = ({
  group,
  memberCards,
  onEditGroup,
  onCardClick,
}) => {
  const totalLimit = group.totalLimit || group.sharedLimit || 0;
  const combinedOutstanding = calculateCreditLimitGroupOutstanding(group, memberCards);
  const availableCredit = calculateCreditLimitGroupAvailableCredit(group, memberCards);
  const utilization = calculateCreditLimitGroupUtilization(group, memberCards);

  return (
    <div
      id={`shared-limit-group-${group.id}`}
      className="rounded-3xl p-5 bg-gradient-to-br from-slate-900/95 via-[#0d182b] to-slate-950/90 border border-cyan-500/30 shadow-xl space-y-4 text-white"
    >
      {/* Header: Group Name, Issuer, Edit Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-heading">
                {group.name}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                Shared Pool
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              Issuer: {group.issuer || group.bankName || 'Combined'} • {memberCards.length} Cards in Pool
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEditGroup(group)}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          title="Edit Shared Limit Pool"
        >
          <Edit2 className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* Metrics Row: Pool Limit, Combined Outstanding, Available Pool */}
      <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Merged Limit</span>
          <span className="text-xs sm:text-sm font-bold text-slate-200 tabular-nums">
            {formatRupee(totalLimit)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Total Dues</span>
          <span className="text-xs sm:text-sm font-bold text-rose-300 tabular-nums">
            {formatRupee(combinedOutstanding)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-medium">Available Pool</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums">
            {formatRupee(availableCredit)}
          </span>
        </div>
      </div>

      {/* Progress Bar for Shared Limit Utilization */}
      <div className="space-y-1">
        <ProgressBar
          value={Math.max(0, combinedOutstanding)}
          max={totalLimit}
          label="Shared Pool Utilization"
          showPercentage
          variant="dynamic"
          size="sm"
        />
      </div>

      {/* Member Cards Grid */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-heading">
          Cards Sharing This Limit:
        </span>

        {memberCards.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No active cards assigned to this pool yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {memberCards.map((c) => {
              const cardOut = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
              return (
                <div
                  key={c.id}
                  onClick={() => onCardClick?.(c)}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between gap-2 cursor-pointer transition-all"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      {c.displayName || c.cardName || c.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      •••• {c.lastFourDigits ? String(c.lastFourDigits).slice(-4) : '••••'} • {c.owner || 'Self'}
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-slate-200 tabular-nums block">
                      {cardOut < 0 ? `+₹${Math.abs(cardOut)}` : formatRupee(cardOut)}
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      Individual dues
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
