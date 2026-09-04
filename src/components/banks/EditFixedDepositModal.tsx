import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  PiggyBank,
  Calendar,
  Percent,
  RefreshCw,
  Calculator,
  Info,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sliders,
  Landmark,
} from 'lucide-react';
import { useFinancialData } from '../../context/FinancialDataContext';
import { FixedDepositAccount, FDInterestType, FDStatus } from '../../types';
import {
  calculateFDEstimatedMaturity,
  calculateAccruedFDValue,
  getDaysToMaturity,
} from '../../services/calculations';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { SelectField, SelectOption } from '../ui/SelectionSheet';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { formatRupee } from '../../utils/formatters';
import { BankSelector } from './BankSelector';

interface EditFixedDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  fd: FixedDepositAccount | null;
  onSuccess?: (message: string) => void;
}

export const EditFixedDepositModal: React.FC<EditFixedDepositModalProps> = ({
  isOpen,
  onClose,
  fd,
  onSuccess,
}) => {
  const { banks, bankAccounts, updateFixedDeposit, addBank } = useFinancialData();

  const [bankName, setBankName] = useState<string>('');
  const [linkedAccountId, setLinkedAccountId] = useState<string>('');
  const [fdName, setFdName] = useState<string>('');
  const [certificateNumber, setCertificateNumber] = useState<string>('');
  const [principal, setPrincipal] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [interestType, setInterestType] = useState<FDInterestType>('compound_quarterly');
  const [startDate, setStartDate] = useState<string>('');
  const [maturityDate, setMaturityDate] = useState<string>('');
  const [autoRenew, setAutoRenew] = useState<boolean>(false);
  const [fdStatus, setFdStatus] = useState<FDStatus>('active');
  const [isCustomMaturity, setIsCustomMaturity] = useState<boolean>(false);
  const [customMaturityAmount, setCustomMaturityAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Populate state when fd changes
  useEffect(() => {
    if (!fd || !isOpen) return;

    setBankName(fd.institutionName || fd.bankName || 'State Bank of India');
    setLinkedAccountId(fd.linkedAccountId || '');
    setFdName(fd.displayName || fd.name || '');
    setCertificateNumber(fd.accountNumberMasked || '');
    setPrincipal(String(fd.principal || fd.balance || ''));
    setInterestRate(String(fd.interestRate || '7.10'));
    setInterestType(fd.interestType || 'compound_quarterly');
    setStartDate(fd.startDate || new Date().toISOString().split('T')[0]);
    setMaturityDate(fd.maturityDate || '');
    setAutoRenew(!!fd.autoRenew);
    setFdStatus(fd.fdStatus || 'active');
    setNotes(fd.notes || '');

    if (fd.maturityAmount) {
      setCustomMaturityAmount(String(fd.maturityAmount));
      setIsCustomMaturity(true);
    } else {
      setIsCustomMaturity(false);
      setCustomMaturityAmount('');
    }
  }, [fd, isOpen]);

  // Derived tenure and live calculations
  const tenureInfo = useMemo(() => {
    if (!startDate || !maturityDate) return { totalDays: 0, totalYears: 1, label: '1 Year' };
    const start = new Date(startDate).getTime();
    const end = new Date(maturityDate).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) {
      return { totalDays: 0, totalYears: 1, label: 'Invalid Date Range' };
    }

    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    const years = diffDays / 365.25;
    const months = Math.round(diffDays / 30.4);

    let label = `${diffDays} Days`;
    if (months >= 12) {
      const y = (months / 12).toFixed(1).replace(/\.0$/, '');
      label = `${y} Years (${diffDays} days)`;
    } else if (months > 0) {
      label = `${months} Months (${diffDays} days)`;
    }

    return { totalDays: diffDays, totalYears: years, label };
  }, [startDate, maturityDate]);

  // Live estimated formula return
  const formulaCalculation = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(interestRate) || 0;
    const t = tenureInfo.totalYears;
    return calculateFDEstimatedMaturity(p, r, t, interestType);
  }, [principal, interestRate, tenureInfo.totalYears, interestType]);

  const effectiveMaturityAmount = isCustomMaturity && parseFloat(customMaturityAmount) > 0
    ? parseFloat(customMaturityAmount)
    : formulaCalculation.maturityAmount;

  const effectiveInterestEarned = Math.max(0, effectiveMaturityAmount - (parseFloat(principal) || 0));

  // Current accrued value to date
  const accruedValueToDate = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(interestRate) || 0;
    return calculateAccruedFDValue(p, r, startDate, maturityDate, interestType);
  }, [principal, interestRate, startDate, maturityDate, interestType]);

  const maturityCountdown = useMemo(() => {
    return getDaysToMaturity(maturityDate);
  }, [maturityDate]);

  if (!isOpen || !fd) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numPrincipal = parseFloat(principal);
    const numRate = parseFloat(interestRate);

    if (isNaN(numPrincipal) || numPrincipal <= 0) {
      setError('Please enter a valid positive principal deposit amount');
      return;
    }

    if (isNaN(numRate) || numRate <= 0) {
      setError('Please enter a valid positive annual interest rate');
      return;
    }

    if (!maturityDate) {
      setError('Please select a valid maturity date');
      return;
    }

    setIsSubmitting(true);
    try {
      let targetBank = banks.find((b) => b.name.toLowerCase() === bankName.trim().toLowerCase());
      if (!targetBank && bankName.trim()) {
        targetBank = await addBank({
          name: bankName.trim(),
          displayName: bankName.trim(),
          status: 'active',
        });
      }

      await updateFixedDeposit(fd.id, {
        bankId: targetBank?.id || fd.bankId,
        bankName: bankName.trim() || fd.bankName,
        institutionName: bankName.trim() || fd.institutionName,
        linkedAccountId: linkedAccountId || undefined,
        name: fdName.trim() || `${bankName.trim()} FD`,
        displayName: fdName.trim() || `${bankName.trim()} FD`,
        accountNumberMasked: certificateNumber.trim() || fd.accountNumberMasked || `FD •••• ${Math.floor(1000 + Math.random() * 9000)}`,
        principal: numPrincipal,
        balance: numPrincipal,
        interestRate: numRate,
        interestType,
        startDate: startDate || undefined,
        maturityDate,
        maturityAmount: effectiveMaturityAmount,
        estimatedCurrentValue: accruedValueToDate,
        autoRenew,
        fdStatus,
        notes: notes.trim() || undefined,
      });

      onSuccess?.(`✓ Updated Fixed Deposit (${fdName || bankName})`);
      onClose();
    } catch (err: any) {
      console.error('Failed to update fixed deposit:', err);
      setError(err?.message || 'Failed to update fixed deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-edit-fixed-deposit"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-center justify-center"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0c1427] border border-slate-700/80 shadow-2xl shadow-black/90 text-white overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800/90 bg-[#0c1427] z-10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-inner">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white font-heading truncate">Edit Fixed Deposit</h2>
              <p className="text-xs text-slate-400 truncate">
                Update deposit certificate, maturity dates, interest rates, and accrued growth
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors flex-shrink-0 ml-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-xs text-rose-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bank / Institution Selector */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <BankSelector
              selectedBankName={bankName}
              onSelectBank={(res) => setBankName(res.name)}
              label="Bank / Financial Institution"
              maxHeight="max-h-40 sm:max-h-48"
            />
          </div>

          {/* Nickname & Goal */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Deposit Nickname / Goal
            </label>
            <input
              type="text"
              value={fdName}
              onChange={(e) => setFdName(e.target.value)}
              placeholder="e.g. 3-Year Emergency Lockin"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          {/* Certificate / Account Number & Linked Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                FD Account / Certificate #
              </label>
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="e.g. FDR/2024/98421 or •••• 4812"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-500"
              />
            </div>

            <div>
              <SelectField
                label="Linked Payout Bank Account"
                value={linkedAccountId}
                onChange={(val) => setLinkedAccountId(val)}
                showSearch={true}
                searchPlaceholder="Search bank account..."
                options={[
                  { value: '', label: 'None / External Account', sublabel: 'No linked local bank balance account' },
                  ...bankAccounts.map((acc) => ({
                    value: acc.id,
                    label: acc.institutionName || acc.bankName || acc.name,
                    sublabel: acc.displayName || acc.name,
                    badge: acc.accountNumberMasked || '••••',
                    badgeColor: 'blue' as const,
                    icon: <BankBrandBadge bankName={acc.institutionName || acc.bankName || acc.name} size="sm" showIconOnly={true} />,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Principal & Interest Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Principal Amount (₹) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  placeholder="50000"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Annual Interest Rate (% p.a.) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="7.10"
                  className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">%</span>
              </div>
            </div>
          </div>

          {/* Start Date & Maturity Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Booking / Opening Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
              <span className="text-[11px] text-slate-400 block">Original deposit creation date</span>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Exact Maturity Date <span className="text-emerald-400">*</span>
              </label>
              <input
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                required
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span className="truncate">{tenureInfo.label}</span>
                <span className="text-emerald-400 font-semibold truncate ml-1">{maturityCountdown.label}</span>
              </div>
            </div>
          </div>

          {/* Interest Compounding Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <SelectField
                label="Compounding Frequency"
                value={interestType}
                onChange={(val) => setInterestType(val as FDInterestType)}
                options={[
                  { value: 'compound_quarterly', label: 'Quarterly Compounded', sublabel: 'Standard Indian bank cumulative growth', badge: 'Standard', badgeColor: 'emerald' },
                  { value: 'compound_monthly', label: 'Monthly Compounded', sublabel: 'Compounded every month', badge: 'Monthly', badgeColor: 'cyan' },
                  { value: 'compound_annually', label: 'Annually Compounded', sublabel: 'Compounded once per year', badge: 'Annual', badgeColor: 'blue' },
                  { value: 'payout', label: 'Non-Cumulative Regular Payout', sublabel: 'Periodic interest credited to bank account', badge: 'Payout', badgeColor: 'amber' },
                  { value: 'simple', label: 'Simple Interest', sublabel: 'Calculated without compounding', badge: 'Simple', badgeColor: 'slate' },
                ]}
              />
            </div>

            <div>
              <SelectField
                label="FD Status"
                value={fdStatus}
                onChange={(val) => setFdStatus(val as FDStatus)}
                options={[
                  { value: 'active', label: 'Active & Compounding', sublabel: 'Currently accruing interest', badge: 'Active', badgeColor: 'emerald' },
                  { value: 'matured', label: 'Matured (Awaiting Payout)', sublabel: 'Tenor completed', badge: 'Matured', badgeColor: 'cyan' },
                  { value: 'closed', label: 'Closed / Liquidated', sublabel: 'Principal and interest received', badge: 'Closed', badgeColor: 'slate' },
                  { value: 'premature_closed', label: 'Prematurely Broken', sublabel: 'Withdrawn before maturity', badge: 'Broken', badgeColor: 'rose' },
                ]}
              />
            </div>
          </div>

          {/* Custom Maturity Payout Override */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
              <div className="flex items-start gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs text-white font-bold leading-tight">Exact Maturity Amount from Certificate</div>
                  <div className="text-[11px] text-slate-400 leading-normal mt-0.5">
                    Match exact maturity amount stated on your physical/PDF deposit receipt
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isCustomMaturity}
                onChange={(e) => setIsCustomMaturity(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-800 flex-shrink-0 mt-0.5 cursor-pointer"
              />
            </label>

            {isCustomMaturity && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Certificate Maturity Payout (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={customMaturityAmount}
                    onChange={(e) => setCustomMaturityAmount(e.target.value)}
                    placeholder={String(Math.round(formulaCalculation.maturityAmount))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/50 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Return & Accrued Value Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-teal-950/30 border border-emerald-800/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4" />
                <span>Deposit Performance Summary</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {isCustomMaturity ? 'Custom Certificate Payout' : 'Calculated Standard'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Interest Earned</span>
                <MoneyDisplay amount={effectiveInterestEarned} size="md" className="text-emerald-400 font-bold" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Maturity Payout</span>
                <MoneyDisplay amount={effectiveMaturityAmount} size="lg" className="text-white font-extrabold" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Accrued to Date</span>
                <MoneyDisplay amount={accruedValueToDate} size="md" className="text-cyan-300 font-bold" />
              </div>
            </div>
          </div>

          {/* Auto Renew & Notes */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <RefreshCw className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-white font-bold leading-tight">Auto-Renew on Maturity</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Re-invest principal automatically when term ends</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-800 flex-shrink-0 ml-2 cursor-pointer"
            />
          </label>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Notes / Lockin Details
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 5-year Section 80C Tax Saver FD, Nominee: Spouse"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>
        </form>

        {/* Fixed Sticky Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800/90 bg-[#0c1427] flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Fixed Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
};
