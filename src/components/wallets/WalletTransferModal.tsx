import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeftRight,
  ArrowRight,
  Wallet,
  Building2,
  Banknote,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  DigitalWallet,
  BankAccount,
  CashHoldingAccount,
  InternalTransferRecord,
} from '../../types';
import { SelectField, SelectOption } from '../ui/SelectionSheet';
import { BankBrandBadge } from '../brand/BankBrandBadge';

type TransferMode =
  | 'bank_to_wallet'
  | 'wallet_to_bank'
  | 'wallet_to_wallet'
  | 'cash_to_wallet'
  | 'wallet_to_cash';

interface WalletTransferModalProps {
  isOpen: boolean;
  wallets: DigitalWallet[];
  bankAccounts: BankAccount[];
  cashHoldings: CashHoldingAccount[];
  initialWalletId?: string;
  initialMode?: TransferMode;
  onClose: () => void;
  onTransferBankToWallet: (bankId: string, walletId: string, amount: number, notes?: string) => Promise<any>;
  onTransferWalletToBank: (walletId: string, bankId: string, amount: number, notes?: string) => Promise<any>;
  onTransferWalletToWallet: (fromId: string, toId: string, amount: number, notes?: string) => Promise<any>;
  onTransferCashToWallet: (cashId: string, walletId: string, amount: number, notes?: string) => Promise<any>;
  onTransferWalletToCash: (walletId: string, cashId: string, amount: number, notes?: string) => Promise<any>;
}

