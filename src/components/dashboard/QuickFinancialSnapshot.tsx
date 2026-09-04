import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Building2,
  TrendingUp,
  CreditCard,
  CalendarClock,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { useFinancialData } from '../../context/FinancialDataContext';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import {
  findNextUpcomingCommitment,
  calculateWidgetPaymentSafety,
} from '../../services/widgetDataService';
import {
  calculateTotalInvestmentProfitLoss,
  calculateTotalInvestmentValue,
} from '../../services/calculations';
import { cn } from '../../utils/cn';

interface QuickFinancialSnapshotProps {
  className?: string;
  onQuickUpdateClick?: () => void;
  onOpenWidgetCompanion?: () => void;
}

export const QuickFinancialSnapshot: React.FC<QuickFinancialSnapshotProps> = ({
  className,
  onQuickUpdateClick,
  onOpenWidgetCompanion,
}) => {
  const navigate = useNavigate();
  const {
    netWorth,
    totalAssets,
    totalLiabilities,
    bankAccounts,
    creditCards,
    sips,
    investments,
    creditPosition,
    bankPosition,
    sipSafetyReport,
    isSyncing,
    lastSyncedAt,
    refreshAllData,
  } = useFinancialData();

  // Masking state for privacy (glanceable PWA widget mode)
  const [isMasked, setIsMasked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('afinity_widget_mask') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMask = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !isMasked;
    setIsMasked(nextVal);
    try {
      localStorage.setItem('afinity_widget_mask', String(nextVal));
    } catch {
      // ignore
    }
  };

  // 1. Available Bank Balance (reusing existing calculations & accounts data)
  const activeBanks = useMemo(
    () => (bankAccounts || []).filter((b) => b?.status === 'active'),
    [bankAccounts]
  );
  const availableBankBalance = useMemo(() => {
    if (bankPosition?.totalPositiveAssets !== undefined && bankPosition.totalPositiveAssets > 0) {
      return bankPosition.totalPositiveAssets;
    }
    return activeBanks.reduce((sum, b) => sum + Math.max(0, Number(b?.balance || 0)), 0);
  }, [bankPosition, activeBanks]);

  // 2. Investment Portfolio Value & P&L
  const activeInvs = useMemo(
    () => (investments || []).filter((i) => i?.status === 'active' || i?.status !== 'archived'),
    [investments]
  );
  const investmentValuation = useMemo(
    () => calculateTotalInvestmentProfitLoss(activeInvs),
    [activeInvs]
  );
  const investmentValue = useMemo(() => {
    return investmentValuation.totalCurrent > 0
      ? investmentValuation.totalCurrent
      : calculateTotalInvestmentValue(activeInvs);
  }, [investmentValuation, activeInvs]);

  // 3. Credit Card Total Outstanding
  const activeCards = useMemo(
    () => (creditCards || []).filter((c) => c?.status !== 'archived' && c?.status !== 'closed'),
    [creditCards]
  );
  const creditOutstanding = useMemo(() => {
    if (creditPosition?.totalCreditLiability !== undefined && creditPosition.totalCreditLiability > 0) {
      return creditPosition.totalCreditLiability;
    }
    return activeCards.reduce(
      (sum, c) =>
        sum + Math.max(0, Number(c?.outstanding !== undefined ? c.outstanding : c?.outstandingBalance || 0)),
      0
    );
  }, [creditPosition, activeCards]);

  // 4. Next Upcoming Commitment (SIP deduction or Credit Card statement due)
  const nextCommitment = useMemo(() => {
    return findNextUpcomingCommitment(sips || [], creditCards || [], 'auto');
  }, [sips, creditCards]);

  // 5. Payment Safety Status (reusing core calculation)
  const paymentSafety = useMemo(() => {
    return calculateWidgetPaymentSafety(
      availableBankBalance,
      nextCommitment,
      creditPosition,
      sipSafetyReport
    );
  }, [availableBankBalance, nextCommitment, creditPosition, sipSafetyReport]);

  const isSafe = paymentSafety.status === 'SAFE';
  const isWarning = paymentSafety.status === 'WARNING';
  const isCritical = paymentSafety.status === 'CRITICAL';

  // Mask helper
  const val = (formatted: string) => (isMasked ? '••••••' : formatted);

  return (
    <section
      id="quick-financial-snapshot-panel"
      aria-label="Quick Financial Snapshot"
      className={cn(
        'group relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0c1220]/95 to-[#080c16]/95 border border-cyan-500/25 hover:border-cyan-500/40 shadow-2xl shadow-black/80 transition-all p-4 sm:p-5 text-slate-100',
        className
      )}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent pointer-events-none rounded-tr-3xl" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-600/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header bar: Widget Identity, Status Badge, Privacy & Sync */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 flex-shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 font-heading">
                Quick Financial Snapshot
              </h2>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/50 text-[10px] font-mono font-bold text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                PWA Widget
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Glanceable overview of your personal balance sheet &amp; commitments
            </p>
          </div>
        </div>

        {/* Action Controls & Payment Safety Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Payment Safety Status Pill */}
          <div
            id="widget-payment-safety-pill"
            onClick={() => {
              if (nextCommitment?.deepLinkRoute) {
                navigate(nextCommitment.deepLinkRoute);
              } else {
                navigate('/credit');
              }
            }}
            title={paymentSafety.description}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer select-none active:scale-95 shadow-sm',
              isSafe && 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60',
              isWarning && 'bg-amber-950/70 border-amber-700/60 text-amber-300 hover:bg-amber-900/60',
              isCritical && 'bg-rose-950/70 border-rose-700/60 text-rose-300 hover:bg-rose-900/60'
            )}
          >
            {isSafe && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            {isCritical && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
            <span>{paymentSafety.label}</span>
          </div>

          {/* Mask / Privacy Toggle */}
          <button
            type="button"
            id="widget-privacy-toggle-btn"
            onClick={toggleMask}
            title={isMasked ? 'Reveal numbers' : 'Hide numbers for privacy (••••••)'}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMasked ? <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Refresh */}
          <button
            type="button"
            id="widget-refresh-btn"
            onClick={() => refreshAllData()}
            disabled={isSyncing}
            title="Refresh IndexedDB & financial state"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-300', isSyncing && 'animate-spin text-cyan-400')} />
          </button>
        </div>
      </div>

      {/* Net Worth Hero Capsule */}
      <div className="relative z-10 py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading">
              Current Net Worth
            </span>
            {totalAssets > 0 && (
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                (Assets {val(formatRupee(totalAssets, { compact: true }))} − Liabilities {val(formatRupee(totalLiabilities, { compact: true }))})
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {val(formatRupee(netWorth))}
            </span>
          </div>
        </div>

        {/* Quick Jump / Update Link */}
        <div className="flex items-center gap-2">
          {onQuickUpdateClick && (
            <button
              type="button"
              onClick={onQuickUpdateClick}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Update Closing Balances</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Core Metric Tiles: Bank Balance, Investment Value, Credit Outstanding */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 py-3.5">
        {/* 1. Available Bank Balance */}
        <div
          id="widget-tile-bank"
          onClick={() => navigate('/accounts')}
          className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider font-heading">
                Bank Balance
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-2 text-lg sm:text-xl font-black text-cyan-300 font-mono tracking-tight">
            {val(formatRupee(availableBankBalance))}
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>{activeBanks.length} active bank{activeBanks.length === 1 ? '' : 's'}</span>
            <span className="text-[10px] text-slate-400">Liquid</span>
          </div>
        </div>

        {/* 2. Investment Portfolio Value */}
        <div
          id="widget-tile-investments"
          onClick={() => navigate('/investments')}
          className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/60 transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider font-heading">
                Investments
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-2 text-lg sm:text-xl font-black text-emerald-300 font-mono tracking-tight">
            {val(formatRupee(investmentValue))}
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>{activeInvs.length} holding{activeInvs.length === 1 ? '' : 's'}</span>
            {investmentValuation.totalPnl !== 0 && (
              <span
                className={cn(
                  'text-[10px] font-mono font-bold',
                  investmentValuation.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {investmentValuation.profitLoss >= 0 ? '+' : ''}
                {val(formatRupee(investmentValuation.profitLoss, { compact: true }))}
              </span>
            )}
          </div>
        </div>

        {/* 3. Credit Card Outstanding */}
        <div
          id="widget-tile-credit"
          onClick={() => navigate('/credit')}
          className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-rose-500/40 hover:bg-slate-900/60 transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400">
              <CreditCard className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider font-heading">
                Credit Outstanding
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-2 text-lg sm:text-xl font-black text-rose-300 font-mono tracking-tight">
            {val(formatRupee(creditOutstanding))}
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>{activeCards.length} active card{activeCards.length === 1 ? '' : 's'}</span>
            <span className="text-[10px] font-mono text-slate-400">
              {creditPosition.totalUtilization}% limit used
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Next Upcoming Commitment Banner */}
      <div className="relative z-10 pt-1">
        {nextCommitment ? (
          <div
            id="widget-next-commitment-strip"
            onClick={() => navigate(nextCommitment.deepLinkRoute)}
            className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border',
                  nextCommitment.type === 'sip'
                    ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400'
                    : 'bg-rose-950/60 border-rose-800/50 text-rose-400'
                )}
              >
                {nextCommitment.type === 'sip' ? (
                  <Repeat className="w-4 h-4" />
                ) : (
                  <CalendarClock className="w-4 h-4" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-heading">
                    {nextCommitment.categoryLabel}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-bold px-2 py-0.2 rounded-md border',
                      nextCommitment.isDueSoon
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800/60 font-black'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                    )}
                  >
                    {nextCommitment.badgeText}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mt-0.5">
                  {nextCommitment.title}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Commitment Due</span>
                <span className="text-sm font-black font-mono text-white">
                  {val(nextCommitment.formattedAmount)}
                </span>
              </div>

              <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-300 group-hover:bg-cyan-600 group-hover:text-white transition-all flex-shrink-0">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ) : (
          <div
            id="widget-all-clear-strip"
            className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>No immediate SIP deductions or credit card dues pending in current cycle.</span>
            </div>
            <span className="text-[11px] text-emerald-400/90 font-bold hidden sm:inline">All obligations clear</span>
          </div>
        )}
      </div>

      {/* Safety Description & PWA Widget Guidance Footer */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isSafe && 'bg-emerald-400',
              isWarning && 'bg-amber-400',
              isCritical && 'bg-rose-400'
            )}
          />
          <span className="text-slate-300 font-medium">
            {paymentSafety.description}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenWidgetCompanion && (
            <button
              type="button"
              onClick={onOpenWidgetCompanion}
              className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Smartphone className="w-3 h-3" />
              <span>Android Widget</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
