/**
 * RecordCardPaymentModal.tsx — Credit Card Payment Recording Modal (Step 6C)
 * Allows atomic settlement of card dues from Bank Accounts, Cash Vaults, or Other sources.
 * Supports partial payments, full settlement, and overpayments (negative outstanding).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard as CreditCardIcon,
  Building2,
  Wallet,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Info,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SelectField, SelectOption } from '../ui/SelectionSheet';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { useFinancialData } from '../../context/FinancialDataContext';
import { CreditCard, CreditCardPaymentMethod } from '../../types';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';

interface RecordCardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
  onSuccess?: (msg: string) => void;
}

export const RecordCardPaymentModal: React.FC<RecordCardPaymentModalProps> = ({
  isOpen,
  onClose,
  card: initialCard,
  onSuccess,
}) => {
  const {
    creditCards,
    bankAccounts,
    cashHoldings,
    recordCreditCardPayment,
  } = useFinancialData();

  const activeCards = useMemo(
    () => creditCards.filter((c) => c.status === 'active'),
    [creditCards]
  );
  const activeBanks = useMemo(
    () => bankAccounts.filter((b) => b.status === 'active'),
    [bankAccounts]
  );
  const activeCashVaults = useMemo(
    () => cashHoldings.filter((c) => c.status === 'active'),
    [cashHoldings]
  );

  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<CreditCardPaymentMethod>('bank_account');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [selectedCashId, setSelectedCashId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial card when modal opens
  useEffect(() => {
    if (isOpen) {
      const card = initialCard || activeCards[0] || null;
      if (card) {
        setSelectedCardId(card.id);
        const cardOutstanding = Number(
          card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0
        );
        // Pre-fill full dues if positive
        if (cardOutstanding > 0) {
          setAmount(String(cardOutstanding));
        } else {
          setAmount('');
        }
      }
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('bank_account');
      if (activeBanks.length > 0) {
        setSelectedBankId(activeBanks[0].id);
      }
      if (activeCashVaults.length > 0) {
        setSelectedCashId(activeCashVaults[0].id);
      }
      setNotes('');
      setErrorMessage(null);
    }
  }, [isOpen, initialCard, activeCards, activeBanks, activeCashVaults]);

  const currentCard = useMemo(() => {
    return creditCards.find((c) => c.id === selectedCardId) || initialCard || null;
  }, [creditCards, selectedCardId, initialCard]);

  const selectedBank = useMemo(() => {
    return bankAccounts.find((b) => b.id === selectedBankId) || null;
  }, [bankAccounts, selectedBankId]);

  const selectedCash = useMemo(() => {
    return cashHoldings.find((c) => c.id === selectedCashId) || null;
  }, [cashHoldings, selectedCashId]);

  const numAmount = parseFloat(amount) || 0;
  const currentOutstanding = currentCard
    ? Number(currentCard.outstanding !== undefined ? currentCard.outstanding : currentCard.outstandingBalance || 0)
    : 0;

  const newOutstanding = Math.round((currentOutstanding - numAmount) * 100) / 100;
  const isOverpayment = newOutstanding < 0;

  // Validate balance of source account
  const sourceValidation = useMemo(() => {
    if (paymentMethod === 'bank_account' && selectedBank) {
      const bankBal = Number(selectedBank.balance || 0);
      const odLimit = Number(selectedBank.overdraftLimit || 0);
      const available = bankBal + odLimit;
      if (!selectedBank.allowNegativeBalance && numAmount > available) {
        return {
          valid: false,
          error: `Insufficient funds in ${selectedBank.name}. Available: ₹${available.toLocaleString('en-IN')}`,
        };
      }
    } else if (paymentMethod === 'cash' && selectedCash) {
      const cashBal = Number(selectedCash.balance || 0);
      if (numAmount > cashBal) {
        return {
          valid: false,
          error: `Insufficient cash in ${selectedCash.name}. Available: ₹${cashBal.toLocaleString('en-IN')}`,
        };
      }
    }
    return { valid: true, error: null };
  }, [paymentMethod, selectedBank, selectedCash, numAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentCard) {
      setErrorMessage('Please select a valid credit card');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      setErrorMessage('Please enter a payment amount greater than ₹0');
      return;
    }

    if (!sourceValidation.valid) {
      setErrorMessage(sourceValidation.error);
      return;
    }

    let sourceAccountId: string | undefined;
    if (paymentMethod === 'bank_account') {
      sourceAccountId = selectedBankId || undefined;
    } else if (paymentMethod === 'cash') {
      sourceAccountId = selectedCashId || undefined;
    }

    setIsSubmitting(true);
    try {
      await recordCreditCardPayment({
        cardId: currentCard.id,
        amount: numAmount,
        paymentDate,
        paymentMethod,
        sourceAccountId,
        notes: notes.trim() || undefined,
      });

      onSuccess?.(
        `Recorded ₹${numAmount.toLocaleString('en-IN')} payment for ${currentCard.displayName || currentCard.cardName}`
      );
      onClose();
    } catch (err: any) {
      console.error('Failed to record credit card payment:', err);
      setErrorMessage(err.message || 'Failed to record card payment. Transaction rolled back.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Card Bill Payment"
      subtitle="Settle credit card dues and update balances atomically across bank, cash, and card accounts"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* 1. Select Card */}
        <div>
          <SelectField
            label="Credit Card to Pay"
            required
            value={selectedCardId}
            onChange={(val) => {
              setSelectedCardId(val);
              const card = creditCards.find((c) => c.id === val);
              if (card) {
                const out = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
                if (out > 0) setAmount(String(out));
              }
            }}
            showSearch={true}
            searchPlaceholder="Search credit card..."
            options={activeCards.map((c) => {
              const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
              return {
                value: c.id,
                label: `${c.issuer || c.bankName} • ${c.displayName || c.cardName}`,
                sublabel: `•••• ${c.lastFourDigits || '••••'}`,
                badge: out > 0 ? `₹${out.toLocaleString('en-IN')}` : out < 0 ? `-₹${Math.abs(out).toLocaleString('en-IN')}` : 'Settled',
                badgeColor: out > 0 ? 'rose' : out < 0 ? 'emerald' : 'slate',
                icon: <BankBrandBadge bankName={c.issuer || c.bankName || ''} size="sm" showIconOnly={true} />,
              };
            })}
          />
        </div>

        {/* 2. Outstanding Balance & Quick Chips */}
        {currentCard && (
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Current Outstanding
              </span>
              <span className={`text-base font-extrabold font-mono ${currentOutstanding < 0 ? 'text-emerald-400' : 'text-rose-300'}`}>
                {currentOutstanding < 0
                  ? `₹${Math.abs(currentOutstanding).toLocaleString('en-IN')} (Credit Balance)`
                  : `₹${currentOutstanding.toLocaleString('en-IN')}`}
              </span>
            </div>

            {currentOutstanding > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(String(currentOutstanding))}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold cursor-pointer font-heading"
                >
                  Pay Full Dues
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.round(currentOutstanding / 2)))}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer font-heading"
                >
                  50%
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Payment Amount Input */}
        <div className="space-y-1.5">
          <label className="block text-slate-300 font-semibold font-heading">
            Payment Amount (₹) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
        </div>

        {/* 4. Payment Date */}
        <div className="space-y-1.5">
          <label className="block text-slate-300 font-semibold font-heading">
            Payment Date <span className="text-rose-400">*</span>
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
            required
          />
        </div>

        {/* 5. Payment Method & Source Account */}
        <div className="space-y-2">
          <label className="block text-slate-300 font-semibold font-heading">
            Paid From (Source Method) <span className="text-rose-400">*</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'bank_account' as const, label: 'Bank Account', icon: Building2 },
              { key: 'cash' as const, label: 'Cash Vault', icon: Wallet },
              { key: 'other' as const, label: 'Other / External', icon: Sparkles },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-600/20 to-amber-600/20 border-rose-500/50 text-white font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-heading">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* If Bank Account selected */}
          {paymentMethod === 'bank_account' && (
            <div className="pt-1 animate-in fade-in">
              {activeBanks.length === 0 ? (
                <p className="text-amber-400 text-[11px]">No active bank accounts found. Balance will not be deducted.</p>
              ) : (
                <SelectField
                  label="Bank Account to Deduct"
                  required
                  value={selectedBankId}
                  onChange={(val) => setSelectedBankId(val)}
                  showSearch={true}
                  searchPlaceholder="Search bank account..."
                  options={activeBanks.map((b) => ({
                    value: b.id,
                    label: b.bankName || b.name,
                    sublabel: b.accountType.toUpperCase(),
                    badge: `₹${Number(b.balance || 0).toLocaleString('en-IN')}`,
                    badgeColor: 'emerald' as const,
                    icon: <BankBrandBadge bankName={b.bankName || b.name} size="sm" showIconOnly={true} />,
                  }))}
                />
              )}
            </div>
          )}

          {/* If Cash selected */}
          {paymentMethod === 'cash' && (
            <div className="pt-1 animate-in fade-in">
              {activeCashVaults.length === 0 ? (
                <p className="text-amber-400 text-[11px]">No active cash vaults found.</p>
              ) : (
                <SelectField
                  label="Cash Vault to Deduct"
                  required
                  value={selectedCashId}
                  onChange={(val) => setSelectedCashId(val)}
                  options={activeCashVaults.map((c) => ({
                    value: c.id,
                    label: c.displayName || c.name,
                    sublabel: 'Cash Holding',
                    badge: `₹${Number(c.balance || 0).toLocaleString('en-IN')}`,
                    badgeColor: 'emerald' as const,
                    icon: <Wallet className="w-4 h-4 text-amber-400" />,
                  }))}
                />
              )}
            </div>
          )}

          {/* If Other selected */}
          {paymentMethod === 'other' && (
            <p className="text-slate-400 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              No local asset accounts will be deducted. Outstanding on the credit card will be reduced directly.
            </p>
          )}
        </div>

        {/* 6. Notes */}
        <div className="space-y-1.5">
          <label className="block text-slate-300 font-semibold font-heading">
            Payment Notes / Reference (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Monthly statement settlement via Netbanking / UPI Ref #84920"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* 7. Live Dynamic Preview */}
        {numAmount > 0 && currentCard && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 font-heading">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Atomic Transaction Preview</span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">Card Outstanding:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-slate-400">₹{currentOutstanding.toLocaleString('en-IN')}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className={newOutstanding < 0 ? 'text-emerald-400 font-bold' : newOutstanding === 0 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                  {newOutstanding < 0
                    ? `-₹${Math.abs(newOutstanding).toLocaleString('en-IN')} (Credit Balance)`
                    : `₹${newOutstanding.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            {paymentMethod === 'bank_account' && selectedBank && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Bank Balance ({selectedBank.name}):</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-400">₹{Number(selectedBank.balance || 0).toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-emerald-400 font-bold">
                    ₹{(Number(selectedBank.balance || 0) - numAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && selectedCash && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Cash Vault ({selectedCash.name}):</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-400">₹{Number(selectedCash.balance || 0).toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-emerald-400 font-bold">
                    ₹{(Number(selectedCash.balance || 0) - numAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>Net Worth Impact:</span>
              <span className="text-slate-300 font-semibold">₹0 (Net worth preserved)</span>
            </div>
          </div>
        )}

        {/* 8. Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer font-heading"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !numAmount || numAmount <= 0 || !sourceValidation.valid}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 cursor-pointer font-heading disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <TrendingDown className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording...' : `Record Payment ${numAmount > 0 ? `(₹${numAmount.toLocaleString('en-IN')})` : ''}`}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
