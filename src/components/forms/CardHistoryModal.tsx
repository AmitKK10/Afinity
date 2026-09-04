/**
 * CardHistoryModal.tsx — Chronological Payments & Balance Update History (Step 6C)
 * Displays explicit payment transactions and all audit trail adjustments.
 */

import React, { useState, useMemo } from 'react';
import { History, Calendar, CreditCard as CreditCardIcon, Building2, Wallet, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancialData } from '../../context/FinancialDataContext';
import { CreditCard, BalanceHistoryRecord, CreditCardPayment } from '../../types';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';

interface CardHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
}

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({
  isOpen,
  onClose,
  card,
}) => {
  const { balanceHistory, creditCardPayments, deleteCreditCardPayment } = useFinancialData();
  const [activeTab, setActiveTab] = useState<'payments' | 'balances'>('payments');

  // Filter payments for this card
  const cardPayments = useMemo(() => {
    if (!card) return [];
    return (creditCardPayments || [])
      .filter((p) => p.cardId === card.id)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [creditCardPayments, card]);

  // Filter balance audit history
  const cardRecords = useMemo(() => {
    if (!card) return [];
    return balanceHistory
      .filter((rec) => rec.entityId === card.id || (rec.entityType === 'credit_card' && rec.entityName === card.displayName))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [balanceHistory, card]);

  const handleDeletePayment = async (payment: CreditCardPayment) => {
    if (window.confirm(`Delete this payment record of ₹${payment.amount.toLocaleString('en-IN')}? Note: This deletes the payment history record.`)) {
      await deleteCreditCardPayment(payment.id);
    }
  };

  if (!card) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Card History & Activity"
      subtitle={`${card.issuer || card.bankName} • ${card.displayName || card.cardName} (•••• ${card.lastFourDigits || '••••'})`}
    >
      <div className="space-y-4 text-xs">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all text-xs font-heading cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Payments Made ({cardPayments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('balances')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all text-xs font-heading cursor-pointer ${
              activeTab === 'balances'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Balance Updates ({cardRecords.length})
          </button>
        </div>

        {/* Tab Content: Payments */}
        {activeTab === 'payments' && (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {cardPayments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                <CreditCardIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-300 font-semibold">No payments recorded yet</p>
                <p className="text-slate-500 text-[11px]">
                  When you settle card dues using "Pay Bill", the payment transaction details will appear here.
                </p>
              </div>
            ) : (
              cardPayments.map((payment) => {
                const isOverpaid = payment.newOutstanding < 0;
                return (
                  <div
                    key={payment.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{formatFinancialDate(payment.paymentDate)}</span>
                        <span className="text-slate-600">•</span>
                        <span className="capitalize text-slate-300 font-medium">
                          {payment.paymentMethod === 'bank_account' ? 'Bank Transfer' : payment.paymentMethod === 'cash' ? 'Cash' : 'Other'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          -₹{payment.amount.toLocaleString('en-IN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(payment)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Delete payment record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-300 font-medium pt-1 text-[11px]">
                      <span className="text-slate-400">
                        Previous: <span className="font-mono text-slate-200">₹{payment.previousOutstanding.toLocaleString('en-IN')}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span>
                        New: <span className={`font-mono font-bold ${isOverpaid ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {isOverpaid ? `-₹${Math.abs(payment.newOutstanding).toLocaleString('en-IN')} (Credit)` : `₹${payment.newOutstanding.toLocaleString('en-IN')}`}
                        </span>
                      </span>
                    </div>

                    {payment.notes && (
                      <div className="text-[11px] text-cyan-300 font-medium bg-slate-950/40 px-2 py-1 rounded-lg border border-slate-800/60">
                        {payment.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab Content: All Balance Updates */}
        {activeTab === 'balances' && (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {cardRecords.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                <History className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-300 font-semibold">No balance updates recorded yet</p>
                <p className="text-slate-500 text-[11px]">
                  Every time you update the outstanding dues on this card, a timestamped audit record will appear here.
                </p>
              </div>
            ) : (
              cardRecords.map((record) => {
                const diff = record.changeAmount || (record.newBalance - record.previousBalance);
                const isPayment = diff < 0;

                return (
                  <div
                    key={record.id}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatFinancialDate(record.timestamp)}</span>
                      </div>

                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                          isPayment
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {isPayment ? `-₹${Math.abs(diff).toLocaleString('en-IN')}` : `+₹${diff.toLocaleString('en-IN')}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-slate-200 font-medium">
                      <span className="text-slate-400">
                        Previous: <span className="font-mono">{formatRupee(record.previousBalance)}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="font-bold text-slate-100">
                        New: <span className="font-mono">{formatRupee(record.newBalance)}</span>
                      </span>
                    </div>

                    {record.notes && (
                      <div className="text-[11px] text-cyan-300 font-medium pt-0.5">
                        Notes: {record.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer font-heading mt-2"
        >
          Close Activity
        </button>
      </div>
    </Modal>
  );
};
