import React, { useState } from 'react';
import {
  X,
  Wallet,
  ShieldCheck,
  EyeOff,
  Tag,
  Check,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  DigitalWallet,
  WalletType,
  WalletProvider,
  WalletOwner,
  WALLET_PROVIDER_PRESETS,
} from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { SelectField } from '../ui/SelectionSheet';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (data: Omit<DigitalWallet, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => Promise<DigitalWallet>;
  onCreateWallet?: (data: Omit<DigitalWallet, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => Promise<DigitalWallet>;
}

export const AddWalletModal: React.FC<AddWalletModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onCreateWallet,
}) => {
  const { addWallet } = useFinancialData();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('amazon_pay');
  const [provider, setProvider] = useState<WalletProvider>('amazon_pay');
  const [providerName, setProviderName] = useState<string>('Amazon Pay');
  const [name, setName] = useState('Amazon Pay');
  const [walletType, setWalletType] = useState<WalletType>('DIGITAL_WALLET');
  const [owner, setOwner] = useState<WalletOwner>('SELF');
  const [balance, setBalance] = useState<string>('0');
  const [includeInNetWorth, setIncludeInNetWorth] = useState<boolean>(true);
  const [allowNegativeBalance, setAllowNegativeBalance] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: (typeof WALLET_PROVIDER_PRESETS)[0]) => {
    setSelectedPresetId(preset.id);
    setProvider(preset.provider);
    setProviderName(preset.providerName);
    setName(preset.name);
    setWalletType(preset.defaultType);
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this wallet');
      return;
    }

    const rawBal = balance.trim();
    const numBalance = rawBal === '' || rawBal === '-' ? 0 : parseFloat(rawBal);
    if (isNaN(numBalance)) {
      setError('Please enter a valid numeric opening balance (e.g. 0, 500)');
      return;
    }

    // If a negative balance is entered, automatically permit it
    const effectiveAllowNegative = allowNegativeBalance || numBalance < 0;

    try {
      setIsSubmitting(true);
      setError(null);

      const preset = WALLET_PROVIDER_PRESETS.find((p) => p.id === selectedPresetId);

      const newWalletData: Omit<DigitalWallet, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'> = {
        name: name.trim(),
        displayName: name.trim(),
        institutionName: providerName.trim() || name.trim(),
        category: 'wallet',
        provider,
        providerName: providerName.trim() || name.trim(),
        walletType,
        owner,
        balance: numBalance,
        currency: 'INR',
        status: 'active',
        includeInNetWorth,
        allowNegativeBalance: effectiveAllowNegative,
        notes: notes.trim() || undefined,
        colorTheme: preset?.colorTheme || 'from-indigo-600 to-neutral-950',
        accentColor: preset?.accentColor || '#6366f1',
      };

      const handler = onCreateWallet || onAdd || addWallet;
      if (typeof handler === 'function') {
        await handler(newWalletData);
      } else {
        await addWallet(newWalletData);
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to create wallet:', err);
      setError(err?.message || 'Failed to create wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="add-wallet-modal"
        className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Add Digital Wallet</h2>
              <p className="text-xs text-neutral-400">
                Track digital wallets, prepaid balances, and rewards
              </p>
            </div>
          </div>
          <button
            id="close-add-wallet-modal-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Wrap */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Content */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Provider Presets */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Provider Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WALLET_PROVIDER_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      id={`preset-${preset.id}`}
                      onClick={() => handleSelectPreset(preset)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-left border transition-all text-xs font-medium ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/80 text-white shadow-sm ring-1 ring-indigo-500/50'
                          : 'bg-neutral-800/40 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                      <span className="truncate">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Wallet Name & Provider Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Wallet Name *
                </label>
                <input
                  id="input-wallet-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Amazon Pay, Paytm"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/80 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Provider Name
                </label>
                <input
                  id="input-provider-name"
                  type="text"
                  value={providerName}
                  onChange={(e) => {
                    setProviderName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Amazon, SBI"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/80 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-neutral-500"
                />
              </div>
            </div>

            {/* 3. Wallet Type & Owner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <SelectField
                  label="Wallet Type"
                  value={walletType}
                  onChange={(val) => setWalletType(val as WalletType)}
                  options={[
                    { value: 'DIGITAL_WALLET', label: 'Digital Wallet', sublabel: 'Prepaid wallet (e.g. Amazon Pay, Paytm)', badge: 'Wallet', badgeColor: 'blue' },
                    { value: 'CASHBACK', label: 'Cashback / Reward', sublabel: 'Reward points or merchant store credit', badge: 'Rewards', badgeColor: 'amber' },
                    { value: 'STORED_VALUE', label: 'Stored Value', sublabel: 'Transit / Food / Metro cards', badge: 'Prepaid', badgeColor: 'purple' },
                    { value: 'CUSTOM', label: 'Custom Wallet', sublabel: 'Other digital funds', badge: 'Custom', badgeColor: 'emerald' },
                  ]}
                />
              </div>

              <div>
                <SelectField
                  label="Owner"
                  value={owner}
                  onChange={(val) => setOwner(val as WalletOwner)}
                  options={[
                    { value: 'SELF', label: 'Self', sublabel: 'Primary account holder', icon: <User className="w-4 h-4 text-indigo-400" /> },
                    { value: 'PARENT', label: 'Parent / Family', sublabel: 'Family shared wallet', icon: <User className="w-4 h-4 text-purple-400" /> },
                    { value: 'OTHER', label: 'Other', sublabel: 'Secondary / business wallet', icon: <User className="w-4 h-4 text-slate-400" /> },
                  ]}
                />
              </div>
            </div>

            {/* 4. Opening Balance */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Opening Balance (₹) *
              </label>
              <FinancialAmountInput
                id="input-opening-balance"
                value={balance}
                onChange={(val) => {
                  setBalance(val);
                  if (error) setError(null);
                }}
                allowNegative={true}
                currencySymbol="₹"
                placeholder="0.00"
                inputClassName="text-base font-bold focus:border-indigo-500"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Supports positive, zero, and negative / overdraft balances.
              </p>
            </div>

            {/* 5. Include in Net Worth Toggle */}
            <div className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-700/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl border mt-0.5 ${
                    includeInNetWorth
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {includeInNetWorth ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Include in Net Worth
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                    {includeInNetWorth
                      ? 'Contributing directly to total assets and Net Worth.'
                      : 'Excluded from total net worth calculation.'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  id="toggle-net-worth"
                  type="checkbox"
                  checked={includeInNetWorth}
                  onChange={(e) => setIncludeInNetWorth(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 6. Allow Negative Balance Toggle */}
            <div className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-700/60 flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Allow Negative Balance
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                  Enable for post-paid, credit-backed, or overdraft digital balances (e.g. Amazon Pay Later / MobiKwik Zip).
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  id="toggle-allow-negative"
                  type="checkbox"
                  checked={allowNegativeBalance}
                  onChange={(e) => setAllowNegativeBalance(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* 7. Notes */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Notes (Optional)
              </label>
              <input
                id="input-wallet-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Utility bill payments, cashback savings"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/40 border border-neutral-700/60 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder-neutral-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-neutral-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              id="cancel-add-wallet-btn"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-add-wallet-btn"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Creating...' : 'Create Wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
