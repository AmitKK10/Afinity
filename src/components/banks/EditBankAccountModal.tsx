import React, { useState, useEffect } from 'react';
import {
  X,
  Landmark,
  CreditCard,
  Shield,
  Scale,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Archive,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Bank,
  BankAccount,
  BankAccountType,
  AverageBalancePeriod,
  AverageBalanceSource,
} from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { SelectField } from '../ui/SelectionSheet';
import { BankSelector, BankSelectionResult } from './BankSelector';
import { formatRupee } from '../../utils/formatters';

interface EditBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount | null;
  onAccountUpdated?: (account: BankAccount) => void;
}

export const EditBankAccountModal: React.FC<EditBankAccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountUpdated,
}) => {
  const { banks, updateBankAccount, addBank } = useFinancialData();

  const [bankName, setBankName] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [accountType, setAccountType] = useState<BankAccountType>('savings');
  const [balance, setBalance] = useState<string>('0');
  const [last4, setLast4] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [hasDebitCard, setHasDebitCard] = useState<boolean>(true);
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [notes, setNotes] = useState<string>('');

  // Average & Minimum Balance Management States
  const [avgMonitoringEnabled, setAvgMonitoringEnabled] = useState<boolean>(false);
  const [requiredAvgBalance, setRequiredAvgBalance] = useState<string>('0');
  const [minBalanceReq, setMinBalanceReq] = useState<string>('0');
  const [avgPeriod, setAvgPeriod] = useState<AverageBalancePeriod>('monthly');
  const [actualAvgBalance, setActualAvgBalance] = useState<string>('');
  const [avgSource, setAvgSource] = useState<AverageBalanceSource>('manual');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'average_balance'>('general');

  useEffect(() => {
    if (account) {
      setBankName(account.bankName || account.institutionName || 'HDFC Bank');
      setAccountName(account.displayName || account.name || '');
      setAccountType((account.accountType as BankAccountType) || 'savings');
      setBalance(String(account.balance ?? 0));
      setLast4(account.last4 || (account.accountNumberMasked ? account.accountNumberMasked.replace(/\D/g, '') : ''));
      setIfscCode(account.ifscCode || '');
      setHasDebitCard(account.hasDebitCard ?? true);
      setStatus(account.status === 'archived' ? 'archived' : 'active');
      setNotes(account.notes || '');

      const reqAmount = account.averageBalanceRequirement ?? account.requiredAverageBalance ?? 0;
      const minAmount = account.minimumBalanceRequirement ?? 0;
      setAvgMonitoringEnabled(Boolean(account.averageBalanceMonitoringEnabled || reqAmount > 0));
      setRequiredAvgBalance(String(reqAmount));
      setMinBalanceReq(String(minAmount));
      setAvgPeriod(account.averageBalancePeriod || 'monthly');
      setActualAvgBalance(account.actualAverageBalance !== undefined ? String(account.actualAverageBalance) : '');
      setAvgSource(account.averageBalanceSource || 'manual');
      setError(null);
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  const handleSelectBank = (result: BankSelectionResult) => {
    setBankName(result.name);
    if (result.defaultIfsc && !ifscCode) {
      setIfscCode(result.defaultIfsc);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rawBal = balance.trim();
    const numBalance = rawBal === '' || rawBal === '-' ? 0 : parseFloat(rawBal);
    if (isNaN(numBalance)) {
      setError('Please enter a valid numeric balance');
      return;
    }

    if (!bankName.trim()) {
      setError('Please provide a bank or institution name');
      return;
    }

    const numReqAvg = parseFloat(requiredAvgBalance) || 0;
    const numMinReq = parseFloat(minBalanceReq) || 0;
    const numActualAvg = actualAvgBalance.trim() !== '' ? parseFloat(actualAvgBalance) : undefined;

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
          colorTheme: account.colorTheme || 'from-blue-700 to-indigo-900',
        });
      }

      const cleanLast4 = last4.replace(/\D/g, '').slice(-4);
      const masked = cleanLast4 ? `•••• ${cleanLast4}` : (account.accountNumberMasked || '•••• ••••');

      const updates: Partial<BankAccount> = {
        bankId: targetBank.id,
        bankName: targetBank.name,
        institutionName: targetBank.name,
        name: accountName.trim() || `${targetBank.name} ${accountType.toUpperCase()} Account`,
        displayName: accountName.trim() || account.displayName || `${accountType.toUpperCase()} Account`,
        accountType,
        accountNumberMasked: masked,
        last4: cleanLast4 || undefined,
        balance: numBalance,
        ifscCode: ifscCode.trim().toUpperCase() || undefined,
        hasDebitCard,
        status: status as any,
        notes: notes.trim() || undefined,

        // Average & Minimum Balance Management
        averageBalanceMonitoringEnabled: avgMonitoringEnabled,
        averageBalanceRequirement: numReqAvg,
        requiredAverageBalance: numReqAvg,
        minimumBalanceRequirement: numMinReq,
        averageBalancePeriod: avgPeriod,
        actualAverageBalance: numActualAvg !== undefined ? numActualAvg : (avgMonitoringEnabled ? numBalance : undefined),
        averageBalanceSource: avgSource,
        lastAverageBalanceUpdate: new Date().toISOString(),
      };

      const updated = await updateBankAccount(account.id, updates);
      if (onAccountUpdated) onAccountUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update bank account:', err);
      setError(err?.message || 'Failed to update bank account details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-edit-bank-account"
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
                Edit Bank Account Details
              </h2>
              <p className="text-xs text-slate-400">
                Modify details, requirements & average balance monitoring
              </p>
            </div>
          </div>
          <button
            id="btn-close-edit-bank"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-3 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            General Account Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('average_balance')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'average_balance'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Average Balance (MAB/QAB)
            {avgMonitoringEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>
        </div>

        {error && (
          <div className="my-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300 flex-shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-3 overflow-y-auto pr-1 flex-1">
          {activeTab === 'general' && (
            <>
              {/* Bank Selection Top Section */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
                <BankSelector
                  selectedBankName={bankName}
                  onSelectBank={handleSelectBank}
                  label="Select Bank / Institution"
                  maxHeight="max-h-40 sm:max-h-48"
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
                    placeholder="e.g. Primary Salary"
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

              {/* Balance Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Current Balance (₹)
                  </label>
                  {accountType === 'overdraft' ? (
                    <span className="text-[10px] text-amber-400">
                      Negative balance = Overdraft Liability
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      Adjusts ledger balance directly
                    </span>
                  )}
                </div>
                <FinancialAmountInput
                  id="input-edit-bank-balance"
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
                      Last 4 Digits / Identifier
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
                    IFSC Code
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

              {/* Account Status & Debit Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-200">Debit Card Active</span>
                  </div>
                  <input
                    id="checkbox-edit-has-debit-card"
                    type="checkbox"
                    checked={hasDebitCard}
                    onChange={(e) => setHasDebitCard(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 bg-slate-800 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    {status === 'active' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Archive className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-xs text-slate-200">
                      {status === 'active' ? 'Account Active' : 'Account Archived'}
                    </span>
                  </div>
                  <button
                    id="btn-edit-toggle-status"
                    type="button"
                    onClick={() => setStatus(status === 'active' ? 'archived' : 'active')}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                  >
                    {status === 'active' ? 'Archive' : 'Activate'}
                  </button>
                </div>
              </div>

              {/* Zero-Balance Quick Indicator on General Tab */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    Average Balance Rule: {parseFloat(requiredAvgBalance) > 0 ? `₹${formatRupee(parseFloat(requiredAvgBalance))} (${avgPeriod.toUpperCase()})` : 'Zero Balance (No MAB)'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {avgMonitoringEnabled ? 'Monitoring Active' : 'Monitoring Disabled'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('average_balance')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
                >
                  Configure MAB/QAB →
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Notes / Purpose
                </label>
                <input
                  id="input-edit-bank-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Primary salary account and emergency buffer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {activeTab === 'average_balance' && (
            <div className="space-y-4">
              {/* Monitoring Toggle Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Average Balance Monitoring
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Track Monthly (MAB) or Quarterly (QAB) average requirements
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={avgMonitoringEnabled}
                      onChange={(e) => setAvgMonitoringEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {avgMonitoringEnabled ? (
                <>
                  {/* Zero Balance Toggle & Presets */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">Zero-Balance Account</span>
                          <span className="text-[11px] text-slate-400">No monthly or quarterly balance required</span>
                        </div>
                      </div>
                      <button
                        id="btn-toggle-zero-balance"
                        type="button"
                        onClick={() => {
                          if (parseFloat(requiredAvgBalance) === 0) {
                            setRequiredAvgBalance('10000');
                          } else {
                            setRequiredAvgBalance('0');
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          parseFloat(requiredAvgBalance) === 0
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                            : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        {parseFloat(requiredAvgBalance) === 0 ? '✓ Zero-Balance Enabled' : 'Mark as Zero-Balance'}
                      </button>
                    </div>

                    {/* Quick Preset Chips */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Quick Requirement Presets:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { label: 'Zero-Balance', value: '0' },
                          { label: '₹2,000 (Semi-Urban)', value: '2000' },
                          { label: '₹5,000 (Urban/Salary)', value: '5000' },
                          { label: '₹10,000 (Standard Metro)', value: '10000' },
                          { label: '₹25,000 (Premium/Current)', value: '25000' },
                        ].map((chip) => (
                          <button
                            key={chip.value}
                            type="button"
                            onClick={() => setRequiredAvgBalance(chip.value)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              requiredAvgBalance === chip.value
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Period & Requirement */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <SelectField
                        label="Average Balance Period"
                        value={avgPeriod}
                        onChange={(val) => setAvgPeriod(val as AverageBalancePeriod)}
                        options={[
                          { value: 'monthly', label: 'Monthly Average (MAB)', sublabel: 'Calculated over calendar month', badge: 'MAB', badgeColor: 'blue' },
                          { value: 'quarterly', label: 'Quarterly Average (QAB)', sublabel: 'Calculated over calendar quarter', badge: 'QAB', badgeColor: 'purple' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Required Average Balance (₹)
                      </label>
                      <input
                        id="input-edit-required-avg-balance"
                        type="number"
                        min="0"
                        step="100"
                        value={requiredAvgBalance}
                        onChange={(e) => setRequiredAvgBalance(e.target.value)}
                        placeholder="e.g. 10000 (0 for zero-balance)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {parseFloat(requiredAvgBalance) === 0 ? '✓ Configured as zero-balance account (No MAB/QAB penalty)' : 'Minimum average needed over the period'}
                      </span>
                    </div>
                  </div>

                  {/* Minimum Balance Requirement & Tracked Actual */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Minimum Balance Threshold (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={minBalanceReq}
                        onChange={(e) => setMinBalanceReq(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Actual Average Balance (₹)
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={actualAvgBalance}
                        onChange={(e) => {
                          setActualAvgBalance(e.target.value);
                          setAvgSource('manual');
                        }}
                        placeholder={`Current balance fallback: ₹${formatRupee(Number(balance || 0))}`}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Data Source Indicator */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300">Tracking Source:</span>
                      <span className="font-semibold text-white capitalize bg-slate-800 px-2 py-0.5 rounded">
                        {avgSource === 'manual' ? 'Manual Entry (Statement/Netbanking)' : 'Calculated from History'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAvgSource(avgSource === 'manual' ? 'calculated' : 'manual')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium"
                    >
                      Switch to {avgSource === 'manual' ? 'Calculated' : 'Manual'}
                    </button>
                  </div>

                  {/* Compliance Preview */}
                  {parseFloat(requiredAvgBalance) > 0 && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs ${
                        (parseFloat(actualAvgBalance) || parseFloat(balance) || 0) >= parseFloat(requiredAvgBalance)
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold mb-1">
                        {(parseFloat(actualAvgBalance) || parseFloat(balance) || 0) >= parseFloat(requiredAvgBalance) ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <span>
                          {(parseFloat(actualAvgBalance) || parseFloat(balance) || 0) >= parseFloat(requiredAvgBalance)
                            ? 'Compliance Maintained'
                            : 'Average balance appears below your configured requirement'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Configured {avgPeriod.toUpperCase()}: ₹{formatRupee(parseFloat(requiredAvgBalance))} • Tracked:{' '}
                        ₹{formatRupee(parseFloat(actualAvgBalance) || parseFloat(balance) || 0)}
                        {(parseFloat(actualAvgBalance) || parseFloat(balance) || 0) < parseFloat(requiredAvgBalance) && (
                          <span className="text-amber-400 font-bold ml-1">
                            (Deficit: ₹{formatRupee(parseFloat(requiredAvgBalance) - (parseFloat(actualAvgBalance) || parseFloat(balance) || 0))})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-400">
                  <p>Average balance monitoring is currently disabled for this account.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enable the toggle above if this bank requires a monthly or quarterly minimum average balance.
                  </p>
                </div>
              )}
            </div>
          )}

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
              id="btn-save-edit-bank"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
