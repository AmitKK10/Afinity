import React, { useState, useMemo } from 'react';
import {
  X,
  PiggyBank,
  Calendar,
  Percent,
  RefreshCw,
  Calculator,
  Info,
  Clock,
  FileText,
  Landmark,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useFinancialData } from '../../context/FinancialDataContext';
import {
  calculateFDEstimatedMaturity,
  calculateAccruedFDValue,
  getDaysToMaturity,
} from '../../services/calculations';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { SelectField, SelectOption } from '../ui/SelectionSheet';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { formatRupee } from '../../utils/formatters';
import { FDInterestType } from '../../types';
import { BankSelector, BankSelectionResult } from './BankSelector';

interface AddFixedDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const POPULAR_FD_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Bank of Baroda',
  'Punjab National Bank',
  'Post Office Term Deposit',
  'Canara Bank',
  'AU Small Finance Bank',
  'IDFC FIRST Bank',
  'Federal Bank',
  'IndusInd Bank',
];

export const AddFixedDepositModal: React.FC<AddFixedDepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { banks, bankAccounts, addFixedDeposit, addBank } = useFinancialData();

  // Mode: 'past_existing' (alredy created past FD) vs 'new_today'
  const [fdMode, setFdMode] = useState<'past_existing' | 'new_today'>('past_existing');

  const [bankName, setBankName] = useState<string>(banks[0]?.name || 'State Bank of India');
  const [linkedAccountId, setLinkedAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [fdName, setFdName] = useState<string>('');
  const [certificateNumber, setCertificateNumber] = useState<string>('');
  const [principal, setPrincipal] = useState<string>('50000');
  const [interestRate, setInterestRate] = useState<string>('7.10');
  const [interestType, setInterestType] = useState<FDInterestType>('compound_quarterly');

  // Dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [maturityDate, setMaturityDate] = useState<string>('');
  const [tenorMonths, setTenorMonths] = useState<number>(12);

  // Custom maturity amount override
  const [isCustomMaturity, setIsCustomMaturity] = useState<boolean>(false);
  const [customMaturityAmount, setCustomMaturityAmount] = useState<string>('');

  const [autoRenew, setAutoRenew] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or adjust dates when switching mode or tenor
  React.useEffect(() => {
    if (fdMode === 'new_today') {
      const now = new Date();
      setStartDate(now.toISOString().split('T')[0]);
      const mat = new Date(now);
      mat.setMonth(mat.getMonth() + tenorMonths);
      setMaturityDate(mat.toISOString().split('T')[0]);
    } else {
      // Default to 1 year ago for past existing FD if not set
      if (!maturityDate || startDate === todayStr) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const pastStart = oneYearAgo.toISOString().split('T')[0];
        setStartDate(pastStart);

        const twoYearsFuture = new Date();
        twoYearsFuture.setFullYear(twoYearsFuture.getFullYear() + 2);
        setMaturityDate(twoYearsFuture.toISOString().split('T')[0]);
      }
    }
  }, [fdMode, tenorMonths]);

  // Derived tenure calculation
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

  // Formula estimated maturity calculation
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

  // Current accrued value to date for past FDs
  const accruedValueToDate = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(interestRate) || 0;
    return calculateAccruedFDValue(p, r, startDate, maturityDate, interestType);
  }, [principal, interestRate, startDate, maturityDate, interestType]);

  const maturityCountdown = useMemo(() => {
    return getDaysToMaturity(maturityDate);
  }, [maturityDate]);

  if (!isOpen) return null;

  const handleQuickTenorSelect = (months: number) => {
    setTenorMonths(months);
    const start = new Date(startDate || new Date());
    const mat = new Date(start);
    mat.setMonth(mat.getMonth() + months);
    setMaturityDate(mat.toISOString().split('T')[0]);
  };

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
      setError('Please provide or select a valid maturity date');
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

      const generatedName = fdName.trim() || `${bankName.trim()} ${numRate}% FD`;
      const maskNumber = certificateNumber.trim()
        ? (certificateNumber.startsWith('FD') ? certificateNumber : `FD •••• ${certificateNumber.slice(-4)}`)
        : `FD •••• ${Math.floor(1000 + Math.random() * 9000)}`;

      await addFixedDeposit({
        bankId: targetBank?.id,
        bankName: bankName.trim(),
        linkedAccountId: linkedAccountId || undefined,
        name: generatedName,
        displayName: generatedName,
        institutionName: bankName.trim(),
        category: 'fd',
        accountNumberMasked: maskNumber,
        principal: numPrincipal,
        balance: numPrincipal,
        currency: 'INR',
        interestRate: numRate,
        interestType,
        startDate: startDate || undefined,
        maturityDate,
        maturityAmount: effectiveMaturityAmount,
        estimatedCurrentValue: accruedValueToDate,
        autoRenew,
        fdStatus: 'active',
        status: 'active',
        notes: notes.trim() || undefined,
      });

      onSuccess?.(`✓ Added Fixed Deposit (${generatedName})`);
      onClose();
    } catch (err: any) {
      console.error('Failed to create fixed deposit:', err);
      setError(err?.message || 'Failed to create fixed deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-add-fixed-deposit"
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
              <h2 className="text-base sm:text-lg font-bold text-white font-heading truncate">Add Fixed Deposit</h2>
              <p className="text-xs text-slate-400 truncate">
                Track past existing deposits or book new high-yield term deposits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Mode Selector Tab (Past Existing FD vs New Booked Today) */}
          <div className="p-1 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setFdMode('past_existing')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                fdMode === 'past_existing'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Already Active / Past FD</span>
            </button>
            <button
              type="button"
              onClick={() => setFdMode('new_today')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                fdMode === 'new_today'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New FD (Booked Today)</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-xs text-rose-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bank / Institution */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <BankSelector
              selectedBankName={bankName}
              onSelectBank={(result) => setBankName(result.name)}
              label="Issuing Bank / Financial Institution"
              maxHeight="max-h-48 sm:max-h-56"
            />
          </div>

          {/* Deposit Nickname & Certificate Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Deposit Nickname / Goal
              </label>
              <input
                type="text"
                value={fdName}
                onChange={(e) => setFdName(e.target.value)}
                placeholder="e.g. 3-Year Safe Lockin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                FD Account / Certificate #
              </label>
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="e.g. FDR/2024/98421"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
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
                Interest Rate (% p.a.) <span className="text-emerald-400">*</span>
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

          {/* Booking Date & Exact Maturity Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {fdMode === 'past_existing' ? 'Past Booking / Opening Date' : 'Booking Date'} <span className="text-emerald-400">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                required
              />
              <span className="text-[11px] text-slate-400 block">
                {fdMode === 'past_existing'
                  ? 'Date when deposit was booked'
                  : 'Start date of the deposit'}
              </span>
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

          {/* Quick Duration Presets */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Quick Tenor Helper (From Start Date)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: '6M', months: 6 },
                { label: '1Y', months: 12 },
                { label: '2Y', months: 24 },
                { label: '3Y', months: 36 },
                { label: '5Y', months: 60 },
              ].map((t) => (
                <button
                  type="button"
                  key={t.months}
                  onClick={() => handleQuickTenorSelect(t.months)}
                  className={`py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                    tenorMonths === t.months
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/40'
                      : 'bg-slate-900/90 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  +{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compounding & Linked Account */}
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
                  { value: 'payout', label: 'Non-Cumulative Regular Payout', sublabel: 'Periodic interest credited directly to account', badge: 'Payout', badgeColor: 'amber' },
                  { value: 'simple', label: 'Simple Interest', sublabel: 'Calculated without compounding', badge: 'Simple', badgeColor: 'slate' },
                ]}
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

          {/* Custom Maturity Amount Override Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
              <div className="flex items-start gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs text-white font-bold leading-tight">Exact Maturity Amount from Certificate</div>
                  <div className="text-[11px] text-slate-400 leading-normal mt-0.5">
                    Override calculation with exact payout printed on your FD receipt
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isCustomMaturity}
                onChange={(e) => {
                  setIsCustomMaturity(e.target.checked);
                  if (e.target.checked && !customMaturityAmount) {
                    setCustomMaturityAmount(String(Math.round(formulaCalculation.maturityAmount)));
                  }
                }}
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

          {/* Estimated Return Preview Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-teal-950/30 border border-emerald-800/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4" />
                <span>Estimated Return & Current Value</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {isCustomMaturity ? 'Certificate Override' : 'Compounded Return'}
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
              {fdMode === 'past_existing' && (
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Accrued to Date</span>
                  <MoneyDisplay amount={accruedValueToDate} size="md" className="text-cyan-300 font-bold" />
                </div>
              )}
            </div>
          </div>

          {/* Auto Renew on Maturity */}
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

          {/* Notes / Plan details */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Notes / Lockin Details (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 5-Year Section 80C Tax Saver FD, Nominee: Mother"
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
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isSubmitting
              ? 'Saving Fixed Deposit...'
              : fdMode === 'past_existing'
              ? 'Track Existing FD'
              : 'Confirm & Open FD'}
          </button>
        </div>
      </div>
    </div>
  );
};
