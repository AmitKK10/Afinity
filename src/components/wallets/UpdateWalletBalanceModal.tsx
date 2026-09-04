import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { DigitalWallet } from '../../types';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { SelectField } from '../ui/SelectionSheet';

interface UpdateWalletBalanceModalProps {
  isOpen: boolean;
  wallet: DigitalWallet | null;
  onClose: () => void;
  onUpdateBalance: (id: string, newBalance: number, reason?: string) => Promise<DigitalWallet>;
}

export const UpdateWalletBalanceModal: React.FC<UpdateWalletBalanceModalProps> = ({
  isOpen,
  wallet,
  onClose,
  onUpdateBalance,
}) => {
  const [newBalance, setNewBalance] = useState<string>('');
  const [reasonCategory, setReasonCategory] = useState<string>('Balance Correction');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallet) {
      setNewBalance(wallet.balance.toString());
      setReasonCategory('Balance Correction');
      setCustomReason('');
      setError(null);
    }
  }, [wallet]);

  if (!isOpen || !wallet) return null;

  const currentBalance = Number(wallet.balance || 0);
  const rawEntered = newBalance.trim();
  const enteredBalance = rawEntered === '' || rawEntered === '-' ? 0 : parseFloat(rawEntered);
  const isValidNumber = !isNaN(enteredBalance) && rawEntered !== '-';
  const diff = isValidNumber ? enteredBalance - currentBalance : 0;
  const isNegativeEntered = isValidNumber && enteredBalance < 0;
  const allowNegative = wallet.allowNegativeBalance === true || isNegativeEntered;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: wallet.currency || 'INR',
      maximumFractionDigits: 2,
    }).format(Math.abs(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNumber && rawEntered !== '') {
      setError('Please enter a valid numeric balance amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const finalReason = customReason.trim()
        ? `${reasonCategory}: ${customReason.trim()}`
        : reasonCategory;

      await onUpdateBalance(wallet.id, enteredBalance, finalReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id={`update-balance-modal-${wallet.id}`}
        className="w-full max-w-md max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Update Wallet Balance</h2>
              <p className="text-xs text-neutral-400">{wallet.displayName || wallet.name}</p>
            </div>
          </div>
          <button
            id="close-update-balance-modal-btn"
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
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Balance Display */}
          <div className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-700/60 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
              Current Balance
            </span>
            <span
              className={`font-mono text-base font-bold ${
                currentBalance < 0 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {currentBalance < 0 ? '-' : ''}
              {formatCurrency(currentBalance)}
            </span>
          </div>

          {/* New Balance Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              New Balance (₹) *
            </label>
            <FinancialAmountInput
              id="input-new-wallet-balance"
              value={newBalance}
              onChange={setNewBalance}
              allowNegative={true}
              currencySymbol="₹"
              placeholder="0.00"
              inputClassName="text-xl font-bold focus:border-sky-500"
            />
          </div>

          {/* Difference & Direction Indicator */}
          {isValidNumber && diff !== 0 && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                diff > 0
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {diff > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">
                  {diff > 0 ? 'Balance Increase' : 'Balance Decrease'}
                </span>
              </div>
              <span className="font-mono text-xs font-bold">
                {diff > 0 ? '+' : '-'}
                {formatCurrency(diff)}
              </span>
            </div>
          )}

          {/* Negative Balance Notice / Warning */}
          {isNegativeEntered && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                allowNegative
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">
                  {allowNegative ? 'Negative Balance Allowed' : 'Negative Balance Restricted'}
                </span>
                <span className="text-[11px] text-neutral-300 block mt-0.5">
                  {allowNegative
                    ? 'This balance will be treated as an overdraft liability in net worth calculations.'
                    : 'This wallet is configured to restrict negative balances. Please enter ₹0 or higher.'}
                </span>
              </div>
            </div>
          )}

          {/* Reason Selector */}
          <div>
            <SelectField
              label="Reason for Adjustment"
              value={reasonCategory}
              onChange={(val) => setReasonCategory(val)}
              options={[
                { value: 'Balance Correction', label: 'Balance Correction', sublabel: 'Reconcile or update to latest balance', badge: 'Reconcile', badgeColor: 'blue' },
                { value: 'Cashback', label: 'Cashback', sublabel: 'Reward or promotional cashback credited', badge: 'Rewards', badgeColor: 'amber' },
                { value: 'Refund', label: 'Refund', sublabel: 'Returned item refund received', badge: 'Refund', badgeColor: 'emerald' },
                { value: 'Manual Adjustment', label: 'Manual Adjustment', sublabel: 'Manual correction', badge: 'Adjustment', badgeColor: 'purple' },
                { value: 'Other', label: 'Other', sublabel: 'Custom note', badge: 'Custom', badgeColor: 'slate' },
              ]}
            />
          </div>

          {/* Optional Reason Text */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Additional Note (Optional)
            </label>
            <input
              id="input-adjustment-note"
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Swiggy cashback credited, monthly reconciliation"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/40 border border-neutral-700/60 text-white text-xs focus:outline-none focus:border-sky-500 placeholder-neutral-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            id="cancel-update-balance-btn"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="submit-update-balance-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || (isNegativeEntered && !allowNegative)}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Updating...' : 'Save Balance'}
          </button>
        </div>
      </div>
    </div>
  );
};
