/**
 * CreditPaymentSafetySection.tsx — Credit Card Payment Safety & Combined Liquidity Protection
 * Evaluates Auto-Pay credit cards against linked bank balances.
 * Shows Sufficient vs. Insufficient balance indicators, exact shortfall, countdown to due date,
 * and Combined SIP + Credit Card liquidity breakdown with clear risk source attribution.
 */

import React, { useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Landmark,
  ArrowRightLeft,
  CreditCard as CreditCardIcon,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CreditCard, BankAccount, SIPRecord } from '../../types';
import { creditSafetyService } from '../../services/creditSafetyService';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import { BankBrandBadge } from '../brand/BankBrandBadge';

interface CreditPaymentSafetySectionProps {
  creditCards: CreditCard[];
  bankAccounts: BankAccount[];
  sips?: SIPRecord[];
  onTransferFunds?: (bankId?: string) => void;
  onPayCard?: (card: CreditCard) => void;
  onSelectCard?: (card: CreditCard) => void;
}

export const CreditPaymentSafetySection: React.FC<CreditPaymentSafetySectionProps> = ({
  creditCards,
  bankAccounts,
  sips = [],
  onTransferFunds,
  onPayCard,
  onSelectCard,
}) => {
  const cardSafetyReport = useMemo(() => {
    return creditSafetyService.evaluateCreditCardSafety(creditCards, bankAccounts);
  }, [creditCards, bankAccounts]);

  const combinedReport = useMemo(() => {
    return creditSafetyService.evaluateCombinedPaymentSafety(sips, creditCards, bankAccounts);
  }, [sips, creditCards, bankAccounts]);

  const autoPayCards = cardSafetyReport.evaluations;
  const insufficientCards = autoPayCards.filter((c) => c.isInsufficient);
  const sufficientCards = autoPayCards.filter((c) => !c.isInsufficient);

  // Sort: Insufficient first, then due soon, then by daysUntilDue
  const sortedCards = useMemo(() => {
    return [...autoPayCards].sort((a, b) => {
      if (a.isInsufficient && !b.isInsufficient) return -1;
      if (!a.isInsufficient && b.isInsufficient) return 1;
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.daysUntilDue - b.daysUntilDue;
    });
  }, [autoPayCards]);

  if (autoPayCards.length === 0 && !combinedReport.hasRisk) {
    return (
      <div
        id="credit-payment-safety-empty"
        className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white font-heading">Auto-Pay Safety Verification</h4>
            <p className="text-[11px] text-slate-400">
              Enable Auto-Pay on your credit cards to automatically monitor linked bank balances and prevent payment shortfalls.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="credit-payment-safety-section" className="space-y-4">
      {/* 1. Main Header Container */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
              cardSafetyReport.hasInsufficientBalance
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-heading">
                  Credit Card Payment Safety
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase">
                  Auto-Pay Active ({autoPayCards.length})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live balance verification against linked bank accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {insufficientCards.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                {insufficientCards.length} Insufficient (Shortfall {formatRupee(cardSafetyReport.totalShortfall)})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                All Auto-Pay Balances Sufficient
              </span>
            )}
          </div>
        </div>

        {/* 2. Auto-Pay Individual Card Safety Cards */}
        <div className="space-y-3">
          {sortedCards.map((item) => {
            const isShort = item.isInsufficient;
            const card = item.card;

            return (
              <div
                key={item.cardId}
                id={`card-safety-item-${item.cardId}`}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isShort
                    ? 'bg-gradient-to-r from-rose-950/40 via-slate-900/90 to-slate-900/90 border-rose-800/60 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Card & Bank Meta */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white font-heading">
                        {item.cardDisplayName}
                      </span>
                      {item.cardNickname && (
                        <span className="text-[10px] text-cyan-300 font-medium px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/50">
                          🏷️ {item.cardNickname}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400">
                        •••• {item.lastFourDigits}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                        {item.issuer}
                      </span>
                    </div>

                    {/* Linked Bank details */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Landmark className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{item.bankName}</span>
                      </div>
                      <span>•</span>
                      <span>
                        Available Balance:{' '}
                        <strong className="font-mono text-white">
                          {formatRupee(item.availableBalance)}
                        </strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.isOverdue ? (
                          <span className="text-rose-400 font-bold">Overdue by {Math.abs(item.daysUntilDue)}d</span>
                        ) : item.daysUntilDue <= 3 ? (
                          <span className="text-amber-400 font-bold">Due in {item.daysUntilDue}d</span>
                        ) : (
                          <span>Due in {item.daysUntilDue}d ({item.dueDateFormatted})</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Right: Dues, Safety Status & Actions */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400">Required Payment</div>
                      <div className="text-sm sm:text-base font-extrabold font-mono text-white">
                        {formatRupee(item.requiredAmount)}
                      </div>
                      {item.minAmountDue > 0 && item.minAmountDue !== item.requiredAmount && (
                        <div className="text-[10px] text-amber-300/80">
                          Min Due: {formatRupee(item.minAmountDue)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isShort ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            🔴 Insufficient Balance
                          </span>
                          <span className="text-[10px] text-rose-400 font-mono font-semibold">
                            Shortfall: {formatRupee(item.shortfall)}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          🟢 Sufficient Balance
                        </span>
                      )}

                      {/* Top Up Action Button */}
                      {isShort && onTransferFunds && (
                        <button
                          type="button"
                          onClick={() => onTransferFunds(item.bankAccountId)}
                          className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Top Up / Transfer</span>
                        </button>
                      )}

                      {onPayCard && (
                        <button
                          type="button"
                          onClick={() => onPayCard(card)}
                          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <span>Pay Card</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Combined Bank Payment Safety Breakdown (SIP + Credit Card) */}
      {combinedReport.bankEvaluations.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white font-heading uppercase tracking-wider">
                Combined Bank Liquidity (SIPs + Credit Cards)
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">
              Available − Upcoming SIPs − Upcoming Cards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {combinedReport.bankEvaluations.map((be) => {
              const hasRisk = be.isInsufficient;

              return (
                <div
                  key={be.bankAccountId}
                  id={`combined-bank-safety-${be.bankAccountId}`}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    hasRisk
                      ? 'bg-rose-950/30 border-rose-800/60 shadow-md shadow-rose-950/20'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BankBrandBadge bankName={be.bankName} size="sm" showIconOnly={true} />
                      <div>
                        <div className="font-bold text-xs text-white font-heading">
                          {be.accountDisplayName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {be.accountNumberMasked}
                        </div>
                      </div>
                    </div>

                    {hasRisk ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {be.riskLabel}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        🟢 Safe Liquidity
                      </span>
                    )}
                  </div>

                  {/* Math Breakdown Equation */}
                  <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] text-center mb-2.5">
                    <div>
                      <div className="text-slate-500">Available</div>
                      <div className="font-mono font-bold text-white text-[11px]">
                        {formatRupee(be.availableBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">SIPs</div>
                      <div className="font-mono font-semibold text-cyan-400 text-[11px]">
                        -{formatRupee(be.sipCommitment)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Cards</div>
                      <div className="font-mono font-semibold text-indigo-400 text-[11px]">
                        -{formatRupee(be.creditCardCommitment)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Remaining</div>
                      <div className={`font-mono font-bold text-[11px] ${be.remainingBalance < 0 ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}`}>
                        {formatRupee(be.remainingBalance)}
                      </div>
                    </div>
                  </div>

                  {/* Risk Footer & Transfer CTA */}
                  <div className="flex items-center justify-between text-xs">
                    {hasRisk ? (
                      <div className="text-[11px] text-rose-300 font-semibold">
                        Shortfall: <span className="font-mono font-bold text-rose-200">{formatRupee(be.shortfall)}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-400">
                        ✓ All commitments covered
                      </div>
                    )}

                    {hasRisk && onTransferFunds && (
                      <button
                        type="button"
                        onClick={() => onTransferFunds(be.bankAccountId)}
                        className="py-1 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Top Up Bank</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
