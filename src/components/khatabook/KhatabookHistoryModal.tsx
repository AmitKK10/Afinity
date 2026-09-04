import React from 'react';
import { History, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, Calendar, ShieldCheck, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { KhatabookEntry } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import {
  normalizeKhatabookType,
  getKhatabookOriginalAmount,
  getKhatabookPaidAmount,
  getKhatabookRemainingAmount,
  getKhatabookStatus,
} from '../../services/calculations';

interface KhatabookHistoryModalProps {
  isOpen: boolean;
  entry: KhatabookEntry | null;
  onClose: () => void;
}

export const KhatabookHistoryModal: React.FC<KhatabookHistoryModalProps> = ({
  isOpen,
  entry,
  onClose,
}) => {
  const { balanceHistory, auditEvents, transfers } = useFinancialData();

  if (!entry) return null;

  const type = normalizeKhatabookType(entry.entryType || entry.type);
  const isReceivable = type === 'RECEIVABLE';
  const original = getKhatabookOriginalAmount(entry);
  const paid = getKhatabookPaidAmount(entry);
  const remaining = getKhatabookRemainingAmount(entry);
  const status = getKhatabookStatus(entry);

  // Filter balance histories for this entry
  const entryHistories = balanceHistory
    .filter((h) => h.entityType === 'khatabook' && h.entityId === entry.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter audit events for this entry
  const entryAudits = auditEvents
    .filter((a) => a.entityId === entry.id || a.metadata?.khatabookEntryId === entry.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter related transfers
  const relatedTransfers = (transfers || [])
    .filter((t) => t.notes?.includes(entry.id) || t.notes?.includes(entry.personName))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settlement & Audit Ledger"
      subtitle={`Full traceable history for ${entry.personName}`}
    >
      <div className="space-y-4 text-xs">
        {/* Entry Summary Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isReceivable ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {isReceivable ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-bold text-white text-sm block">{entry.personName}</span>
                <span className="text-[10px] text-slate-400">
                  Created {entry.date ? formatFinancialDate(entry.date) : 'Recently'}
                </span>
              </div>
            </div>
            <Badge variant={status === 'PAID' ? 'emerald' : isReceivable ? 'cyan' : 'rose'} size="sm">
              {status}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block">Original</span>
              <span className="font-bold text-slate-200 font-mono">{formatRupee(original)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Total Settled</span>
              <span className="font-bold text-emerald-400 font-mono">{formatRupee(paid)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Remaining</span>
              <span
                className={`font-black font-mono ${
                  isReceivable ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {formatRupee(remaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Events Timeline */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Immutable Audit Trail & Balance Transitions</span>
          </div>

          {entryHistories.length === 0 && entryAudits.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-400">
              <Clock className="w-6 h-6 mx-auto mb-1 text-slate-600" />
              <p className="text-xs">No settlements recorded yet for this entry.</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                When settlements occur, all balance adjustments and account transfers will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entryHistories.map((hist, idx) => (
                <div
                  key={hist.id || idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Settlement Recorded
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(hist.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-slate-400">
                      Balance: {formatRupee(hist.previousBalance)} → {formatRupee(hist.newBalance)}
                    </span>
                    <span className="font-bold text-emerald-400">
                      {formatRupee(Math.abs(hist.changeAmount))} Settled
                    </span>
                  </div>

                  {hist.notes && (
                    <p className="text-[10px] text-slate-400 italic pt-0.5">
                      "{hist.notes}"
                    </p>
                  )}
                </div>
              ))}

              {entryAudits.map((aud, idx) => (
                <div
                  key={aud.id || idx}
                  className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <FileText className="w-3 h-3 text-cyan-400" />
                    <span>{aud.type.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px]">
                    {new Date(aud.timestamp).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
