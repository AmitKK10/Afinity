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
  Plus,
  Coins,
  Edit2,
  History,
  Trash2,
  Calendar,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { PersonKhatabookBalance, KhatabookEntry } from '../../types';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import {
  normalizeKhatabookType,
  getKhatabookOriginalAmount,
  getKhatabookPaidAmount,
  getKhatabookRemainingAmount,
  getKhatabookStatus,
  getKhatabookDueInfo,
} from '../../services/calculations';

interface KhatabookPersonDetailModalProps {
  isOpen: boolean;
  person: PersonKhatabookBalance | null;
  onClose: () => void;
  onSettleEntry: (entry: KhatabookEntry) => void;
  onEditEntry: (entry: KhatabookEntry) => void;
  onViewHistory: (entry: KhatabookEntry) => void;
  onAddEntryForPerson: (personName: string) => void;
  onDeleteEntry?: (entry: KhatabookEntry) => void;
}

export const KhatabookPersonDetailModal: React.FC<KhatabookPersonDetailModalProps> = ({
  isOpen,
  person,
  onClose,
  onSettleEntry,
  onEditEntry,
  onViewHistory,
  onAddEntryForPerson,
  onDeleteEntry,
}) => {
  if (!person) return null;

  const isNetPositive = person.netBalance >= 0;
  const isFullySettled = person.totalReceivable === 0 && person.totalPayable === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${person.personName}'s Ledger`}
      subtitle="Complete chronological transaction record & consolidated balances"
    >
      <div className="space-y-4 text-xs">
        {/* Person Consolidated Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base ${
                  isFullySettled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : isNetPositive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {person.personName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">{person.personName}</h3>
                {person.phone && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{person.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              id="person-detail-add-tx-btn"
              onClick={() => {
                onClose();
                onAddEntryForPerson(person.personName);
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-cyan-900/30 cursor-pointer active:scale-98 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
          </div>

          {/* Consolidated Summary Grid */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
            <div>
              <span className="text-[10px] text-cyan-400/90 font-semibold block">Receivable</span>
              <span className="font-bold text-cyan-300 font-mono text-xs sm:text-sm">
                +{formatRupee(person.totalReceivable)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-rose-400/90 font-semibold block">Payable</span>
              <span className="font-bold text-rose-300 font-mono text-xs sm:text-sm">
                -{formatRupee(person.totalPayable)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Net Position</span>
              <span
                className={`font-black font-mono text-xs sm:text-sm ${
                  isFullySettled
                    ? 'text-emerald-400'
                    : isNetPositive
                    ? 'text-cyan-300'
                    : 'text-rose-300'
                }`}
              >
                {isFullySettled ? '₹0' : `${isNetPositive ? '+' : ''}${formatRupee(person.netBalance)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Entries List for this Person */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between font-bold text-slate-300">
            <span>All Entries ({person.entries.length})</span>
            <span className="text-[11px] text-slate-400">
              {person.activeEntriesCount} Active • {person.settledEntriesCount} Settled
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-none">
            {person.entries.map((entry) => {
              const type = normalizeKhatabookType(entry.entryType || entry.type);
              const isReceivable = type === 'RECEIVABLE';
              const original = getKhatabookOriginalAmount(entry);
              const paid = getKhatabookPaidAmount(entry);
              const remaining = getKhatabookRemainingAmount(entry);
              const status = getKhatabookStatus(entry);
              const dueInfo = getKhatabookDueInfo(entry);
              const isPaid = status === 'PAID';

              return (
                <div
                  key={entry.id}
                  className={`p-3 rounded-xl border space-y-2 transition-all ${
                    isPaid
                      ? 'bg-slate-950/40 border-slate-800/40 opacity-70'
                      : isReceivable
                      ? 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isReceivable ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {isReceivable ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">
                            {isReceivable ? 'Receivable' : 'Payable'}
                          </span>
                          {status === 'OVERDUE' && (
                            <Badge variant="rose" size="sm" className="text-[10px]">
                              {dueInfo.displayText}
                            </Badge>
                          )}
                          {isPaid && (
                            <Badge variant="emerald" size="sm" className="text-[10px]">
                              Settled
                            </Badge>
                          )}
                        </div>
                        {entry.date && (
                          <span className="text-[10px] text-slate-400">
                            {formatFinancialDate(entry.date)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black font-mono text-xs ${
                          isPaid
                            ? 'text-slate-500 line-through'
                            : isReceivable
                            ? 'text-cyan-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {isReceivable ? '+' : '-'}
                        {formatRupee(remaining)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Original: {formatRupee(original)}
                      </span>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="text-[11px] text-slate-400 italic">"{entry.notes}"</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditEntry(entry);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewHistory(entry);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3 h-3" />
                        <span>History</span>
                      </button>
                      {onDeleteEntry && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onDeleteEntry(entry);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSettleEntry(entry);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-sm ${
                          isReceivable
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                            : 'bg-rose-600 hover:bg-rose-500 text-white'
                        }`}
                      >
                        <Coins className="w-3 h-3" />
                        <span>{isReceivable ? 'Receive' : 'Pay'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
