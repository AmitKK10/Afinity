import React, { useState } from 'react';
import {
  PiggyBank,
  Calendar,
  Percent,
  RefreshCw,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit3,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { FixedDepositAccount } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { Badge } from '../ui/Badge';
import { formatRupee } from '../../utils/formatters';

interface FixedDepositCardProps {
  fd: FixedDepositAccount;
  onActionClick: (fd: FixedDepositAccount, action: 'withdraw' | 'renew' | 'close') => void;
  onEdit: (fd: FixedDepositAccount) => void;
  onArchiveToggle: (fd: FixedDepositAccount) => void;
  onDeleteFD?: (fd: FixedDepositAccount) => void;
}

export const FixedDepositCard: React.FC<FixedDepositCardProps> = ({
  fd,
  onActionClick,
  onEdit,
  onArchiveToggle,
  onDeleteFD,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isArchived = fd.status === 'archived';
  const isMatured = fd.fdStatus === 'matured';

  // Calculate maturity progress
  const now = new Date();
  const startDate = fd.startDate ? new Date(fd.startDate) : new Date(fd.createdAt || now);
  const maturityDate = fd.maturityDate ? new Date(fd.maturityDate) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const totalDuration = Math.max(1, maturityDate.getTime() - startDate.getTime());
  const elapsed = Math.max(0, Math.min(totalDuration, now.getTime() - startDate.getTime()));
  const progressPercent = Math.round((elapsed / totalDuration) * 100);

  const daysRemaining = Math.max(0, Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isNearMaturity = daysRemaining <= 30 && daysRemaining > 0;

  const interestFrequencyLabel = () => {
    switch (fd.interestType) {
      case 'compound_monthly':
        return 'Monthly Compounded';
      case 'compound_quarterly':
        return 'Quarterly Compounded';
      case 'simple':
      default:
        return 'Simple Interest';
    }
  };

  return (
    <div
      id={`fd-card-${fd.id}`}
      className={`relative rounded-2xl p-5 transition-all duration-200 border ${
        isArchived
          ? 'bg-slate-900/40 border-slate-800 opacity-60'
          : isNearMaturity
          ? 'bg-gradient-to-br from-amber-950/20 via-slate-900/90 to-slate-950 border-amber-600/50 shadow-lg shadow-amber-950/20'
          : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
      }`}
    >
      {/* Header with FD Name and Bank */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center font-bold text-white shadow-inner">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {fd.displayName || fd.name}
              </h3>
              <Badge variant="success">{fd.interestRate}% p.a.</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{fd.institutionName || fd.bankName || 'Bank'}</span>
              {fd.accountNumberMasked && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-300">{fd.accountNumberMasked}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            id={`btn-fd-menu-${fd.id}`}
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-30 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onActionClick(fd, 'withdraw');
                  }}
                  className="w-full px-3 py-2 text-left text-emerald-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Withdraw / Liquidate
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onActionClick(fd, 'renew');
                  }}
                  className="w-full px-3 py-2 text-left text-blue-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Renew FD
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(fd);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Details
                </button>
                {isArchived ? (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onArchiveToggle(fd);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-400 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    Restore FD
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onArchiveToggle(fd);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-400 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5 text-slate-400" />
                    Archive FD
                  </button>
                )}

                {onDeleteFD && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteFD(fd);
                    }}
                    className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2 border-t border-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    Delete FD
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Financials Grid: Principal, Accrued, Maturity */}
      <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Principal</span>
          <MoneyDisplay amount={fd.principal || fd.balance} size="md" className="text-white font-bold" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Estimated Value</span>
          <MoneyDisplay
            amount={fd.estimatedCurrentValue || fd.principal || fd.balance}
            size="md"
            className="text-emerald-400 font-bold"
          />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">At Maturity</span>
          <MoneyDisplay
            amount={fd.maturityAmount || (fd.principal || fd.balance) * 1.1}
            size="md"
            className="text-teal-300 font-bold"
          />
        </div>
      </div>

      {/* Maturity Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {daysRemaining === 0 ? 'Matured' : `${daysRemaining} days left`}
          </span>
          <span className="text-slate-300 font-medium">
            Matures {maturityDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              daysRemaining === 0
                ? 'bg-emerald-400'
                : isNearMaturity
                ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                : 'bg-gradient-to-r from-teal-500 to-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer Info & Quick Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
            {interestFrequencyLabel()}
          </span>
          {fd.autoRenew && (
            <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
              <RefreshCw className="w-3 h-3" />
              Auto-Renew ON
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id={`btn-withdraw-${fd.id}`}
            onClick={() => onActionClick(fd, 'withdraw')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold transition-all"
          >
            Withdraw
          </button>
          <button
            id={`btn-renew-${fd.id}`}
            onClick={() => onActionClick(fd, 'renew')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all"
          >
            Renew
          </button>
        </div>
      </div>
    </div>
  );
};
