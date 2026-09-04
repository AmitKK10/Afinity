import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Calendar, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { FinancialSnapshot, TimePeriod } from '../../types';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { FinancialCard } from '../ui/FinancialCard';
import { cn } from '../../utils/cn';

interface InvestmentTrendChartProps {
  snapshots: FinancialSnapshot[];
  currentPortfolioValue?: number;
  className?: string;
}

const InvestmentTrendTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-2xl bg-[#0d172b]/95 p-3.5 border border-cyan-500/40 shadow-2xl backdrop-blur-md text-xs min-w-[190px]">
        <p className="font-bold text-white mb-2 font-heading pb-1.5 border-b border-slate-800 flex items-center justify-between">
          <span>{data.fullName}</span>
          <span className="text-[10px] text-cyan-400 font-mono">Valuation</span>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-cyan-300 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Portfolio Value:
            </span>
            <span className="tabular-nums font-mono text-sm">
              {formatRupee(data.investmentValue)}
            </span>
          </div>
          {data.netWorth !== undefined && (
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Total Net Worth:</span>
              <span className="font-mono">{formatRupee(data.netWorth)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const InvestmentTrendChart: React.FC<InvestmentTrendChartProps> = ({
  snapshots,
  currentPortfolioValue,
  className,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('ALL');

  // Filter snapshots based on selected period
  const filteredSnapshots = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    
    // Sort chronological
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.timestamp || a.dateString).getTime() - new Date(b.timestamp || b.dateString).getTime()
    );

    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    let cutoffDays = Infinity;
    if (selectedPeriod === '1M') cutoffDays = 30;
    else if (selectedPeriod === '3M') cutoffDays = 90;
    else if (selectedPeriod === '6M') cutoffDays = 180;
    else if (selectedPeriod === '1Y') cutoffDays = 365;

    if (cutoffDays === Infinity) return sorted;

    const cutoffTime = now - cutoffDays * dayMs;
    const filtered = sorted.filter((s) => new Date(s.timestamp || s.dateString).getTime() >= cutoffTime);

    // If filtered is empty or only 1 point, return at least the last available points
    if (filtered.length === 0) {
      return sorted.slice(-3);
    }
    return filtered;
  }, [snapshots, selectedPeriod]);

  // Build chart dataset
  const chartData = useMemo(() => {
    if (filteredSnapshots.length === 0) {
      if (currentPortfolioValue !== undefined) {
        return [
          {
            name: 'Current',
            fullName: 'Live Valuation',
            investmentValue: currentPortfolioValue,
          },
        ];
      }
      return [];
    }

    return filteredSnapshots.map((s) => {
      const parts = s.dateString.split(' ');
      const shortName = parts.length >= 2 ? `${parts[1]} ${parts[0]}` : s.dateString;
      return {
        name: shortName,
        fullName: s.dateString,
        investmentValue: Number(s.investmentTotal || 0),
        netWorth: Number(s.totalNetWorth || 0),
      };
    });
  }, [filteredSnapshots, currentPortfolioValue]);

  // Calculate start to end change in the period
  const periodGrowth = useMemo(() => {
    if (chartData.length < 2) return { amount: 0, percentage: 0, isPositive: true };
    const first = chartData[0].investmentValue;
    const last = chartData[chartData.length - 1].investmentValue;
    const diff = last - first;
    const pct = first > 0 ? (diff / first) * 100 : 0;
    return {
      amount: diff,
      percentage: pct,
      isPositive: diff >= 0,
    };
  }, [chartData]);

  const periods: TimePeriod[] = ['1M', '3M', '6M', '1Y', 'ALL'];

  return (
    <FinancialCard
      id="investment-portfolio-trend-card"
      className={cn('p-4 sm:p-5 overflow-hidden space-y-4', className)}
    >
      {/* Header: Title + Period Selector + Growth Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-bold text-white font-heading">
              Investment Portfolio Trend
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical portfolio valuation progression based on captured snapshots
          </p>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 self-start sm:self-center">
          {periods.map((period) => (
            <button
              key={period}
              type="button"
              id={`trend-period-${period}`}
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer font-heading min-h-[32px]',
                selectedPeriod === period
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Period Valuation Change Metric */}
      {chartData.length >= 2 && (
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium">Period Valuation Change:</span>
          <div
            className={cn(
              'inline-flex items-center gap-1 font-bold font-mono',
              periodGrowth.isPositive ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {periodGrowth.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>
              {periodGrowth.isPositive ? '+' : ''}
              {formatRupee(periodGrowth.amount)}
            </span>
            <span className="text-[11px] font-normal">
              ({periodGrowth.isPositive ? '+' : ''}
              {formatPercentage(periodGrowth.percentage, true)})
            </span>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-56 sm:h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="investmentValuationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />

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
              tickFormatter={(value) => formatRupee(value, { compact: true })}
            />

            <Tooltip content={<InvestmentTrendTooltip />} />

            <Area
              type="monotone"
              dataKey="investmentValue"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#investmentValuationGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </FinancialCard>
  );
};
