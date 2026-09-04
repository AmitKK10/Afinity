import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Sparkles,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Eye,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  Grid,
} from 'lucide-react';
import { FinancialSnapshot, ComparisonPeriod } from '../../types';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const STORAGE_KEY_SHOW_GRID = 'afinity_analysis_chart_grid_lines';

interface NetWorthComparisonChartProps {
  snapshots: FinancialSnapshot[];
  currentNetWorth: number;
  currentAssets: number;
  currentLiabilities: number;
  selectedPeriod?: ComparisonPeriod;
  onSelectPeriod?: (period: ComparisonPeriod) => void;
  className?: string;
}

type TrendTimeframe = '6M' | '12M' | '24M' | 'ALL';
type ChartViewMode = 'net_worth' | 'assets_vs_debt' | 'asset_classes';
type ReferenceLineOption = 'none' | 'average' | 'baseline' | 'peak';

const renderComparisonCustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload && payload.isPeak) {
    return (
      <svg key={`peak-dot-${payload.id}`} x={cx - 7} y={cy - 7} width={14} height={14} viewBox="0 0 24 24" className="animate-pulse">
        <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
      </svg>
    );
  }
  return null;
};

const ComparisonChartTooltip: React.FC<any> = ({ active, payload, activeTimeframe, viewMode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPositiveGrowth = data.changeFromBase >= 0;
    const isPositiveMoM = data.momDelta >= 0;

    return (
      <div className="rounded-2xl bg-slate-950/95 p-4 border border-cyan-900/60 shadow-2xl backdrop-blur-xl text-xs min-w-[240px] max-w-[280px] space-y-2.5 z-50">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <span className="font-bold text-white font-heading text-sm block">
              {data.fullName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {data.fullDate}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {data.isPeak && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30 flex items-center gap-0.5 font-bold">
                <Award className="w-3 h-3 text-amber-400" /> Peak
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono border border-cyan-800/40">
              {data.label}
            </span>
          </div>
        </div>

        {/* Primary Net Worth valuation */}
        <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Net Worth:</span>
            <span className="text-cyan-300 font-bold font-mono text-sm">
              {formatRupee(data.netWorth)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-cyan-900/30">
            <span className="text-slate-400">Growth from {activeTimeframe || 'Period'} Start:</span>
            <span className={cn('font-bold font-mono flex items-center', isPositiveGrowth ? 'text-emerald-400' : 'text-rose-400')}>
              {isPositiveGrowth ? '+' : ''}{formatRupee(data.changeFromBase)} ({formatPercentage(data.changePctFromBase, true)})
            </span>
          </div>
          {data.momDelta !== 0 && (
            <div className="flex items-center justify-between text-[10px] mt-0.5">
              <span className="text-slate-400">Step Change:</span>
              <span className={cn('font-mono', isPositiveMoM ? 'text-emerald-400' : 'text-rose-400')}>
                {isPositiveMoM ? '+' : ''}{formatRupee(data.momDelta)}
              </span>
            </div>
          )}
        </div>

        {/* Asset & Liability details */}
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Total Assets:
            </span>
            <span>{formatRupee(data.assets)}</span>
          </div>
          <div className="flex items-center justify-between text-rose-400">
            <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Total Liabilities:
            </span>
            <span>{formatRupee(data.liabilities)}</span>
          </div>
        </div>

        {/* Component breakdown if in asset classes mode */}
        {viewMode === 'asset_classes' && (
          <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[10px] font-mono">
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-slate-400">Cash & Banks:</span>
              <span>{formatRupee(data.liquid)}</span>
            </div>
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-slate-400">Investments:</span>
              <span>{formatRupee(data.investments)}</span>
            </div>
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-slate-400">Receivables:</span>
              <span>{formatRupee(data.receivables)}</span>
            </div>
          </div>
        )}

        {data.note && (
          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 italic">
            "{data.note}"
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const NetWorthComparisonChart: React.FC<NetWorthComparisonChartProps> = ({
  snapshots,
  currentNetWorth,
  currentAssets,
  currentLiabilities,
  selectedPeriod,
  onSelectPeriod,
  className,
}) => {
  // Local timeframe state with sync capability to parent selectedPeriod
  const [internalTimeframe, setInternalTimeframe] = useState<TrendTimeframe>(() => {
    if (selectedPeriod === '24M' || selectedPeriod === '2Y') return '24M';
    if (selectedPeriod === '1Y' || selectedPeriod === '12M') return '12M';
    if (selectedPeriod === '6M' || selectedPeriod === '6_months_ago') return '6M';
    if (selectedPeriod === 'ALL' || selectedPeriod === 'all_time') return 'ALL';
    return '12M';
  });

  const activeTimeframe: TrendTimeframe = useMemo(() => {
    if (selectedPeriod === '24M' || selectedPeriod === '2Y') return '24M';
    if (selectedPeriod === '1Y' || selectedPeriod === '12M') return '12M';
    if (selectedPeriod === '6M' || selectedPeriod === '6_months_ago') return '6M';
    if (selectedPeriod === 'ALL' || selectedPeriod === 'all_time') return 'ALL';
    return internalTimeframe;
  }, [selectedPeriod, internalTimeframe]);

  const handleTimeframeChange = (tf: TrendTimeframe) => {
    setInternalTimeframe(tf);
    if (onSelectPeriod) {
      if (tf === '12M') onSelectPeriod('1Y');
      else onSelectPeriod(tf as ComparisonPeriod);
    }
  };

  const [viewMode, setViewMode] = useState<ChartViewMode>('net_worth');
  const [curveType, setCurveType] = useState<'monotone' | 'linear'>('monotone');
  const [referenceLine, setReferenceLine] = useState<ReferenceLineOption>('average');
  const [showDataTable, setShowDataTable] = useState(false);
  const [showGrid, setShowGrid] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHOW_GRID);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Failed to read grid line preference:', err);
    }
    return true; // default to enabled
  });

  const toggleGrid = () => {
    setShowGrid((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_SHOW_GRID, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to save grid line preference:', err);
      }
      return next;
    });
  };

  // Sort snapshots chronologically ascending
  const sortedSnapshots = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    return [...snapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [snapshots]);

  // Filter snapshots based on selected 6M, 12M, 24M, or ALL timeframe
  const filteredSnapshots = useMemo(() => {
    if (sortedSnapshots.length === 0) return [];

    const now = new Date();
    const nowTime = now.getTime();
    let cutoffTime = 0;

    switch (activeTimeframe) {
      case '6M':
        cutoffTime = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).getTime();
        break;
      case '12M':
        cutoffTime = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
        break;
      case '24M':
        cutoffTime = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).getTime();
        break;
      case 'ALL':
      default:
        cutoffTime = 0;
        break;
    }

    const filtered = sortedSnapshots.filter(
      (s) => new Date(s.timestamp).getTime() >= cutoffTime
    );

    // If filter returns empty or only 1 item, fallback gracefully to full list or top items
    if (filtered.length >= 2) return filtered;
    if (activeTimeframe === '6M') return sortedSnapshots.slice(-7);
    if (activeTimeframe === '12M') return sortedSnapshots.slice(-13);
    if (activeTimeframe === '24M') return sortedSnapshots.slice(-25);
    return sortedSnapshots;
  }, [sortedSnapshots, activeTimeframe]);

  // Compute Growth Performance Analytics over the chosen window
  const analytics = useMemo(() => {
    if (filteredSnapshots.length === 0) {
      return {
        startSnapshot: null,
        endSnapshot: null,
        startNetWorth: 0,
        endNetWorth: currentNetWorth || 0,
        growthAmount: 0,
        growthPercentage: 0,
        isPositive: true,
        cagr: 0,
        peakSnapshot: null,
        lowestSnapshot: null,
        averageNetWorth: currentNetWorth || 0,
        assetGrowthAmount: 0,
        assetGrowthPercentage: 0,
        liabilityGrowthAmount: 0,
        liabilityGrowthPercentage: 0,
        monthsSpan: 0,
        pointsCount: 0,
      };
    }

    const startSnap = filteredSnapshots[0];
    const endSnap = filteredSnapshots[filteredSnapshots.length - 1];

    const startNw = startSnap.netWorth !== undefined ? startSnap.netWorth : Number(startSnap.totalNetWorth || 0);
    const endNw = currentNetWorth !== undefined && currentNetWorth > 0
      ? currentNetWorth
      : (endSnap.netWorth !== undefined ? endSnap.netWorth : Number(endSnap.totalNetWorth || 0));

    const growthAmount = endNw - startNw;
    const growthPercentage = startNw > 0 ? (growthAmount / startNw) * 100 : 0;

    // Time difference in months
    const startTime = new Date(startSnap.timestamp).getTime();
    const endTime = new Date(endSnap.timestamp).getTime();
    const diffDays = Math.max(1, Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)));
    const monthsSpan = Math.max(1, Math.round(diffDays / 30.4375));

    // Annualized CAGR: ((End / Start) ^ (12 / months) - 1) * 100
    let cagr = 0;
    if (startNw > 0 && endNw > 0 && monthsSpan >= 6) {
      const years = monthsSpan / 12;
      cagr = (Math.pow(endNw / startNw, 1 / years) - 1) * 100;
    } else if (monthsSpan < 6) {
      cagr = growthPercentage; // Simple percentage for short spans
    }

    // Peak & Lowest Snapshot
    let peakSnap = filteredSnapshots[0];
    let lowestSnap = filteredSnapshots[0];
    let sumNw = 0;

    filteredSnapshots.forEach((snap) => {
      const nw = snap.netWorth !== undefined ? snap.netWorth : Number(snap.totalNetWorth || 0);
      sumNw += nw;

      const peakNw = peakSnap.netWorth !== undefined ? peakSnap.netWorth : Number(peakSnap.totalNetWorth || 0);
      if (nw > peakNw) peakSnap = snap;

      const lowNw = lowestSnap.netWorth !== undefined ? lowestSnap.netWorth : Number(lowestSnap.totalNetWorth || 0);
      if (nw < lowNw) lowestSnap = snap;
    });

    const averageNetWorth = Math.round(sumNw / filteredSnapshots.length);

    // Assets & Liability growth
    const startAst = Number(startSnap.totalAssets || 0);
    const endAst = currentAssets !== undefined && currentAssets > 0 ? currentAssets : Number(endSnap.totalAssets || 0);
    const astGrowth = endAst - startAst;
    const astGrowthPct = startAst > 0 ? (astGrowth / startAst) * 100 : 0;

    const startLiab = Number(startSnap.totalLiabilities || 0);
    const endLiab = currentLiabilities !== undefined && currentLiabilities > 0 ? currentLiabilities : Number(endSnap.totalLiabilities || 0);
    const liabGrowth = endLiab - startLiab;
    const liabGrowthPct = startLiab > 0 ? (liabGrowth / startLiab) * 100 : 0;

    return {
      startSnapshot: startSnap,
      endSnapshot: endSnap,
      startNetWorth: startNw,
      endNetWorth: endNw,
      growthAmount,
      growthPercentage,
      isPositive: growthAmount >= 0,
      cagr,
      peakSnapshot: peakSnap,
      lowestSnapshot: lowestSnap,
      averageNetWorth,
      assetGrowthAmount: astGrowth,
      assetGrowthPercentage: astGrowthPct,
      liabilityGrowthAmount: liabGrowth,
      liabilityGrowthPercentage: liabGrowthPct,
      monthsSpan,
      pointsCount: filteredSnapshots.length,
    };
  }, [filteredSnapshots, currentNetWorth, currentAssets, currentLiabilities]);

  // Format Recharts dataset with rich step calculations
  const chartData = useMemo(() => {
    if (filteredSnapshots.length === 0) return [];

    const baselineNw = analytics.startNetWorth;

    return filteredSnapshots.map((s, idx, arr) => {
      const nw = s.netWorth !== undefined ? s.netWorth : Number(s.totalNetWorth || 0);
      const ast = Number(s.totalAssets || 0);
      const liab = Number(s.totalLiabilities || 0);

      // Asset Class subcomponents
      const liquid = (s.categoryBreakdown?.assets?.cash ?? s.totalCash ?? 0) +
        (s.categoryBreakdown?.assets?.banks ?? s.totalBankBalance ?? 0) +
        (s.categoryBreakdown?.assets?.wallets ?? s.totalWalletBalance ?? 0);
      const investments = s.categoryBreakdown?.assets?.investments ?? s.totalInvestments ?? 0;
      const receivables = s.categoryBreakdown?.assets?.receivables ?? s.totalReceivables ?? 0;

      // Delta from baseline
      const changeFromBase = nw - baselineNw;
      const changePctFromBase = baselineNw > 0 ? (changeFromBase / baselineNw) * 100 : 0;

      // Delta from previous snapshot
      let momDelta = 0;
      let momPct = 0;
      if (idx > 0) {
        const prevNw = arr[idx - 1].netWorth !== undefined ? arr[idx - 1].netWorth : Number(arr[idx - 1].totalNetWorth || 0);
        momDelta = nw - prevNw;
        momPct = prevNw > 0 ? (momDelta / prevNw) * 100 : 0;
      }

      // Format short label for X-Axis
      let shortName = s.dateString || s.date || 'Snap';
      if (s.dateString) {
        const parts = s.dateString.split(' ');
        if (parts.length >= 2) {
          shortName = `${parts[0].slice(0, 3)} '${parts[1].slice(-2)}`;
        } else {
          shortName = s.dateString.slice(0, 6);
        }
      } else if (s.date) {
        const d = new Date(s.date);
        shortName = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }

      const isPeak = analytics.peakSnapshot?.id === s.id;
      const isLowest = analytics.lowestSnapshot?.id === s.id;

      return {
        id: s.id,
        name: shortName,
        fullName: s.dateString || s.date || 'Snapshot',
        fullDate: s.date || s.timestamp.slice(0, 10),
        label: s.label || s.snapshotType || 'Snapshot',
        snapshotType: s.snapshotType || 'monthly',
        netWorth: nw,
        assets: ast,
        liabilities: liab,
        liquid,
        investments,
        receivables,
        changeFromBase,
        changePctFromBase,
        momDelta,
        momPct,
        note: s.note,
        isPeak,
        isLowest,
      };
    });
  }, [filteredSnapshots, analytics]);

  return (
    <FinancialCard
      id="afinity-historical-net-worth-trend-card"
      className={cn('p-4 sm:p-6 overflow-hidden space-y-5 bg-slate-900/90 border-slate-800', className)}
    >
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-white font-heading flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Historical Net-Worth Trend
            </h3>
            <Badge
              variant={analytics.isPositive ? 'success' : 'danger'}
              size="sm"
              className="font-mono text-xs font-bold"
            >
              {analytics.isPositive ? '+' : ''}{formatPercentage(analytics.growthPercentage, true)} ({activeTimeframe})
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing growth across stored valuation snapshots over {activeTimeframe === 'ALL' ? 'all recorded history' : `the last ${activeTimeframe}`} ({chartData.length} data points)
          </p>
        </div>

        {/* Timeframe Switcher: 6M, 12M, 24M, ALL */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
            {(['6M', '12M', '24M', 'ALL'] as TrendTimeframe[]).map((tf) => {
              const isActive = activeTimeframe === tf;
              return (
                <button
                  key={tf}
                  type="button"
                  id={`trend-timeframe-btn-${tf.toLowerCase()}`}
                  onClick={() => handleTimeframeChange(tf)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl font-heading font-bold text-xs transition-all duration-200 cursor-pointer select-none min-h-[36px] flex items-center justify-center',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-950/60 scale-[1.03]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )}
                >
                  {tf === '12M' ? '12M (1Y)' : tf === '24M' ? '24M (2Y)' : tf}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Key Growth & Performance KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
        {/* Starting Net Worth */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 font-heading">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Starting Valuation ({analytics.startSnapshot?.dateString || analytics.startSnapshot?.date || `${activeTimeframe} ago`})
          </span>
          <p className="text-sm sm:text-base font-bold font-mono text-slate-200">
            {formatRupee(analytics.startNetWorth)}
          </p>
          <span className="text-[10px] text-slate-500">Baseline level</span>
        </div>

        {/* Current / Ending Net Worth */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 font-heading">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Current Valuation ({analytics.endSnapshot?.dateString || 'Today'})
          </span>
          <p className="text-sm sm:text-base font-bold font-mono text-cyan-300">
            {formatRupee(analytics.endNetWorth)}
          </p>
          <span className="text-[10px] text-cyan-500/80 font-medium">Live financial position</span>
        </div>

        {/* Net Growth (Absolute & %) */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 font-heading">
            {analytics.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />}
            Net Worth Growth ({activeTimeframe})
          </span>
          <p className={cn('text-sm sm:text-base font-bold font-mono flex items-center gap-1', analytics.isPositive ? 'text-emerald-400' : 'text-rose-400')}>
            {analytics.isPositive ? '+' : ''}{formatRupee(analytics.growthAmount)}
          </p>
          <span className={cn('text-[10px] font-mono font-semibold', analytics.isPositive ? 'text-emerald-500' : 'text-rose-500')}>
            {analytics.isPositive ? '▲' : '▼'} {formatPercentage(analytics.growthPercentage, true)}
          </span>
        </div>

        {/* Annualized Compound Growth Rate (CAGR) */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 font-heading">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Annualized Rate (CAGR)
          </span>
          <p className="text-sm sm:text-base font-bold font-mono text-amber-300">
            {analytics.cagr >= 0 ? '+' : ''}{formatPercentage(analytics.cagr, true)} <span className="text-xs font-normal text-amber-400/70">/ yr</span>
          </p>
          <span className="text-[10px] text-slate-500">
            Peak: {formatRupee(analytics.peakSnapshot?.netWorth ?? 0, { compact: true })}
          </span>
        </div>
      </div>

      {/* 3. Secondary Controls: View Modes, Curve Style, Reference Guides */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* View Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('net_worth')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-bold font-heading transition-all cursor-pointer select-none',
              viewMode === 'net_worth'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Net Worth Growth
          </button>
          <button
            type="button"
            onClick={() => setViewMode('assets_vs_debt')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-bold font-heading transition-all cursor-pointer select-none',
              viewMode === 'assets_vs_debt'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Net Worth vs Assets & Debt
          </button>
          <button
            type="button"
            onClick={() => setViewMode('asset_classes')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-bold font-heading transition-all cursor-pointer select-none hidden sm:block',
              viewMode === 'asset_classes'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Asset Classes
          </button>
        </div>

        {/* Reference Line and Data Table Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Reference Line Filter */}
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="text-[11px]">Ref:</span>
            <select
              value={referenceLine}
              onChange={(e) => setReferenceLine(e.target.value as ReferenceLineOption)}
              className="bg-transparent text-slate-300 font-medium font-heading focus:outline-none cursor-pointer text-xs"
            >
              <option value="none" className="bg-slate-900 text-slate-300">None</option>
              <option value="average" className="bg-slate-900 text-slate-300">Period Average</option>
              <option value="baseline" className="bg-slate-900 text-slate-300">Baseline Starting</option>
              <option value="peak" className="bg-slate-900 text-slate-300">Peak Milestone</option>
            </select>
          </div>

          {/* Toggle Background Grid Lines */}
          <button
            type="button"
            id="toggle-chart-grid-lines-btn"
            onClick={toggleGrid}
            className={cn(
              'px-2.5 py-1 rounded-xl border transition-all font-heading text-xs flex items-center gap-1.5 cursor-pointer select-none',
              showGrid
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-xs'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
            )}
            title={showGrid ? 'Hide background grid lines for a cleaner display' : 'Show background grid lines for aligned reading'}
            aria-label={showGrid ? 'Hide background grid lines' : 'Show background grid lines'}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid: {showGrid ? 'On' : 'Off'}</span>
          </button>

          {/* Toggle Curve Interpolation */}
          <button
            type="button"
            onClick={() => setCurveType(curveType === 'monotone' ? 'linear' : 'monotone')}
            className="px-2.5 py-1 rounded-xl bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all font-heading text-xs cursor-pointer select-none"
            title="Toggle smooth spline vs straight linear curve"
          >
            {curveType === 'monotone' ? 'Smooth Curve' : 'Linear Line'}
          </button>

          {/* View Snapshot Log Table Toggle */}
          <button
            type="button"
            onClick={() => setShowDataTable(!showDataTable)}
            className={cn(
              'px-2.5 py-1 rounded-xl border transition-all font-heading text-xs flex items-center gap-1 cursor-pointer select-none',
              showDataTable
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table Log</span>
            {showDataTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 4. Recharts Interactive Trend Line & Area Visualization */}
      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2 border border-dashed border-slate-800 rounded-2xl">
          <Layers className="w-8 h-8 text-slate-500" />
          <p className="text-sm font-medium text-slate-300">No snapshot history found for {activeTimeframe}</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Record regular monthly or milestone snapshots to build your wealth timeline.
          </p>
        </div>
      ) : (
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'net_worth' ? (
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 4 }}>
                <defs>
                  <linearGradient id="nwTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />}

                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatRupee(val, { compact: true })}
                  domain={['auto', 'auto']}
                />

                <Tooltip content={<ComparisonChartTooltip activeTimeframe={activeTimeframe} viewMode={viewMode} />} />

                {/* Reference Lines */}
                {referenceLine === 'average' && (
                  <ReferenceLine
                    y={analytics.averageNetWorth}
                    stroke="#06b6d4"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                    label={{
                      value: `Avg: ${formatRupee(analytics.averageNetWorth, { compact: true })}`,
                      fill: '#06b6d4',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                )}
                {referenceLine === 'baseline' && (
                  <ReferenceLine
                    y={analytics.startNetWorth}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                    label={{
                      value: `Start: ${formatRupee(analytics.startNetWorth, { compact: true })}`,
                      fill: '#f59e0b',
                      fontSize: 10,
                      position: 'insideBottomRight',
                    }}
                  />
                )}
                {referenceLine === 'peak' && analytics.peakSnapshot && (
                  <ReferenceLine
                    y={analytics.peakSnapshot.netWorth}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                    label={{
                      value: `Peak: ${formatRupee(analytics.peakSnapshot.netWorth, { compact: true })}`,
                      fill: '#10b981',
                      fontSize: 10,
                      position: 'insideTopLeft',
                    }}
                  />
                )}

                <Area
                  type={curveType}
                  dataKey="netWorth"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#nwTrendGradient)"
                  isAnimationActive={true}
                  animationDuration={1000}
                  dot={renderComparisonCustomDot}
                  activeDot={{
                    r: 6,
                    fill: '#06b6d4',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            ) : viewMode === 'assets_vs_debt' ? (
              <LineChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 4 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />}

                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatRupee(val, { compact: true })}
                />

                <Tooltip content={<ComparisonChartTooltip activeTimeframe={activeTimeframe} viewMode={viewMode} />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                  formatter={(value) => <span className="text-slate-300 font-medium font-heading">{value}</span>}
                />

                <Line
                  name="Total Assets"
                  type={curveType}
                  dataKey="assets"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />

                <Line
                  name="Net Worth"
                  type={curveType}
                  dataKey="netWorth"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={renderComparisonCustomDot}
                  activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                />

                <Line
                  name="Total Liabilities (Dues)"
                  type={curveType}
                  dataKey="liabilities"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: '#f43f5e' }}
                  activeDot={{ r: 4, fill: '#f43f5e', stroke: '#fff', strokeWidth: 1.5 }}
                />
              </LineChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 4 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />}

                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatRupee(val, { compact: true })}
                />

                <Tooltip content={<ComparisonChartTooltip activeTimeframe={activeTimeframe} viewMode={viewMode} />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                  formatter={(value) => <span className="text-slate-300 font-medium font-heading">{value}</span>}
                />

                <Line
                  name="Net Worth"
                  type={curveType}
                  dataKey="netWorth"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#06b6d4' }}
                />

                <Line
                  name="Investments"
                  type={curveType}
                  dataKey="investments"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#a855f7' }}
                />

                <Line
                  name="Cash & Bank Funds"
                  type={curveType}
                  dataKey="liquid"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#3b82f6' }}
                />

                <Line
                  name="Liabilities"
                  type={curveType}
                  dataKey="liabilities"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 2, fill: '#f43f5e' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* 5. Interactive Legend & Context Information */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-medium">Net Worth</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-medium">Assets</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-slate-300 font-medium">Debt</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <Award className="w-3.5 h-3.5" />
            <span>Peak Milestone Point</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Span: {analytics.startSnapshot?.dateString || analytics.startSnapshot?.date || 'Start'} → {analytics.endSnapshot?.dateString || 'Now'} ({analytics.monthsSpan}M)
        </div>
      </div>

      {/* 6. Expandable Period Snapshot Historical Log Table */}
      <AnimatePresence>
        {showDataTable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden pt-2"
          >
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-heading flex items-center gap-1.5">
                  <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                  Historical Snapshot Data Points ({activeTimeframe})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {chartData.length} records chronologically ordered
                </span>
              </div>

              <div className="overflow-x-auto max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 font-heading sticky top-0 backdrop-blur-sm">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Snapshot</th>
                      <th className="py-2 px-3 font-semibold">Type</th>
                      <th className="py-2 px-3 font-semibold text-right">Net Worth</th>
                      <th className="py-2 px-3 font-semibold text-right">Step Delta</th>
                      <th className="py-2 px-3 font-semibold text-right">Assets</th>
                      <th className="py-2 px-3 font-semibold text-right">Liabilities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {chartData.map((item) => (
                      <tr
                        key={item.id}
                        className={cn(
                          'hover:bg-slate-900/50 transition-colors',
                          item.isPeak ? 'bg-amber-500/5 font-semibold' : ''
                        )}
                      >
                        <td className="py-2 px-3 font-sans font-medium text-slate-200">
                          <div className="flex items-center gap-1.5">
                            {item.isPeak && <Award className="w-3 h-3 text-amber-400 shrink-0" />}
                            <span>{item.fullName}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-sans">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-cyan-300 font-bold">
                          {formatRupee(item.netWorth)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {item.momDelta === 0 ? (
                            <span className="text-slate-500">-</span>
                          ) : (
                            <span className={item.momDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {item.momDelta > 0 ? '+' : ''}{formatRupee(item.momDelta)}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400">
                          {formatRupee(item.assets)}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-400">
                          {formatRupee(item.liabilities)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FinancialCard>
  );
};
