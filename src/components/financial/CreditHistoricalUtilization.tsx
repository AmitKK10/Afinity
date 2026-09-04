/**
 * CreditHistoricalUtilization.tsx — Historical Credit Utilization Analytics (Step 6D)
 * Displays credit utilization trends across 30D, 90D, 6M, and 1Y based on snapshot history.
 * Refactored for full mobile responsiveness with adaptive date formatting and Recharts visualization.
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { FinancialSnapshot, CreditCard, CreditLimitGroup } from '../../types';
import {
  calculateTotalCreditLimit,
  getCreditUtilizationInfo,
} from '../../services/calculations';
import { formatRupee } from '../../utils/formatters';

interface CreditHistoricalUtilizationProps {
  snapshots: FinancialSnapshot[];
  creditCards: CreditCard[];
  creditLimitGroups: CreditLimitGroup[];
  currentUtilization: number;
}

interface TrendPoint {
  shortLabel: string;
  fullLabel: string;
  utilization: number;
  dues: number;
  timestamp: number;
}

export const CreditHistoricalUtilization: React.FC<CreditHistoricalUtilizationProps> = ({
  snapshots,
  creditCards,
  creditLimitGroups,
  currentUtilization,
}) => {
  const [timeframe, setTimeframe] = useState<'30D' | '90D' | '6M' | '1Y'>('30D');
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');

  const totalLimit = useMemo(
    () => calculateTotalCreditLimit(creditCards, creditLimitGroups),
    [creditCards, creditLimitGroups]
  );

  const liveDues = useMemo(() => {
    return creditCards
      .filter((c) => c.status === 'active')
      .reduce(
        (acc, c) =>
          acc +
          Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0),
        0
      );
  }, [creditCards]);

  // Helper to format clean snapshot date labels
  const formatSnapshotDate = (
    s: FinancialSnapshot,
    tf: '30D' | '90D' | '6M' | '1Y'
  ): { shortLabel: string; fullLabel: string; timestamp: number } => {
    const isNow = Boolean(s.dateString && s.dateString.toLowerCase().includes('(now)'));

    let dt: Date | null = null;
    if (s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date)) {
      const [y, m, day] = s.date.split('-').map(Number);
      dt = new Date(y, m - 1, day);
    } else if (s.timestamp) {
      const parsed = new Date(s.timestamp);
      if (!isNaN(parsed.getTime())) dt = parsed;
    }

    if (dt && !isNaN(dt.getTime())) {
      const ts = dt.getTime();
      if (isNow) {
        return {
          shortLabel: 'Today',
          fullLabel: `${dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (Live)`,
          timestamp: ts,
        };
      }

      if (tf === '30D' || tf === '90D') {
        return {
          shortLabel: dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          fullLabel: dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          timestamp: ts,
        };
      }

      return {
        shortLabel: dt.toLocaleDateString('en-IN', { month: 'short' }),
        fullLabel: dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        timestamp: ts,
      };
    }

    // Fallback for monthly string labels
    const clean = (s.dateString || s.date || 'Snapshot')
      .replace(/\s*\(now\)/i, '')
      .trim();

    return {
      shortLabel: isNow ? 'Today' : clean,
      fullLabel: s.dateString || clean,
      timestamp: 0,
    };
  };

  // Compute trend points from snapshots
  const trendData = useMemo<TrendPoint[]>(() => {
    const now = new Date().getTime();
    const daysMap = {
      '30D': 30,
      '90D': 90,
      '6M': 180,
      '1Y': 365,
    };
    const cutoff = now - daysMap[timeframe] * 24 * 60 * 60 * 1000;

    const filtered = (snapshots || [])
      .filter((s) => {
        const t = new Date(s.timestamp || s.date || s.dateString).getTime();
        return !isNaN(t) && t >= cutoff;
      })
      .sort((a, b) => {
        const tA = new Date(a.timestamp || a.date || a.dateString).getTime();
        const tB = new Date(b.timestamp || b.date || b.dateString).getTime();
        return tA - tB;
      });

    // Deduplicate snapshots on the same date, keeping latest
    const uniqueMap = new Map<string, FinancialSnapshot>();
    for (const s of filtered) {
      const key = s.date || s.dateString || s.timestamp;
      uniqueMap.set(key, s);
    }
    const dedupedSnapshots = Array.from(uniqueMap.values());

    const points: TrendPoint[] = dedupedSnapshots.map((s) => {
      const dues = Number(
        s.totalCreditCardDue ??
          s.creditCardTotal ??
          (s as any).creditCardDues ??
          s.categoryBreakdown?.liabilities?.creditCards ??
          s.totalLiabilities ??
          0
      );
      const util =
        totalLimit > 0
          ? Math.min(100, Math.round(((dues / totalLimit) * 100) * 10) / 10)
          : 0;
      const { shortLabel, fullLabel, timestamp } = formatSnapshotDate(s, timeframe);

      return {
        shortLabel,
        fullLabel,
        utilization: util,
        dues,
        timestamp,
      };
    });

    // Ensure live current status is represented if points are sparse or last snapshot is not today
    if (points.length === 0) {
      const baseLabel =
        timeframe === '30D'
          ? '30d ago'
          : timeframe === '90D'
          ? '90d ago'
          : timeframe === '6M'
          ? '6m ago'
          : '1y ago';
      return [
        {
          shortLabel: baseLabel,
          fullLabel: `${baseLabel} Baseline`,
          utilization: currentUtilization,
          dues: liveDues,
          timestamp: cutoff,
        },
        {
          shortLabel: 'Today',
          fullLabel: 'Live Current Exposure',
          utilization: currentUtilization,
          dues: liveDues,
          timestamp: now,
        },
      ];
    }

    if (points.length === 1) {
      const baseLabel =
        timeframe === '30D'
          ? '30d ago'
          : timeframe === '90D'
          ? '90d ago'
          : timeframe === '6M'
          ? '6m ago'
          : '1y ago';
      points.unshift({
        shortLabel: baseLabel,
        fullLabel: `${baseLabel} Baseline`,
        utilization: points[0].utilization,
        dues: points[0].dues,
        timestamp: cutoff,
      });
    }

    return points;
  }, [snapshots, timeframe, currentUtilization, liveDues, totalLimit]);

  const avgUtilization = useMemo(() => {
    if (trendData.length === 0) return currentUtilization;
    const sum = trendData.reduce((acc, d) => acc + d.utilization, 0);
    return Math.round((sum / trendData.length) * 10) / 10;
  }, [trendData, currentUtilization]);

  const peakUtilization = useMemo(() => {
    if (trendData.length === 0) return currentUtilization;
    return Math.max(...trendData.map((d) => d.utilization), currentUtilization);
  }, [trendData, currentUtilization]);

  const periodGrowth = useMemo(() => {
    if (trendData.length < 2) return null;
    const first = trendData[0].utilization;
    const last = trendData[trendData.length - 1].utilization;
    const diff = Math.round((last - first) * 10) / 10;
    return {
      amount: diff,
      isIncrease: diff > 0,
      isZero: diff === 0,
    };
  }, [trendData]);

  const currentInfo = getCreditUtilizationInfo(currentUtilization);
  const avgInfo = getCreditUtilizationInfo(avgUtilization);

  // Theme styling for the chart based on exposure health
  const chartColor = useMemo(() => {
    if (currentUtilization < 30) {
      return {
        primary: '#10b981',
        fill: '#10b981',
        name: 'emerald',
      };
    }
    if (currentUtilization <= 50) {
      return {
        primary: '#f59e0b',
        fill: '#f59e0b',
        name: 'amber',
      };
    }
    if (currentUtilization <= 75) {
      return {
        primary: '#f97316',
        fill: '#f97316',
        name: 'orange',
      };
    }
    return {
      primary: '#f43f5e',
      fill: '#f43f5e',
      name: 'rose',
    };
  }, [currentUtilization]);

  const yAxisMax = useMemo(() => {
    return Math.max(35, Math.ceil((peakUtilization + 5) / 10) * 10);
  }, [peakUtilization]);

  // Mobile-friendly custom tooltip component
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TrendPoint = payload[0].payload;
      const pointInfo = getCreditUtilizationInfo(data.utilization);
      return (
        <div className="p-2.5 rounded-xl bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-md text-xs space-y-1 z-30">
          <div className="font-bold text-slate-200 font-heading text-[11px]">
            {data.fullLabel}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Utilization:</span>
            <span className="font-mono font-bold text-white">{data.utilization}%</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pointInfo.badgeClass}`}>
              {pointInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Dues:</span>
            <span className="font-mono font-semibold text-rose-300">
              {formatRupee(data.dues)}
            </span>
          </div>
          {totalLimit > 0 && (
            <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-800">
              Total Pool: {formatRupee(totalLimit)}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="credit-historical-utilization"
      className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4"
    >
      {/* Header: Title + Subtitle + Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            <span>Credit Utilization Trend</span>
          </h3>
          <p className="text-xs text-slate-400">
            Portfolio credit limit exposure history over selected horizon
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto text-xs">
          {(['30D', '90D', '6M', '1Y'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={`py-1 px-2.5 rounded-lg font-bold font-heading transition-all cursor-pointer ${
                timeframe === t
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row (2x2 on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">Current Exposure</span>
          <div className="text-base font-extrabold text-white font-mono mt-0.5">
            {currentUtilization}%
          </div>
          <span className={`text-[10px] font-bold ${currentInfo.textClass}`}>
            {currentInfo.label}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">Average ({timeframe})</span>
          <div className="text-base font-extrabold text-slate-200 font-mono mt-0.5">
            {avgUtilization}%
          </div>
          <span className={`text-[10px] font-bold ${avgInfo.textClass}`}>
            {avgInfo.label}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">Peak Recorded</span>
          <div className="text-base font-extrabold text-amber-300 font-mono mt-0.5">
            {peakUtilization}%
          </div>
          <span className="text-[10px] text-slate-500">Highest ratio</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">Credit Pool</span>
          <div className="text-base font-extrabold text-slate-100 font-mono mt-0.5">
            {formatRupee(totalLimit)}
          </div>
          <span className="text-[10px] text-emerald-400">Total Deduplicated</span>
        </div>
      </div>

      {/* Responsive Visual Chart Area */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 space-y-2">
        {/* Sub-header: Change over period & View mode selector (Trend / Bars) */}
        <div className="flex items-center justify-between text-xs px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium text-[11px]">Exposure Progression</span>
            {periodGrowth && !periodGrowth.isZero && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                  periodGrowth.isIncrease
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-emerald-400 bg-emerald-500/10'
                }`}
              >
                {periodGrowth.isIncrease ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>
                  {periodGrowth.isIncrease ? '+' : ''}
                  {periodGrowth.amount}% vs start
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setChartMode('area')}
              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                chartMode === 'area'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trend
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bars
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-44 sm:h-52 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'area' ? (
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="creditUtilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor.primary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartColor.primary} stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />

                <XAxis
                  dataKey="shortLabel"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  minTickGap={22}
                  interval="preserveStartEnd"
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, yAxisMax]}
                  width={34}
                />

                <ReferenceLine
                  y={30}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                  label={{
                    value: '30% Safe',
                    position: 'insideTopRight',
                    fill: '#10b981',
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                />

                <Tooltip content={<CustomChartTooltip />} />

                <Area
                  type="monotone"
                  dataKey="utilization"
                  stroke={chartColor.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#creditUtilGrad)"
                  activeDot={{
                    r: 4,
                    fill: chartColor.primary,
                    stroke: '#0f172a',
                    strokeWidth: 2,
                  }}
                  dot={
                    trendData.length <= 15
                      ? {
                          r: 3,
                          fill: chartColor.primary,
                          stroke: '#0f172a',
                          strokeWidth: 1,
                        }
                      : false
                  }
                />
              </AreaChart>
            ) : (
              <BarChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />

                <XAxis
                  dataKey="shortLabel"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  minTickGap={22}
                  interval="preserveStartEnd"
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, yAxisMax]}
                  width={34}
                />

                <ReferenceLine
                  y={30}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                  label={{
                    value: '30% Safe',
                    position: 'insideTopRight',
                    fill: '#10b981',
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                />

                <Tooltip content={<CustomChartTooltip />} />

                <Bar
                  dataKey="utilization"
                  radius={[4, 4, 0, 0]}
                  fill={chartColor.primary}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Guidelines Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
        <span>
          * Utilization guidelines: &lt;30% Healthy • 30–50% Moderate • 50–75% High • &gt;75% Critical
        </span>
      </div>
    </div>
  );
};

