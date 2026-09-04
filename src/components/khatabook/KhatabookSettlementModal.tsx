import React, { useState, useEffect } from 'react';
import {
  Coins,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Wallet,
  Landmark,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  FileText,
  CreditCard,
  Banknote,
  MinusCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { SelectField } from '../ui/SelectionSheet';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { useFinancialData } from '../../context/FinancialDataContext';
import { KhatabookEntry, KhatabookPaymentSourceType } from '../../types';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import {
  normalizeKhatabookType,
  getKhatabookOriginalAmount,
  getKhatabookPaidAmount,
  getKhatabookRemainingAmount,
} from '../../services/calculations';

interface KhatabookSettlementModalProps {
  isOpen: boolean;
  entry: KhatabookEntry | null;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const KhatabookSettlementModal: React.FC<KhatabookSettlementModalProps> = ({
  isOpen,
  entry,
  onClose,
  onSuccess,
}) => {
  const { settleKhatabook, bankAccounts, cashHoldings, wallets } = useFinancialData();

  const [settlementAmount, setSettlementAmount] = useState<string>('');
  const [sourceType, setSourceType] = useState<KhatabookPaymentSourceType>('bank');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [settlementDate, setSettlementDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active accounts lists
  const activeBankAccounts = React.useMemo(
    () => bankAccounts.filter((b) => (b.status || '').toString().toLowerCase() !== 'archived'),
    [bankAccounts]
  );
  const activeCashHoldings = React.useMemo(
    () => cashHoldings.filter((c) => (c.status || '').toString().toLowerCase() !== 'archived'),
    [cashHoldings]
  );
  const activeWallets = React.useMemo(
    () => wallets.filter((w) => (w.status || '').toString().toLowerCase() !== 'archived'),
    [wallets]
  );

  // Reset when entry opens
  useEffect(() => {
    if (entry && isOpen) {
      const remaining = getKhatabookRemainingAmount(entry);
      setSettlementAmount(remaining.toString());
      setSettlementDate(new Date().toISOString().split('T')[0]);
      setReferenceNumber('');
      setNotes('');
      setErrorMessage(null);

      // Default account selection
      if (activeBankAccounts.length > 0) {
        setSourceType('bank');
        setSelectedAccountId(activeBankAccounts[0].id);
      } else if (activeCashHoldings.length > 0) {
        setSourceType('cash');
        setSelectedAccountId(activeCashHoldings[0].id);
      } else if (activeWallets.length > 0) {
        setSourceType('wallet');
        setSelectedAccountId(activeWallets[0].id);
      } else {
        setSourceType('none');
        setSelectedAccountId('');
      }
    }
  }, [entry, isOpen, activeBankAccounts, activeCashHoldings, activeWallets]);

  // Handle sourceType change
  const handleSourceTypeChange = (newType: KhatabookPaymentSourceType) => {
    setSourceType(newType);
    if (newType === 'bank' && activeBankAccounts.length > 0) {
      setSelectedAccountId(activeBankAccounts[0].id);
    } else if (newType === 'cash' && activeCashHoldings.length > 0) {
      setSelectedAccountId(activeCashHoldings[0].id);
    } else if (newType === 'wallet' && activeWallets.length > 0) {
      setSelectedAccountId(activeWallets[0].id);
    } else {
      setSelectedAccountId('');
    }
  };

  if (!entry) return null;

  const type = normalizeKhatabookType(entry.entryType || entry.type);
  const isReceivable = type === 'RECEIVABLE';
  const original = getKhatabookOriginalAmount(entry);
  const paid = getKhatabookPaidAmount(entry);
  const remaining = getKhatabookRemainingAmount(entry);

  const parsedSettlementAmount = parseFloat(settlementAmount) || 0;
  const isFullSettlement = parsedSettlementAmount >= remaining;
  const remainingAfterSettlement = Math.max(0, remaining - parsedSettlementAmount);

  // Find selected account
  let selectedAccountBalance = 0;
  let selectedAccountName = '';

  if (sourceType === 'bank') {
    const b = activeBankAccounts.find((acc) => acc.id === selectedAccountId);
    if (b) {
      selectedAccountBalance = b.balance;
      selectedAccountName = b.displayName || b.name || b.bankName || 'Bank Account';
    }
  } else if (sourceType === 'cash') {
    const c = activeCashHoldings.find((acc) => acc.id === selectedAccountId);
    if (c) {
      selectedAccountBalance = c.balance;
      selectedAccountName = c.displayName || c.name || c.location || 'Cash Holding';
    }
  } else if (sourceType === 'wallet') {
    const w = activeWallets.find((acc) => acc.id === selectedAccountId);
    if (w) {
      selectedAccountBalance = w.balance;
      selectedAccountName = w.displayName || w.name || 'Digital Wallet';
    }
  }

  // Check payable balance sufficiency
  const isInsufficientFunds =
    !isReceivable &&
    sourceType !== 'none' &&
    parsedSettlementAmount > selectedAccountBalance;

  const newAccountBalance = isReceivable
    ? selectedAccountBalance + parsedSettlementAmount
    : selectedAccountBalance - parsedSettlementAmount;

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (parsedSettlementAmount <= 0) {
      setErrorMessage('Please enter a valid settlement amount greater than ₹0');
      return;
    }

    if (parsedSettlementAmount > remaining) {
      setErrorMessage(
        `Settlement amount cannot exceed remaining balance of ${formatRupee(remaining)}`
      );
      return;
    }

    if (sourceType !== 'none' && !selectedAccountId) {
      setErrorMessage('Please select a valid payment account');
      return;
    }

    if (isInsufficientFunds) {
      setErrorMessage(
        `Insufficient balance in ${selectedAccountName} (Available: ${formatRupee(
          selectedAccountBalance
        )}). Please select another account or settle a smaller amount.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await settleKhatabook({
        entryId: entry.id,
        amount: parsedSettlementAmount,
        settlementDate: settlementDate || new Date().toISOString().split('T')[0],
        sourceOrDestinationType: sourceType,
        sourceOrDestinationAccountId: selectedAccountId || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      const actionText = isReceivable ? 'received from' : 'paid to';
      onSuccess?.(
        `✓ Successfully settled ${formatRupee(parsedSettlementAmount)} ${actionText} ${
          entry.personName
        }`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to record settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReceivable ? 'Record Money Received' : 'Record Money Paid'}
      subtitle={`Settling transaction with ${entry.personName}`}
    >
      <form onSubmit={handleSettleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Transaction Card Preview */}
        <div
          className={`p-3.5 rounded-2xl border ${
            isReceivable
              ? 'bg-cyan-950/30 border-cyan-800/40'
              : 'bg-rose-950/30 border-rose-800/40'
          } space-y-2`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isReceivable ? 'bg-cyan-500/20 text-cyan-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isReceivable ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <span className="font-bold text-white text-sm">{entry.personName}</span>
            </div>
            <Badge variant={isReceivable ? 'cyan' : 'rose'} size="sm">
              {isReceivable ? 'Receivable' : 'Payable'}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block">Original</span>
              <span className="font-bold text-slate-200 font-mono">{formatRupee(original)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Already Paid</span>
              <span className="font-bold text-emerald-400 font-mono">{formatRupee(paid)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Remaining Due</span>
              <span
                className={`font-black font-mono ${
                  isReceivable ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {formatRupee(remaining)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Settlement Amount Input & Quick Fill */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-semibold">
              Settlement Amount (₹) <span className="text-cyan-400">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="settle-quick-full-btn"
                onClick={() => setSettlementAmount(remaining.toString())}
                className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold transition-all cursor-pointer"
              >
                Full ({formatRupee(remaining)})
              </button>
              {remaining > 1000 && (
                <button
                  type="button"
                  id="settle-quick-half-btn"
                  onClick={() => setSettlementAmount((remaining / 2).toString())}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  Half ({formatRupee(remaining / 2)})
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
              ₹
            </span>
            <input
              type="number"
              required
              min="1"
              max={remaining}
              step="any"
              id="khatabook-settle-amount-input"
              value={settlementAmount}
              onChange={(e) => setSettlementAmount(e.target.value)}
              placeholder={`Enter amount up to ₹${remaining}`}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* 3. Source / Destination Account Selector */}
        <div className="space-y-2">
          <label className="text-slate-300 font-semibold block">
            {isReceivable ? 'Deposit Money Into' : 'Pay Money From'}
          </label>

          {/* Source Type Pills */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              id="settle-source-bank"
              onClick={() => handleSourceTypeChange('bank')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                sourceType === 'bank'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Bank</span>
            </button>
            <button
              type="button"
              id="settle-source-cash"
              onClick={() => handleSourceTypeChange('cash')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                sourceType === 'cash'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash</span>
            </button>
            <button
              type="button"
              id="settle-source-wallet"
              onClick={() => handleSourceTypeChange('wallet')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                sourceType === 'wallet'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Wallet</span>
            </button>
            <button
              type="button"
              id="settle-source-none"
              onClick={() => handleSourceTypeChange('none')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                sourceType === 'none'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>External</span>
            </button>
          </div>

          {/* Account Dropdown (if not external) */}
          {sourceType === 'bank' && (
            <div>
              <SelectField
                value={selectedAccountId}
                onChange={(val) => setSelectedAccountId(val)}
                options={activeBankAccounts.map((b) => ({
                  value: b.id,
                  label: b.displayName || b.name || b.bankName,
                  sublabel: b.institutionName || b.bankName || 'Bank Account',
                  badge: formatRupee(b.balance),
                  badgeColor: 'blue' as const,
                  icon: <BankBrandBadge bankName={b.institutionName || b.bankName || b.name} size="sm" showIconOnly={true} />,
                }))}
                triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-700 text-xs"
              />
            </div>
          )}

          {sourceType === 'cash' && (
            <div>
              <SelectField
                value={selectedAccountId}
                onChange={(val) => setSelectedAccountId(val)}
                options={activeCashHoldings.map((c) => ({
                  value: c.id,
                  label: c.displayName || c.name || c.location || 'Cash Holding',
                  sublabel: c.location || 'Physical Cash',
                  badge: formatRupee(c.balance),
                  badgeColor: 'emerald' as const,
                  icon: <Banknote className="w-4 h-4 text-emerald-400" />,
                }))}
                triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-700 text-xs"
              />
            </div>
          )}

          {sourceType === 'wallet' && (
            <div>
              <SelectField
                value={selectedAccountId}
                onChange={(val) => setSelectedAccountId(val)}
                options={activeWallets.map((w) => ({
                  value: w.id,
                  label: w.displayName || w.name,
                  sublabel: w.providerName || w.provider || 'Digital Wallet',
                  badge: formatRupee(w.balance),
                  badgeColor: 'purple' as const,
                  icon: <Wallet className="w-4 h-4 text-purple-400" />,
                }))}
                triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-700 text-xs"
              />
            </div>
          )}

          {sourceType === 'none' && (
            <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
              ℹ️ <strong>External / Direct Settlement:</strong> This will adjust the Khatabook record and Net Worth without deducting or adding funds to any tracked Bank, Cash, or Wallet account.
            </p>
          )}
        </div>

        {/* 4. Live Settlement Impact Preview Card */}
        {parsedSettlementAmount > 0 && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Atomic Impact Preview</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Khatabook Remaining */}
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Remaining in Khatabook</span>
                <div className="flex items-center gap-1 font-mono font-bold mt-0.5">
                  <span className="text-slate-400">{formatRupee(remaining)}</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                  <span className={remainingAfterSettlement === 0 ? 'text-emerald-400 font-black' : 'text-slate-200'}>
                    {formatRupee(remainingAfterSettlement)}
                  </span>
                </div>
              </div>

              {/* Account Balance */}
              {sourceType !== 'none' && selectedAccountId ? (
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block truncate">{selectedAccountName}</span>
                  <div className="flex items-center gap-1 font-mono font-bold mt-0.5">
                    <span className="text-slate-400">{formatRupee(selectedAccountBalance)}</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                    <span className={isInsufficientFunds ? 'text-rose-400' : isReceivable ? 'text-emerald-400' : 'text-slate-200'}>
                      {formatRupee(newAccountBalance)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block">Bank/Cash/Wallet</span>
                  <span className="text-slate-400 italic">No account change</span>
                </div>
              )}
            </div>

            {isFullSettlement && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-800/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>This transaction will be marked FULLY SETTLED.</span>
              </div>
            )}
          </div>
        )}

        {/* 5. Date & Reference Number Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Settlement Date
            </label>
            <input
              type="date"
              id="khatabook-settle-date-input"
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Ref / UPI UTR <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="khatabook-settle-ref-input"
              placeholder="e.g. UPI/4082718912"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-300 font-semibold block mb-1">
            Settlement Notes <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            id="khatabook-settle-notes-input"
            placeholder="e.g. Received via GPay, settled after trip"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="khatabook-confirm-settle-btn"
          disabled={isSubmitting || isInsufficientFunds}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer font-heading mt-2 active:scale-98 transition-all ${
            isInsufficientFunds
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isReceivable
              ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-cyan-900/30'
              : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-900/30'
          }`}
        >
          <span>
            {isSubmitting
              ? 'Processing Atomic Settlement...'
              : `Confirm & Record ${formatRupee(parsedSettlementAmount)} Settlement`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </Modal>
  );
};
