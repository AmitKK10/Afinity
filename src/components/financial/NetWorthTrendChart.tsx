import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Sparkles, Activity } from 'lucide-react';
import { FinancialSnapshot } from '../../types';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { generate30DayNetWorthTrajectory } from '../../utils/trajectoryUtils';
import { FinancialCard } from '../ui/FinancialCard';
import { cn } from '../../utils/cn';

interface NetWorthTrendChartProps {
  snapshots: FinancialSnapshot[];
  currentNetWorth?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  className?: string;
}

const NetWorthTrendTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-2xl bg-white dark:bg-[#0d1629]/95 p-3 border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-2xl backdrop-blur-md text-xs min-w-[170px]">
        <p className="font-bold text-slate-900 dark:text-white mb-1.5 font-heading pb-1 border-b border-slate-200 dark:border-slate-800">
          {data.fullName}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-300 font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
              Net Worth:
            </span>
            <span className="tabular-nums font-bold">
              {formatRupee(data.netWorth)}
            </span>
          </div>
          {data.delta !== undefined && (
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">30D Shift:</span>
              <span className={data.delta >= 0 ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>
                {data.delta >= 0 ? '+' : ''}{formatRupee(data.delta)} ({formatPercentage(data.deltaPct, true)})
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Assets:
            </span>
            <span className="tabular-nums">{formatRupee(data.assets)}</span>
          </div>
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" />
              Liabilities:
            </span>
            <span className="tabular-nums">
              {formatRupee(data.liabilities)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const NetWorthTrendChart: React.FC<NetWorthTrendChartProps> = ({
  snapshots,
  currentNetWorth,
  totalAssets,
  totalLiabilities,
  className,
}) => {
  const [viewMode, setViewMode] = useState<'30d' | 'all'>('30d');

  // 30-day daily trajectory dataset
  const trajectory30D = useMemo(() => {
    const nw = currentNetWorth ?? (snapshots.length > 0 ? (snapshots[snapshots.length - 1].totalNetWorth ?? 482875) : 482875);
    return generate30DayNetWorthTrajectory(snapshots, nw, totalAssets, totalLiabilities);
  }, [snapshots, currentNetWorth, totalAssets, totalLiabilities]);

  // All-time monthly snapshots dataset
  const allTimeData = useMemo(() => {
    return snapshots.map((s) => ({
      name: s.dateString ? s.dateString.split(' ')[0] : s.date?.slice(5) || 'Snap',
      fullName: s.dateString || s.date || 'Snapshot',
      netWorth: s.totalNetWorth ?? s.netWorth ?? 0,
      assets: s.totalAssets ?? 0,
      liabilities: s.totalLiabilities ?? 0,
    }));
  }, [snapshots]);

  const chartData = useMemo(() => {
    if (viewMode === '30d') {
      return trajectory30D.points.map((p) => ({
        name: p.displayDate,
        fullName: `${p.displayDate}, 2026`,
        netWorth: p.netWorth,
        assets: p.assets,
        liabilities: p.liabilities,
        delta: p.changeFromStart,
        deltaPct: p.changePctFromStart,
      }));
    }
    return allTimeData;
  }, [viewMode, trajectory30D, allTimeData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <FinancialCard
        title="Net Worth Growth Trajectory"
        subtitle={
          viewMode === '30d'
            ? '30-day continuous net worth trajectory based on real-time movements'
            : 'All-time historical progression and growth across recording milestones'
        }
        icon={<Activity className="w-5 h-5 text-cyan-500" />}
        action={
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-heading">
            <button
              type="button"
              onClick={() => setViewMode('30d')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer',
                viewMode === '30d'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              30D Trajectory
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer',
                viewMode === 'all'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              All Snapshots
            </button>
          </div>
        }
      >
        <div className="w-full h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="assetsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatRupee(value, { compact: true })}
              />

              <Tooltip content={<NetWorthTrendTooltip />} />

              <Area
                type="monotone"
                dataKey="assets"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#assetsGrad)"
                isAnimationActive={true}
                animationDuration={900}
                animationEasing="ease-out"
              />

              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#06b6d4"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#netWorthGrad)"
                isAnimationActive={true}
                animationDuration={1100}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </FinancialCard>
    </motion.div>
  );
};

