import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Camera,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Scale,
  FileText,
} from 'lucide-react';
import { NetWorthComparisonResult } from '../../types';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../../utils/cn';

interface AnalysisHeroProps {
  currentNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  comparison: NetWorthComparisonResult;
  onTakeSnapshot: () => void;
  onOpenCompareModal: () => void;
  onOpenPdfExport?: () => void;
  className?: string;
}

export const AnalysisHero: React.FC<AnalysisHeroProps> = ({
  currentNetWorth,
  totalAssets,
  totalLiabilities,
  comparison,
  onTakeSnapshot,
  onOpenCompareModal,
  onOpenPdfExport,
  className,
}) => {
  const isPositive = comparison?.isPositive ?? (comparison?.netWorthChangeAmount !== undefined ? comparison.netWorthChangeAmount >= 0 : true);
  const isZero = (comparison?.netWorthChangeAmount || 0) === 0;
  const changeAmountFormatted = formatRupee(Math.abs(comparison?.netWorthChangeAmount || 0));
  const changePctFormatted = formatPercentage(Math.abs(comparison?.netWorthChangePercentage || 0), false);

  const totalBase = totalAssets + totalLiabilities;
  const solvencyRatio = totalBase > 0
    ? Math.round((totalAssets / totalBase) * 1000) / 10
    : 100;

  const baselineDate = comparison?.baselineSnapshot
    ? comparison.baselineSnapshot.dateString || comparison.baselineSnapshot.date || 'Baseline'
    : comparison?.baselineDate || 'Inception';

  const currentDate = comparison?.currentSnapshot
    ? comparison.currentSnapshot.dateString || comparison.currentSnapshot.date || 'Today'
    : 'Today';

  return (
    <div
      id="afinity-analysis-hero"
      className={cn(
        'rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#121c38] via-[#0d1629] to-[#070b14] border border-cyan-500/30 shadow-2xl space-y-5',
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-heading">
              Financial Analysis & Net Worth Growth
            </span>
            <Badge variant="cyan" size="sm">
              Live Real-Time
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Current portfolio valuation vs historical snapshot reference
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPdfExport && (
            <button
              type="button"
              id="btn-analysis-export-pdf"
              onClick={onOpenPdfExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 hover:text-white text-xs font-bold border border-cyan-500/30 transition-all active:scale-95 cursor-pointer font-heading min-h-[40px]"
              title="Export statement as PDF"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          )}

          <button
            type="button"
            id="btn-analysis-compare-modal"
            onClick={onOpenCompareModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all active:scale-95 cursor-pointer font-heading min-h-[40px]"
            title="Compare two custom snapshots"
          >
            <Scale className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Compare Snapshots</span>
            <span className="sm:hidden">Compare</span>
          </button>

          <button
            type="button"
            id="btn-analysis-take-snapshot"
            onClick={onTakeSnapshot}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all active:scale-95 cursor-pointer font-heading min-h-[40px]"
          >
            <Camera className="w-4 h-4" />
            <span>Record Snapshot</span>
          </button>
        </div>
      </div>

      {/* Main Net Worth Valuation Hero Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column: Big Net Worth Display */}
        <div className="md:col-span-7 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Current Net Worth
          </span>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-mono tracking-tight">
              {formatRupee(currentNetWorth)}
            </span>
          </div>

          {/* Change Pill */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold font-mono border',
                isZero
                  ? 'bg-slate-800/60 text-slate-300 border-slate-700'
                  : isPositive
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                  : 'bg-rose-950/70 text-rose-300 border-rose-700/60'
              )}
            >
              {isZero ? (
                <span>₹0 No Change</span>
              ) : isPositive ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+{changeAmountFormatted} (+{changePctFormatted})</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>-{changeAmountFormatted} (-{changePctFormatted})</span>
                </>
              )}
            </div>

            <span className="text-xs text-slate-400">
              vs {comparison.periodLabel}
            </span>
          </div>

          {/* Dates Comparison Bar */}
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Current: <strong className="text-slate-200 font-sans">{currentDate}</strong></span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Baseline: <strong className="text-slate-200 font-sans">{baselineDate}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Assets vs Liabilities Snapshot Summary */}
        <div className="md:col-span-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading">
              Balance Sheet Position
            </span>
            <Badge variant={solvencyRatio >= 70 ? 'emerald' : 'gold'} size="sm">
              {solvencyRatio >= 70 ? 'Solvent' : 'Balanced'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Total Assets</span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
                {formatRupee(totalAssets)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Total Liabilities</span>
              <span className="text-sm sm:text-base font-bold font-mono text-rose-400">
                {formatRupee(totalLiabilities)}
              </span>
            </div>
          </div>

          <ProgressBar
            value={totalAssets}
            max={totalBase || 1}
            label={`Solvency Ratio: ${solvencyRatio}%`}
            sublabel={`Debt-to-Asset: ${Math.round((totalLiabilities / (totalAssets || 1)) * 1000) / 10}%`}
            variant="emerald"
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};
