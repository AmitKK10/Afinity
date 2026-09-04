import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  ArrowRight,
  TrendingUp,
  CreditCard as CardIcon,
  ShoppingBag,
  Building2,
  Wallet as WalletIcon,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import { DigitalWallet, CashbackSource, CashbackType } from '../../types';
import { SelectField } from '../ui/SelectionSheet';

export type CashbackModalMode = 'earn' | 'use' | 'adjust';

interface CashbackModalProps {
  isOpen: boolean;
  initialMode?: CashbackModalMode;
  wallets: DigitalWallet[];
  preselectedWalletId?: string;
  onClose: () => void;
  onRecordEarned: (
    walletId: string,
    amount: number,
    source: CashbackSource | string,
    date?: string,
    description?: string
  ) => Promise<unknown>;
  onRecordUsed: (
    walletId: string,
    amount: number,
    source: CashbackSource | string,
    date?: string,
    description?: string
  ) => Promise<unknown>;
  onRecordAdjustment: (
    walletId: string,
    newBalance: number,
    source: CashbackSource | string,
    date?: string,
    description?: string
  ) => Promise<unknown>;
}

const CASHBACK_SOURCES: { label: CashbackSource; icon: React.FC<{ className?: string }> }[] = [
  { label: 'Credit Card', icon: CardIcon },
  { label: 'Shopping', icon: ShoppingBag },
  { label: 'Bank', icon: Building2 },
  { label: 'Wallet', icon: WalletIcon },
  { label: 'Other', icon: Tag },
];

const SOURCE_PRESETS: Record<CashbackSource, string[]> = {
  'Credit Card': [
    'Credit Card 5% Statement Cashback',
    'Amazon ICICI 5% Shopping Reward',
    'Axis Ace 2% Bill Payment Cashback',
    'SBI Cashback 5% Online Spend',
  ],
  Shopping: [
    'Amazon Pay Promo Reward',
    'Flipkart SuperCoin Conversion',
    'Swiggy / Zomato Dining Cashback',
    'Myntra / Brand Purchase Promo',
  ],
  Bank: [
    'Bank Debit Card Spend Promo',
    'Netbanking UPI Transaction Reward',
    'Salary Account Monthly Cashback',
    'Fixed Deposit Opening Incentive',
  ],
  Wallet: [
    'Paytm Scratch Card Win',
    'PhonePe Merchant Reward',
    'GPay UPI Scratch Reward',
    'MobiKwik SuperCash Redemption',
  ],
  Other: [
    'Friend Referral Bonus',
    'Survey / Review Incentive',
    'Loyalty Redemption',
    'Manual Correction / Top-up',
  ],
};

