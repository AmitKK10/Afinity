/**
 * UpdateOutstandingModal.tsx — Quick Outstanding Balance Updater (Step 6B)
 * Logs balance changes, reasons, notes, and audits.
 */

import React, { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { SelectField } from '../ui/SelectionSheet';
import { useFinancialData } from '../../context/FinancialDataContext';
import { CreditCard } from '../../types';
import { formatRupee } from '../../utils/formatters';

interface UpdateOutstandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
  onSuccess?: (msg: string) => void;
}

export const UpdateOutstandingModal: React.FC<UpdateOutstandingModalProps> = ({
  isOpen,
  onClose,
  card,
  onSuccess,
}) => {
  const { updateCreditCardOutstanding } = useFinancialData();

  const [newOutstanding, setNewOutstanding] = useState('');
  const [reason, setReason] = useState<string>('Payment / Bill Settlement');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (card) {
      const current = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
      setNewOutstanding(String(current));
      setReason('Payment / Bill Settlement');
      setNotes('');
      setErrorMessage(null);
    }
  }, [card]);

  if (!card) return null;

  const currentOutstanding = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
  const rawParsed = newOutstanding.trim();
  const parsedNew = rawParsed === '' || rawParsed === '-' ? 0 : parseFloat(rawParsed);
  const isValidNumber = !isNaN(parsedNew) && rawParsed !== '-';
  const diff = isValidNumber ? parsedNew - currentOutstanding : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNumber && rawParsed !== '') {
      setErrorMessage('Please enter a valid numeric outstanding amount');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updateCreditCardOutstanding(card.id, parsedNew, {
        reason,
        notes: notes.trim() || undefined,
      });

      onSuccess?.(`✓ Updated outstanding for ${card.displayName || card.cardName}: ₹${parsedNew}`);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Outstanding Dues"
      subtitle={`${card.issuer || card.bankName} • ${card.cardName || card.displayName} (•••• ${card.lastFourDigits || '••••'})`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Current Balance Display */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Current Balance on Record</span>
            <span className="text-base font-extrabold text-slate-100 tabular-nums">
              {currentOutstanding < 0
                ? `₹${Math.abs(currentOutstanding)} Credit Balance`
                : formatRupee(currentOutstanding)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Credit Limit</span>
            <span className="text-sm font-bold text-slate-300 tabular-nums">
              {formatRupee(card.creditLimit)}
            </span>
          </div>
        </div>

        {/* New Outstanding Input Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-semibold">New Outstanding Balance (₹) *</label>
            <span className="text-[10px] text-cyan-400">Can be negative (refund/overpaid)</span>
          </div>
          <FinancialAmountInput
            id="input-new-outstanding"
            value={newOutstanding}
            onChange={setNewOutstanding}
            allowNegative={true}
            currencySymbol={null}
            autoFocus
            placeholder="0"
            inputClassName="p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Live Computed Difference */}
        {isValidNumber && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              diff < 0
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                : diff > 0
                ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {diff < 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              ) : diff > 0 ? (
                <TrendingUp className="w-4 h-4 text-rose-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-500" />
              )}
              <span className="font-semibold">
                {diff < 0
                  ? `Payment / Reduction: -₹${Math.abs(diff)}`
                  : diff > 0
                  ? `Additional Spend: +₹${diff}`
                  : 'No Change in Balance'}
              </span>
            </div>
            {parsedNew < 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Refund Credit
              </span>
            )}
          </div>
        )}

        {/* Update Reason */}
        <div>
          <SelectField
            label="Reason for Update *"
            value={reason}
            onChange={(val) => setReason(val)}
            options={[
              { value: 'Payment / Bill Settlement', label: 'Payment / Bill Settlement', sublabel: 'Bill paid or auto-debit executed', badge: 'Settlement', badgeColor: 'emerald' },
              { value: 'Purchase / Daily Spend', label: 'Purchase / Daily Spend', sublabel: 'New expense or retail transaction', badge: 'Spend', badgeColor: 'rose' },
              { value: 'Refund / Merchant Credit', label: 'Refund / Merchant Credit', sublabel: 'Returned item or reversal credit', badge: 'Refund', badgeColor: 'blue' },
              { value: 'Cashback / Reward Credit', label: 'Cashback / Reward Credit', sublabel: 'Statement cashbacks or perks', badge: 'Reward', badgeColor: 'amber' },
              { value: 'Statement Balance Reconciliation', label: 'Statement Balance Reconciliation', sublabel: 'Syncing with monthly bank statement', badge: 'Sync', badgeColor: 'purple' },
              { value: 'Correction / Manual Adjustment', label: 'Correction / Manual Adjustment', sublabel: 'Fix typo or manual correction', badge: 'Fix', badgeColor: 'slate' },
              { value: 'Other', label: 'Other', sublabel: 'Custom ledger entry' },
            ]}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-300 font-semibold block mb-1">Notes (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Paid in full via CRED / HDFC Netbanking"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-rose-950/40 flex items-center justify-center gap-2 cursor-pointer font-heading mt-2"
        >
          <span>{isSubmitting ? 'Saving...' : 'Update Outstanding Dues'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </Modal>
  );
};
