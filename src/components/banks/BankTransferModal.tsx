import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  Landmark,
  Banknote,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { BankAccount, CashHoldingAccount, DigitalWallet } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { SelectField, SelectOption } from '../ui/SelectionSheet';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { formatRupee } from '../../utils/formatters';

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceBankId?: string;
  defaultDestinationBankId?: string;
  defaultMode?: 'bank_to_bank' | 'bank_to_cash' | 'cash_to_bank' | 'bank_to_wallet';
}

export const BankTransferModal: React.FC<BankTransferModalProps> = ({
  isOpen,
  onClose,
  defaultSourceBankId,
  defaultDestinationBankId,
  defaultMode = 'bank_to_bank',
}) => {
  const {
    bankAccounts,
    cashHoldings,
    wallets,
    transferBankToBank,
    withdrawBankToCash,
    transferCashToBank,
    transferBankToWallet,
  } = useFinancialData();

  const [mode, setMode] = useState<'bank_to_bank' | 'bank_to_cash' | 'cash_to_bank' | 'bank_to_wallet'>(defaultMode);
  const [sourceId, setSourceId] = useState<string>('');
  const [destinationId, setDestinationId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeBanks = bankAccounts.filter((b) => b.status === 'active');
  const activeCash = cashHoldings.filter((c) => c.status === 'active');
  const activeWallets = wallets.filter((w) => w.status === 'active');

  // Initialize source and destination when modal opens or mode changes
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'bank_to_bank') {
      if (defaultDestinationBankId) {
        const dest = defaultDestinationBankId;
        // Find best source with highest balance
        const candidates = activeBanks.filter((b) => b.id !== dest).sort((a, b) => (b.balance || 0) - (a.balance || 0));
        const src = candidates[0]?.id || (activeBanks.find((b) => b.id !== dest)?.id || '');
        setSourceId(src);
        setDestinationId(dest);
      } else {
        const src = defaultSourceBankId || activeBanks[0]?.id || '';
        const dest = activeBanks.find((b) => b.id !== src)?.id || '';
        setSourceId(src);
        setDestinationId(dest);
      }
    } else if (mode === 'bank_to_cash') {
      setSourceId(defaultSourceBankId || activeBanks[0]?.id || '');
      setDestinationId(activeCash[0]?.id || '');
    } else if (mode === 'cash_to_bank') {
      setSourceId(activeCash[0]?.id || '');
      setDestinationId(defaultDestinationBankId || defaultSourceBankId || activeBanks[0]?.id || '');
    } else if (mode === 'bank_to_wallet') {
      setSourceId(defaultSourceBankId || activeBanks[0]?.id || '');
      setDestinationId(activeWallets[0]?.id || '');
    }
  }, [isOpen, mode, defaultSourceBankId, defaultDestinationBankId]);

  if (!isOpen) return null;

  // Selected Source Balance
  let sourceBalance = 0;
  let sourceName = '';
  if (mode === 'bank_to_bank' || mode === 'bank_to_cash' || mode === 'bank_to_wallet') {
    const b = activeBanks.find((a) => a.id === sourceId);
    sourceBalance = Number(b?.balance || 0);
    sourceName = b?.displayName || b?.name || 'Bank Account';
  } else if (mode === 'cash_to_bank') {
    const c = activeCash.find((a) => a.id === sourceId);
    sourceBalance = Number(c?.balance || 0);
    sourceName = c?.displayName || c?.name || 'Cash Vault';
  }

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid transfer amount greater than zero');
      return;
    }

    if (!sourceId || !destinationId) {
      setError('Please select both source and destination accounts');
      return;
    }

    if (sourceId === destinationId && mode === 'bank_to_bank') {
      setError('Source and destination bank accounts cannot be identical');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'bank_to_bank') {
        await transferBankToBank(sourceId, destinationId, numAmount, notes);
      } else if (mode === 'bank_to_cash') {
        await withdrawBankToCash(sourceId, destinationId, numAmount, notes);
      } else if (mode === 'cash_to_bank') {
        await transferCashToBank(sourceId, destinationId, numAmount, notes);
      } else if (mode === 'bank_to_wallet') {
        await transferBankToWallet(sourceId, destinationId, numAmount, notes);
      }

      onClose();
    } catch (err: any) {
      console.error('Transfer failed:', err);
      setError(err?.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-bank-transfer"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0d1629] border border-slate-700/80 shadow-2xl p-6 sm:p-7 text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Internal Transfer</h2>
              <p className="text-xs text-slate-400">Move funds between your accounts without affecting Net Worth</p>
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
          {/* Transfer Mode Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Transfer Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('bank_to_bank')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  mode === 'bank_to_bank'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Landmark className="w-4 h-4" />
                Bank to Bank
              </button>
              <button
                type="button"
                onClick={() => setMode('bank_to_cash')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  mode === 'bank_to_cash'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Banknote className="w-4 h-4" />
                ATM / Cash
              </button>
              <button
                type="button"
                onClick={() => setMode('cash_to_bank')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  mode === 'cash_to_bank'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Landmark className="w-4 h-4" />
                Cash Deposit
              </button>
              <button
                type="button"
                onClick={() => setMode('bank_to_wallet')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  mode === 'bank_to_wallet'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Topup Wallet
              </button>
            </div>
          </div>

          {/* Source and Destination Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              {mode === 'cash_to_bank' ? (
                <SelectField
                  label="From (Source Vault)"
                  required
                  value={sourceId}
                  onChange={(val) => setSourceId(val)}
                  options={activeCash.map((c) => ({
                    value: c.id,
                    label: c.displayName || c.name,
                    sublabel: 'Cash Holding',
                    badge: formatRupee(c.balance),
                    badgeColor: 'emerald' as const,
                    icon: <Banknote className="w-4 h-4 text-emerald-400" />,
                  }))}
                />
              ) : (
                <SelectField
                  label="From (Source Bank)"
                  required
                  value={sourceId}
                  onChange={(val) => setSourceId(val)}
                  showSearch={true}
                  searchPlaceholder="Search bank..."
                  options={activeBanks.map((b) => ({
                    value: b.id,
                    label: b.institutionName || b.bankName || b.name,
                    sublabel: b.displayName || b.name,
                    badge: formatRupee(b.balance),
                    badgeColor: 'emerald' as const,
                    icon: <BankBrandBadge bankName={b.institutionName || b.bankName || b.name} size="sm" showIconOnly={true} />,
                  }))}
                />
              )}
            </div>

            <div>
              {mode === 'bank_to_bank' && (
                <SelectField
                  label="To (Destination Bank)"
                  required
                  value={destinationId}
                  onChange={(val) => setDestinationId(val)}
                  showSearch={true}
                  searchPlaceholder="Search destination..."
                  options={activeBanks
                    .filter((b) => b.id !== sourceId)
                    .map((b) => ({
                      value: b.id,
                      label: b.institutionName || b.bankName || b.name,
                      sublabel: b.displayName || b.name,
                      badge: formatRupee(b.balance),
                      badgeColor: 'emerald' as const,
                      icon: <BankBrandBadge bankName={b.institutionName || b.bankName || b.name} size="sm" showIconOnly={true} />,
                    }))}
                />
              )}

              {mode === 'bank_to_cash' && (
                <SelectField
                  label="To (Destination Vault)"
                  required
                  value={destinationId}
                  onChange={(val) => setDestinationId(val)}
                  options={activeCash.map((c) => ({
                    value: c.id,
                    label: c.displayName || c.name,
                    sublabel: 'Cash Holding',
                    badge: formatRupee(c.balance),
                    badgeColor: 'emerald' as const,
                    icon: <Banknote className="w-4 h-4 text-amber-400" />,
                  }))}
                />
              )}

              {mode === 'cash_to_bank' && (
                <SelectField
                  label="To (Destination Bank)"
                  required
                  value={destinationId}
                  onChange={(val) => setDestinationId(val)}
                  showSearch={true}
                  searchPlaceholder="Search destination..."
                  options={activeBanks.map((b) => ({
                    value: b.id,
                    label: b.institutionName || b.bankName || b.name,
                    sublabel: b.displayName || b.name,
                    badge: formatRupee(b.balance),
                    badgeColor: 'emerald' as const,
                    icon: <BankBrandBadge bankName={b.institutionName || b.bankName || b.name} size="sm" showIconOnly={true} />,
                  }))}
                />
              )}

              {mode === 'bank_to_wallet' && (
                <SelectField
                  label="To (Destination Wallet)"
                  required
                  value={destinationId}
                  onChange={(val) => setDestinationId(val)}
                  options={activeWallets.map((w) => ({
                    value: w.id,
                    label: w.displayName || w.name,
                    sublabel: w.walletType?.toUpperCase() || 'DIGITAL WALLET',
                    badge: formatRupee(w.balance),
                    badgeColor: 'purple' as const,
                    icon: <Smartphone className="w-4 h-4 text-purple-400" />,
                  }))}
                />
              )}
            </div>
          </div>

          {/* Amount Input & Quick Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Transfer Amount (₹)
            </label>
            <div className="relative mb-2">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-lg font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[1000, 2000, 5000, 10000, 25000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleQuickAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-all"
                >
                  +{formatRupee(val)}
                </button>
              ))}
              {sourceBalance > 0 && (
                <button
                  type="button"
                  onClick={() => handleQuickAmount(sourceBalance)}
                  className="px-2.5 py-1 rounded-lg bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/60 text-xs text-blue-300 font-semibold transition-all"
                >
                  All ({formatRupee(sourceBalance)})
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Transfer Note / Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly emergency savings allocation"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Accounting Guardrail Banner */}
          <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-800/30 flex items-center gap-2.5 text-xs text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>
              <strong>Double-Entry Transfer:</strong> Deducts from source and credits destination simultaneously. Total portfolio Net Worth is preserved.
            </span>
          </div>

          {/* Submit Actions */}
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
              {isSubmitting ? 'Processing Transfer...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
