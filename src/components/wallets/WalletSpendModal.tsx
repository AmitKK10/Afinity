import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpRight,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { DigitalWallet } from '../../types';
import { SelectField } from '../ui/SelectionSheet';

interface WalletSpendModalProps {
  isOpen: boolean;
  wallets: DigitalWallet[];
  preselectedWalletId?: string;
  onClose: () => void;
  onSpend: (walletId: string, amount: number, reason?: string) => Promise<DigitalWallet>;
}

const SPEND_PURPOSES = [
  'Amazon Online Shopping',
  'Food Delivery (Swiggy / Zomato)',
  'Electricity / Utility Bill',
  'Mobile / DTH Recharge',
  'Cab / Travel Booking',
  'Offline Store Merchant Scan',
  'Subscription Renewal',
];

export const WalletSpendModal: React.FC<WalletSpendModalProps> = ({
  isOpen,
  wallets,
  preselectedWalletId,
  onClose,
  onSpend,
}) => {
  const activeWallets = wallets.filter((w) => w.status !== 'archived' && w.status !== 'closed');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('Amazon Online Shopping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedWalletId) {
      setSelectedWalletId(preselectedWalletId);
    } else if (activeWallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(activeWallets[0].id);
    }
  }, [preselectedWalletId, activeWallets, selectedWalletId]);

  if (!isOpen) return null;

  const currentWallet = activeWallets.find((w) => w.id === selectedWalletId);
  const currentBalance = currentWallet ? Number(currentWallet.balance || 0) : 0;
  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const newBalance = isValidAmount ? currentBalance - parsedAmount : currentBalance;
  const isOverdraft = newBalance < 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currentWallet?.currency || 'INR',
      maximumFractionDigits: 2,
    }).format(Math.abs(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletId) {
      setError('Please select a wallet');
      return;
    }
    if (!isValidAmount) {
      setError('Please enter a valid spend amount greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSpend(selectedWalletId, parsedAmount, purpose.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record wallet spend');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="wallet-spend-modal"
        className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Spend / Redeem Balance</h2>
              <p className="text-xs text-neutral-400">
                Record purchases & redemptions from stored balance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Source Wallet selection */}
          <div>
            <SelectField
              label="Select Source Wallet *"
              value={selectedWalletId}
              onChange={(val) => setSelectedWalletId(val)}
              options={activeWallets.map((w) => ({
                value: w.id,
                label: w.displayName || w.name,
                sublabel: w.providerName || w.provider || 'Digital Wallet',
                badge: `₹${Number(w.balance || 0).toLocaleString('en-IN')}`,
                badgeColor: 'amber' as const,
                icon: <Wallet className="w-4 h-4 text-amber-400" />,
              }))}
            />
          </div>

          {/* Spend Amount */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Amount Spent (₹) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 499"
                className="w-full px-4 py-3 rounded-xl bg-neutral-800/80 border border-neutral-700 text-white font-mono text-xl font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <span className="absolute right-3.5 top-3.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                - DEBIT
              </span>
            </div>
          </div>

          {/* Live Balance preview */}
          {currentWallet && (
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isOverdraft
                ? 'bg-rose-950/20 border-rose-500/30'
                : 'bg-neutral-800/40 border-neutral-700/60'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  Current
                </span>
                <p className="text-sm font-bold font-mono text-neutral-300">
                  {formatCurrency(currentBalance)}
                </p>
              </div>

              <ArrowRight className="w-4 h-4 text-neutral-500" />

              <div className="text-right">
                <span className={`text-[10px] uppercase font-bold ${
                  isOverdraft ? 'text-rose-400' : 'text-neutral-300'
                }`}>
                  Remaining Balance
                </span>
                <p className={`text-sm font-bold font-mono ${
                  isOverdraft ? 'text-rose-400' : 'text-white'
                }`}>
                  {isOverdraft ? '-' : ''}
                  {formatCurrency(newBalance)}
                </p>
              </div>
            </div>
          )}

          {isOverdraft && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              This spend exceeds current wallet balance and will create an overdraft.
            </p>
          )}

          {/* Purpose presets */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Merchant / Purchase Purpose
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SPEND_PURPOSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    purpose === p
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                      : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Order #123-45678"
              className="w-full px-3 py-2 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidAmount}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Recording...' : 'Record Spend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
