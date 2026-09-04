import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  Coins,
  Building2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import { useFinancialData } from '../../context/FinancialDataContext';
import { calculateCardBillingCycle } from '../../services/calculations';
import { cn } from '../../utils/cn';

export interface TimelineCommitmentItem {
  id: string;
  sourceId: string;
  type: 'SIP' | 'CREDIT_CARD';
  title: string;
  subtitle?: string;
  amount: number;
  dateObj: Date;
  dateFormatted: string;
  daysUntil: number;
  relativeText: string;
  isOverdue: boolean;
  linkedBankId?: string;
  linkedBankName: string;
  bankBalance: number;
  isCovered: boolean;
  shortfall: number;
  safetyStatus: 'SUFFICIENT' | 'INSUFFICIENT' | 'NO_BANK' | 'MANUAL_PAY';
  safetyLabel: string;
  autoPay: boolean;
  route: string;
}

interface UpcomingCommitmentsTimelineProps {
  className?: string;
}

export const UpcomingCommitmentsTimeline: React.FC<UpcomingCommitmentsTimelineProps> = ({
  className,
}) => {
  const navigate = useNavigate();
  const { bankAccounts, sips, creditCards } = useFinancialData();
  const [typeFilter, setTypeFilter] = useState<'all' | 'sip' | 'credit'>('all');

  const timelineItems = useMemo<TimelineCommitmentItem[]>(() => {
    const items: TimelineCommitmentItem[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Map banks for fast lookup
    const bankMap = new Map<string, any>();
    (bankAccounts || []).forEach((b) => {
      if (b.id) bankMap.set(b.id, b);
      if (b.bankId) bankMap.set(b.bankId, b);
    });

    const activeBanks = (bankAccounts || []).filter((b) => b.status === 'active');

    // 1. Process SIPs (Active SIPs deduction in next 30 days)
    const activeSips = (sips || []).filter(
      (s) => s.sipStatus === 'active' && s.status !== 'archived'
    );
    activeSips.forEach((sip) => {
      const deductionDay = Number(sip.deductionDay || 1);
      let targetDate: Date;

      if (deductionDay >= currentDay) {
        // Current month deduction
        const maxDaysThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const validDay = Math.min(deductionDay, maxDaysThisMonth);
        targetDate = new Date(currentYear, currentMonth, validDay, 10, 0, 0);
      } else {
        // Next month deduction
        const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const maxDaysNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
        const validDay = Math.min(deductionDay, maxDaysNextMonth);
        targetDate = new Date(nextMonthYear, nextMonth, validDay, 10, 0, 0);
      }

      // Calculate days until deduction
      const diffMs = targetDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Only include items within 30 days
      if (daysUntil >= 0 && daysUntil <= 30) {
        // Linked Bank Lookup
        let bank = sip.bankAccountId ? bankMap.get(sip.bankAccountId) : null;
        if (!bank && sip.bankName) {
          bank = activeBanks.find(
            (b) =>
              (b.institutionName && b.institutionName.toLowerCase() === sip.bankName?.toLowerCase()) ||
              (b.displayName && b.displayName.toLowerCase() === sip.bankName?.toLowerCase()) ||
              (b.name && b.name.toLowerCase() === sip.bankName?.toLowerCase())
          );
        }

        const bankName = bank?.displayName || bank?.name || sip.bankName || 'No Bank Linked';
        const bankBalance = Number(bank?.balance ?? 0);
        const amount = Number(sip.amount || 0);

        let safetyStatus: TimelineCommitmentItem['safetyStatus'] = 'SUFFICIENT';
        let safetyLabel = 'Sufficient Balance';
        let isCovered = true;
        let shortfall = 0;

        if (!bank) {
          safetyStatus = 'NO_BANK';
          safetyLabel = 'No Bank Linked';
          isCovered = false;
          shortfall = amount;
        } else if (bankBalance < amount) {
          safetyStatus = 'INSUFFICIENT';
          shortfall = amount - bankBalance;
          safetyLabel = `Shortfall ${formatRupee(shortfall)}`;
          isCovered = false;
        }

        let relativeText = `In ${daysUntil} days`;
        if (daysUntil === 0) relativeText = 'Due Today';
        else if (daysUntil === 1) relativeText = 'Tomorrow';

        items.push({
          id: `timeline-sip-${sip.id}`,
          sourceId: sip.id,
          type: 'SIP',
          title: sip.fundName || 'Mutual Fund SIP',
          subtitle: sip.category || sip.platform || 'SIP Deduction',
          amount,
          dateObj: targetDate,
          dateFormatted: formatFinancialDate(targetDate.toISOString()),
          daysUntil,
          relativeText,
          isOverdue: false,
          linkedBankId: bank?.id,
          linkedBankName: bankName,
          bankBalance,
          isCovered,
          shortfall,
          safetyStatus,
          safetyLabel,
          autoPay: true,
          route: `/investments?tab=sips&sip=${sip.id}`,
        });
      }
    });

    // 2. Process Credit Cards (Active cards with dues in next 30 days)
    const activeCards = (creditCards || []).filter(
      (c) => c.status !== 'archived' && c.status !== 'closed'
    );
    activeCards.forEach((card) => {
      const outstanding = Number(
        card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0
      );

      // Only consider cards with active due amount
      if (outstanding > 0) {
        const billing = calculateCardBillingCycle(card, now);
        const daysUntilDue = billing.daysUntilDue;

        // Include if due in past 7 days (overdue) or in next 30 days
        if (daysUntilDue >= -7 && daysUntilDue <= 30) {
          const dueDateObj = billing.currentDueDate
            ? new Date(billing.currentDueDate)
            : new Date();

          let bank = card.paymentBankAccountId ? bankMap.get(card.paymentBankAccountId) : null;
          if (!bank && card.paymentBankName) {
            bank = activeBanks.find(
              (b) =>
                (b.institutionName && b.institutionName.toLowerCase() === card.paymentBankName?.toLowerCase()) ||
                (b.displayName && b.displayName.toLowerCase() === card.paymentBankName?.toLowerCase()) ||
                (b.name && b.name.toLowerCase() === card.paymentBankName?.toLowerCase())
            );
          }

          const isAutoPay = Boolean(card.autoPay || card.isAutoPayEnabled);
          const bankName = bank?.displayName || bank?.name || card.paymentBankName || (isAutoPay ? 'No Bank Linked' : 'Manual Payment');
          const bankBalance = Number(bank?.balance ?? 0);

          let safetyStatus: TimelineCommitmentItem['safetyStatus'] = 'SUFFICIENT';
          let safetyLabel = 'Sufficient Balance';
          let isCovered = true;
          let shortfall = 0;

          if (isAutoPay) {
            if (!bank) {
              safetyStatus = 'NO_BANK';
              safetyLabel = 'No Bank Linked';
              isCovered = false;
              shortfall = outstanding;
            } else if (bankBalance < outstanding) {
              safetyStatus = 'INSUFFICIENT';
              shortfall = outstanding - bankBalance;
              safetyLabel = `Shortfall ${formatRupee(shortfall)}`;
              isCovered = false;
            }
          } else {
            safetyStatus = 'MANUAL_PAY';
            safetyLabel = 'Manual Payment';
            isCovered = bankBalance >= outstanding;
            shortfall = isCovered ? 0 : outstanding - bankBalance;
          }

          let relativeText = `In ${daysUntilDue} days`;
          if (billing.isOverdue) relativeText = 'Overdue';
          else if (daysUntilDue === 0) relativeText = 'Due Today';
          else if (daysUntilDue === 1) relativeText = 'Tomorrow';

          items.push({
            id: `timeline-cc-${card.id}`,
            sourceId: card.id,
            type: 'CREDIT_CARD',
            title: card.displayName || card.cardName || 'Credit Card',
            subtitle: `${card.issuer || 'Card'} •••• ${card.lastFourDigits || card.last4 || '••••'}`,
            amount: outstanding,
            dateObj: dueDateObj,
            dateFormatted: billing.currentDueDate
              ? formatFinancialDate(billing.currentDueDate)
              : card.dueDate || 'Due Date',
            daysUntil: daysUntilDue,
            relativeText,
            isOverdue: billing.isOverdue,
            linkedBankId: bank?.id,
            linkedBankName: bankName,
            bankBalance,
            isCovered,
            shortfall,
            safetyStatus,
            safetyLabel,
            autoPay: isAutoPay,
            route: `/credit?card=${card.id}`,
          });
        }
      }
    });

    // Sort combined timeline chronologically
    return items.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [bankAccounts, sips, creditCards]);

  // Filter items based on selected tab
  const displayedItems = useMemo(() => {
    if (typeFilter === 'sip') return timelineItems.filter((i) => i.type === 'SIP');
    if (typeFilter === 'credit') return timelineItems.filter((i) => i.type === 'CREDIT_CARD');
    return timelineItems;
  }, [timelineItems, typeFilter]);

  // Aggregates for 30-day view
  const totalCommitments = useMemo(
    () => timelineItems.reduce((sum, i) => sum + i.amount, 0),
    [timelineItems]
  );
  const totalCoveredCount = useMemo(
    () => timelineItems.filter((i) => i.isCovered).length,
    [timelineItems]
  );

  return (
    <div
      id="upcoming-30-days-timeline-section"
      className={cn(
        'p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-slate-800/90 shadow-sm backdrop-blur-sm space-y-3.5',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <span>Upcoming 30 Days</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-slate-800 text-cyan-400 border border-slate-700">
                {timelineItems.length} Due
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological schedule of SIP deductions &amp; credit card statement dues
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer',
              typeFilter === 'all'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            All ({timelineItems.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('sip')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer',
              typeFilter === 'sip'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            SIPs ({timelineItems.filter((i) => i.type === 'SIP').length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('credit')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer',
              typeFilter === 'credit'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Cards ({timelineItems.filter((i) => i.type === 'CREDIT_CARD').length})
          </button>
        </div>
      </div>

      {/* Summary Total Banner */}
      <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Next 30 Days Outflow:</span>
          <span className="font-mono font-bold text-white text-sm">
            {formatRupee(totalCommitments)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            {totalCoveredCount} of {timelineItems.length} commitments covered
          </span>
          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{
                width: `${timelineItems.length > 0 ? (totalCoveredCount / timelineItems.length) * 100 : 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Timeline List */}
      {displayedItems.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/60 text-slate-400 space-y-1">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-300">
            No upcoming commitments in the next 30 days
          </p>
          <p className="text-xs text-slate-500">
            {typeFilter !== 'all'
              ? 'Try switching filters to view other scheduled dues.'
              : 'All active SIPs and card statements are up to date.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedItems.map((item) => {
            const isSIP = item.type === 'SIP';
            const isCovered = item.isCovered;

            return (
              <div
                key={item.id}
                onClick={() => navigate(item.route)}
                className={cn(
                  'p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.005]',
                  item.isOverdue
                    ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                    : !isCovered
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                    : 'bg-slate-950/60 hover:bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Side: Date + Type + Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Date Block */}
                    <div className="w-12 text-center shrink-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        {item.dateFormatted.split(' ')[1] || 'DUE'}
                      </span>
                      <span className="text-base font-black font-mono text-white leading-tight">
                        {item.dateFormatted.split(' ')[0] || ''}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] px-1 py-0.2 rounded font-mono block mt-0.5 whitespace-nowrap',
                          item.isOverdue
                            ? 'bg-rose-950 text-rose-300 font-bold'
                            : item.daysUntil <= 2
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        )}
                      >
                        {item.relativeText}
                      </span>
                    </div>

                    <div className="h-9 w-px bg-slate-800 shrink-0" />

                    {/* Icon & Title info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'p-2 rounded-xl border shrink-0',
                          isSIP
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        )}
                      >
                        {isSIP ? <Coins className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {item.title}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold shrink-0',
                              isSIP
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            )}
                          >
                            {isSIP ? 'SIP' : 'Credit Card'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{item.linkedBankName}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Bal: {formatRupee(item.bankBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Amount & Real-Time Safety Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-15 sm:pl-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-sm sm:text-base font-black font-mono text-white">
                        {formatRupee(item.amount)}
                      </div>
                      <div className="flex items-center sm:justify-end gap-1 mt-0.5">
                        {isCovered ? (
                          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{item.safetyLabel}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{item.safetyLabel}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-cyan-600 group-hover:text-white transition-all shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
