import React, { useState } from 'react';
import {
  X,
  Archive,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { DigitalWallet } from '../../types';

interface ArchiveWalletModalProps {
  isOpen: boolean;
  wallet: DigitalWallet | null;
  onClose: () => void;
  onArchive: (id: string, closureDate?: string, finalBalance?: number, closureNote?: string) => Promise<void>;
}

export const ArchiveWalletModal: React.FC<ArchiveWalletModalProps> = ({
  isOpen,
  wallet,
  onClose,
  onArchive,
}) => {
  const [settleToZero, setSettleToZero] = useState(false);
  const [closureNote, setClosureNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !wallet) return null;

  const balance = Number(wallet.balance || 0);
  const hasNonZeroBalance = balance !== 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: wallet.currency || 'INR',
      maximumFractionDigits: 2,
    }).format(Math.abs(val));
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const finalBal = settleToZero ? 0 : balance;
      const today = new Date().toISOString();

      await onArchive(
        wallet.id,
        today,
        finalBal,
        closureNote.trim() || undefined
      );

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to archive wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id={`archive-wallet-modal-${wallet.id}`}
        className="w-full max-w-md max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Archive Digital Wallet</h2>
              <p className="text-xs text-neutral-400">{wallet.displayName || wallet.name}</p>
            </div>
          </div>
          <button
            id="close-archive-modal-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Non-zero Balance Warning */}
          {hasNonZeroBalance ? (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Non-Zero Balance Notice</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                This wallet currently contains{' '}
                <strong className="text-white font-mono font-bold">
                  {balance < 0 ? '-' : ''}
                  {formatCurrency(balance)}
                </strong>
                . Are you sure you want to archive it?
              </p>
            </div>
          ) : (
            <p className="text-xs text-neutral-400">
              Archiving removes this wallet from active views while preserving all transaction and balance history.
            </p>
          )}

          {/* Notice about preservation & restoring */}
          <div className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-700/60 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Archived wallets retain their complete historical records and can be restored back to active state at any time from the Archived tab.
            </p>
          </div>

          {/* Settle to ₹0 Option */}
          {hasNonZeroBalance && (
            <div className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-700/60 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Settle balance to ₹0 on archive
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  Records a final zero-balance settlement
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  id="settle-zero-toggle"
                  type="checkbox"
                  checked={settleToZero}
                  onChange={(e) => setSettleToZero(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          )}

          {/* Optional Closure Note */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Closure Note (Optional)
            </label>
            <input
              id="input-closure-note"
              type="text"
              value={closureNote}
              onChange={(e) => setClosureNote(e.target.value)}
              placeholder="e.g. Account deactivated / Stopped using"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/40 border border-neutral-700/60 text-white text-xs focus:outline-none focus:border-rose-500 placeholder-neutral-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            id="cancel-archive-wallet-btn"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-archive-wallet-btn"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Archiving...' : 'Archive Wallet'}
          </button>
        </div>
      </div>
    </div>
  );
};