export const WalletTransferModal: React.FC<WalletTransferModalProps> = ({
  isOpen,
  wallets,
  bankAccounts,
  cashHoldings,
  initialWalletId,
  initialMode = 'bank_to_wallet',
  onClose,
  onTransferBankToWallet,
  onTransferWalletToBank,
  onTransferWalletToWallet,
  onTransferCashToWallet,
  onTransferWalletToCash,
}) => {
  const activeWallets = useMemo(() => wallets.filter((w) => w.status !== 'archived' && w.status !== 'closed'), [wallets]);
  const activeBanks = useMemo(() => bankAccounts.filter((b) => b.status !== 'archived' && b.status !== 'closed'), [bankAccounts]);
  const activeCash = useMemo(() => cashHoldings.filter((c) => c.status !== 'archived' && c.status !== 'closed'), [cashHoldings]);

  const [mode, setMode] = useState<TransferMode>(initialMode);
  const [sourceId, setSourceId] = useState<string>('');
  const [destId, setDestId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize source/dest based on mode
  useEffect(() => {
    if (isOpen && initialMode) setMode(initialMode);
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (mode === 'bank_to_wallet') {
      if (activeBanks.length > 0) setSourceId(activeBanks[0].id);
      if (initialWalletId) {
        setDestId(initialWalletId);
      } else if (activeWallets.length > 0) {
        setDestId(activeWallets[0].id);
      }
    } else if (mode === 'wallet_to_bank') {
      if (initialWalletId) {
        setSourceId(initialWalletId);
      } else if (activeWallets.length > 0) {
        setSourceId(activeWallets[0].id);
      }
      if (activeBanks.length > 0) setDestId(activeBanks[0].id);
    } else if (mode === 'wallet_to_wallet') {
      if (initialWalletId) {
        setSourceId(initialWalletId);
        const otherWallet = activeWallets.find((w) => w.id !== initialWalletId);
        if (otherWallet) setDestId(otherWallet.id);
      } else if (activeWallets.length >= 2) {
        setSourceId(activeWallets[0].id);
        setDestId(activeWallets[1].id);
      }
    } else if (mode === 'cash_to_wallet') {
      if (activeCash.length > 0) setSourceId(activeCash[0].id);
      if (initialWalletId) {
        setDestId(initialWalletId);
      } else if (activeWallets.length > 0) {
        setDestId(activeWallets[0].id);
      }
    } else if (mode === 'wallet_to_cash') {
      if (initialWalletId) {
        setSourceId(initialWalletId);
      } else if (activeWallets.length > 0) {
        setSourceId(activeWallets[0].id);
      }
      if (activeCash.length > 0) setDestId(activeCash[0].id);
    }
  }, [isOpen, mode, initialWalletId, activeWallets.length, activeBanks.length, activeCash.length]);

  if (!isOpen) return null;

  // Resolve source and destination details
  const getSourceEntity = () => {
    if (mode === 'bank_to_wallet') return activeBanks.find((b) => b.id === sourceId);
    if (mode === 'cash_to_wallet') return activeCash.find((c) => c.id === sourceId);
    return activeWallets.find((w) => w.id === sourceId);
  };

  const getDestEntity = () => {
    if (mode === 'wallet_to_bank') return activeBanks.find((b) => b.id === destId);
    if (mode === 'wallet_to_cash') return activeCash.find((c) => c.id === destId);
    return activeWallets.find((w) => w.id === destId);
  };

  const sourceEntity = getSourceEntity();
  const destEntity = getDestEntity();

  const sourceOptions = useMemo<SelectOption<string>[]>(() => {
    if (mode === 'bank_to_wallet') {
      return activeBanks.map((b) => ({
        value: b.id,
        label: b.institutionName || b.bankName || b.name,
        sublabel: b.displayName || b.name,
        badge: `₹${b.balance.toLocaleString('en-IN')}`,
        badgeColor: 'blue' as const,
        icon: <BankBrandBadge bankName={b.institutionName || b.bankName || b.name} size="sm" showIconOnly={true} />,
      }));
    }
    if (mode === 'cash_to_wallet') {
      return activeCash.map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: c.location || 'Physical Cash',
        badge: `₹${c.balance.toLocaleString('en-IN')}`,
        badgeColor: 'emerald' as const,
        icon: <Banknote className="w-4 h-4 text-emerald-400" />,
      }));
    }
    return activeWallets.map((w) => ({
      value: w.id,
      label: w.displayName || w.name,
      sublabel: w.providerName || w.provider || 'Digital Wallet',
      badge: `₹${w.balance.toLocaleString('en-IN')}`,
      badgeColor: 'purple' as const,
      icon: <Wallet className="w-4 h-4 text-indigo-400" />,
    }));
  }, [mode, activeBanks, activeCash, activeWallets]);

  const destOptions = useMemo<SelectOption<string>[]>(() => {
    if (mode === 'wallet_to_bank') {
      return activeBanks.map((b) => ({
        value: b.id,
        label: b.institutionName || b.bankName || b.name,
        sublabel: b.displayName || b.name,
        badge: `₹${b.balance.toLocaleString('en-IN')}`,
        badgeColor: 'blue' as const,
        icon: <BankBrandBadge bankName={b.institutionName || b.bankName || b.name} size="sm" showIconOnly={true} />,
      }));
    }
    if (mode === 'wallet_to_cash') {
      return activeCash.map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: c.location || 'Physical Cash',
        badge: `₹${c.balance.toLocaleString('en-IN')}`,
        badgeColor: 'emerald' as const,
        icon: <Banknote className="w-4 h-4 text-emerald-400" />,
      }));
    }
    return activeWallets
      .filter((w) => mode !== 'wallet_to_wallet' || w.id !== sourceId)
      .map((w) => ({
        value: w.id,
        label: w.displayName || w.name,
        sublabel: w.providerName || w.provider || 'Digital Wallet',
        badge: `₹${w.balance.toLocaleString('en-IN')}`,
        badgeColor: 'purple' as const,
        icon: <Wallet className="w-4 h-4 text-indigo-400" />,
      }));
  }, [mode, activeBanks, activeCash, activeWallets, sourceId]);

  const sourceBalance = sourceEntity ? Number(sourceEntity.balance || 0) : 0;
  const destBalance = destEntity ? Number(destEntity.balance || 0) : 0;

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const sourceRemaining = isValidAmount ? sourceBalance - parsedAmount : sourceBalance;
  const destNewBalance = isValidAmount ? destBalance + parsedAmount : destBalance;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Math.abs(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destId) {
      setError('Please select both source and destination accounts');
      return;
    }
    if (sourceId === destId && mode === 'wallet_to_wallet') {
      setError('Source and destination wallets must be different');
      return;
    }
    if (!isValidAmount) {
      setError('Please enter a valid transfer amount greater than 0');
      return;
    }

    // Client-side balance and limit validations
    if (mode === 'bank_to_wallet') {
      const bank = activeBanks.find((b) => b.id === sourceId);
      if (bank) {
        const bal = Number(bank.balance || 0);
        if (bank.accountType === 'overdraft') {
          const limit = Number(bank.overdraftLimit || 0);
          if (bal - parsedAmount < -limit) {
            setError(`Transfer exceeds overdraft limit. Available limit: ₹${(bal + limit).toLocaleString('en-IN')}`);
            return;
          }
        } else if (bal - parsedAmount < 0) {
          setError(`Insufficient bank balance. Available: ₹${bal.toLocaleString('en-IN')}`);
          return;
        }
      }
    } else if (mode === 'cash_to_wallet') {
      const cash = activeCash.find((c) => c.id === sourceId);
      if (cash && Number(cash.balance || 0) - parsedAmount < 0) {
        setError(`Insufficient cash in vault. Available: ₹${Number(cash.balance || 0).toLocaleString('en-IN')}`);
        return;
      }
    } else if (mode === 'wallet_to_bank' || mode === 'wallet_to_wallet' || mode === 'wallet_to_cash') {
      const wallet = activeWallets.find((w) => w.id === sourceId);
      if (wallet && !wallet.allowNegativeBalance && Number(wallet.balance || 0) - parsedAmount < 0) {
        setError(`Wallet does not allow negative balance. Current balance: ₹${Number(wallet.balance || 0).toLocaleString('en-IN')}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (mode === 'bank_to_wallet') {
        await onTransferBankToWallet(sourceId, destId, parsedAmount, notes.trim() || undefined);
      } else if (mode === 'wallet_to_bank') {
        await onTransferWalletToBank(sourceId, destId, parsedAmount, notes.trim() || undefined);
      } else if (mode === 'wallet_to_wallet') {
        await onTransferWalletToWallet(sourceId, destId, parsedAmount, notes.trim() || undefined);
      } else if (mode === 'cash_to_wallet') {
        await onTransferCashToWallet(sourceId, destId, parsedAmount, notes.trim() || undefined);
      } else if (mode === 'wallet_to_cash') {
        await onTransferWalletToCash(sourceId, destId, parsedAmount, notes.trim() || undefined);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="wallet-transfer-modal"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Transfer & Top-up</h2>
              <p className="text-xs text-neutral-400">
                Move money between banks, wallets, and cash vaults
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

        {/* Transfer Mode Tabs - All 5 Operations */}
        <div className="mt-4 flex gap-1.5 p-1 bg-neutral-950 rounded-2xl border border-neutral-800/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setMode('bank_to_wallet')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              mode === 'bank_to_wallet'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank → Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('wallet_to_bank')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              mode === 'wallet_to_bank'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Wallet → Bank</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('cash_to_wallet')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              mode === 'cash_to_wallet'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Cash → Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('wallet_to_cash')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              mode === 'wallet_to_cash'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Wallet → Cash</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('wallet_to_wallet')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              mode === 'wallet_to_wallet'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Wallet → Wallet</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Source Account Picker */}
          <div>
            <SelectField
              label={`Source Account (${mode.split('_')[0]})`}
              value={sourceId}
              onChange={(val) => setSourceId(val)}
              options={sourceOptions}
              showSearch={sourceOptions.length > 4}
              searchPlaceholder="Search source account..."
            />
          </div>

          {/* Destination Account Picker */}
          <div>
            <SelectField
              label={`Destination Account (${mode.split('_to_')[1]})`}
              value={destId}
              onChange={(val) => setDestId(val)}
              options={destOptions}
              showSearch={destOptions.length > 4}
              searchPlaceholder="Search destination account..."
            />
          </div>

          {/* Transfer Amount */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Transfer Amount (₹) *
            </label>
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full px-4 py-3 rounded-xl bg-neutral-800/80 border border-neutral-700 text-white font-mono text-xl font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Real-time Balances Preview */}
          {sourceEntity && destEntity && isValidAmount && (
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Source: {sourceEntity.name}</span>
                <span className="font-mono text-rose-400">
                  ₹{sourceBalance.toLocaleString('en-IN')} → ₹{sourceRemaining.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Destination: {destEntity.name}</span>
                <span className="font-mono text-emerald-400">
                  ₹{destBalance.toLocaleString('en-IN')} → ₹{destNewBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Reassurance Banner */}
          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-center gap-2.5 text-xs text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Internal movement: This transfers money between your accounts and does NOT change total net worth.
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Transfer Note / Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Amazon shopping reload"
              className="w-full px-3 py-2 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white text-xs focus:outline-none focus:border-indigo-500"
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
