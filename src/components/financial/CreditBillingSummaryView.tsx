/**
 * CreditBillingSummaryView.tsx — Monthly Billing Cycles & Dues Schedule (Step 6C)
 * Provides a consolidated timeline of statement dates, payment deadlines, and cycle settlements.
 */

import React, { useMemo } from 'react';
import {
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingDown,
  CreditCard as CreditCardIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { CreditCard, CreditCardPayment } from '../../types';
import { calculateCardBillingCycle } from '../../services/calculations';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';

interface CreditBillingSummaryViewProps {
  creditCards: CreditCard[];
  payments: CreditCardPayment[];
  onPayCard: (card: CreditCard) => void;
}

export const CreditBillingSummaryView: React.FC<CreditBillingSummaryViewProps> = ({
  creditCards,
  payments,
  onPayCard,
}) => {
  const activeCards = useMemo(
    () => creditCards.filter((c) => c.status === 'active'),
    [creditCards]
  );

  // Group and sort cards by next due date
  const cardsWithBilling = useMemo(() => {
    return activeCards
      .map((card) => {
        const billing = calculateCardBillingCycle(card);
        const outstanding = Number(
          card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0
        );
        return {
          card,
          billing,
          outstanding,
        };
      })
      .sort((a, b) => a.billing.daysUntilDue - b.billing.daysUntilDue);
  }, [activeCards]);

  const overdueCards = cardsWithBilling.filter(
    (c) => c.billing.isOverdue && c.outstanding > 0
  );
  const dueSoonCards = cardsWithBilling.filter(
    (c) => !c.billing.isOverdue && c.billing.cycleStatus === 'due_soon' && c.outstanding > 0
  );
  const upcomingCards = cardsWithBilling.filter(
    (c) => c.billing.cycleStatus === 'upcoming' && c.outstanding > 0
  );
  const zeroDueCards = cardsWithBilling.filter((c) => c.outstanding <= 0);

  const totalDuesThisCycle = cardsWithBilling
    .filter((c) => c.outstanding > 0)
    .reduce((sum, c) => sum + c.outstanding, 0);

  const totalPaidThisMonth = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return (payments || [])
      .filter((p) => (p.paymentDate || '').startsWith(currentMonth))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  return (
    <div id="credit-billing-summary-view" className="space-y-4 animate-in fade-in">
      {/* 1. Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Dues */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-800/30 space-y-1">
          <span className="text-[11px] text-rose-300/80 font-bold uppercase tracking-wider font-heading">
            Total Active Dues
          </span>
          <div className="text-xl font-extrabold text-white font-mono">
            {formatRupee(totalDuesThisCycle)}
          </div>
          <span className="text-[10px] text-slate-400">
            Across {cardsWithBilling.filter((c) => c.outstanding > 0).length} cards with payable dues
          </span>
        </div>

        {/* Payments Made this Month */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/30 space-y-1">
          <span className="text-[11px] text-emerald-300/80 font-bold uppercase tracking-wider font-heading">
            Settled This Month
          </span>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {formatRupee(totalPaidThisMonth)}
          </div>
          <span className="text-[10px] text-slate-400">
            Recorded in current calendar month
          </span>
        </div>

        {/* Urgent Action Count */}
        <div className={`p-4 rounded-2xl border space-y-1 ${
          overdueCards.length > 0
            ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            : dueSoonCards.length > 0
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <span className="text-[11px] font-bold uppercase tracking-wider font-heading">
            Payment Urgency
          </span>
          <div className="text-xl font-extrabold font-mono">
            {overdueCards.length > 0 ? (
              <span className="text-rose-400">{overdueCards.length} Overdue</span>
            ) : dueSoonCards.length > 0 ? (
              <span className="text-amber-400">{dueSoonCards.length} Due Soon</span>
            ) : (
              <span className="text-emerald-400">All Clear</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400">
            {overdueCards.length > 0
              ? 'Immediate action recommended'
              : dueSoonCards.length > 0
              ? 'Due within the next 5 days'
              : 'No imminent payment deadlines'}
          </span>
        </div>
      </div>

      {/* 2. Billing Timeline by Card */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-heading">
              Card Billing Cycles & Due Deadlines
            </h3>
            <p className="text-xs text-slate-400">
              Sorted chronologically by nearest payment deadline
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {cardsWithBilling.map(({ card, billing, outstanding }) => {
            const isCreditBalance = outstanding < 0;
            const isZeroDue = outstanding === 0;

            return (
              <div
                key={card.id}
                className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Card details */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-7 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-slate-300 uppercase">
                    {card.issuer?.slice(0, 3) || 'CRD'}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-heading">
                        {card.displayName || card.cardName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        •••• {card.lastFourDigits || '••••'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>
                        Statement: <strong className="text-slate-200">{card.statementDay || card.billingCycleDate ? `${card.statementDay || card.billingCycleDate}th` : 'Not set'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Due Date: <strong className="text-cyan-300">{formatFinancialDate(billing.nextDueDate)}</strong>
                      </span>
                      {billing.isOverdue && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                          Overdue ({Math.abs(billing.daysUntilDue)}d)
                        </span>
                      )}
                      {!billing.isOverdue && billing.cycleStatus === 'due_soon' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] animate-pulse">
                          Due in {billing.daysUntilDue}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Outstanding and Pay Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-medium">Outstanding</span>
                    <span
                      className={`text-sm font-extrabold font-mono ${
                        isCreditBalance
                          ? 'text-emerald-400'
                          : isZeroDue
                          ? 'text-slate-400'
                          : 'text-rose-300'
                      }`}
                    >
                      {isCreditBalance
                        ? `₹${Math.abs(outstanding).toLocaleString('en-IN')} Cr`
                        : `₹${outstanding.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onPayCard(card)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold font-heading cursor-pointer flex items-center gap-1.5 transition-all ${
                      outstanding > 0
                        ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md shadow-rose-950/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{outstanding > 0 ? 'Pay Bill' : 'Record Pay'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
