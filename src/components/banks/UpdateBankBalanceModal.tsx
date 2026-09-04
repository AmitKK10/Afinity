import React, { useState } from 'react';
import { X, Edit3, Landmark, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { BankAccount } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { formatRupee } from '../../utils/formatters';

interface UpdateBankBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount | null;
}

export const UpdateBankBalanceModal: React.FC<UpdateBankBalanceModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const { updateBankAccountBalance } = useFinancialData();

  const [newBalance, setNewBalance] = useState<string>('');
  const [reason, setReason] = useState<string>('Periodic reconciliation');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (account) {
      setNewBalance((account.balance || 0).toString());
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const currentBalance = Number(account.balance || 0);
  const rawTarget = newBalance.trim();
  const targetBalance = rawTarget === '' || rawTarget === '-' ? 0 : parseFloat(rawTarget);
  const delta = targetBalance - currentBalance;
  const isOverdrawn = targetBalance < 0 || newBalance.startsWith('-');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rawBal = newBalance.trim();
    const numBal = rawBal === '' || rawBal === '-' ? 0 : parseFloat(rawBal);
    if (isNaN(numBal)) {
      setError('Please enter a valid numeric balance');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBankAccountBalance(account.id, numBal, reason.trim() || undefined);
      onClose();
    } catch (err: any) {
      console.error('Failed to update bank balance:', err);
      setError(err?.message || 'Failed to update balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-update-bank-balance"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#0d1629] border border-slate-700/80 shadow-2xl p-6 text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Adjust Balance</h2>
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
          {/* Current vs New Delta Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Current Balance</span>
              <MoneyDisplay amount={currentBalance} size="md" className="text-slate-300 font-bold" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase block">Difference</span>
              <span
                className={`text-sm font-bold font-mono ${
                  delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {delta > 0 ? `+${formatRupee(delta)}` : delta < 0 ? `-${formatRupee(Math.abs(delta))}` : '₹0'}
              </span>
            </div>
          </div>

          {/* New Balance Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                New Bank Balance (₹)
              </label>
              {isOverdrawn && (
                <span className="text-[10px] text-rose-400 flex items-center gap-1 font-bold">
                  <AlertTriangle className="w-3 h-3" /> Overdraft Liability
                </span>
              )}
            </div>
            <FinancialAmountInput
              id="input-update-bank-balance"
              value={newBalance}
              onChange={setNewBalance}
              allowNegative={true}
              autoFocus
              currencySymbol="₹"
              placeholder="0"
              inputClassName={`text-lg font-bold ${
                isOverdrawn ? 'border-rose-600 focus:border-rose-500 text-rose-400' : 'border-slate-800 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Preset Quick Adjustments */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">Quick Adjustments</span>
            <div className="flex flex-wrap gap-1.5">
              {[+500, +1000, +5000, -500, -1000, -5000].map((adj) => (
                <button
                  type="button"
                  key={adj}
                  onClick={() => setNewBalance((targetBalance + adj).toString())}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-all"
                >
                  {adj > 0 ? `+${formatRupee(adj)}` : `-${formatRupee(Math.abs(adj))}`}
                </button>
              ))}
            </div>
          </div>

          {/* Reason / Audit note */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Reason for Adjustment
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Salary credited, monthly interest, statement sync"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
