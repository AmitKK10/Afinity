import React from 'react';
import { X, ArrowRightLeft, Landmark, Banknote, Smartphone, ShieldCheck, Clock } from 'lucide-react';
import { InternalTransferRecord } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { formatRupee } from '../../utils/formatters';

interface BankTransferHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankTransferHistoryModal: React.FC<BankTransferHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { transfers } = useFinancialData();

  if (!isOpen) return null;

  return (
    <div
      id="modal-bank-transfer-history"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0d1629] border border-slate-700/80 shadow-2xl p-6 sm:p-7 text-white animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Internal Transfer Audit Logs</h2>
              <p className="text-xs text-slate-400">All historical movements across bank, cash, and wallet accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer list */}
        <div className="overflow-y-auto space-y-3 py-4 flex-1">
          {transfers.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No internal transfer records recorded yet.
            </div>
          ) : (
            transfers.map((trf) => (
              <div
                key={trf.id}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{trf.fromEntityName}</span>
                      <span className="text-slate-500 font-normal">→</span>
                      <span className="text-emerald-400">{trf.toEntityName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(trf.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {trf.notes && <span>• "{trf.notes}"</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <MoneyDisplay amount={trf.amount} size="md" className="text-white font-bold" />
                  <span className="text-[10px] text-blue-400 block font-mono">Net Worth ±₹0</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Double-entry balanced
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
