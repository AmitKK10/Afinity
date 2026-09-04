import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  ShieldCheck,
  EyeOff,
  Tag,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  DigitalWallet,
  WalletType,
  WalletProvider,
  WalletOwner,
} from '../../types';
import { SelectField } from '../ui/SelectionSheet';

interface EditWalletModalProps {
  isOpen: boolean;
  wallet: DigitalWallet | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<DigitalWallet>) => Promise<DigitalWallet>;
}

export const EditWalletModal: React.FC<EditWalletModalProps> = ({
  isOpen,
  wallet,
  onClose,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<WalletProvider>('custom');
  const [providerName, setProviderName] = useState<string>('');
  const [walletType, setWalletType] = useState<WalletType>('DIGITAL_WALLET');
  const [owner, setOwner] = useState<WalletOwner>('SELF');
  const [includeInNetWorth, setIncludeInNetWorth] = useState<boolean>(true);
  const [allowNegativeBalance, setAllowNegativeBalance] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallet) {
      setName(wallet.displayName || wallet.name || '');
      setProvider(wallet.provider || 'custom');
      setProviderName(wallet.providerName || wallet.institutionName || '');
      // Normalize wallet type
      const wt = (wallet.walletType || 'DIGITAL_WALLET').toUpperCase() as WalletType;
      setWalletType(wt);
      // Normalize owner
      const ow = (wallet.owner || 'SELF').toUpperCase() as WalletOwner;
      setOwner(ow);
      setIncludeInNetWorth(wallet.includeInNetWorth !== false);
      setAllowNegativeBalance(wallet.allowNegativeBalance === true);
      setNotes(wallet.notes || '');
      setError(null);
    }
  }, [wallet]);

  if (!isOpen || !wallet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this wallet');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await onUpdate(wallet.id, {
        name: name.trim(),
        displayName: name.trim(),
        provider,
        providerName: providerName.trim() || undefined,
        institutionName: providerName.trim() || undefined,
        walletType,
        owner,
        includeInNetWorth,
        allowNegativeBalance,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id={`edit-wallet-modal-${wallet.id}`}
        className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Edit Wallet Details</h2>
              <p className="text-xs text-neutral-400">
                Update name, type, owner, and net worth contribution
              </p>
            </div>
          </div>
          <button
            id="close-edit-wallet-modal-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Wallet Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Wallet Name *
            </label>
            <input
              id="edit-wallet-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amazon Pay, Paytm"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Provider and Provider Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <SelectField
                label="Provider"
                value={provider}
                onChange={(val) => {
                  const p = val as WalletProvider;
                  setProvider(p);
                  if (p === 'amazon_pay') setProviderName('Amazon Pay');
                  else if (p === 'paytm') setProviderName('Paytm');
                  else if (p === 'phonepe') setProviderName('PhonePe');
                  else if (p === 'mobikwik') setProviderName('MobiKwik');
                  else if (p === 'bajaj') setProviderName('Bajaj Finserv');
                  else if (p === 'sbi') setProviderName('SBI Cashback');
                }}
                options={[
                  { value: 'amazon_pay', label: 'Amazon Pay', sublabel: 'Amazon balance / UPI wallet', badge: 'Amazon', badgeColor: 'amber' },
                  { value: 'paytm', label: 'Paytm Wallet', sublabel: 'Paytm Payments Bank / Wallet', badge: 'Paytm', badgeColor: 'blue' },
                  { value: 'phonepe', label: 'PhonePe Wallet', sublabel: 'PhonePe gift / wallet', badge: 'PhonePe', badgeColor: 'purple' },
                  { value: 'mobikwik', label: 'MobiKwik', sublabel: 'MobiKwik wallet / ZIP', badge: 'MobiKwik', badgeColor: 'cyan' },
                  { value: 'bajaj', label: 'Bajaj Finserv', sublabel: 'Bajaj Pay wallet', badge: 'Bajaj', badgeColor: 'blue' },
                  { value: 'sbi', label: 'SBI Cashback', sublabel: 'SBI card / cashback wallet', badge: 'SBI', badgeColor: 'blue' },
                  { value: 'custom', label: 'Custom Provider', sublabel: 'Manual custom provider', badge: 'Custom', badgeColor: 'slate' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Provider Name
              </label>
              <input
                id="edit-provider-name-input"
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="e.g. Amazon, Paytm"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/80 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-neutral-500"
              />
            </div>
          </div>

          {/* Wallet Type and Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <SelectField
                label="Wallet Type"
                value={walletType}
                onChange={(val) => setWalletType(val as WalletType)}
                options={[
                  { value: 'DIGITAL_WALLET', label: 'Digital Wallet', sublabel: 'Prepaid digital wallet', badge: 'Wallet', badgeColor: 'blue' },
                  { value: 'CASHBACK', label: 'Cashback / Reward', sublabel: 'Reward points or store credits', badge: 'Rewards', badgeColor: 'amber' },
                  { value: 'STORED_VALUE', label: 'Stored Value', sublabel: 'Prepaid transit or meal card', badge: 'Prepaid', badgeColor: 'purple' },
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

          {/* Include in Net Worth Toggle */}
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
                    ? 'Contributing directly to total assets & Net Worth.'
                    : 'Excluded from net worth.'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                id="edit-toggle-net-worth"
                type="checkbox"
                checked={includeInNetWorth}
                onChange={(e) => setIncludeInNetWorth(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Allow Negative Balance Toggle */}
          <div className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-700/60 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-white block">
                Allow Negative Balance
              </span>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Allow balance updates below ₹0 for postpaid credit or overdraft facilities.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                id="edit-toggle-allow-negative"
                type="checkbox"
                checked={allowNegativeBalance}
                onChange={(e) => setAllowNegativeBalance(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Notes
            </label>
            <input
              id="edit-wallet-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. For food delivery & groceries"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/40 border border-neutral-700/60 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            id="cancel-edit-wallet-btn"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="submit-edit-wallet-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
