/**
 * SharedLimitSection.tsx — Dedicated Shared Limit Pools Command Center (Step 6D)
 * Displays combined shared credit pools with member cards, combined dues, utilization, and limit deduplication.
 */

import React from 'react';
import { Layers, Plus, ShieldCheck, CreditCard as CreditCardIcon, Edit3, ArrowRight } from 'lucide-react';
import { CreditLimitGroup, CreditCard } from '../../types';
import {
  calculateCreditLimitGroupOutstanding,
  calculateCreditLimitGroupAvailableCredit,
  calculateCreditLimitGroupUtilization,
  getCreditUtilizationInfo,
} from '../../services/calculations';
import { formatRupee } from '../../utils/formatters';
import { ProgressBar } from '../ui/ProgressBar';

interface SharedLimitSectionProps {
  groups: CreditLimitGroup[];
  creditCards: CreditCard[];
  onAddGroup: () => void;
  onEditGroup: (group: CreditLimitGroup) => void;
  onSelectCard?: (card: CreditCard) => void;
}

export const SharedLimitSection: React.FC<SharedLimitSectionProps> = ({
  groups,
  creditCards,
  onAddGroup,
  onEditGroup,
  onSelectCard,
}) => {
  const activeGroups = groups.filter((g) => g.status !== 'archived');
  const activeCards = creditCards.filter((c) => c.status === 'active');

  return (
    <div id="shared-limit-pools-section" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Shared Limit Pools</span>
          </h3>
          <p className="text-xs text-slate-400">
            Combined credit limits shared across multiple cards from the same issuer
          </p>
        </div>

        <button
          type="button"
          onClick={onAddGroup}
          className="shrink-0 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer font-heading transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Pool</span>
        </button>
      </div>

      {activeGroups.length === 0 ? (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-bold text-xs">No shared credit pools configured</p>
          <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
            If you have multiple cards from the same bank (e.g. ICICI, HDFC) sharing a single credit limit, create a shared pool to avoid double-counting limits.
          </p>
          <button
            type="button"
            onClick={onAddGroup}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 text-xs font-bold border border-cyan-500/40 cursor-pointer font-heading"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Shared Pool</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeGroups.map((group) => {
            const memberCards = activeCards.filter(
              (c) =>
                c.creditLimitGroupId === group.id ||
                c.sharedLimitGroupId === group.id ||
                group.cardIds?.includes(c.id)
            );

            const totalLimit = Number(
              group.totalLimit !== undefined ? group.totalLimit : group.sharedLimit || 0
            );
            const combinedOutstanding = calculateCreditLimitGroupOutstanding(group, activeCards);
            const availableCredit = calculateCreditLimitGroupAvailableCredit(group, activeCards);
            const utilization = calculateCreditLimitGroupUtilization(group, activeCards);
            const utilInfo = getCreditUtilizationInfo(utilization);

            return (
              <div
                key={group.id}
                className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 space-y-3.5 hover:border-slate-700 transition-all shadow-lg"
              >
                {/* Header: Group Name, Issuer & Edit */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-heading">
                        {group.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                        {group.issuer || group.bankName || 'Shared'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      {memberCards.length} Linked Card{memberCards.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditGroup(group)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit Shared Pool"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Shared Limit</span>
                    <div className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">
                      {formatRupee(totalLimit)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Combined Dues</span>
                    <div className="text-xs sm:text-sm font-extrabold text-rose-300 font-mono mt-0.5">
                      {formatRupee(combinedOutstanding)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Available</span>
                    <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {formatRupee(availableCredit)}
                    </div>
                  </div>
                </div>

                {/* Utilization bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Pool Utilization</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${utilInfo.badgeClass}`}>
                      {utilization}% • {utilInfo.label}
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.max(0, combinedOutstanding)}
                    max={totalLimit || 1}
                    showPercentage={false}
                    variant="dynamic"
                    size="sm"
                  />
                </div>

                {/* Member Cards List */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-heading block">
                    Member Cards in this Pool:
                  </span>
                  <div className="space-y-1">
                    {memberCards.map((c) => {
                      const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
                      const isCredit = out < 0;

                      return (
                        <div
                          key={c.id}
                          onClick={() => onSelectCard?.(c)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800/60 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCardIcon className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-semibold text-slate-200">
                              {c.displayName || c.cardName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              •••• {c.lastFourDigits || '••••'}
                            </span>
                          </div>

                          <span
                            className={`font-mono text-xs font-bold ${
                              isCredit ? 'text-emerald-400' : out > 0 ? 'text-rose-300' : 'text-slate-500'
                            }`}
                          >
                            {isCredit
                              ? `₹${Math.abs(out).toLocaleString('en-IN')} Cr`
                              : formatRupee(out)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
