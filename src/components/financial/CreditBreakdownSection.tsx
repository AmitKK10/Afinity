/**
 * CreditBreakdownSection.tsx — Legal Owner vs Operational Management Breakdown (Step 6D)
 * Clearly separates legal card ownership (Self, Parent, Other) from payment responsibility (Paid By Me vs Owner).
 */

import React, { useState } from 'react';
import { Users, UserCheck, ShieldCheck, CreditCard as CreditCardIcon, ArrowUpRight } from 'lucide-react';
import { CreditPositionSummary, getCreditUtilizationInfo } from '../../services/calculations';
import { formatRupee } from '../../utils/formatters';
import { ProgressBar } from '../ui/ProgressBar';

interface CreditBreakdownSectionProps {
  creditPosition: CreditPositionSummary;
}

export const CreditBreakdownSection: React.FC<CreditBreakdownSectionProps> = ({
  creditPosition,
}) => {
  const [activeTab, setActiveTab] = useState<'owner' | 'management'>('owner');
  const { ownerSummary, managedSummary } = creditPosition;

  return (
    <div id="credit-breakdown-section" className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Portfolio Breakdown & Responsibility</span>
          </h3>
          <p className="text-xs text-slate-400">
            {activeTab === 'owner'
              ? 'Categorized by legal card ownership'
              : 'Categorized by operational payment responsibility'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('owner')}
            className={`py-1 px-3 rounded-lg text-xs font-bold font-heading transition-all cursor-pointer ${
              activeTab === 'owner'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Legal Owner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('management')}
            className={`py-1 px-3 rounded-lg text-xs font-bold font-heading transition-all cursor-pointer ${
              activeTab === 'management'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Payment Responsibility
          </button>
        </div>
      </div>

      {/* Tab 1: Legal Owner Breakdown */}
      {activeTab === 'owner' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* My Cards (Self) */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 font-heading">
                My Cards (Self)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                {ownerSummary.self.cardCount} Cards
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">Total Outstanding</span>
              <div className="text-base font-extrabold text-white font-mono">
                {formatRupee(ownerSummary.self.totalOutstanding)}
              </div>
            </div>

            <ProgressBar
              value={Math.max(0, ownerSummary.self.totalOutstanding)}
              max={ownerSummary.self.totalLimit || 1}
              label="Limit Exposure"
              sublabel={`Limit: ${formatRupee(ownerSummary.self.totalLimit)}`}
              showPercentage
              variant="dynamic"
              size="sm"
            />

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Available: <strong className="text-emerald-400">{formatRupee(ownerSummary.self.availableCredit)}</strong></span>
              <span>{ownerSummary.self.utilization}% Utilized</span>
            </div>
          </div>

          {/* Parent's Cards */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 font-heading">
                Parent's Cards
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                {ownerSummary.parent.cardCount} Cards
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">Total Outstanding</span>
              <div className="text-base font-extrabold text-white font-mono">
                {formatRupee(ownerSummary.parent.totalOutstanding)}
              </div>
            </div>

            <ProgressBar
              value={Math.max(0, ownerSummary.parent.totalOutstanding)}
              max={ownerSummary.parent.totalLimit || 1}
              label="Limit Exposure"
              sublabel={`Limit: ${formatRupee(ownerSummary.parent.totalLimit)}`}
              showPercentage
              variant="dynamic"
              size="sm"
            />

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Available: <strong className="text-emerald-400">{formatRupee(ownerSummary.parent.availableCredit)}</strong></span>
              <span>{ownerSummary.parent.utilization}% Utilized</span>
            </div>
          </div>

          {/* Other / Family Cards */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-heading">
                Other / Family Cards
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {ownerSummary.other.cardCount} Cards
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">Total Outstanding</span>
              <div className="text-base font-extrabold text-white font-mono">
                {formatRupee(ownerSummary.other.totalOutstanding)}
              </div>
            </div>

            <ProgressBar
              value={Math.max(0, ownerSummary.other.totalOutstanding)}
              max={ownerSummary.other.totalLimit || 1}
              label="Limit Exposure"
              sublabel={`Limit: ${formatRupee(ownerSummary.other.totalLimit)}`}
              showPercentage
              variant="dynamic"
              size="sm"
            />

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Available: <strong className="text-emerald-400">{formatRupee(ownerSummary.other.availableCredit)}</strong></span>
              <span>{ownerSummary.other.utilization}% Utilized</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Operational Payment Responsibility Breakdown */}
      {activeTab === 'management' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Managed & Paid By Me */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/30 via-slate-950 to-slate-950 border border-rose-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 font-heading flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>Managed & Paid By Me</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                {managedSummary.iPay.cardCount} Cards
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">My Payment Obligations</span>
              <div className="text-xl font-extrabold text-white font-mono">
                {formatRupee(managedSummary.iPay.totalOutstanding)}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Includes both self-owned cards and parent/other cards that you have committed to pay.
            </p>
          </div>

          {/* Paid By Owner / Parent */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-heading flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Paid By Owner / Parent</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {managedSummary.iDontPay.cardCount} Cards
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">Other Responsible Parties</span>
              <div className="text-xl font-extrabold text-slate-200 font-mono">
                {formatRupee(managedSummary.iDontPay.totalOutstanding)}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Cards tracked for awareness but where the bill is paid directly by the cardholder.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
