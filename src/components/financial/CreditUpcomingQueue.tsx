/**
 * CreditUpcomingQueue.tsx — Upcoming & Overdue Credit Card Payments Queue (Step 6D)
 * Displays immediate overdue alerts, due-today/due-soon countdowns, and quick settlement actions.
 */

import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  CreditCard as CreditCardIcon,
  ArrowRight,
} from 'lucide-react';
import { CreditCard } from '../../types';
import { calculateCardBillingCycle, CardBillingCycleInfo } from '../../services/calculations';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';

interface CreditUpcomingQueueProps {
  creditCards: CreditCard[];
  onPayCard: (card: CreditCard) => void;
  onSelectCard?: (card: CreditCard) => void;
}

interface CardQueueItem {
  card: CreditCard;
  billing: CardBillingCycleInfo;
  outstanding: number;
  isCreditBalance: boolean;
}

export const CreditUpcomingQueue: React.FC<CreditUpcomingQueueProps> = ({
  creditCards,
  onPayCard,
  onSelectCard,
}) => {
  const activeCards = useMemo(
    () => creditCards.filter((c) => c.status === 'active'),
    [creditCards]
  );

  const queueItems: CardQueueItem[] = useMemo(() => {
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
          isCreditBalance: outstanding < 0,
        };
      })
      .sort((a, b) => {
        // Overdue first, then by daysUntilDue ascending, then by outstanding descending
        if (a.billing.isOverdue && !b.billing.isOverdue) return -1;
        if (!a.billing.isOverdue && b.billing.isOverdue) return 1;
        return a.billing.daysUntilDue - b.billing.daysUntilDue;
      });
  }, [activeCards]);

  const overdueItems = queueItems.filter((i) => i.billing.isOverdue && i.outstanding > 0);
  const dueTodayItems = queueItems.filter(
    (i) => !i.billing.isOverdue && i.billing.daysUntilDue === 0 && i.outstanding > 0
  );
  const dueSoonItems = queueItems.filter(
    (i) => !i.billing.isOverdue && i.billing.daysUntilDue > 0 && i.billing.daysUntilDue <= 3 && i.outstanding > 0
  );
  const upcomingItems = queueItems.filter(
    (i) => !i.billing.isOverdue && i.billing.daysUntilDue > 3 && i.outstanding > 0
  );
  const zeroOrCreditItems = queueItems.filter((i) => i.outstanding <= 0);

  return (
    <div id="credit-upcoming-queue" className="space-y-3">
      {/* 1. High-Priority Overdue Banner if any overdue card exists */}
      {overdueItems.length > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-red-950/80 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/50 text-white space-y-2.5 animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider font-heading">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>High Priority: {overdueItems.length} Overdue Payment{overdueItems.length > 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-2 divide-y divide-rose-800/40">
            {overdueItems.map(({ card, billing, outstanding }) => (
              <div
                key={card.id}
                className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-heading">
                      {card.displayName || card.cardName}
                    </span>
                    <span className="text-[11px] text-rose-200/80 font-mono">
                      (•••• {card.lastFourDigits || '••••'})
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200 border border-rose-400/40 font-semibold uppercase">
                      {card.owner || 'Self'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-rose-200">
                    <span className="font-extrabold font-mono text-white text-sm">
                      {formatRupee(outstanding)}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-rose-300">
                      {Math.abs(billing.daysUntilDue)} days overdue (Due: {formatFinancialDate(billing.currentDueDate)})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onPayCard(card)}
                  className="py-1.5 px-4 rounded-xl bg-white hover:bg-rose-50 text-rose-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer font-heading transition-all"
                >
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>Pay Bill Now</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Upcoming Payments Container */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-heading">
              Upcoming Payment Deadlines
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {queueItems.filter((i) => i.outstanding > 0).length} active bill{queueItems.filter((i) => i.outstanding > 0).length === 1 ? '' : 's'}
          </span>
        </div>

        {queueItems.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No credit cards configured.
          </div>
        ) : (
          <div className="space-y-2 divide-y divide-slate-800/60">
            {queueItems.map(({ card, billing, outstanding, isCreditBalance }) => {
              const isOverdue = billing.isOverdue && outstanding > 0;
              const isDueToday = !isOverdue && billing.daysUntilDue === 0 && outstanding > 0;
              const isDueSoon = !isOverdue && billing.daysUntilDue > 0 && billing.daysUntilDue <= 3 && outstanding > 0;
              const isZero = outstanding === 0;

              const ownerLabel = (card.owner || 'SELF').toUpperCase();
              const managedLabel = (card.managedBy || (ownerLabel === 'PARENT' ? 'ME' : 'ME')).toUpperCase();
              const iPay = card.iPayThisCard !== undefined ? card.iPayThisCard : managedLabel === 'ME' || managedLabel === 'SELF';

              return (
                <div
                  key={card.id}
                  className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Card info and owner / status */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <CreditCardIcon className="w-4 h-4" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-100 font-heading">
                          {card.displayName || card.cardName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          •••• {card.lastFourDigits || '••••'}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            ownerLabel === 'SELF'
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {ownerLabel === 'SELF' ? 'Self' : 'Parent'}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Paid by: {iPay ? 'Me' : 'Parent'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span>Due: <strong className="text-slate-200">{billing.currentDueDate ? formatFinancialDate(billing.currentDueDate) : 'Not configured'}</strong></span>
                        <span>•</span>
                        {isOverdue ? (
                          <span className="text-rose-400 font-bold">
                            {Math.abs(billing.daysUntilDue)}d overdue
                          </span>
                        ) : isDueToday ? (
                          <span className="text-amber-400 font-bold animate-pulse">
                            Due Today!
                          </span>
                        ) : isDueSoon ? (
                          <span className="text-amber-300 font-bold">
                            Due in {billing.daysUntilDue} days
                          </span>
                        ) : isCreditBalance ? (
                          <span className="text-emerald-400 font-medium">
                            Credit Balance
                          </span>
                        ) : isZero ? (
                          <span className="text-slate-500 font-medium">
                            Fully Settled
                          </span>
                        ) : (
                          <span>Due in {billing.daysUntilDue} days</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Pay Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-10.5 sm:pl-0">
                    <div className="text-right">
                      {isCreditBalance ? (
                        <div className="text-xs font-bold text-emerald-400 font-mono">
                          ₹{Math.abs(outstanding).toLocaleString('en-IN')} Credit Balance
                        </div>
                      ) : isZero ? (
                        <div className="text-xs font-bold text-slate-500 font-mono">
                          ₹0 Due
                        </div>
                      ) : (
                        <div
                          className={`text-xs sm:text-sm font-extrabold font-mono ${
                            isOverdue
                              ? 'text-rose-400'
                              : isDueToday || isDueSoon
                              ? 'text-amber-300'
                              : 'text-slate-100'
                          }`}
                        >
                          {formatRupee(outstanding)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onPayCard(card)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold font-heading cursor-pointer flex items-center gap-1.5 transition-all ${
                        outstanding > 0
                          ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md shadow-rose-950/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>{outstanding > 0 ? 'Pay Bill' : 'Record'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
