import React from 'react';
import {
  User,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  Plus,
  BookOpen,
} from 'lucide-react';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { PersonKhatabookBalance, KhatabookEntry } from '../../types';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import { getKhatabookDueInfo, getKhatabookStatus } from '../../services/calculations';

interface KhatabookPersonCardProps {
  person: PersonKhatabookBalance;
  onClick: (person: PersonKhatabookBalance) => void;
  onAddEntryForPerson: (personName: string) => void;
}

export const KhatabookPersonCard: React.FC<KhatabookPersonCardProps> = ({
  person,
  onClick,
  onAddEntryForPerson,
}) => {
  const isNetPositive = person.netBalance >= 0;
  const isFullySettled = person.totalReceivable === 0 && person.totalPayable === 0;

  // Find nearest due date among active entries
  const activeEntries = person.entries.filter(
    (e) => (e.status || '').toString().toUpperCase() !== 'ARCHIVED' && getKhatabookStatus(e) !== 'PAID'
  );

  let nearestDueText: string | null = null;
  let nearestDueIsOverdue = false;

  const entriesWithDue = activeEntries
    .filter((e) => e.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  if (entriesWithDue.length > 0) {
    const dueInfo = getKhatabookDueInfo(entriesWithDue[0]);
    nearestDueText = dueInfo.displayText;
    nearestDueIsOverdue = dueInfo.isOverdue;
  }

  return (
    <FinancialCard
      variant="default"
      padding="md"
      className={`relative overflow-hidden transition-all duration-200 hover:border-slate-700 cursor-pointer ${
        isFullySettled
          ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
          : isNetPositive
          ? 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40'
          : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/40'
      }`}
      onClick={() => onClick(person)}
    >
      <div className="space-y-3">
        {/* Person Header + Net Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                isFullySettled
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : isNetPositive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {person.personName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white truncate font-heading">
                  {person.personName}
                </h3>
                {person.hasOverdue && (
                  <Badge variant="rose" size="sm" className="flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Overdue</span>
                  </Badge>
                )}
                {isFullySettled && (
                  <Badge variant="emerald" size="sm" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Settled</span>
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                {person.phone ? (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    {person.phone}
                  </span>
                ) : (
                  <span>
                    {person.activeEntriesCount} active {person.activeEntriesCount === 1 ? 'entry' : 'entries'}
                  </span>
                )}
                {person.settledEntriesCount > 0 && (
                  <span className="text-slate-500">• {person.settledEntriesCount} settled</span>
                )}
              </div>
            </div>
          </div>

          {/* Net Balance Pill */}
          <div className="text-right flex-shrink-0">
            <div
              className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                isFullySettled
                  ? 'text-emerald-400'
                  : isNetPositive
                  ? 'text-cyan-400'
                  : 'text-rose-400'
              }`}
            >
              {isFullySettled
                ? '₹0'
                : `${isNetPositive ? '+' : ''}${formatRupee(person.netBalance)}`}
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              {isFullySettled
                ? 'All Settled'
                : isNetPositive
                ? 'Net Receivable'
                : 'Net Payable'}
            </span>
          </div>
        </div>

        {/* Breakdown of Receivable vs Payable for this person */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-semibold">
              <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Owes You</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
              +{formatRupee(person.totalReceivable)}
            </div>
          </div>

          <div className="space-y-0.5 text-right">
            <div className="flex items-center justify-end gap-1 text-[11px] text-rose-300 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span>You Owe</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
              -{formatRupee(person.totalPayable)}
            </div>
          </div>
        </div>

        {/* Footer info: Nearest Due date & Drilldown prompt */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          {nearestDueText ? (
            <span
              className={`text-[11px] font-medium flex items-center gap-1 ${
                nearestDueIsOverdue ? 'text-rose-400 font-semibold' : 'text-amber-400'
              }`}
            >
              <Clock className="w-3 h-3" />
              {nearestDueText}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">
              {person.entries.length} total recorded {person.entries.length === 1 ? 'transaction' : 'transactions'}
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              id={`add-entry-for-${person.personName.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={(e) => {
                e.stopPropagation();
                onAddEntryForPerson(person.personName);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all text-xs flex items-center gap-1 font-medium cursor-pointer"
              title={`Add new transaction with ${person.personName}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[11px]">Add</span>
            </button>

            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>View Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </FinancialCard>
  );
};
