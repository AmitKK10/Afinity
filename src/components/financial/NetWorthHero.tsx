import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  RefreshCw,
  Landmark,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Wallet,
  Coins,
  Percent,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { ChangeIndicator } from '../ui/ChangeIndicator';
import { TIME_PERIODS } from '../../utils/constants';
import { TimePeriod } from '../../types/navigation';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { FinancialSnapshot } from '../../types';
import { NetWorthMiniTrendSparkline } from './NetWorthMiniTrendSparkline';
import { cn } from '../../utils/cn';

export type QuickSnapshotMode = 'net_worth' | 'cashflow';

interface NetWorthHeroProps {
  netWorth: number;
  changeAmount: number;
  changePercentage: number;
  totalAssets: number;
  totalLiabilities: number;
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  lastUpdated?: string;
  onQuickUpdate?: () => void;
  snapshots?: FinancialSnapshot[];
  // Optional Cashflow props
  snapshotMode?: QuickSnapshotMode;
  onSnapshotModeChange?: (mode: QuickSnapshotMode) => void;
  monthlyInflow?: number;
  monthlyOutflow?: number;
  monthlyNetCashflow?: number;
  savingsRate?: number;
  cashflowChangeAmount?: number;
  cashflowChangePercentage?: number;
  fdMonthlyYield?: number;
  creditCardDues?: number;
  receivablesDue?: number;
  payablesDue?: number;
  className?: string;
}

