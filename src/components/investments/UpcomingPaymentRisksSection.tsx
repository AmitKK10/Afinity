import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Landmark,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Bell,
  BellRing,
  BellOff,
} from 'lucide-react';
import {
  SIPRecord,
  SIPIndividualSafetyEvaluation,
  BankAccount,
  SIPSafetyStatus,
} from '../../types';
import { formatRupee } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { useFinancialData } from '../../context/FinancialDataContext';

interface UpcomingPaymentRisksSectionProps {
  evaluations: SIPIndividualSafetyEvaluation[];
  sips: SIPRecord[];
  bankAccounts: BankAccount[];
  onTransferFunds?: (bankId?: string) => void;
  onRefreshSafety?: () => void;
  onEditSIP?: (sip: SIPRecord) => void;
  onViewDetailsSIP?: (sip: SIPRecord) => void;
  reminderPreferences?: Record<string, boolean>;
  onToggleReminder?: (sipId: string) => void;
  className?: string;
}

type RiskUrgencyTier = 1 | 2 | 3; // 1: Critical Shortfall, 2: Low Buffer, 3: Safe

interface CategorizedEvaluation {
  evaluation: SIPIndividualSafetyEvaluation;
  sip: SIPRecord;
  tier: RiskUrgencyTier;
  tierLabel: 'Critical Shortfall' | 'Low Buffer' | 'Safe';
  daysUntil: number;
  shortfallAmount: number;
  bufferAmount: number;
  bankName: string;
  accountNumberMasked: string;
  availableBalance: number;
  requiredAmount: number;
  bankAccountId?: string;
  reminderDateFormatted: string;
}

