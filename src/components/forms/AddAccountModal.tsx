import React, { useState } from 'react';
import { Building2, Landmark, Smartphone, Banknote, Plus, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { SelectField } from '../ui/SelectionSheet';
import { useFinancialData } from '../../context/FinancialDataContext';
import { cn } from '../../utils/cn';
import { BankSelector, BankSelectionResult } from '../banks/BankSelector';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addBankAccount, addFixedDeposit, addWallet, addCashHolding } = useFinancialData();

  const [category, setCategory] = useState<'bank' | 'fd' | 'wallet' | 'cash'>('bank');

  // Bank Form State
  const [bankName, setBankName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [accountType, setAccountType] = useState<'savings' | 'salary' | 'current'>('savings');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [balance, setBalance] = useState<string>('0');

  // FD Form State
  const [fdInterestRate, setFdInterestRate] = useState('7.1');
  const [fdMaturityDate, setFdMaturityDate] = useState('2027-02-15');
  const [fdMaturityAmount, setFdMaturityAmount] = useState('');

  // Wallet Form State
  const [walletProvider, setWalletProvider] = useState<'paytm' | 'amazon_pay' | 'phonepe' | 'mobikwik' | 'other'>('amazon_pay');
  const [linkedMobile, setLinkedMobile] = useState('');

  // Cash Form State
  const [location, setLocation] = useState('Home Wardrobe Locker');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawBal = balance.trim();
    const parsedBalance = rawBal === '' || rawBal === '-' ? 0 : parseFloat(rawBal);
    if (isNaN(parsedBalance)) {
      setErrorMessage('Please enter a valid numeric balance');
      return;
    }

    if (!bankName.trim()) {
      setErrorMessage('Account name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (category === 'bank') {
        await addBankAccount({
          name: bankName.trim(),
          displayName: bankName.trim(),
          category: 'bank',
          institutionName: institutionName.trim() || bankName.trim(),
          accountType,
          accountNumberMasked: accountNumber ? `•••• ${accountNumber.slice(-4)}` : '•••• 0000',
          ifscCode: ifscCode.toUpperCase().trim() || undefined,
          balance: parsedBalance,
          currency: 'INR',
          status: 'active',
          colorTheme: 'from-blue-600 to-indigo-900',
        });
        onSuccess?.(`✓ Added Bank Account: ${bankName}`);
      } else if (category === 'fd') {
        const rate = parseFloat(fdInterestRate) || 7.0;
        const matAmount = parseFloat(fdMaturityAmount) || parsedBalance * 1.1;
        await addFixedDeposit({
          name: bankName.trim(),
          displayName: bankName.trim(),
          category: 'fd',
          institutionName: institutionName.trim() || 'Bank FD',
          bankName: institutionName.trim() || 'Bank',
          accountNumberMasked: accountNumber ? `FD •••• ${accountNumber.slice(-4)}` : 'FD •••• 0000',
          balance: parsedBalance,
          interestRate: rate,
          maturityDate: fdMaturityDate,
          maturityAmount: matAmount,
          currency: 'INR',
          status: 'active',
        });
        onSuccess?.(`✓ Added Fixed Deposit: ${bankName}`);
      } else if (category === 'wallet') {
        await addWallet({
          name: bankName.trim(),
          displayName: bankName.trim(),
          category: 'wallet',
          provider: walletProvider,
          institutionName: walletProvider.replace('_', ' ').toUpperCase(),
          balance: parsedBalance,
          linkedMobile: linkedMobile.trim() || undefined,
          currency: 'INR',
          status: 'active',
        });
        onSuccess?.(`✓ Added Wallet: ${bankName}`);
      } else if (category === 'cash') {
        await addCashHolding({
          name: bankName.trim(),
          displayName: bankName.trim(),
          category: 'cash',
          location: location.trim(),
          balance: parsedBalance,
          currency: 'INR',
          status: 'active',
          denominations: [
            { denomination: 500, count: Math.floor(Math.max(0, parsedBalance) / 500) },
          ],
        });
        onSuccess?.(`✓ Added Cash Vault: ${bankName}`);
      }

      // Reset
      setBankName('');
      setBalance('0');
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Financial Account"
      subtitle="Track bank savings, fixed deposits, cash, and wallets"
    >
      {/* Category Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 mb-4">
        {[
          { key: 'bank' as const, label: 'Bank', icon: Building2 },
          { key: 'fd' as const, label: 'Fixed Deposit', icon: Landmark },
          { key: 'wallet' as const, label: 'Wallet', icon: Smartphone },
          { key: 'cash' as const, label: 'Cash Vault', icon: Banknote },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = category === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setCategory(tab.key);
                setErrorMessage(null);
              }}
              className={cn(
                'flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer font-heading',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Bank & FD Provider Selector */}
        {(category === 'bank' || category === 'fd') && (
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <BankSelector
              selectedBankName={institutionName || bankName}
              onSelectBank={(res) => {
                setInstitutionName(res.name);
                if (!bankName || bankName === 'HDFC Bank' || bankName === 'State Bank of India') {
                  setBankName(category === 'bank' ? `${res.short} Account` : `${res.short} Fixed Deposit`);
                }
                if (res.defaultIfsc) {
                  setIfscCode(res.defaultIfsc);
                }
              }}
              label={category === 'bank' ? 'Select Bank / Financial Provider' : 'Select Issuing Bank / Post Office'}
              maxHeight="max-h-40 sm:max-h-48"
            />
          </div>
        )}

        <div>
          <label className="text-slate-300 font-semibold block mb-1">
            {category === 'cash' ? 'Vault / Location Name' : 'Account Nickname'} *
          </label>
          <input
            type="text"
            required
            placeholder={
              category === 'bank'
                ? 'e.g. Axis Salary Account'
                : category === 'fd'
                ? 'e.g. HDFC 1-Year Tax Saver'
                : category === 'wallet'
                ? 'e.g. Amazon Pay Shopping'
                : 'e.g. Home Wardrobe Safe'
            }
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500 text-xs"
          />
        </div>

        {/* Bank & FD specific fields */}
        {(category === 'bank' || category === 'fd') && (
          <div className="grid grid-cols-2 gap-3">
            {category === 'bank' ? (
              <div>
                <SelectField
                  label="Account Type"
                  value={accountType}
                  onChange={(val) => setAccountType(val as 'savings' | 'salary' | 'current')}
                  options={[
                    { value: 'savings', label: 'Savings Account', sublabel: 'Standard personal savings', badge: 'Savings', badgeColor: 'blue' },
                    { value: 'salary', label: 'Salary Account', sublabel: 'Corporate payroll account', badge: 'Salary', badgeColor: 'emerald' },
                    { value: 'current', label: 'Current Account', sublabel: 'Business / commercial account', badge: 'Current', badgeColor: 'purple' },
                  ]}
                  triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-700 text-xs"
                />
              </div>
            ) : (
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={fdInterestRate}
                  onChange={(e) => setFdInterestRate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                {category === 'bank' ? 'IFSC Code' : 'Maturity Date'}
              </label>
              {category === 'bank' ? (
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              ) : (
                <input
                  type="date"
                  value={fdMaturityDate}
                  onChange={(e) => setFdMaturityDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>
          </div>
        )}

        {/* Wallet specific */}
        {category === 'wallet' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SelectField
                label="Provider"
                value={walletProvider}
                onChange={(val) => setWalletProvider(val as 'paytm' | 'amazon_pay' | 'phonepe' | 'mobikwik' | 'other')}
                options={[
                  { value: 'amazon_pay', label: 'Amazon Pay', sublabel: 'Amazon balance / wallet', badge: 'Amazon', badgeColor: 'amber' },
                  { value: 'paytm', label: 'Paytm', sublabel: 'Paytm wallet', badge: 'Paytm', badgeColor: 'blue' },
                  { value: 'phonepe', label: 'PhonePe', sublabel: 'PhonePe wallet', badge: 'PhonePe', badgeColor: 'purple' },
                  { value: 'mobikwik', label: 'MobiKwik', sublabel: 'MobiKwik wallet', badge: 'MobiKwik', badgeColor: 'cyan' },
                  { value: 'other', label: 'Other', sublabel: 'Custom provider' },
                ]}
                triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Linked Mobile</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={linkedMobile}
                onChange={(e) => setLinkedMobile(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* Balance Field (supports negative) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-300 font-semibold">
              Current Balance (₹) *
            </label>
            <span className="text-[10px] text-cyan-400 font-medium">Negative values supported</span>
          </div>
          <FinancialAmountInput
            id="input-add-account-balance"
            value={balance}
            onChange={setBalance}
            allowNegative={category !== 'fd'}
            currencySymbol="₹"
            placeholder="e.g. 50000 or -5000"
            inputClassName="p-3 text-base font-bold focus:border-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading mt-2"
        >
          <span>{isSubmitting ? 'Saving to Vault...' : '+ Save to Vault'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </Modal>
  );
};
