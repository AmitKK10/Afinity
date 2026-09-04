import React, { useState } from 'react';
import {
  X,
  Landmark,
  CreditCard,
  Shield,
  Info,
} from 'lucide-react';
import { Bank, BankAccount, BankAccountType } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { SelectField } from '../ui/SelectionSheet';
import { BankSelector, BankSelectionResult } from './BankSelector';

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBankId?: string;
  onAccountCreated?: (account: BankAccount) => void;
}

export const AddBankAccountModal: React.FC<AddBankAccountModalProps> = ({
  isOpen,
  onClose,
  defaultBankId,
  onAccountCreated,
}) => {
  const { banks, addBankAccount, addBank } = useFinancialData();

  const [bankName, setBankName] = useState<string>('HDFC Bank');
  const [accountName, setAccountName] = useState<string>('');
  const [accountType, setAccountType] = useState<BankAccountType>('savings');
  const [balance, setBalance] = useState<string>('0');
  const [last4, setLast4] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('HDFC0000001');
  const [hasDebitCard, setHasDebitCard] = useState<boolean>(true);
  const [colorTheme, setColorTheme] = useState<string>('from-blue-700 to-indigo-900');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectBank = (result: BankSelectionResult) => {
    setBankName(result.name);
    if (result.defaultIfsc) {
      setIfscCode(result.defaultIfsc);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rawBal = balance.trim();
    const numBalance = rawBal === '' || rawBal === '-' ? 0 : parseFloat(rawBal);
    if (isNaN(numBalance)) {
      setError('Please enter a valid numeric opening balance');
      return;
    }

    if (!bankName.trim()) {
      setError('Please provide a bank or institution name');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find or create matching Bank institution
      let targetBank = banks.find(
        (b) => b.name.toLowerCase() === bankName.trim().toLowerCase()
      );

      if (!targetBank) {
        targetBank = await addBank({
          name: bankName.trim(),
          displayName: bankName.trim(),
          status: 'active',
          colorTheme,
        });
      }

      const cleanLast4 = last4.replace(/\D/g, '').slice(-4);
      const masked = cleanLast4 ? `•••• ${cleanLast4}` : '•••• ••••';

      const newAccount = await addBankAccount({
        bankId: targetBank.id,
        bankName: targetBank.name,
        name: accountName.trim() || `${bankName} ${accountType.toUpperCase()} Account`,
        displayName: accountName.trim() || `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account`,
        institutionName: targetBank.name,
        category: 'bank',
        accountType,
        accountNumberMasked: masked,
        last4: cleanLast4 || undefined,
        balance: numBalance,
        openingBalance: numBalance,
        openingDate: new Date().toISOString().split('T')[0],
        currency: 'INR',
        status: 'active',
        ifscCode: ifscCode.trim().toUpperCase() || undefined,
        hasDebitCard,
        colorTheme,
        notes: notes.trim() || undefined,
      });

      if (onAccountCreated) onAccountCreated(newAccount);
      onClose();
    } catch (err: any) {
      console.error('Failed to create bank account:', err);
      setError(err?.message || 'Failed to create bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-add-bank-account"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b1329] border border-slate-700/80 shadow-2xl p-5 sm:p-7 text-white animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                Add Bank Account
              </h2>
              <p className="text-xs text-slate-400">
                Savings, salary, current or overdraft account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300 flex-shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-3 overflow-y-auto pr-1 flex-1">
          {/* Bank Selection Top Section */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <BankSelector
              selectedBankName={bankName}
              onSelectBank={handleSelectBank}
              label="Select Bank / Financial Institution"
              maxHeight="max-h-48 sm:max-h-56"
            />
          </div>

          {/* Account Nickname & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Account Nickname
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Primary Salary / Daily Spends"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <SelectField
                label="Account Type"
                value={accountType}
                onChange={(val) => setAccountType(val as BankAccountType)}
                options={[
                  { value: 'savings', label: 'Savings Account', sublabel: 'Standard personal savings', badge: 'Savings', badgeColor: 'blue' },
                  { value: 'salary', label: 'Salary Account', sublabel: 'Corporate salary credits', badge: 'Salary', badgeColor: 'emerald' },
                  { value: 'current', label: 'Current Account', sublabel: 'Business / High-frequency', badge: 'Current', badgeColor: 'purple' },
                  { value: 'overdraft', label: 'Overdraft Account', sublabel: 'OD limit / Credit line', badge: 'OD/Line', badgeColor: 'amber' },
                ]}
              />
            </div>
          </div>

          {/* Opening Balance */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current / Opening Balance (₹)
              </label>
              {accountType === 'overdraft' ? (
                <span className="text-[10px] text-amber-400">
                  Negative balances will be treated as overdraft liabilities
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">
                  Overdraft / negative balances supported
                </span>
              )}
            </div>
            <FinancialAmountInput
              id="input-bank-opening-balance"
              value={balance}
              onChange={setBalance}
              allowNegative={true}
              placeholder="0"
              currencySymbol="₹"
              inputClassName="text-base font-bold focus:border-blue-500"
            />
          </div>

          {/* Masked Last 4 & IFSC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Last 4 Digits
                </label>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> Privacy Safe
                </span>
              </div>
              <input
                type="text"
                maxLength={4}
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                IFSC Code (Optional)
              </label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Debit Card Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-200">Active Debit Card attached</span>
            </div>
            <input
              type="checkbox"
              checked={hasDebitCard}
              onChange={(e) => setHasDebitCard(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 bg-slate-800"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Notes / Purpose (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Secondary utility bill and EMIs account"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Creating Account...' : 'Save Bank Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
