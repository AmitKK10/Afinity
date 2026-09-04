import React, { useState } from 'react';
import { X, XCircle, AlertTriangle, Landmark } from 'lucide-react';
import { BankAccount } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { formatRupee } from '../../utils/formatters';

interface CloseBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount | null;
}

export const CloseBankAccountModal: React.FC<CloseBankAccountModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const { closeBankAccount } = useFinancialData();

  const [closureDate, setClosureDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [finalBalance, setFinalBalance] = useState<string>('0');
  const [closureNote, setClosureNote] = useState<string>('Account closed with bank');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rawBal = finalBalance.trim();
    const numBal = rawBal === '' || rawBal === '-' ? 0 : parseFloat(rawBal);
    if (isNaN(numBal)) {
      setError('Please enter a valid final balance');
      return;
    }

    setIsSubmitting(true);
    try {
      await closeBankAccount(account.id, closureDate, numBal, closureNote.trim());
      onClose();
    } catch (err: any) {
      console.error('Failed to close bank account:', err);
      setError(err?.message || 'Failed to close bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-close-bank-account"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#0d1629] border border-slate-700/80 shadow-2xl p-6 text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Close Bank Account</h2>
              <p className="text-xs text-slate-400">
                {account.displayName || account.name} ({account.accountNumberMasked || '••••'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              Closing this account will mark it as archived. Historical balance records and audit events are preserved permanently.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Closure Date
            </label>
            <input
              type="date"
              value={closureDate}
              onChange={(e) => setClosureDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Settlement / Final Balance (₹)
            </label>
            <FinancialAmountInput
              id="input-close-bank-final-balance"
              value={finalBalance}
              onChange={setFinalBalance}
              allowNegative={true}
              currencySymbol="₹"
              placeholder="0"
              inputClassName="text-base font-bold focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Closure Note
            </label>
            <input
              type="text"
              value={closureNote}
              onChange={(e) => setClosureNote(e.target.value)}
              placeholder="e.g. Switched primary corporate bank"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Action CTAs */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Closing Account...' : 'Confirm Account Closure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