export const NetWorthHero: React.FC<NetWorthHeroProps> = ({
  netWorth,
  changeAmount,
  changePercentage,
  totalAssets,
  totalLiabilities,
  selectedPeriod,
  onPeriodChange,
  lastUpdated = 'Just now',
  onQuickUpdate,
  snapshots = [],
  snapshotMode: controlledMode,
  onSnapshotModeChange,
  monthlyInflow: propInflow,
  monthlyOutflow: propOutflow,
  monthlyNetCashflow: propNetCashflow,
  savingsRate: propSavingsRate,
  cashflowChangeAmount = 6800,
  cashflowChangePercentage = 12.8,
  fdMonthlyYield = 2450,
  creditCardDues = 68475,
  receivablesDue = 12000,
  payablesDue = 32000,
  className,
}) => {
  const [internalMode, setInternalMode] = useState<QuickSnapshotMode>('net_worth');
  const [cashflowViewType, setCashflowViewType] = useState<'this_month' | '3m_avg' | 'projected'>('this_month');

  const activeMode = controlledMode !== undefined ? controlledMode : internalMode;

  const handleModeToggle = (mode: QuickSnapshotMode) => {
    setInternalMode(mode);
    if (onSnapshotModeChange) {
      onSnapshotModeChange(mode);
    }
  };

  // Derive realistic cashflow amounts if not passed directly
  const effectiveInflow = propInflow ?? 137450; // Baseline inflow (Salary + yield + receipts)
  const effectiveOutflow = propOutflow ?? (creditCardDues > 0 ? creditCardDues + (payablesDue > 0 ? 12000 : 0) : 56800);
  const effectiveNetCashflow = propNetCashflow ?? (effectiveInflow - effectiveOutflow);
  const effectiveSavingsRate = propSavingsRate ?? (effectiveInflow > 0 ? Math.round((effectiveNetCashflow / effectiveInflow) * 100) : 54);
  const isPositiveCashflow = effectiveNetCashflow >= 0;

  // Inflow to Outflow percentage ratio
  const outflowRatio = effectiveInflow > 0 ? Math.min(100, Math.round((effectiveOutflow / effectiveInflow) * 100)) : 45;
  const surplusRatio = Math.max(0, 100 - outflowRatio);

  return (
    <motion.div
      id="net-worth-hero-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#121c33] dark:via-[#0d1629] dark:to-[#090e1b] border border-slate-200/90 dark:border-slate-700/60 shadow-xl shadow-slate-200/40 dark:shadow-2xl dark:shadow-black/40',
        className
      )}
    >
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      {/* Top Controls Row: Quick Snapshot Switcher & Contextual Period Filters */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Quick Snapshot Toggle Segmented Control */}
        <div
          id="quick-snapshot-toggle-container"
          className="flex items-center bg-slate-100/95 dark:bg-[#0a0f1d]/95 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
        >
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-heading">
            <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>Quick Snapshot</span>
          </div>

          <button
            id="snapshot-btn-net-worth"
            type="button"
            onClick={() => handleModeToggle('net_worth')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none font-heading',
              activeMode === 'net_worth'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Total Net Worth</span>
          </button>

          <button
            id="snapshot-btn-cashflow"
            type="button"
            onClick={() => handleModeToggle('cashflow')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none font-heading',
              activeMode === 'cashflow'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Monthly Cashflow</span>
          </button>
        </div>

        {/* Secondary Contextual Filter (Period for Net Worth / Mode for Cashflow) */}
        {activeMode === 'net_worth' ? (
          <div className="flex items-center bg-slate-100/90 dark:bg-[#0a0f1d]/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {TIME_PERIODS.map((period) => {
              const isActive = selectedPeriod === period.key;
              return (
                <button
                  key={period.key}
                  type="button"
                  onClick={() => onPeriodChange(period.key)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none font-heading',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  {period.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center bg-slate-100/90 dark:bg-[#0a0f1d]/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCashflowViewType('this_month')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none font-heading',
                cashflowViewType === 'this_month'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setCashflowViewType('3m_avg')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none font-heading',
                cashflowViewType === '3m_avg'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              3M Average
            </button>
          </div>
        )}
      </div>

      {/* Main Metric Transition Area */}
      <AnimatePresence mode="wait">
        {activeMode === 'net_worth' ? (
          /* =========================================================================
             TOTAL NET WORTH SNAPSHOT VIEW
             ========================================================================= */
          <motion.div
            key="snapshot-view-net-worth"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25 }}
            className="relative z-10"
          >
            {/* Tag / Subtitle */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-slate-800/80 border border-emerald-500/20 dark:border-slate-700/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-slate-300 font-heading uppercase tracking-wider">
                  Total Net Worth
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Single User Vault</span>
              </div>
            </div>

            {/* Big Hero Valuation */}
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <MoneyDisplay
                  id="hero-net-worth-amount"
                  amount={netWorth}
                  size="hero"
                  className="text-slate-900 dark:text-white drop-shadow-xs dark:drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 mt-3">
                <ChangeIndicator
                  amount={changeAmount}
                  percentage={changePercentage}
                  label={`this ${selectedPeriod.toLowerCase()}`}
                  variant="pill"
                  size="md"
                />

                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  Valuation {lastUpdated}
                </span>
              </div>
            </div>

            {/* Mini Trend Sparkline (30-Day Trajectory using Recharts) */}
            <div className="my-4">
              <NetWorthMiniTrendSparkline
                netWorth={netWorth}
                snapshots={snapshots}
                totalAssets={totalAssets}
                totalLiabilities={totalLiabilities}
                variant="hero-inline"
                showStats={true}
              />
            </div>

            {/* Bottom Summary Strip: Total Assets vs Total Liabilities */}
            <div className="mt-6 pt-4 border-t border-slate-200/90 dark:border-slate-800/80 grid grid-cols-2 gap-3 sm:gap-4">
              {/* Total Assets Pill */}
              <div className="flex flex-col p-3 rounded-2xl bg-emerald-50/80 dark:bg-[#0c1424]/80 border border-emerald-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs mb-1 font-medium">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    Total Assets
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">GROWING</span>
                </div>
                <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-300 tabular-nums">
                  {formatRupee(totalAssets)}
                </span>
              </div>

              {/* Total Liabilities Pill */}
              <div className="flex flex-col p-3 rounded-2xl bg-rose-50/80 dark:bg-[#0c1424]/80 border border-rose-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs mb-1 font-medium">
                  <span className="flex items-center gap-1.5 font-semibold text-rose-800 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                    Total Liabilities
                  </span>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold">DUES</span>
                </div>
                <span className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-300 tabular-nums">
                  {formatRupee(totalLiabilities)}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* =========================================================================
             MONTHLY CASHFLOW SNAPSHOT VIEW
             ========================================================================= */
          <motion.div
            key="snapshot-view-cashflow"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="relative z-10"
          >
            {/* Tag / Subtitle */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 dark:bg-slate-800/80 border border-teal-500/20 dark:border-slate-700/50">
                <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 font-heading uppercase tracking-wider">
                  Monthly Net Cashflow
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Inflows vs Outflows</span>
              </div>
            </div>

            {/* Big Hero Cashflow Metric */}
            <div className="my-3">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <MoneyDisplay
                  id="hero-cashflow-amount"
                  amount={effectiveNetCashflow}
                  size="hero"
                  sentiment="positive"
                  className={cn(
                    isPositiveCashflow
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  )}
                />
                <span className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 font-heading">
                  / month net surplus
                </span>
              </div>

              {/* Badges & Health Indicators */}
              <div className="flex flex-wrap items-center gap-2.5 mt-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
                  <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{effectiveSavingsRate}% Savings Rate</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-bold font-mono">
                  <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>+{formatRupee(cashflowChangeAmount)} (+{cashflowChangePercentage}%) vs last mo</span>
                </div>

                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Positive Free Cashflow
                </span>
              </div>
            </div>

            {/* Bottom Summary Strip: Estimated Inflows vs Estimated Outflows */}
            <div className="mt-6 pt-4 border-t border-slate-200/90 dark:border-slate-800/80 space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Monthly Inflows */}
                <div className="flex flex-col p-3 rounded-2xl bg-emerald-50/80 dark:bg-[#0c1424]/80 border border-emerald-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs mb-1 font-medium">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      Est. Monthly Inflow
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">INFLOWS</span>
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-300 tabular-nums">
                    +{formatRupee(effectiveInflow)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Includes FD yields &amp; earnings
                  </span>
                </div>

                {/* Monthly Outflows & Dues */}
                <div className="flex flex-col p-3 rounded-2xl bg-amber-50/80 dark:bg-[#0c1424]/80 border border-amber-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs mb-1 font-medium">
                    <span className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                      Est. Monthly Outflow
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">COMMITMENTS</span>
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-300 tabular-nums">
                    -{formatRupee(effectiveOutflow)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Card dues &amp; living expenses
                  </span>
                </div>
              </div>

              {/* Cashflow Efficiency Visual Meter */}
              <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium font-heading">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Surplus Retained ({surplusRatio}%)
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Expenses &amp; Dues ({outflowRatio}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                    style={{ width: `${surplusRatio}%` }}
                  />
                  <div
                    className="h-full bg-amber-500 rounded-r-full transition-all duration-500"
                    style={{ width: `${outflowRatio}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