export const UpcomingPaymentRisksSection: React.FC<UpcomingPaymentRisksSectionProps> = ({
  evaluations,
  sips,
  bankAccounts,
  onTransferFunds,
  onRefreshSafety,
  onEditSIP,
  onViewDetailsSIP,
  reminderPreferences: propReminderPrefs,
  onToggleReminder: propOnToggleReminder,
  className,
}) => {
  const [filterTier, setFilterTier] = useState<'all' | 'risks_only' | 'critical' | 'low_buffer' | 'safe'>('all');
  const [isAllSafeExpanded, setIsAllSafeExpanded] = useState(false);
  const [recentToggledId, setRecentToggledId] = useState<string | null>(null);

  // Financial context for reminder preferences
  const financialData = useFinancialData();
  const contextReminderPrefs = financialData?.sipReminderPreferences || {};
  const contextToggleReminder = financialData?.toggleSIPReminder;

  const activeReminderPrefs = propReminderPrefs || contextReminderPrefs;

  const handleToggleReminder = (sipId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (propOnToggleReminder) {
      propOnToggleReminder(sipId);
    } else if (contextToggleReminder) {
      contextToggleReminder(sipId);
    }

    setRecentToggledId(sipId);
    setTimeout(() => {
      setRecentToggledId(null);
    }, 2500);
  };

  // Bank map for fallback lookups
  const bankMap = useMemo(() => {
    const map = new Map<string, BankAccount>();
    bankAccounts.forEach((b) => {
      if (b.id) map.set(b.id, b);
      if (b.bankId) map.set(b.bankId, b);
    });
    return map;
  }, [bankAccounts]);

  // Helper to compute 1-day before reminder date label
  const calculateReminderDate = (nextDateStr?: string, deductionDay?: number) => {
    try {
      if (nextDateStr && !isNaN(Date.parse(nextDateStr))) {
        const d = new Date(nextDateStr);
        d.setDate(d.getDate() - 1);
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      }
      const today = new Date();
      const targetDay = (deductionDay ?? 1) - 1;
      const d = new Date(today.getFullYear(), today.getMonth(), targetDay || 1);
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return '1 day prior';
    }
  };

  // Process & categorize all active SIP evaluations
  const categorizedList = useMemo<CategorizedEvaluation[]>(() => {
    const result: CategorizedEvaluation[] = [];

    // Filter to active SIP evaluations only (or build from active SIPs if evaluations array is empty)
    const activeSIPs = sips.filter((s) => s.sipStatus === 'active');

    activeSIPs.forEach((sip) => {
      const ev = evaluations.find((e) => e.sipId === sip.id);

      const bank = sip.bankAccountId
        ? bankMap.get(sip.bankAccountId) ||
          bankAccounts.find(
            (b) => b.id === sip.bankAccountId || (b.bankId && b.bankId === sip.bankAccountId)
          ) ||
          null
        : null;

      const bankName =
        ev?.bankDisplayName ||
        ev?.bankName ||
        bank?.institutionName ||
        bank?.displayName ||
        bank?.bankName ||
        sip.bankName ||
        'Unlinked Bank';

      const accountNumberMasked =
        ev?.bankAccountNumberMasked ||
        ev?.accountNumberMasked ||
        bank?.accountNumberMasked ||
        (bank?.last4 ? `•••• ${bank.last4}` : sip.accountNumberMasked || '');

      const availableBalance =
        typeof ev?.bankCurrentBalance === 'number'
          ? ev.bankCurrentBalance
          : typeof ev?.availableBalance === 'number'
          ? ev.availableBalance
          : Number(bank?.balance ?? 0);

      const requiredAmount = Number(ev?.requiredAmount ?? ev?.amount ?? sip.amount ?? 0);

      // Determine urgency tier strictly by the existing calculations
      // 1. Critical Shortfall: Insufficient balance or no linked bank account
      // 2. Low Buffer: Available balance >= required, but < 1.2x (tight margin)
      // 3. Safe: Available balance >= 1.2x required
      let tier: RiskUrgencyTier = 3;
      let tierLabel: 'Critical Shortfall' | 'Low Buffer' | 'Safe' = 'Safe';
      const isCritical =
        ev?.safetyStatus === 'CRITICAL_INSUFFICIENT' ||
        ev?.safetyStatus === 'NO_BANK_LINKED' ||
        ev?.status === 'INSUFFICIENT' ||
        ev?.status === 'NO_BANK_LINKED' ||
        (ev?.shortfall ?? 0) > 0 ||
        availableBalance < requiredAmount ||
        !bank;

      const isLowBuffer =
        !isCritical &&
        (ev?.safetyStatus === 'AT_RISK' ||
          (availableBalance >= requiredAmount && availableBalance < requiredAmount * 1.2));

      if (isCritical) {
        tier = 1;
        tierLabel = 'Critical Shortfall';
      } else if (isLowBuffer) {
        tier = 2;
        tierLabel = 'Low Buffer';
      } else {
        tier = 3;
        tierLabel = 'Safe';
      }

      const shortfallAmount = isCritical
        ? ev?.shortfall && ev.shortfall > 0
          ? ev.shortfall
          : Math.max(0, requiredAmount - availableBalance)
        : 0;

      const bufferAmount = !isCritical ? Math.max(0, availableBalance - requiredAmount) : 0;
      const daysUntil = typeof ev?.daysUntilDeduction === 'number' ? ev.daysUntilDeduction : (ev?.daysUntil ?? 999);

      const reminderDateFormatted = calculateReminderDate(ev?.nextDeductionDate, sip.deductionDay);

      // Build evaluation object if missing
      const baseEval: SIPIndividualSafetyEvaluation = ev || {
        sipId: sip.id,
        sip,
        bankAccount: bank,
        bankName,
        accountDisplayName: bankName,
        accountNumberMasked,
        availableBalance,
        requiredAmount,
        shortfall: shortfallAmount,
        isInsufficient: isCritical,
        status: (isCritical ? 'INSUFFICIENT' : 'SUFFICIENT') as SIPSafetyStatus,
        safetyStatus: tier === 1 ? 'CRITICAL_INSUFFICIENT' : tier === 2 ? 'AT_RISK' : 'SAFE',
        nextDeductionDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(sip.deductionDay).padStart(2, '0')}`,
        daysUntilDeduction: daysUntil,
        relativeDateLabel: `Day ${sip.deductionDay}`,
        isDueWithin7Days: daysUntil <= 7,
        isDueWithin30Days: daysUntil <= 30,
      };

      result.push({
        evaluation: baseEval,
        sip,
        tier,
        tierLabel,
        daysUntil,
        shortfallAmount,
        bufferAmount,
        bankName,
        accountNumberMasked,
        availableBalance,
        requiredAmount,
        bankAccountId: bank?.id || sip.bankAccountId,
        reminderDateFormatted,
      });
    });

    // Urgency Sorting:
    // 1. Critical Shortfall first (tier 1)
    // 2. Low Buffer second (tier 2)
    // 3. Safe upcoming payments last (tier 3)
    // Secondary sorting: Earliest deduction date (daysUntil ascending)
    return result.sort((a, b) => {
      if (a.tier !== b.tier) {
        return a.tier - b.tier;
      }
      return a.daysUntil - b.daysUntil;
    });
  }, [sips, evaluations, bankMap, bankAccounts]);

  // Counts
  const criticalCount = useMemo(() => categorizedList.filter((c) => c.tier === 1).length, [categorizedList]);
  const lowBufferCount = useMemo(() => categorizedList.filter((c) => c.tier === 2).length, [categorizedList]);
  const safeCount = useMemo(() => categorizedList.filter((c) => c.tier === 3).length, [categorizedList]);
  const totalRiskyCount = criticalCount + lowBufferCount;

  // Filtered display list
  const displayedList = useMemo(() => {
    switch (filterTier) {
      case 'risks_only':
        return categorizedList.filter((c) => c.tier === 1 || c.tier === 2);
      case 'critical':
        return categorizedList.filter((c) => c.tier === 1);
      case 'low_buffer':
        return categorizedList.filter((c) => c.tier === 2);
      case 'safe':
        return categorizedList.filter((c) => c.tier === 3);
      case 'all':
      default:
        return categorizedList;
    }
  }, [categorizedList, filterTier]);

  // Countdown badge formatter
  const getCountdownLabel = (daysUntil: number, relativeLabel?: string) => {
    if (daysUntil === 0) return { text: 'Due Today', isUrgent: true };
    if (daysUntil === 1) return { text: 'Due Tomorrow', isUrgent: true };
    if (daysUntil > 1 && daysUntil <= 3) return { text: `In ${daysUntil} days`, isUrgent: true };
    if (daysUntil > 3 && daysUntil <= 7) return { text: `In ${daysUntil} days`, isUrgent: false };
    if (daysUntil > 7) return { text: `In ${daysUntil} days`, isUrgent: false };
    return { text: relativeLabel || 'Upcoming', isUrgent: false };
  };

  if (categorizedList.length === 0) {
    return null;
  }

  // 1. CLEAN ALL-SAFE STATE (When there are zero Critical Shortfalls and zero Low Buffer risks)
  if (totalRiskyCount === 0) {
    return (
      <div
        id="upcoming-payment-risks-section-safe"
        className={cn(
          'rounded-2xl p-4 sm:p-5 border transition-all duration-300',
          'bg-gradient-to-r from-emerald-950/40 via-[#071913] to-slate-900/90 border-emerald-500/30 shadow-lg shadow-emerald-950/10',
          className
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  All upcoming SIP payments are safe
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  {safeCount} Mandates Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                All linked bank accounts have verified sufficient balances to cover upcoming deduction schedules without deficit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onRefreshSafety && (
              <button
                type="button"
                id="btn-recheck-sip-risks-safe"
                onClick={onRefreshSafety}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all cursor-pointer min-h-[34px]"
                title="Re-verify account balances"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Re-verify</span>
              </button>
            )}

            <button
              type="button"
              id="btn-toggle-all-safe-preview"
              onClick={() => setIsAllSafeExpanded(!isAllSafeExpanded)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer min-h-[34px]"
            >
              <span>{isAllSafeExpanded ? 'Hide Schedule' : 'View Safe SIPs'}</span>
              {isAllSafeExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Safe SIPs List */}
        {isAllSafeExpanded && (
          <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-2.5 animate-in fade-in duration-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 block font-heading">
              Upcoming Verified Safe Mandates ({categorizedList.length})
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {categorizedList.map((item) => {
                const countdown = getCountdownLabel(item.daysUntil, item.evaluation.relativeDateLabel);
                const isReminderActive = Boolean(activeReminderPrefs[item.sip.id] || item.sip.reminderEnabled);

                return (
                  <div
                    key={item.sip.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 transition-all text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white truncate">{item.sip.fundName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Landmark className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[120px]">{item.bankName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <Clock className="w-3 h-3" />
                          {countdown.text}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        id={`btn-toggle-reminder-safe-${item.sip.id}`}
                        onClick={(e) => handleToggleReminder(item.sip.id, e)}
                        className={cn(
                          'p-1.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center gap-1',
                          isReminderActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-700/60'
                        )}
                        title={isReminderActive ? 'Reminder active 1 day before deduction' : 'Notify me 1 day before deduction'}
                      >
                        {isReminderActive ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      </button>

                      <div className="text-right">
                        <div className="font-mono font-bold text-white">{formatRupee(item.requiredAmount)}</div>
                        <span className="text-[10px] text-emerald-400 font-mono block">
                          +{formatRupee(item.bufferAmount)} buffer
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. ACTIVE RISKS STATE (Automatically highlights most urgent upcoming SIPs first)
  return (
    <div
      id="upcoming-payment-risks-section"
      className={cn(
        'rounded-3xl p-4 sm:p-5 border transition-all shadow-xl relative overflow-hidden',
        criticalCount > 0
          ? 'bg-gradient-to-br from-[#1a080d] via-[#12070e] to-[#0a0d18] border-rose-500/40 shadow-rose-950/20'
          : 'bg-gradient-to-br from-[#1c1204] via-[#120d06] to-[#0a0d18] border-amber-500/40 shadow-amber-950/20',
        className
      )}
    >
      {/* Background ambient blur */}
      <div
        className={cn(
          'absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40',
          criticalCount > 0 ? 'bg-rose-500' : 'bg-amber-500'
        )}
      />

      <div className="relative z-10 space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-2.5 rounded-2xl border shrink-0',
                criticalCount > 0
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              )}
            >
              {criticalCount > 0 ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-white font-heading">
                  Upcoming Payment Risks
                </h3>
                {criticalCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/50 font-mono uppercase tracking-wide">
                    <Zap className="w-3 h-3" />
                    {criticalCount} Critical Shortfall{criticalCount > 1 ? 's' : ''}
                  </span>
                )}
                {lowBufferCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40 font-mono uppercase tracking-wide">
                    {lowBufferCount} Low Buffer
                  </span>
                )}
                {safeCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 font-mono">
                    {safeCount} Safe
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Prioritized by payment urgency: Shortfalls and low bank buffers flagged before deduction dates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onRefreshSafety && (
              <button
                type="button"
                id="btn-recheck-upcoming-risks"
                onClick={onRefreshSafety}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer min-h-[34px]"
                title="Re-evaluate linked bank balances against upcoming installments"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-check</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Pill Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800/90 overflow-x-auto">
          {[
            { key: 'all' as const, label: 'All Upcoming', count: categorizedList.length },
            { key: 'risks_only' as const, label: 'Urgent Risks', count: totalRiskyCount, badgeColor: 'text-rose-400' },
            ...(criticalCount > 0
              ? [{ key: 'critical' as const, label: 'Critical', count: criticalCount, badgeColor: 'text-rose-400' }]
              : []),
            ...(lowBufferCount > 0
              ? [{ key: 'low_buffer' as const, label: 'Low Buffer', count: lowBufferCount, badgeColor: 'text-amber-400' }]
              : []),
            { key: 'safe' as const, label: 'Safe', count: safeCount, badgeColor: 'text-emerald-400' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              id={`filter-risks-${tab.key}`}
              onClick={() => setFilterTier(tab.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[30px]',
                filterTier === tab.key
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold',
                  filterTier === tab.key ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-400',
                  tab.badgeColor
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Urgently Sorted Flagged SIP Cards List */}
        <div className="space-y-2.5">
          {displayedList.map((item) => {
            const countdown = getCountdownLabel(item.daysUntil, item.evaluation.relativeDateLabel);
            const isCritical = item.tier === 1;
            const isLowBuffer = item.tier === 2;
            const isSafe = item.tier === 3;
            const isReminderActive = Boolean(activeReminderPrefs[item.sip.id] || item.sip.reminderEnabled);
            const isDeductionTomorrow = item.daysUntil === 1;
            const isJustToggled = recentToggledId === item.sip.id;

            return (
              <div
                key={item.sip.id}
                id={`sip-risk-item-${item.sip.id}`}
                className={cn(
                  'rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 flex flex-col gap-3',
                  isCritical
                    ? 'bg-gradient-to-r from-rose-950/60 via-[#18080f] to-slate-950/90 border-rose-500/50 hover:border-rose-400 shadow-md shadow-rose-950/20'
                    : isLowBuffer
                    ? 'bg-gradient-to-r from-amber-950/40 via-[#160f06] to-slate-950/90 border-amber-500/40 hover:border-amber-400 shadow-sm'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                )}
              >
                {/* Main Card Content: Left Info + Right Financials */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                  {/* Left Side: SIP / Fund Name, Deduction Date & Countdown, Linked Bank */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Urgency Status Badge */}
                      {isCritical && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40 font-mono uppercase tracking-wide">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          Critical Shortfall
                        </span>
                      )}
                      {isLowBuffer && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 font-mono uppercase tracking-wide">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          Low Buffer
                        </span>
                      )}
                      {isSafe && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          Safe
                        </span>
                      )}

                      {/* Fund Name */}
                      <h4 className="text-sm font-bold text-white truncate font-heading">
                        {item.sip.fundName}
                      </h4>

                      {item.sip.platform && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                          {item.sip.platform}
                        </span>
                      )}
                    </div>

                    {/* Date + Countdown and Bank Details Row */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-300">
                      {/* Deduction Date + Countdown */}
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Clock
                          className={cn(
                            'w-3.5 h-3.5',
                            isCritical ? 'text-rose-400' : isLowBuffer ? 'text-amber-400' : 'text-cyan-400'
                          )}
                        />
                        <span className="font-semibold">
                          {item.evaluation.nextDeductionFormatted || item.evaluation.nextDeductionDate}
                        </span>
                        <span
                          className={cn(
                            'px-1.5 py-0.2 rounded font-mono text-[10px] font-bold',
                            countdown.isUrgent
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300'
                          )}
                        >
                          {countdown.text}
                        </span>
                      </div>

                      <span className="text-slate-600 hidden sm:inline">•</span>

                      {/* Linked Bank & Account */}
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Landmark className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300 truncate max-w-[160px] font-medium">
                          {item.bankName}
                        </span>
                        {item.accountNumberMasked && (
                          <span className="text-[11px] font-mono text-slate-500">
                            {item.accountNumberMasked}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Required Amount, Current Balance, Shortfall/Buffer & Transfer Action */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    {/* Financial Details Grid */}
                    <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
                      {/* 1. Required SIP Amount */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-semibold">
                          Required
                        </span>
                        <span className="text-sm font-bold text-white">
                          {formatRupee(item.requiredAmount)}
                        </span>
                      </div>

                      {/* 2. Current Bank Balance */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-semibold">
                          Bank Balance
                        </span>
                        <span
                          className={cn(
                            'text-sm font-bold',
                            isCritical ? 'text-rose-400' : 'text-slate-300'
                          )}
                        >
                          {formatRupee(item.availableBalance)}
                        </span>
                      </div>

                      {/* 3. Exact Shortfall / Buffer Amount */}
                      <div className="text-right min-w-[80px]">
                        <span className="text-[10px] uppercase tracking-wider block font-sans font-semibold text-slate-500">
                          {isCritical ? 'Shortfall' : 'Buffer'}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-extrabold',
                            isCritical ? 'text-rose-400' : isLowBuffer ? 'text-amber-400' : 'text-emerald-400'
                          )}
                        >
                          {isCritical
                            ? `-${formatRupee(item.shortfallAmount)}`
                            : `+${formatRupee(item.bufferAmount)}`}
                        </span>
                      </div>
                    </div>

                    {/* Top Up / Transfer Action Button */}
                    {onTransferFunds && (
                      <button
                        type="button"
                        id={`btn-transfer-risk-${item.sip.id}`}
                        onClick={() => onTransferFunds(item.bankAccountId)}
                        className={cn(
                          'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-heading min-h-[38px] active:scale-95 shrink-0',
                          isCritical
                            ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-950/40 border border-rose-500/50'
                            : isLowBuffer
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-md shadow-amber-950/30 border border-amber-500/50'
                            : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700'
                        )}
                        title={`Top up or transfer funds to ${item.bankName}`}
                      >
                        <span>{isCritical ? 'Top Up Bank' : isLowBuffer ? 'Add Buffer' : 'Transfer'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-bar: Notify Me Toggle & 1-day-before Reminder Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/60 text-xs">
                  {/* Left: Reminder Toggle Control */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`btn-notify-toggle-${item.sip.id}`}
                      onClick={(e) => handleToggleReminder(item.sip.id, e)}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer min-h-[32px]',
                        isReminderActive
                          ? 'bg-cyan-950/60 text-cyan-200 border-cyan-500/40 hover:bg-cyan-900/60 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                      )}
                      title={
                        isReminderActive
                          ? 'Reminder active: You will be alerted 1 day before deduction'
                          : 'Turn on reminder: Alert 1 day before deduction'
                      }
                    >
                      <div className="flex items-center gap-1.5">
                        {isReminderActive ? (
                          <BellRing className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span className="font-semibold">Notify me</span>
                      </div>

                      {/* Switch pill pill visual */}
                      <div
                        className={cn(
                          'w-7 h-4 rounded-full transition-colors relative flex items-center px-0.5',
                          isReminderActive ? 'bg-cyan-500' : 'bg-slate-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm',
                            isReminderActive ? 'translate-x-3' : 'translate-x-0'
                          )}
                        />
                      </div>
                    </button>

                    {/* Brief saved feedback */}
                    {isJustToggled && (
                      <span className="text-[11px] text-cyan-300 font-medium animate-in fade-in duration-150">
                        {isReminderActive ? 'Reminder enabled!' : 'Reminder removed'}
                      </span>
                    )}
                  </div>

                  {/* Right: Reminder Trigger Date Details & Active Alert Indicator */}
                  <div className="flex items-center gap-2 text-[11px]">
                    {isReminderActive ? (
                      <div className="flex items-center gap-1.5 text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>Alert scheduled for 1 day before ({item.reminderDateFormatted})</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">
                        Reminder scheduled 1 day prior ({item.reminderDateFormatted})
                      </span>
                    )}

                    {isReminderActive && isDeductionTomorrow && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/35 animate-pulse font-mono">
                        ⏰ Reminder: Due Tomorrow
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
