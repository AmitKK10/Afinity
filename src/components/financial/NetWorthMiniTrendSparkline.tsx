import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { FinancialSnapshot } from '../../types';
import { generate30DayNetWorthTrajectory, TrajectoryPoint } from '../../utils/trajectoryUtils';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface NetWorthMiniTrendSparklineProps {
  netWorth: number;
  snapshots?: FinancialSnapshot[];
  totalAssets?: number;
  totalLiabilities?: number;
  variant?: 'hero-inline' | 'card' | 'compact';
  showStats?: boolean;
  height?: number;
  className?: string;
}

const SparklineTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data: TrajectoryPoint = payload[0].payload;
    return (
      <div className="rounded-xl bg-slate-950/95 dark:bg-[#070d19]/95 p-2.5 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs min-w-[150px] pointer-events-none z-50">
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-cyan-400" />
            {data.displayDate}
          </span>
          <span className="font-mono text-slate-500">Day {data.dayIndex + 1}/30</span>
        </div>
        <div className="pt-1.5 space-y-1">
          <div className="flex items-center justify-between gap-2 font-mono">
            <span className="text-[11px] text-slate-300">Net Worth:</span>
            <span className="text-xs font-bold text-white tabular-nums">
              {formatRupee(data.netWorth)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
            <span className="text-slate-400">30D Shift:</span>
            <span
              className={cn(
                'font-semibold flex items-center',
                data.changeFromStart >= 0 ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {data.changeFromStart >= 0 ? '+' : ''}
              {formatRupee(data.changeFromStart)} ({formatPercentage(data.changePctFromStart, true)})
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const NetWorthMiniTrendSparkline: React.FC<NetWorthMiniTrendSparklineProps> = ({
  netWorth,
  snapshots = [],
  totalAssets = 0,
  totalLiabilities = 0,
  variant = 'hero-inline',
  showStats = true,
  height,
  className,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TrajectoryPoint | null>(null);

  const trajectory = useMemo(() => {
    return generate30DayNetWorthTrajectory(snapshots, netWorth, totalAssets, totalLiabilities);
  }, [snapshots, netWorth, totalAssets, totalLiabilities]);

  const { points, startNetWorth, change30D, changePct30D, minNetWorth, maxNetWorth, isPositive } = trajectory;

  // Derive dynamic height based on variant
  const chartHeight = height || (variant === 'compact' ? 44 : variant === 'hero-inline' ? 72 : 110);

  // Gradient IDs for unique SVG isolation
  const gradientId = useMemo(() => `nwSparklineGrad_${Math.random().toString(36).substring(2, 9)}`, []);

  const strokeColor = isPositive ? '#06b6d4' : '#f43f5e';
  const startColor = isPositive ? '#06b6d4' : '#f43f5e';
  const stopColor = isPositive ? '#10b981' : '#fb7185';

  if (variant === 'compact') {
    return (
      <div id="net-worth-sparkline-compact" className={cn('relative w-full overflow-hidden', className)}>
        <div style={{ height: chartHeight }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
              onMouseMove={(e: any) => {
                if (e?.activePayload?.[0]?.payload) {
                  setHoveredPoint(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={startColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stopColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} hide />
              <Tooltip content={<SparklineTooltip />} isAnimationActive={false} />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: strokeColor,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div
      id="net-worth-sparkline-container"
      className={cn(
        'relative rounded-2xl overflow-hidden transition-all',
        variant === 'hero-inline'
          ? 'bg-slate-100/80 dark:bg-[#080e1b]/70 border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4'
          : 'bg-white dark:bg-[#0d1629]/90 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm',
        className
      )}
    >
      {/* Sparkline Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0',
              isPositive
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            )}
          >
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-heading">
                30-Day Net Worth Trajectory
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold font-mono border border-cyan-500/20 hidden sm:inline-block">
                SPARKLINE
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
              {hoveredPoint
                ? `${hoveredPoint.displayDate}: ${formatRupee(hoveredPoint.netWorth)}`
                : `${points[0]?.displayDate} → Today`}
            </span>
          </div>
        </div>

        {/* 30D Delta Pill */}
        <div className="flex items-center gap-1.5 text-right">
          <div
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono border shadow-xs',
              isPositive
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {formatRupee(change30D)} ({formatPercentage(changePct30D, true)})
            </span>
          </div>
        </div>
      </div>

      {/* Sparkline Canvas */}
      <div style={{ height: chartHeight }} className="w-full relative mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
            onMouseMove={(e: any) => {
              if (e?.activePayload?.[0]?.payload) {
                setHoveredPoint(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={startColor} stopOpacity={0.45} />
                <stop offset="90%" stopColor={stopColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin - 1500', 'dataMax + 1500']} hide />
            <XAxis dataKey="shortDay" hide />
            <Tooltip content={<SparklineTooltip />} isAnimationActive={false} />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke={strokeColor}
              strokeWidth={2.2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 4.5,
                fill: strokeColor,
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Benchmarks / 30-Day Context Strip */}
      {showStats && (
        <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70 grid grid-cols-3 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex flex-col">
            <span className="text-slate-400 dark:text-slate-500 font-sans text-[9px] uppercase tracking-wider">30D Baseline</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {formatRupee(startNetWorth)}
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-slate-400 dark:text-slate-500 font-sans text-[9px] uppercase tracking-wider">30D Range</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums truncate">
              {formatRupee(minNetWorth)} – {formatRupee(maxNetWorth)}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-400 dark:text-slate-500 font-sans text-[9px] uppercase tracking-wider">Today's Vault</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
              {formatRupee(netWorth)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
