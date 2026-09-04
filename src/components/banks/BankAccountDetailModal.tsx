import React, { useState } from 'react';
import {
  X,
  Landmark,
  CreditCard,
  Scale,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ArrowRightLeft,
  XCircle,
  Archive,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  History,
  ShieldCheck,
  TrendingUp,
  FileText,
  Calculator,
  Plus,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  BankAccount,
  BankAverageBalanceRecord,
  AverageBalancePeriod,
  AverageBalanceSource,
} from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { Badge } from '../ui/Badge';
import { formatRupee } from '../../utils/formatters';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { getBankBrandTheme } from '../../utils/bankThemes';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};
import {
  getBankAccountAverageBalanceStatus,
  calculateEstimatedAverageBalanceFromHistory,
} from '../../services/calculations';

interface BankAccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount | null;
  onEditAccount: (account: BankAccount) => void;
  onUpdateBalance: (account: BankAccount) => void;
  onTransfer: (account: BankAccount) => void;
  onCloseAccount: (account: BankAccount) => void;
}

export const BankAccountDetailModal: React.FC<BankAccountDetailModalProps> = ({
  isOpen,
  onClose,
  account,
  onEditAccount,
  onUpdateBalance,
  onTransfer,
  onCloseAccount,
}) => {
  const { balanceHistory, logBankAccountAverageBalance, updateBankAccount } = useFinancialData();

  const [activeTab, setActiveTab] = useState<'overview' | 'log_average' | 'history' | 'settings'>('overview');

  // Form states for logging average balance
  const [logAmount, setLogAmount] = useState<string>('');
  const [logPeriod, setLogPeriod] = useState<AverageBalancePeriod>('monthly');
  const [logPeriodLabel, setLogPeriodLabel] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });
  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [logSource, setLogSource] = useState<AverageBalanceSource>('manual');
  const [logNotes, setLogNotes] = useState<string>('');
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);
  const [logErrorMessage, setLogErrorMessage] = useState<string | null>(null);

  // Auto-calculation preview state
  const [calculationPreview, setCalculationPreview] = useState<{
    averageBalance: number;
    sampleCount: number;
    periodDays: number;
    startDate: string;
    endDate: string;
    method: string;
  } | null>(null);

  // Settings tab states
  const [settingsMonitoringEnabled, setSettingsMonitoringEnabled] = useState<boolean>(false);
  const [settingsRequiredAmount, setSettingsRequiredAmount] = useState<string>('0');
  const [settingsPeriod, setSettingsPeriod] = useState<AverageBalancePeriod>('monthly');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState<string | null>(null);

  // Sync settings when account changes
  React.useEffect(() => {
    if (account) {
      const req = account.averageBalanceRequirement ?? account.requiredAverageBalance ?? 0;
      setSettingsMonitoringEnabled(Boolean(account.averageBalanceMonitoringEnabled || req > 0));
      setSettingsRequiredAmount(String(req));
      setSettingsPeriod(account.averageBalancePeriod || 'monthly');
      setLogPeriod(account.averageBalancePeriod || 'monthly');
      setLogAmount(account.actualAverageBalance !== undefined ? String(account.actualAverageBalance) : String(account.balance || 0));
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const brandTheme = getBankBrandTheme(account.institutionName || account.bankName || account.displayName || account.name);
  const isOverdrawn = Number(account.balance) < 0;
  const isArchived = account.status === 'archived';
  const avgStatus = getBankAccountAverageBalanceStatus(account);

  const handleRunAutoCalculation = () => {
    const result = calculateEstimatedAverageBalanceFromHistory(
      account,
      balanceHistory,
      logPeriod
    );
    setCalculationPreview(result);
    setLogAmount(String(result.averageBalance));
    setLogSource('calculated');
    setLogNotes(
      result.sampleCount > 0
        ? `Calculated from ${result.sampleCount} balance events (${result.startDate} to ${result.endDate})`
        : `Calculated from steady account balance (${result.periodDays} days)`
    );
  };

  const handleLogAverageBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogErrorMessage(null);
    setLogSuccessMessage(null);

    const amountNum = parseFloat(logAmount);
    if (isNaN(amountNum)) {
      setLogErrorMessage('Please enter a valid numeric average balance amount.');
      return;
    }

    setIsLogging(true);
    try {
      await logBankAccountAverageBalance(account.id, {
        date: logDate,
        period: logPeriod,
        periodLabel: logPeriodLabel.trim() || (logPeriod === 'monthly' ? 'Monthly Average' : 'Quarterly Average'),
        amount: amountNum,
        source: logSource,
        requiredAmount: avgStatus.requiredAmount,
        notes: logNotes.trim() || undefined,
      });

      setLogSuccessMessage(`Average balance record of ₹${formatRupee(amountNum)} logged successfully.`);
      setTimeout(() => {
        setLogSuccessMessage(null);
        setActiveTab('overview');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to log average balance:', err);
      setLogErrorMessage(err?.message || 'Failed to record average balance.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccessMessage(null);

    const reqNum = parseFloat(settingsRequiredAmount) || 0;
    try {
      await updateBankAccount(account.id, {
        averageBalanceMonitoringEnabled: settingsMonitoringEnabled,
        averageBalanceRequirement: reqNum,
        requiredAverageBalance: reqNum,
        averageBalancePeriod: settingsPeriod,
        lastAverageBalanceUpdate: new Date().toISOString(),
      });

      setSettingsSuccessMessage('Average balance requirements updated successfully.');
      setTimeout(() => {
        setSettingsSuccessMessage(null);
        setActiveTab('overview');
      }, 1000);
    } catch (err: any) {
      console.error('Failed to update requirement settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Get records list
  const records: BankAverageBalanceRecord[] = account.averageBalanceRecords || [];

  return (
    <div
      id="modal-bank-account-detail"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0b1329] border border-slate-700/80 shadow-2xl p-5 sm:p-7 text-white animate-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col">
        {/* Header with Bank Brand & Identity */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <BankBrandBadge
              bankName={account.bankName}
              institutionName={account.institutionName || account.displayName || account.name}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white font-heading">
                  {account.displayName || account.name}
                </h2>
                <Badge variant={account.accountType === 'salary' ? 'success' : account.accountType === 'current' ? 'warning' : 'default'}>
                  {account.accountType.toUpperCase()}
                </Badge>
                {isArchived && <Badge variant="danger">Archived</Badge>}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="font-semibold text-slate-300">
                  {account.institutionName || account.bankName || brandTheme.name}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-300">
                  {account.accountNumberMasked || (account.last4 ? `•••• ${account.last4}` : '•••• ••••')}
                </span>
                {account.ifscCode && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-slate-400">IFSC: {account.ifscCode}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-header-edit-bank-details"
              onClick={() => onEditAccount(account)}
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Edit Bank Details"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Edit Bank Details</span>
            </button>

            <button
              id="btn-close-bank-detail"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-3 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs flex-shrink-0 overflow-x-auto">
          <button
            id="tab-btn-overview"
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 px-3 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview & Status
          </button>
          <button
            id="tab-btn-log-average"
            onClick={() => setActiveTab('log_average')}
            className={`py-1.5 px-3 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'log_average'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Log / Update Average
          </button>
          <button
            id="tab-btn-history"
            onClick={() => setActiveTab('history')}
            className={`py-1.5 px-3 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History ({records.length})
          </button>
          <button
            id="tab-btn-settings"
            onClick={() => setActiveTab('settings')}
            className={`py-1.5 px-3 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Requirement Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="mt-4 overflow-y-auto pr-1 flex-1 space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Financial Position Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Balance Card */}
                <div className={`p-4 rounded-2xl border ${isOverdrawn ? 'bg-rose-950/30 border-rose-800/60' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {isOverdrawn ? 'Overdrawn Balance (Liability)' : 'Current Ledger Balance'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <MoneyDisplay
                      amount={account.balance}
                      size="xl"
                      className={isOverdrawn ? 'text-rose-400 font-extrabold' : 'text-white font-extrabold'}
                    />
                    {isOverdrawn && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3" /> Overdraft
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Last balance update: {formatDate(account.lastUpdated || account.updatedAt)}</span>
                  </div>
                </div>

                {/* Average Balance Metric Card */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {avgStatus.periodLabel}
                      </span>
                      {avgStatus.status === 'maintained' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Maintained
                        </span>
                      ) : avgStatus.status === 'deficit' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> Below Requirement
                        </span>
                      ) : avgStatus.requiredAmount === 0 && avgStatus.monitoringEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                          <ShieldCheck className="w-3 h-3" /> Zero Balance
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                          Not Monitored
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-bold font-mono text-white">
                        ₹{formatRupee(avgStatus.actualAmount)}
                      </span>
                      {avgStatus.monitoringEnabled && avgStatus.requiredAmount > 0 && (
                        <span className="text-xs text-slate-400">
                          / Req. ₹{formatRupee(avgStatus.requiredAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Source: {avgStatus.source === 'manual' ? 'Manual Entry' : 'Calculated'}
                    </span>
                    <button
                      onClick={() => setActiveTab('log_average')}
                      className="text-blue-400 hover:text-blue-300 font-semibold text-[11px] flex items-center gap-0.5"
                    >
                      Update <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Informational Alert Box when Below Requirement */}
              {avgStatus.hasAlert && (
                <div
                  id="alert-below-requirement"
                  className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-300">
                        Average balance appears below your configured requirement
                      </h4>
                      <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                        Your recorded average balance of <strong className="text-white">₹{formatRupee(avgStatus.actualAmount)}</strong> is{' '}
                        <strong className="text-amber-300">₹{formatRupee(avgStatus.deficit)}</strong> below your configured {avgStatus.period.toUpperCase()} requirement of <strong className="text-white">₹{formatRupee(avgStatus.requiredAmount)}</strong>.
                      </p>
                      <div className="mt-2.5 p-2 rounded-xl bg-amber-950/60 border border-amber-800/50 text-[11px] text-amber-300/80 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Informational Notice:</strong> This reminder is calculated from your configured parameters. Final bank fee assessments depend on individual bank terms, branch categories, and exact daily product closing calculations.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Specifications */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Account Specifications & Details
                  </h4>
                  <button
                    id="btn-specs-edit-bank-details"
                    type="button"
                    onClick={() => onEditAccount(account)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Bank Details</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Bank / Institution</span>
                    <span className="font-semibold text-slate-200">{account.institutionName || account.bankName || 'Direct Account'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Account Type</span>
                    <span className="font-semibold text-slate-200 capitalize">{account.accountType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Masked Identifier</span>
                    <span className="font-mono text-slate-200">{account.accountNumberMasked || '•••• ••••'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">IFSC Code</span>
                    <span className="font-mono text-slate-200">{account.ifscCode || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Debit Card</span>
                    <span className="font-semibold text-slate-200">{account.hasDebitCard ? 'Active Attached' : 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Account Status</span>
                    <span className={`font-semibold capitalize ${isArchived ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {account.status || 'Active'}
                    </span>
                  </div>
                </div>

                {account.notes && (
                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                    <span className="text-slate-500 block text-[11px] mb-0.5">Notes / Purpose:</span>
                    <p className="italic text-slate-300">"{account.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LOG / UPDATE AVERAGE BALANCE */}
          {activeTab === 'log_average' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/30">
                <div className="flex items-center gap-2.5 mb-2">
                  <Scale className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Log Periodic Average Balance
                    </h3>
                    <p className="text-xs text-slate-400">
                      Record actual average balance from bank statement or auto-calculate from history
                    </p>
                  </div>
                </div>

                {logSuccessMessage && (
                  <div className="my-2 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{logSuccessMessage}</span>
                  </div>
                )}

                {logErrorMessage && (
                  <div className="my-2 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{logErrorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleLogAverageBalance} className="space-y-3.5 mt-3">
                  {/* Period & Label */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Evaluation Period
                      </label>
                      <select
                        value={logPeriod}
                        onChange={(e) => setLogPeriod(e.target.value as AverageBalancePeriod)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="monthly">Monthly Average (MAB)</option>
                        <option value="quarterly">Quarterly Average (QAB)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Period Label
                      </label>
                      <input
                        type="text"
                        value={logPeriodLabel}
                        onChange={(e) => setLogPeriodLabel(e.target.value)}
                        placeholder="e.g. August 2026 / Q3 2026"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Amount & Auto-calculate Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Tracked Average Balance (₹)
                      </label>
                      <button
                        type="button"
                        onClick={handleRunAutoCalculation}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30"
                      >
                        <Calculator className="w-3 h-3" /> Auto-Calculate from History
                      </button>
                    </div>
                    <input
                      id="input-log-average-amount"
                      type="number"
                      step="100"
                      value={logAmount}
                      onChange={(e) => {
                        setLogAmount(e.target.value);
                        setLogSource('manual');
                      }}
                      placeholder="e.g. 15000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Calculation Preview Box if clicked */}
                  {calculationPreview && (
                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          Auto-Calculated Time-Weighted Average
                        </span>
                        <span className="font-mono text-white font-bold">
                          ₹{formatRupee(calculationPreview.averageBalance)}
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-300/80">
                        {calculationPreview.sampleCount > 0
                          ? `Computed across ${calculationPreview.sampleCount} recorded balance events from ${calculationPreview.startDate} to ${calculationPreview.endDate}.`
                          : `Calculated from current steady balance across the ${calculationPreview.periodDays}-day window.`}
                      </p>
                    </div>
                  )}

                  {/* Source & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Source of Value
                      </label>
                      <select
                        value={logSource}
                        onChange={(e) => setLogSource(e.target.value as AverageBalanceSource)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="manual">Manual Entry (Netbanking / Statement)</option>
                        <option value="calculated">Calculated from Ledger History</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Record As-Of Date
                      </label>
                      <input
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Notes / Statement Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      placeholder="e.g. Netbanking MAB statement download"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      id="btn-submit-log-average"
                      type="submit"
                      disabled={isLogging}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {isLogging ? 'Recording...' : 'Save Average Balance Record'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY OF RECORDS */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Logged Average Balance Records
                </h3>
                <span className="text-xs text-slate-500">
                  {records.length} {records.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {records.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
                  <Scale className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-400">
                    No historical average balance records logged yet.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Use the "Log / Update Average" tab to record your monthly or quarterly statements.
                  </p>
                  <button
                    onClick={() => setActiveTab('log_average')}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold"
                  >
                    Log First Record
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {records.map((rec) => {
                    const reqAmt = rec.requiredAmount ?? avgStatus.requiredAmount;
                    const isMaint = rec.isMaintained !== undefined ? rec.isMaintained : rec.amount >= reqAmt;

                    return (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {rec.periodLabel || (rec.period === 'monthly' ? 'Monthly Average' : 'Quarterly Average')}
                            </span>
                            {isMaint ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Maintained
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                <AlertTriangle className="w-2.5 h-2.5" /> Deficit
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>Date: {formatDate(rec.date)}</span>
                            <span>•</span>
                            <span className="capitalize">
                              Source: {rec.source === 'manual' ? 'Manual' : 'Calculated'}
                            </span>
                          </div>
                          {rec.notes && (
                            <p className="text-[11px] text-slate-400 italic mt-1">
                              "{rec.notes}"
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-mono font-bold text-white block">
                            ₹{formatRupee(rec.amount)}
                          </span>
                          {reqAmt > 0 && (
                            <span className="text-[10px] text-slate-500 block">
                              Req: ₹{formatRupee(reqAmt)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REQUIREMENT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Configure Average Balance Rule
                </h3>

                {settingsSuccessMessage && (
                  <div className="mb-3 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{settingsSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  {/* Enable / Disable toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Enable Monitoring
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Enable compliance checks and deficit warnings for this account
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsMonitoringEnabled}
                        onChange={(e) => setSettingsMonitoringEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {settingsMonitoringEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Period
                        </label>
                        <select
                          value={settingsPeriod}
                          onChange={(e) => setSettingsPeriod(e.target.value as AverageBalancePeriod)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="monthly">Monthly Average Balance (MAB)</option>
                          <option value="quarterly">Quarterly Average Balance (QAB)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Required Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={settingsRequiredAmount}
                          onChange={(e) => setSettingsRequiredAmount(e.target.value)}
                          placeholder="e.g. 10000 (0 for zero balance)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Quick Actions */}
        <div className="pt-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="btn-footer-edit-account"
              onClick={() => onEditAccount(account)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              Edit Account Details
            </button>
            <button
              id="btn-footer-transfer"
              onClick={() => onTransfer(account)}
              className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              Transfer
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-footer-update-balance"
              onClick={() => onUpdateBalance(account)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              Adjust Balance
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
