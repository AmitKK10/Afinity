import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Phone,
  Edit2,
  History,
  Archive,
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Coins,
  ChevronRight,
} from 'lucide-react';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { KhatabookEntry } from '../../types';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import {
  normalizeKhatabookType,
  getKhatabookOriginalAmount,
  getKhatabookPaidAmount,
  getKhatabookRemainingAmount,
  getKhatabookStatus,
  getKhatabookDueInfo,
} from '../../services/calculations';

interface KhatabookEntryCardProps {
  entry: KhatabookEntry;
  onSettle: (entry: KhatabookEntry) => void;
  onEdit: (entry: KhatabookEntry) => void;
  onViewHistory: (entry: KhatabookEntry) => void;
  onArchive?: (entry: KhatabookEntry) => void;
  onRestore?: (entry: KhatabookEntry) => void;
  onDelete?: (entry: KhatabookEntry) => void;
}

export const KhatabookEntryCard: React.FC<KhatabookEntryCardProps> = ({
  entry,
  onSettle,
  onEdit,
  onViewHistory,
  onArchive,
  onRestore,
  onDelete,
}) => {
  const type = normalizeKhatabookType(entry.entryType || entry.type);
  const isReceivable = type === 'RECEIVABLE';
  const original = getKhatabookOriginalAmount(entry);
  const paid = getKhatabookPaidAmount(entry);
  const remaining = getKhatabookRemainingAmount(entry);
  const status = getKhatabookStatus(entry);
  const dueInfo = getKhatabookDueInfo(entry);
  const isArchived = (entry.status || '').toString().toUpperCase() === 'ARCHIVED';
  const isPaid = status === 'PAID';

  const phone = entry.phone || entry.contactNumber;
  const notes = entry.notes || entry.reason;

  // Calculate percentage paid for progress bar
  const pctPaid = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 0;

  return (
    <FinancialCard
      variant="default"
      padding="md"
      className={`relative overflow-hidden transition-all duration-200 hover:border-slate-700 ${
        isPaid
          ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
          : isArchived
          ? 'bg-slate-950/60 border-slate-800/40 opacity-60'
          : isReceivable
          ? 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/30'
          : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/30'
      }`}
    >
      <div className="space-y-3">
        {/* Top Header: Person + Type Badge + Status + Quick Action */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isReceivable
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isReceivable ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-sm font-bold truncate font-heading ${
                    isPaid ? 'line-through text-slate-400' : 'text-white'
                  }`}
                >
                  {entry.personName}
                </h3>
                <Badge variant={isReceivable ? 'cyan' : 'rose'} size="sm">
                  {isReceivable ? 'You Will Receive' : 'You Owe'}
                </Badge>
                {status === 'OVERDUE' && (
                  <Badge variant="rose" size="sm" className="animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{dueInfo.displayText}</span>
                  </Badge>
                )}
                {dueInfo.isDueSoon && status !== 'OVERDUE' && (
                  <Badge variant="amber" size="sm" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{dueInfo.displayText}</span>
                  </Badge>
                )}
                {isPaid && (
                  <Badge variant="emerald" size="sm" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Paid in Full</span>
                  </Badge>
                )}
                {status === 'PARTIALLY_PAID' && (
                  <Badge variant="blue" size="sm">
                    Partial ({pctPaid}%)
                  </Badge>
                )}
                {entry.includeInNetWorth === false && (
                  <Badge variant="slate" size="sm" className="text-[10px]">
                    Excluded from Net Worth
                  </Badge>
                )}
              </div>

              {phone && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount Display */}
          <div className="text-right flex-shrink-0">
            <div
              className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                isPaid
                  ? 'text-slate-500 line-through'
                  : isReceivable
                  ? 'text-cyan-400'
                  : 'text-rose-400'
              }`}
            >
              {isReceivable ? '+' : '-'}
              {formatRupee(remaining)}
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              {isPaid ? 'Settled' : 'Remaining'}
            </span>
          </div>
        </div>

        {/* Amount Progress Bar & Subtotals */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Original: <strong className="text-slate-200">{formatRupee(original)}</strong>
            </span>
            <span className="text-slate-400">
              Paid: <strong className="text-emerald-400">{formatRupee(paid)}</strong>
            </span>
            <span className="text-slate-400">
              Remaining:{' '}
              <strong className={isReceivable ? 'text-cyan-300' : 'text-rose-300'}>
                {formatRupee(remaining)}
              </strong>
            </span>
          </div>

          {/* Mini progress bar if partially paid */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPaid
                  ? 'bg-emerald-500 w-full'
                  : isReceivable
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                  : 'bg-gradient-to-r from-rose-500 to-amber-400'
              }`}
              style={{ width: `${pctPaid}%` }}
            />
          </div>
        </div>

        {/* Details & Notes */}
        {(notes || entry.dueDate || entry.date) && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-0.5">
            {notes ? (
              <span className="text-slate-300 font-medium truncate max-w-xs sm:max-w-md">
                "{notes}"
              </span>
            ) : (
              <span className="text-slate-500 italic">No notes provided</span>
            )}

            <div className="flex items-center gap-3 ml-auto text-[11px]">
              {entry.date && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  Date: {formatFinancialDate(entry.date)}
                </span>
              )}
              {entry.dueDate && (
                <span
                  className={`flex items-center gap-1 font-semibold ${
                    status === 'OVERDUE'
                      ? 'text-rose-400'
                      : dueInfo.isDueSoon
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Due: {formatFinancialDate(entry.dueDate)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1">
            <button
              type="button"
              id={`edit-khatabook-${entry.id}`}
              onClick={() => onEdit(entry)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs flex items-center gap-1 font-medium cursor-pointer"
              title="Edit Entry"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              type="button"
              id={`history-khatabook-${entry.id}`}
              onClick={() => onViewHistory(entry)}
              className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all text-xs flex items-center gap-1 font-medium cursor-pointer"
              title="View Settlement History"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>

            {isArchived ? (
              onRestore && (
                <button
                  type="button"
                  id={`restore-khatabook-${entry.id}`}
                  onClick={() => onRestore(entry)}
                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/30 transition-all text-xs flex items-center gap-1 font-medium cursor-pointer"
                  title="Restore Entry"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restore</span>
                </button>
              )
            ) : (
              onArchive && (
                <button
                  type="button"
                  id={`archive-khatabook-${entry.id}`}
                  onClick={() => onArchive(entry)}
                  className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-950/30 transition-all text-xs flex items-center gap-1 font-medium cursor-pointer"
                  title="Archive Entry"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Archive</span>
                </button>
              )
            )}

            {onDelete && (
              <button
                type="button"
                id={`delete-khatabook-${entry.id}`}
                onClick={() => onDelete(entry)}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all text-xs flex items-center gap-1 font-medium cursor-pointer"
                title="Delete Entry"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>

          {/* Settle Action Button */}
          {!isPaid && !isArchived && (
            <button
              type="button"
              id={`settle-khatabook-${entry.id}`}
              onClick={() => onSettle(entry)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-98 cursor-pointer ${
                isReceivable
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-cyan-900/30'
                  : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-900/30'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{isReceivable ? 'Receive Money' : 'Pay Money'}</span>
            </button>
          )}

          {isPaid && (
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Fully Settled</span>
            </div>
          )}
        </div>
      </div>
    </FinancialCard>
  );
};
