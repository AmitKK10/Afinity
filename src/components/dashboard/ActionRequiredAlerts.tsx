import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRight,
  CreditCard,
  Coins,
  Building2,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import { useFinancialData } from '../../context/FinancialDataContext';
import { creditSafetyService } from '../../services/creditSafetyService';
import { sipSafetyService } from '../../services/sipSafetyService';
import { calculateCardBillingCycle } from '../../services/calculations';
import { cn } from '../../utils/cn';

export interface ActionItem {
  id: string;
  type: 'CC_SHORTFALL' | 'SIP_SHORTFALL' | 'MAB_SHORTFALL' | 'DUE_SOON' | 'LOW_LIQUIDITY';
  severity: 'CRITICAL' | 'WARNING';
  title: string;
  description: string;
  amount?: number;
  impactedAccount: string;
  dueDateFormatted?: string;
  actionText: string;
  route: string;
}

interface ActionRequiredAlertsProps {
  className?: string;
}

export const ActionRequiredAlerts: React.FC<ActionRequiredAlertsProps> = ({ className }) => {
  const navigate = useNavigate();
  const { bankAccounts, sips, creditCards } = useFinancialData();

  const actionItems = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];
    const activeBanks = (bankAccounts || []).filter((b) => b.status === 'active');
    const activeCards = (creditCards || []).filter((c) => c.status !== 'archived' && c.status !== 'closed');
    const activeSips = (sips || []).filter((s) => s.sipStatus === 'active' && s.status !== 'archived');

    // 1. Credit Card Auto-Pay Shortfalls & Overdue Cards
    const ccReport = creditSafetyService.evaluateCreditCardSafety(activeCards, activeBanks);
    ccReport.evaluations.forEach((evalItem) => {
      if (evalItem.isInsufficient && evalItem.shortfall > 0) {
        items.push({
          id: `cc-shortfall-${evalItem.cardId}`,
          type: 'CC_SHORTFALL',
          severity: 'CRITICAL',
          title: `${evalItem.cardDisplayName} Auto-Pay Deficit`,
          description: `Linked bank (${evalItem.bankName}) has ${formatRupee(evalItem.availableBalance)}, needs ${formatRupee(evalItem.requiredAmount)}. Shortfall of ${formatRupee(evalItem.shortfall)}.`,
          amount: evalItem.shortfall,
          impactedAccount: evalItem.bankName,
          dueDateFormatted: evalItem.dueDateFormatted,
          actionText: 'Fund Bank',
          route: `/credit?card=${evalItem.cardId}`,
        });
      } else if (evalItem.isOverdue && evalItem.outstanding > 0) {
        items.push({
          id: `cc-overdue-${evalItem.cardId}`,
          type: 'CC_SHORTFALL',
          severity: 'CRITICAL',
          title: `${evalItem.cardDisplayName} Payment Overdue`,
          description: `Statement of ${formatRupee(evalItem.outstanding)} was due on ${evalItem.dueDateFormatted}. Pay immediately to prevent finance charges.`,
          amount: evalItem.outstanding,
          impactedAccount: evalItem.bankName,
          dueDateFormatted: evalItem.dueDateFormatted,
          actionText: 'Pay Card',
          route: `/credit?card=${evalItem.cardId}`,
        });
      }
    });

    // 2. SIP Payment Shortfalls
    const sipReport = sipSafetyService.evaluatePaymentSafety(activeSips, activeBanks);
    sipReport.evaluations.forEach((evalItem) => {
      if (evalItem.isInsufficient && evalItem.shortfall > 0) {
        items.push({
          id: `sip-shortfall-${evalItem.sipId}`,
          type: 'SIP_SHORTFALL',
          severity: 'CRITICAL',
          title: `${evalItem.fundName} SIP Shortfall`,
          description: `Linked bank (${evalItem.bankName}) balance of ${formatRupee(evalItem.availableBalance)} cannot cover SIP installment of ${formatRupee(evalItem.amount)}. Shortfall of ${formatRupee(evalItem.shortfall)}.`,
          amount: evalItem.shortfall,
          impactedAccount: evalItem.bankName,
          dueDateFormatted: evalItem.nextDeductionFormatted,
          actionText: 'Top Up',
          route: `/investments?tab=sips&sip=${evalItem.sipId}`,
        });
      }
    });

    // 3. MAB / QAB Requirement Shortfalls
    activeBanks.forEach((bank) => {
      const requirement = Number(
        bank.averageBalanceRequirement ||
        bank.requiredAverageBalance ||
        bank.minimumBalanceRequirement ||
        0
      );
      if (requirement > 0) {
        const currentBalance = Number(bank.balance || 0);
        const actualAvg = Number(bank.actualAverageBalance ?? currentBalance);
        const effectiveBal = Math.min(currentBalance, actualAvg);

        if (effectiveBal < requirement) {
          const deficit = requirement - effectiveBal;
          items.push({
            id: `mab-shortfall-${bank.id}`,
            type: 'MAB_SHORTFALL',
            severity: 'WARNING',
            title: `${bank.displayName || bank.name} MAB Deficit`,
            description: `Required monthly average is ${formatRupee(requirement)}, but balance is ${formatRupee(effectiveBal)}. Shortfall of ${formatRupee(deficit)} may incur bank maintenance fees.`,
            amount: deficit,
            impactedAccount: bank.displayName || bank.name,
            actionText: 'Add Funds',
            route: `/banks?account=${bank.id}`,
          });
        }
      }
    });

    // 4. Upcoming Payment Due Soon (within next 3 days)
    const now = new Date();
    activeCards.forEach((card) => {
      const outstanding = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
      if (outstanding > 0) {
        const billing = calculateCardBillingCycle(card, now);
        if (!billing.isOverdue && billing.daysUntilDue >= 0 && billing.daysUntilDue <= 3) {
          // Avoid duplicate if already reported in shortfall
          const alreadyListed = items.some((i) => i.id.includes(card.id));
          if (!alreadyListed) {
            items.push({
              id: `cc-due-soon-${card.id}`,
              type: 'DUE_SOON',
              severity: 'WARNING',
              title: `${card.displayName || card.cardName} Due in ${billing.daysUntilDue === 0 ? 'Today' : `${billing.daysUntilDue} day${billing.daysUntilDue > 1 ? 's' : ''}`}`,
              description: `Total due of ${formatRupee(outstanding)} scheduled on ${billing.currentDueDate ? formatFinancialDate(billing.currentDueDate) : card.dueDate}.`,
              amount: outstanding,
              impactedAccount: card.issuer || 'Credit Card',
              dueDateFormatted: billing.currentDueDate ? formatFinancialDate(billing.currentDueDate) : card.dueDate,
              actionText: 'Review',
              route: `/credit?card=${card.id}`,
            });
          }
        }
      }
    });

    // 5. Low Remaining Liquidity across all active banks
    const totalBankBalances = activeBanks.reduce((sum, b) => sum + Number(b.balance || 0), 0);
    const totalSipCommitments = activeSips.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const totalCardDues = activeCards.reduce(
      (sum, c) => sum + Math.max(0, Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0)),
      0
    );
    const safeCash = totalBankBalances - (totalSipCommitments + totalCardDues);

    if (safeCash < 0) {
      items.push({
        id: 'global-low-liquidity',
        type: 'LOW_LIQUIDITY',
        severity: 'CRITICAL',
        title: 'Critical Aggregate Liquidity Deficit',
        description: `Total active bank funds (${formatRupee(totalBankBalances)}) are insufficient to cover total SIP and card obligations (${formatRupee(totalSipCommitments + totalCardDues)}). Deficit: ${formatRupee(Math.abs(safeCash))}.`,
        amount: Math.abs(safeCash),
        impactedAccount: 'All Bank Accounts',
        actionText: 'Transfer Funds',
        route: '/banks',
      });
    } else if (safeCash < 10000 && (totalSipCommitments > 0 || totalCardDues > 0)) {
      items.push({
        id: 'global-tight-liquidity',
        type: 'LOW_LIQUIDITY',
        severity: 'WARNING',
        title: 'Low Post-Commitment Buffer',
        description: `Remaining safe available cash after all upcoming commitments is only ${formatRupee(safeCash)}. Consider replenishing liquid reserves.`,
        amount: safeCash,
        impactedAccount: 'Active Banks',
        actionText: 'Add Funds',
        route: '/banks',
      });
    }

    return items;
  }, [bankAccounts, sips, creditCards]);

  // Clean "All payments are currently covered" state if no issues
  if (actionItems.length === 0) {
    return (
      <div
        id="action-required-clean-state"
        className={cn(
          'p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-emerald-300 font-heading">
                All payments are currently covered
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 font-mono">
                Safe &amp; Protected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              No credit shortfalls, SIP deficits, upcoming overdue dates, or MAB balance warnings detected across your accounts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/credit')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-medium border border-emerald-700/50 transition-colors cursor-pointer shrink-0"
        >
          <span>Safety Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div id="action-required-alerts-section" className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-400 font-heading">
            Action Required ({actionItems.length})
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Immediate Attention
        </span>
      </div>

      <div className="space-y-2">
        {actionItems.map((item) => {
          const isCritical = item.severity === 'CRITICAL';
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.route)}
              className={cn(
                'p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer shadow-sm group hover:scale-[1.005]',
                isCritical
                  ? 'bg-rose-950/30 hover:bg-rose-950/40 border-rose-500/40 hover:border-rose-500/60'
                  : 'bg-amber-950/30 hover:bg-amber-950/40 border-amber-500/40 hover:border-amber-500/60'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'p-2 rounded-xl border shrink-0 mt-0.5 sm:mt-0',
                      isCritical
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    )}
                  >
                    {isCritical ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.2 rounded border font-mono uppercase font-bold',
                          isCritical
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        )}
                      >
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 sm:line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0">
                  {item.amount !== undefined && (
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Shortfall / Due
                      </span>
                      <span
                        className={cn(
                          'text-xs sm:text-sm font-extrabold font-mono',
                          isCritical ? 'text-rose-400' : 'text-amber-400'
                        )}
                      >
                        {formatRupee(item.amount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-500 transition-all">
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
