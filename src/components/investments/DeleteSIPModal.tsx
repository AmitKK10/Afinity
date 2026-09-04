import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { SIPRecord } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { formatRupee } from '../../utils/formatters';

interface DeleteSIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  sip: SIPRecord | null;
  onConfirmDelete: (sip: SIPRecord) => Promise<void>;
}

export const DeleteSIPModal: React.FC<DeleteSIPModalProps> = ({
  isOpen,
  onClose,
  sip,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !sip) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(sip);
      onClose();
    } catch (err) {
      console.error('Failed to delete SIP', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-600/40 shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white font-heading">
            Delete SIP Mandate?
          </h3>
          <p className="text-xs text-slate-300">
            Are you sure you want to permanently delete this SIP mandate for{' '}
            <span className="font-bold text-white">{sip.fundName}</span>?
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Installment Amount:</span>
            <span className="text-white font-bold">{formatRupee(sip.amount)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Deduction Bank:</span>
            <span className="text-slate-200">{sip.bankName || 'No bank assigned'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Deduction Day:</span>
            <span className="text-slate-200">{sip.deductionDay}th of month</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Note: Deleting this SIP mandate removes it from Afinity balance safety monitoring. It will not affect past executed transactions or your external bank account.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-900/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 font-heading min-h-[38px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete SIP'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