export const CashbackModal: React.FC<CashbackModalProps> = ({
  isOpen,
  initialMode = 'earn',
  wallets,
  preselectedWalletId,
  onClose,
  onRecordEarned,
  onRecordUsed,
  onRecordAdjustment,
}) => {
  const activeWallets = wallets.filter((w) => w.status !== 'archived' && w.status !== 'closed');
  const [mode, setMode] = useState<CashbackModalMode>(initialMode);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [source, setSource] = useState<CashbackSource>('Credit Card');
  const [description, setDescription] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setAmount('');
      setDescription('');
      setTxDate(new Date().toISOString().split('T')[0]);

      if (preselectedWalletId) {
        setSelectedWalletId(preselectedWalletId);
      } else if (activeWallets.length > 0) {
        // Prioritize a dedicated cashback or reward wallet
        const cbWallet = activeWallets.find(
          (w) =>
            w.walletType === 'CASHBACK' ||
            w.walletType === 'cashback' ||
            w.walletType === 'reward' ||
            w.name.toLowerCase().includes('cashback')
        );
        setSelectedWalletId(cbWallet ? cbWallet.id : activeWallets[0].id);
      }
    }
  }, [isOpen, initialMode, preselectedWalletId, activeWallets.length]);

  if (!isOpen) return null;

  const currentWallet = activeWallets.find((w) => w.id === selectedWalletId);
  const currentBalance = currentWallet ? Number(currentWallet.balance || 0) : 0;
  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && (mode === 'adjust' ? parsedAmount >= 0 : parsedAmount > 0);

  // Calculate new balance based on mode
  let projectedNewBalance = currentBalance;
  if (isValidAmount) {
    if (mode === 'earn') {
      projectedNewBalance = Math.round((currentBalance + parsedAmount) * 100) / 100;
    } else if (mode === 'use') {
      projectedNewBalance = Math.round((currentBalance - parsedAmount) * 100) / 100;
    } else if (mode === 'adjust') {
      projectedNewBalance = Math.round(parsedAmount * 100) / 100;
    }
  }

  const isOverdrawn = mode === 'use' && isValidAmount && projectedNewBalance < 0 && !currentWallet?.allowNegativeBalance;

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
      setError('Please select a target wallet or cashback account');
      return;
    }
    if (!isValidAmount) {
      setError(
        mode === 'adjust'
          ? 'Please enter a valid balance amount (0 or greater)'
          : 'Please enter a valid amount greater than 0'
      );
      return;
    }
    if (isOverdrawn) {
      setError(
        `Insufficient balance. Available: ₹${currentBalance.toLocaleString('en-IN')}, Requested: ₹${parsedAmount.toLocaleString('en-IN')}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const desc = description.trim() || undefined;

      if (mode === 'earn') {
        await onRecordEarned(selectedWalletId, parsedAmount, source, txDate, desc);
      } else if (mode === 'use') {
        await onRecordUsed(selectedWalletId, parsedAmount, source, txDate, desc);
      } else if (mode === 'adjust') {
        await onRecordAdjustment(selectedWalletId, parsedAmount, source, txDate, desc);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record cashback operation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="cashback-modal"
        className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                mode === 'earn'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : mode === 'use'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              }`}
            >
              {mode === 'earn' ? (
                <PlusCircle className="w-5 h-5" />
              ) : mode === 'use' ? (
                <MinusCircle className="w-5 h-5" />
              ) : (
                <RotateCcw className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'earn'
                  ? 'Record Cashback Earned'
                  : mode === 'use'
                  ? 'Record Cashback Used / Redeemed'
                  : 'Adjust Cashback Balance'}
              </h2>
              <p className="text-xs text-neutral-400">
                Track cashback from credit cards, shopping, banks, and wallets
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

        {/* Mode Switcher Tabs */}
        <div className="mt-4 p-1 rounded-2xl bg-neutral-950 border border-neutral-800 flex gap-1">
          <button
            type="button"
            id="tab-mode-earn"
            onClick={() => {
              setMode('earn');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'earn'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Earn Cashback</span>
          </button>

          <button
            type="button"
            id="tab-mode-use"
            onClick={() => {
              setMode('use');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'use'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>- Use Cashback</span>
          </button>

          <button
            type="button"
            id="tab-mode-adjust"
            onClick={() => {
              setMode('adjust');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'adjust'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Adjust</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target Wallet Account */}
          <div>
            <SelectField
              label="Wallet / Cashback Account *"
              value={selectedWalletId}
              onChange={(val) => setSelectedWalletId(val)}
              options={activeWallets.map((w) => ({
                value: w.id,
                label: w.displayName || w.name,
                sublabel: w.providerName || w.provider || 'Digital Wallet',
                badge: `₹${w.balance.toLocaleString('en-IN')}`,
                badgeColor: (w.walletType === 'CASHBACK' || w.walletType === 'cashback') ? ('amber' as const) : ('purple' as const),
                icon: <WalletIcon className="w-4 h-4 text-indigo-400" />,
              }))}
            />
          </div>

          {/* Amount input with direction badge */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                {mode === 'earn'
                  ? 'Cashback Amount Earned (₹) *'
                  : mode === 'use'
                  ? 'Cashback Amount Used / Redeemed (₹) *'
                  : 'New Reconciled Balance (₹) *'}
              </label>
              <span className="text-[11px] text-neutral-400 font-medium">
                Current: <strong className="text-neutral-200">{formatCurrency(currentBalance)}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                id="cashback-amount-input"
                type="number"
                step="any"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 250"
                className={`w-full px-4 py-3 rounded-xl bg-neutral-800/80 border font-mono text-xl font-bold focus:outline-none transition-all ${
                  isOverdrawn
                    ? 'border-rose-500 text-rose-400 focus:ring-1 focus:ring-rose-500'
                    : 'border-neutral-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
              <span
                className={`absolute right-3.5 top-3.5 text-xs font-bold px-2 py-0.5 rounded-md border ${
                  mode === 'earn'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : mode === 'use'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                }`}
              >
                {mode === 'earn' ? '+ CREDIT' : mode === 'use' ? '- DEBIT' : '= SET'}
              </span>
            </div>
          </div>

          {/* Balance projection display */}
          {currentWallet && isValidAmount && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                isOverdrawn
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : mode === 'earn'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-indigo-950/20 border-indigo-500/30'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Current</span>
                <span className="text-sm font-bold font-mono text-neutral-300">
                  {formatCurrency(currentBalance)}
                </span>
              </div>

              <ArrowRight
                className={`w-4 h-4 ${
                  isOverdrawn ? 'text-rose-400' : mode === 'earn' ? 'text-emerald-400' : 'text-indigo-400'
                }`}
              />

              <div className="text-right">
                <span
                  className={`text-[10px] uppercase font-bold block ${
                    isOverdrawn
                      ? 'text-rose-400'
                      : mode === 'earn'
                      ? 'text-emerald-400'
                      : 'text-indigo-400'
                  }`}
                >
                  Projected New Balance
                </span>
                <span
                  className={`text-sm font-bold font-mono ${
                    isOverdrawn
                      ? 'text-rose-400'
                      : mode === 'earn'
                      ? 'text-emerald-400'
                      : 'text-indigo-300'
                  }`}
                >
                  {formatCurrency(projectedNewBalance)}
                </span>
              </div>
            </div>
          )}

          {/* Cashback Source Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Cashback Source
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {CASHBACK_SOURCES.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  id={`source-btn-${label.toLowerCase().replace(' ', '-')}`}
                  onClick={() => {
                    setSource(label);
                    if (!description) {
                      setDescription(SOURCE_PRESETS[label][0]);
                    }
                  }}
                  className={`py-2 px-1.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                    source === label
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold shadow-sm'
                      : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${source === label ? 'text-indigo-400' : 'text-neutral-400'}`} />
                  <span className="text-[10px] leading-tight truncate w-full">{label}</span>
                </button>
              ))}
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SOURCE_PRESETS[source].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDescription(p)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    description === p
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-semibold'
                      : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Custom description */}
            <input
              id="cashback-description-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. HDFC 5% cashback on grocery bill"
              className="w-full px-3.5 py-2 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Transaction Date
            </label>
            <div className="relative">
              <input
                id="cashback-date-input"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              id="btn-submit-cashback"
              disabled={isSubmitting || !isValidAmount || isOverdrawn}
              className={`px-5 py-2 rounded-xl disabled:opacity-40 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 ${
                mode === 'earn'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : mode === 'use'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {isSubmitting ? (
                'Processing...'
              ) : mode === 'earn' ? (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Credit ₹{parsedAmount ? parsedAmount.toLocaleString('en-IN') : '0'}</span>
                </>
              ) : mode === 'use' ? (
                <>
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span>Use ₹{parsedAmount ? parsedAmount.toLocaleString('en-IN') : '0'}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Update Balance</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
