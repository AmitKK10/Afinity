import React, { useState } from 'react';
import { X, ArrowRightLeft, RefreshCw, XCircle, PiggyBank, Landmark, CheckCircle2, AlertCircle } from 'lucide-react';
import { FixedDepositAccount, BankAccount } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { SelectField, SelectOption } from '../ui/SelectionSheet';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { formatRupee } from '../../utils/formatters';

interface FDActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fd: FixedDepositAccount | null;
  initialAction?: 'withdraw' | 'renew' | 'close';
}

export const FDActionModal: React.FC<FDActionModalProps> = ({
  isOpen,
  onClose,
  fd,
  initialAction = 'withdraw',
}) => {
  const { bankAccounts, matureOrWithdrawFD, renewFD } = useFinancialData();

  const [action, setAction] = useState<'withdraw' | 'renew' | 'close'>(initialAction);
  const [destinationBankId, setDestinationBankId] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [newPrincipal, setNewPrincipal] = useState<string>('');
  const [newInterestRate, setNewInterestRate] = useState<string>('');
  const [newTenorMonths, setNewTenorMonths] = useState<number>(12);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeBanks = bankAccounts.filter((b) => b.status === 'active');

  // Populate default fields when FD changes
  React.useEffect(() => {
    if (fd) {
      setAction(initialAction);
      const defaultBank = fd.linkedAccountId
        ? activeBanks.find((b) => b.id === fd.linkedAccountId)?.id
        : activeBanks[0]?.id || '';
      setDestinationBankId(defaultBank || '');
      const expectedPayout = fd.maturityAmount || fd.principal || fd.balance;
      setPayoutAmount(expectedPayout.toString());
      setNewPrincipal(expectedPayout.toString());
      setNewInterestRate((fd.interestRate || 7.1).toString());
    }
  }, [fd, initialAction]);

  if (!isOpen || !fd) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setIsSubmitting(true);
    try {
      if (action === 'withdraw') {
        const numPayout = parseFloat(payoutAmount);
        if (isNaN(numPayout) || numPayout <= 0) {
          setError('Please specify a valid payout amount');
          setIsSubmitting(false);
          return;
        }
        await matureOrWithdrawFD(fd.id, destinationBankId || undefined, numPayout, 'withdraw', notes);
      } else if (action === 'renew') {
        const numNewPrinc = parseFloat(newPrincipal);
        const numNewRate = parseFloat(newInterestRate);
        if (isNaN(numNewPrinc) || numNewPrinc <= 0 || isNaN(numNewRate) || numNewRate <= 0) {
          setError('Please specify valid new principal and interest rate');
          setIsSubmitting(false);
          return;
        }

        const now = new Date();
        const maturity = new Date(now);
        maturity.setMonth(maturity.getMonth() + newTenorMonths);
        const maturityDateStr = maturity.toISOString().split('T')[0];

        await renewFD(fd.id, numNewPrinc, numNewRate, maturityDateStr, notes);
      } else if (action === 'close') {
        await matureOrWithdrawFD(fd.id, undefined, 0, 'close', notes);
      }

      onClose();
    } catch (err: any) {
      console.error('FD Action failed:', err);
      setError(err?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-fd-action"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-center justify-center"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-[#0c1427] border border-slate-700/80 shadow-2xl shadow-black/90 text-white overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800/90 bg-[#0c1427] z-10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-inner">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white font-heading truncate">Manage Fixed Deposit</h2>
              <p className="text-xs text-slate-400 truncate">{fd.displayName || fd.name}</p>
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
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Tabs */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Select Workflow
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
              <button
                type="button"
                onClick={() => setAction('withdraw')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  action === 'withdraw'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Liquidate</span>
              </button>
              <button
                type="button"
                onClick={() => setAction('renew')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  action === 'renew'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Renew</span>
              </button>
              <button
                type="button"
                onClick={() => setAction('close')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  action === 'close'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Close FD</span>
              </button>
            </div>
          </div>

          {/* Action 1: Withdraw / Liquidate to Bank */}
          {action === 'withdraw' && (
            <div className="space-y-3">
              <div>
                <SelectField
                  label="Destination Bank Account (Payout)"
                  required
                  value={destinationBankId}
                  onChange={(val) => setDestinationBankId(val)}
                  showSearch={true}
                  searchPlaceholder="Search bank account..."
                  options={activeBanks.map((b) => ({
                    value: b.id,
                    label: b.institutionName || b.bankName || b.name,
                    sublabel: b.displayName || b.name,
                    badge: formatRupee(b.balance),
                    badgeColor: 'emerald' as const,
                    icon: <BankBrandBadge bankName={b.institutionName || b.bankName || b.name} size="sm" showIconOnly={true} />,
                  }))}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Final Payout Amount (₹) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-base">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Payout will be credited to the selected bank account and the FD will be archived.</span>
              </div>
            </div>
          )}

          {/* Action 2: Renew FD */}
          {action === 'renew' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Renewal Principal (₹) <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newPrincipal}
                    onChange={(e) => setNewPrincipal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    New Interest Rate (% p.a.) <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInterestRate}
                    onChange={(e) => setNewInterestRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  New Tenor
                </label>
                <div className="flex gap-1">
                  {[6, 12, 24, 36, 60].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setNewTenorMonths(m)}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                        newTenorMonths === m
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {m < 12 ? `${m}M` : `${m / 12}Y`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Current deposit is archived as matured; a new term deposit is opened immediately.</span>
              </div>
            </div>
          )}

          {/* Action 3: Close FD */}
          {action === 'close' && (
            <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>This will mark the Fixed Deposit as closed and remove it from active asset calculations.</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Matured upon term completion"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
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
            className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50 cursor-pointer active:scale-95 ${
              action === 'withdraw'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : action === 'renew'
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
            }`}
          >
            {isSubmitting
              ? 'Processing...'
              : action === 'withdraw'
              ? 'Confirm Liquidation'
              : action === 'renew'
              ? 'Confirm Renewal'
              : 'Confirm Closure'}
          </button>
        </div>
      </div>
    </div>
  );
};
