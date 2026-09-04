import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Wallet,
} from 'lucide-react';
import { DigitalWallet } from '../../types';
import { SelectField } from '../ui/SelectionSheet';

interface AddCashbackModalProps {
  isOpen: boolean;
  wallets: DigitalWallet[];
  preselectedWalletId?: string;
  onClose: () => void;
  onAddCashback: (walletId: string, amount: number, reason?: string) => Promise<DigitalWallet>;
}

const CASHBACK_SOURCES = [
  'Amazon Pay Rewards (Shopping)',
  'Credit Card 5% Cashback',
  'UPI Scratch Card Reward',
  'Merchant Promo Cashback',
  'Utility Bill Payment Reward',
  'Loyalty Referral Bonus',
  'SuperCoins / Points Conversion',
];

export const AddCashbackModal: React.FC<AddCashbackModalProps> = ({
  isOpen,
  wallets,
  preselectedWalletId,
  onClose,
  onAddCashback,
}) => {
  const activeWallets = wallets.filter((w) => w.status !== 'archived' && w.status !== 'closed');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [source, setSource] = useState<string>('Amazon Pay Rewards (Shopping)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedWalletId) {
      setSelectedWalletId(preselectedWalletId);
    } else if (activeWallets.length > 0 && !selectedWalletId) {
      // Prefer a cashback or first wallet
      const cashbackWallet = activeWallets.find(
        (w) => w.walletType === 'cashback' || w.walletType === 'reward'
      );
      setSelectedWalletId(cashbackWallet ? cashbackWallet.id : activeWallets[0].id);
    }
  }, [preselectedWalletId, activeWallets, selectedWalletId]);

  if (!isOpen) return null;

  const currentWallet = activeWallets.find((w) => w.id === selectedWalletId);
  const currentBalance = currentWallet ? Number(currentWallet.balance || 0) : 0;
  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const newBalance = isValidAmount ? currentBalance + parsedAmount : currentBalance;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currentWallet?.currency || 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletId) {
      setError('Please select a target wallet');
      return;
    }
    if (!isValidAmount) {
      setError('Please enter a valid cashback amount greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddCashback(selectedWalletId, parsedAmount, source.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to credit cashback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="add-cashback-modal"
        className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Credit Cashback / Reward</h2>
              <p className="text-xs text-neutral-400">
                Log earned cashbacks, scratch cards & vouchers
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
          {/* Target Wallet selection */}
          <div>
            <SelectField
              label="Select Destination Wallet *"
              value={selectedWalletId}
              onChange={(val) => setSelectedWalletId(val)}
              options={activeWallets.map((w) => ({
                value: w.id,
                label: w.displayName || w.name,
                sublabel: w.providerName || w.provider || 'Digital Wallet',
                badge: `₹${Number(w.balance || 0).toLocaleString('en-IN')}`,
                badgeColor: w.walletType === 'cashback' ? ('emerald' as const) : ('blue' as const),
                icon: <Wallet className="w-4 h-4 text-emerald-400" />,
              }))}
            />
          </div>

          {/* Cashback Amount */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Cashback Earned (₹) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 150"
                className="w-full px-4 py-3 rounded-xl bg-neutral-800/80 border border-neutral-700 text-white font-mono text-xl font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute right-3.5 top-3.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                + CREDIT
              </span>
            </div>
          </div>

          {/* Live Balance preview */}
          {currentWallet && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  Current
                </span>
                <p className="text-sm font-bold font-mono text-neutral-300">
                  {formatCurrency(currentBalance)}
                </p>
              </div>

              <ArrowRight className="w-4 h-4 text-emerald-400" />

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-400">
                  New Balance
                </span>
                <p className="text-sm font-bold font-mono text-emerald-400">
                  {formatCurrency(newBalance)}
                </p>
              </div>
            </div>
          )}

          {/* Reason / Source preset */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Reward Campaign / Source
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CASHBACK_SOURCES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    source === s
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                      : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Amazon Pay promo credit"
              className="w-full px-3 py-2 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white text-xs focus:outline-none focus:border-emerald-500"
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Crediting...' : 'Credit Cashback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
