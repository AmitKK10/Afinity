import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Landmark,
  DollarSign,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { SIPRecord, BankAccount, AddSIPInput, UpdateSIPInput } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { SelectField } from '../ui/SelectionSheet';
import { BankAccountSelectField } from '../banks/BankAccountSelectField';
import { formatRupee } from '../../utils/formatters';
import { calculateNextSIPDeductionDate, formatDeductionDay } from '../../utils/sipDateUtils';
import { cn } from '../../utils/cn';

interface SIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  sipToEdit?: SIPRecord | null;
  onSuccess?: (msg: string) => void;
}

const COMMON_MF_SUGGESTIONS = [
  'Parag Parikh Flexi Cap Fund Direct Growth',
  'Quant Small Cap Fund Direct Growth',
  'HDFC Mid-Cap Opportunities Direct Plan Growth',
  'Mirae Asset Large Cap Fund Direct Growth',
  'Nippon India Small Cap Fund Direct Growth',
  'SBI Nifty 50 Direct Plan Growth',
  'UTI Nifty 50 Index Fund Direct Growth',
  'Motilal Oswal Midcap Direct Plan Growth',
  'ICICI Prudential Bluechip Direct Plan Growth',
  'Tata Digital India Fund Direct Growth',
];

export const SIPModal: React.FC<SIPModalProps> = ({
  isOpen,
  onClose,
  sipToEdit,
  onSuccess,
}) => {
  const { bankAccounts, addSIP, updateSIP } = useFinancialData();

  const isEditing = !!sipToEdit;

  // Form states
  const [fundName, setFundName] = useState('');
  const [amount, setAmount] = useState('5000');
  const [deductionDay, setDeductionDay] = useState('5');
  const [bankAccountId, setBankAccountId] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'weekly'>('monthly');
  const [status, setStatus] = useState<'active' | 'stopped'>('active');
  const [category, setCategory] = useState('Equity Mutual Fund');
  const [platform, setPlatform] = useState('Groww');
  const [folioNumber, setFolioNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active bank accounts list
  const activeBankAccounts = bankAccounts.filter((b) => b.status !== 'archived' && b.status !== 'closed');

  useEffect(() => {
    if (sipToEdit) {
      setFundName(sipToEdit.fundName || '');
      setAmount(String(sipToEdit.amount || 5000));
      setDeductionDay(String(sipToEdit.deductionDay || 5));
      setBankAccountId(sipToEdit.bankAccountId || '');
      setFrequency(sipToEdit.frequency || 'monthly');
      setStatus(sipToEdit.sipStatus || 'active');
      setCategory(sipToEdit.category || 'Equity Mutual Fund');
      setPlatform(sipToEdit.platform || 'Groww');
      setFolioNumber(sipToEdit.folioNumber || '');
      setNotes(sipToEdit.notes || '');
    } else {
      // Default to first active bank if available
      setFundName('');
      setAmount('5000');
      setDeductionDay('5');
      setBankAccountId(activeBankAccounts[0]?.id || '');
      setFrequency('monthly');
      setStatus('active');
      setCategory('Equity Mutual Fund');
      setPlatform('Groww');
      setFolioNumber('');
      setNotes('');
    }
    setError(null);
  }, [sipToEdit, isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const numDay = parseInt(deductionDay, 10) || 5;

  // Real-time calculation preview
  const calculatedNextDate = calculateNextSIPDeductionDate(
    numDay,
    frequency,
    status,
    new Date()
  );

  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);
  const isBankSufficient = selectedBank ? Number(selectedBank.balance || 0) >= numAmount : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fundName.trim()) {
      setError('Please provide a Mutual Fund or Stock name for this SIP');
      return;
    }

    if (numAmount <= 0) {
      setError('SIP installment amount must be greater than ₹0');
      return;
    }

    if (numDay < 1 || numDay > 31) {
      setError('Deduction day must be between 1 and 31');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && sipToEdit) {
        const updatePayload: UpdateSIPInput = {
          fundName: fundName.trim(),
          amount: numAmount,
          deductionDay: numDay,
          bankAccountId: bankAccountId || undefined,
          bankName: selectedBank?.institutionName || selectedBank?.bankName || selectedBank?.displayName,
          accountNumberMasked: selectedBank?.accountNumberMasked || (selectedBank?.last4 ? `•••• ${selectedBank.last4}` : undefined),
          frequency,
          sipStatus: status,
          category: category.trim() || undefined,
          platform: platform.trim() || undefined,
          folioNumber: folioNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        };
        await updateSIP(sipToEdit.id, updatePayload);
        if (onSuccess) onSuccess(`✓ Updated SIP for ${fundName.trim()}`);
      } else {
        const createPayload: AddSIPInput = {
          fundName: fundName.trim(),
          amount: numAmount,
          deductionDay: numDay,
          bankAccountId: bankAccountId || undefined,
          bankName: selectedBank?.institutionName || selectedBank?.bankName || selectedBank?.displayName,
          accountNumberMasked: selectedBank?.accountNumberMasked || (selectedBank?.last4 ? `•••• ${selectedBank.last4}` : undefined),
          frequency,
          sipStatus: status,
          category: category.trim() || undefined,
          platform: platform.trim() || undefined,
          folioNumber: folioNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        };
        await addSIP(createPayload);
        if (onSuccess) onSuccess(`✓ Created new SIP mandate for ${fundName.trim()}`);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save SIP mandate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="sip-management-modal"
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0d1c33] to-[#0d1629] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">
                {isEditing ? 'Edit SIP Mandate' : 'Add New SIP Mandate'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update installment amount, deduction bank, or date schedule'
                  : 'Track monthly auto-debit mutual fund investments & balance safety'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Fund Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading">
              Mutual Fund / Scheme Name *
            </label>
            <input
              type="text"
              required
              value={fundName}
              onChange={(e) => setFundName(e.target.value)}
              placeholder="e.g. Parag Parikh Flexi Cap Fund Direct Growth"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
            />
            {/* Quick suggestions */}
            {!isEditing && !fundName && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_MF_SUGGESTIONS.slice(0, 3).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setFundName(sug)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors truncate max-w-[200px]"
                  >
                    + {sug.split(' ')[0]} {sug.split(' ')[1]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount and Frequency Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading">
                Installment Amount (₹) *
              </label>
              <input
                type="number"
                step="any"
                min="100"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center gap-1 pt-1">
                {[1000, 2500, 5000, 10000, 25000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(String(quick))}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white font-mono"
                  >
                    ₹{quick >= 1000 ? `${quick / 1000}k` : quick}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading">
                Frequency
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-700/80">
                {(['monthly', 'weekly', 'quarterly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={cn(
                      'py-2 px-2 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer text-center',
                      frequency === freq
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deduction Day & Clamping Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading flex items-center justify-between">
                <span>Deduction Day (1–31) *</span>
                <span className="text-[11px] font-mono text-cyan-400">{formatDeductionDay(numDay)}</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={deductionDay}
                onChange={(e) => setDeductionDay(e.target.value)}
                placeholder="5"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500">
                Days like 31st will safely execute on the last calendar day in shorter months (e.g., 30th or 28th Feb).
              </p>
            </div>

            {/* Deduction Bank Account - Custom Afinity Modal Selector */}
            <BankAccountSelectField
              label="Deduction Bank Account"
              required
              value={bankAccountId}
              bankAccounts={bankAccounts}
              minRequiredBalance={numAmount}
              onChange={(id) => setBankAccountId(id)}
              placeholder="Select Bank Account"
              helperText={
                selectedBank
                  ? `Debits from ${selectedBank.displayName || selectedBank.name}`
                  : 'Select an active bank account'
              }
            />
          </div>

          {/* Status (Active / Stopped) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading">
              SIP Execution Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={cn(
                  'p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer',
                  status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:bg-slate-800'
                )}
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                <span>Active Mandate</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('stopped')}
                className={cn(
                  'p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer',
                  status === 'stopped'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:bg-slate-800'
                )}
              >
                <Square className="w-3.5 h-3.5 text-amber-400" />
                <span>Paused / Stopped</span>
              </button>
            </div>
          </div>

          {/* Live Calculation Preview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Next Scheduled Auto-Debit:</span>
              <span className="font-bold text-cyan-300 font-mono">
                {calculatedNextDate.formattedDate} ({calculatedNextDate.relativeLabel})
              </span>
            </div>

            {selectedBank && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Current Balance in {selectedBank.displayName || selectedBank.name}:</span>
                <span
                  className={cn(
                    'font-mono font-bold',
                    isBankSufficient ? 'text-emerald-400' : 'text-rose-400'
                  )}
                >
                  {formatRupee(selectedBank.balance || 0)} {isBankSufficient ? '✓ Sufficient' : '⚠️ Shortfall'}
                </span>
              </div>
            )}
          </div>

          {/* Optional Meta Row: Platform, Folio, Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading">
                Platform / Broker
              </label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Groww, Zerodha Coin, Kuvera..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading">
                Folio Number (Optional)
              </label>
              <input
                type="text"
                value={folioNumber}
                onChange={(e) => setFolioNumber(e.target.value)}
                placeholder="e.g. 1048593/90"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading">
              Notes / Goal Tag
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Retirement long-term corpus, Emergency Fund..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer font-heading min-h-[38px]"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update SIP Mandate' : 'Create SIP Mandate'}
          </button>
        </div>
      </div>
    </div>
  );
};
