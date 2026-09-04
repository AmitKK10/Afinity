import React from 'react';
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Plus,
  Coins,
} from 'lucide-react';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { useFinancialData } from '../../context/FinancialDataContext';
import { KhatabookEntry } from '../../types';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import {
  normalizeKhatabookType,
  getKhatabookRemainingAmount,
  getKhatabookStatus,
  getKhatabookDueInfo,
} from '../../services/calculations';

interface KhatabookHomeWidgetProps {
  onNavigateToKhatabook: () => void;
  onAddEntry: () => void;
  onSettleEntry: (entry: KhatabookEntry) => void;
}

export const KhatabookHomeWidget: React.FC<KhatabookHomeWidgetProps> = ({
  onNavigateToKhatabook,
  onAddEntry,
  onSettleEntry,
}) => {
  const { khatabookSummary, khatabookEntries } = useFinancialData();

  const isNetPositive = khatabookSummary.netPosition >= 0;

  // Active entries (top 3 urgent/highest)
  const activeEntries = React.useMemo(() => {
    return khatabookEntries
      .filter((e) => (e.status || '').toString().toUpperCase() !== 'ARCHIVED' && getKhatabookStatus(e) !== 'PAID')
      .sort((a, b) => {
        const aStatus = getKhatabookStatus(a);
        const bStatus = getKhatabookStatus(b);
        if (aStatus === 'OVERDUE' && bStatus !== 'OVERDUE') return -1;
        if (bStatus === 'OVERDUE' && aStatus !== 'OVERDUE') return 1;
        return getKhatabookRemainingAmount(b) - getKhatabookRemainingAmount(a);
      })
      .slice(0, 3);
  }, [khatabookEntries]);

  if (khatabookEntries.length === 0) {
    return null;
  }

  return (
    <FinancialCard
      variant="elevated"
      padding="md"
      className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0a1526]"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white font-heading">Dues & Receivables</h3>
                <Badge variant="cyan" size="sm">
                  {khatabookSummary.personCount} {khatabookSummary.personCount === 1 ? 'Person' : 'People'}
                </Badge>
              </div>
              <span className="text-[10px] text-slate-400">Receivables & Payables Ledger</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="home-khatabook-add-btn"
              onClick={onAddEntry}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs flex items-center gap-1 cursor-pointer font-medium transition-all"
              title="Add New Entry"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>

            <button
              type="button"
              id="home-khatabook-view-all-btn"
              onClick={onNavigateToKhatabook}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all border border-cyan-500/20"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
          <div>
            <span className="text-[10px] text-cyan-400/90 font-semibold block flex items-center justify-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-cyan-400" />
              Receive
            </span>
            <span className="font-bold text-cyan-300 font-mono text-xs sm:text-sm">
              +{formatRupee(khatabookSummary.totalReceivables)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-rose-400/90 font-semibold block flex items-center justify-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-rose-400" />
              Owe
            </span>
            <span className="font-bold text-rose-300 font-mono text-xs sm:text-sm">
              -{formatRupee(khatabookSummary.totalPayables)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-slate-400" />
              Net
            </span>
            <span
              className={`font-black font-mono text-xs sm:text-sm ${
                isNetPositive ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isNetPositive ? '+' : ''}
              {formatRupee(khatabookSummary.netPosition)}
            </span>
          </div>
        </div>

        {/* Overdue alert if any */}
        {khatabookSummary.overdueCount > 0 && (
          <div className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-center justify-between text-xs text-rose-300">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <strong>{khatabookSummary.overdueCount} Overdue</strong>
            </span>
            <span className="font-bold font-mono">{formatRupee(khatabookSummary.overdueAmount)}</span>
          </div>
        )}

        {/* Active items preview */}
        {activeEntries.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {activeEntries.map((entry) => {
              const type = normalizeKhatabookType(entry.entryType || entry.type);
              const isReceivable = type === 'RECEIVABLE';
              const remaining = getKhatabookRemainingAmount(entry);
              const dueInfo = getKhatabookDueInfo(entry);

              return (
                <div
                  key={entry.id}
                  className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between gap-2 text-xs hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isReceivable
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {isReceivable ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate text-[11px]">
                        {entry.personName}
                      </span>
                      {entry.dueDate && (
                        <span
                          className={`text-[10px] block ${
                            dueInfo.isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
                          }`}
                        >
                          {dueInfo.displayText}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`font-mono font-bold text-xs ${
                        isReceivable ? 'text-cyan-400' : 'text-rose-400'
                      }`}
                    >
                      {isReceivable ? '+' : '-'}
                      {formatRupee(remaining)}
                    </span>
                    <button
                      type="button"
                      id={`home-settle-entry-${entry.id}`}
                      onClick={() => onSettleEntry(entry)}
                      className={`p-1.5 rounded-lg text-white font-bold cursor-pointer transition-all shadow-sm ${
                        isReceivable
                          ? 'bg-cyan-600 hover:bg-cyan-500'
                          : 'bg-rose-600 hover:bg-rose-500'
                      }`}
                      title={isReceivable ? 'Receive Money' : 'Pay Money'}
                    >
                      <Coins className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FinancialCard>
  );
};
