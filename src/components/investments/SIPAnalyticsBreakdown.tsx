import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  Layers,
  Calendar,
  Sparkles,
  TrendingUp,
  Info,
} from 'lucide-react';
import { SIPRecord } from '../../types';
import { formatRupee } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface SIPAnalyticsBreakdownProps {
  sips: SIPRecord[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

interface FrequencyDataPoint {
  id: string;
  name: string;
  count: number;
  activeCount: number;
  totalOutflow: number;
  monthlyEquivalent: number;
  annualizedOutflow: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const FREQUENCY_COLORS: Record<string, { color: string; badgeBg: string; badgeText: string; badgeBorder: string }> = {
  monthly: {
    color: '#06b6d4', // Cyan 500
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/30',
  },
  quarterly: {
    color: '#6366f1', // Indigo 500
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/30',
  },
  annually: {
    color: '#10b981', // Emerald 500
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
  },
  weekly: {
    color: '#f59e0b', // Amber 500
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/30',
  },
  other: {
    color: '#a855f7', // Purple 500
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/30',
  },
};

const SIPAnalyticsTooltip: React.FC<any> = ({ active, payload, calculationMode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as FrequencyDataPoint & { percentage: string; value: number };
    return (
      <div className="bg-slate-950/95 border border-slate-700/90 p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-bold text-white">{data.name} Outflow</span>
        </div>
        <div className="text-cyan-300 font-mono font-bold text-sm">
          {formatRupee(data.value)}
          <span className="text-[11px] text-slate-400 font-normal ml-1">
            ({data.percentage}%)
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          {data.count} Mandate{data.count > 1 ? 's' : ''} ({data.activeCount} Active)
        </div>
        {calculationMode !== 'monthly' && (
          <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
            Monthly Eq: {formatRupee(data.monthlyEquivalent)}/mo
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const SIPAnalyticsBreakdown: React.FC<SIPAnalyticsBreakdownProps> = ({
  sips,
  isExpanded: controlledExpanded,
  onToggleExpand,
  className,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const [includePaused, setIncludePaused] = useState(false);
  const [calculationMode, setCalculationMode] = useState<'monthly' | 'cycle' | 'annual'>('monthly');

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Filter based on active vs all
  const filteredSIPs = useMemo(() => {
    if (includePaused) return sips;
    return sips.filter((s) => s.sipStatus === 'active');
  }, [sips, includePaused]);

  // Aggregate by frequency
  const frequencyStats = useMemo(() => {
    const map = new Map<string, { count: number; activeCount: number; rawOutflow: number }>();

    // Initialize key frequencies
    map.set('monthly', { count: 0, activeCount: 0, rawOutflow: 0 });
    map.set('quarterly', { count: 0, activeCount: 0, rawOutflow: 0 });
    map.set('annually', { count: 0, activeCount: 0, rawOutflow: 0 });

    filteredSIPs.forEach((sip) => {
      const rawFreq = (sip.frequency || 'monthly').toLowerCase().trim();
      let key = 'other';
      if (rawFreq === 'monthly' || rawFreq === 'month') key = 'monthly';
      else if (rawFreq === 'quarterly' || rawFreq === 'quarter') key = 'quarterly';
      else if (rawFreq === 'annually' || rawFreq === 'yearly' || rawFreq === 'annual') key = 'annually';
      else if (rawFreq === 'weekly' || rawFreq === 'week') key = 'weekly';

      const existing = map.get(key) || { count: 0, activeCount: 0, rawOutflow: 0 };
      existing.count += 1;
      if (sip.sipStatus === 'active') existing.activeCount += 1;
      existing.rawOutflow += Number(sip.amount || 0);
      map.set(key, existing);
    });

    const list: FrequencyDataPoint[] = [];

    const order = ['monthly', 'quarterly', 'annually', 'weekly', 'other'];
    order.forEach((key) => {
      const item = map.get(key);
      if (!item || item.count === 0) return;

      let name = 'Monthly';
      let monthlyMultiplier = 1;
      let annualMultiplier = 12;

      if (key === 'monthly') {
        name = 'Monthly';
        monthlyMultiplier = 1;
        annualMultiplier = 12;
      } else if (key === 'quarterly') {
        name = 'Quarterly';
        monthlyMultiplier = 1 / 3;
        annualMultiplier = 4;
      } else if (key === 'annually') {
        name = 'Annually';
        monthlyMultiplier = 1 / 12;
        annualMultiplier = 1;
      } else if (key === 'weekly') {
        name = 'Weekly';
        monthlyMultiplier = 4.333;
        annualMultiplier = 52;
      } else {
        name = 'Custom / Other';
        monthlyMultiplier = 1;
        annualMultiplier = 12;
      }

      const style = FREQUENCY_COLORS[key] || FREQUENCY_COLORS.other;

      list.push({
        id: key,
        name,
        count: item.count,
        activeCount: item.activeCount,
        totalOutflow: item.rawOutflow,
        monthlyEquivalent: Math.round(item.rawOutflow * monthlyMultiplier),
        annualizedOutflow: Math.round(item.rawOutflow * annualMultiplier),
        color: style.color,
        badgeBg: style.badgeBg,
        badgeText: style.badgeText,
        badgeBorder: style.badgeBorder,
      });
    });

    return list;
  }, [filteredSIPs]);

  // Total sums
  const totalOutflowSum = useMemo(() => {
    if (calculationMode === 'monthly') {
      return frequencyStats.reduce((acc, curr) => acc + curr.monthlyEquivalent, 0);
    }
    if (calculationMode === 'annual') {
      return frequencyStats.reduce((acc, curr) => acc + curr.annualizedOutflow, 0);
    }
    return frequencyStats.reduce((acc, curr) => acc + curr.totalOutflow, 0);
  }, [frequencyStats, calculationMode]);

  // Chart data formatting with recharts
  const chartData = useMemo(() => {
    return frequencyStats.map((item) => {
      const val =
        calculationMode === 'monthly'
          ? item.monthlyEquivalent
          : calculationMode === 'annual'
          ? item.annualizedOutflow
          : item.totalOutflow;

      const pct = totalOutflowSum > 0 ? (val / totalOutflowSum) * 100 : 0;

      return {
        ...item,
        value: val,
        percentage: pct.toFixed(1),
      };
    });
  }, [frequencyStats, calculationMode, totalOutflowSum]);

  if (sips.length === 0) {
    return null;
  }

  return (
    <div
      id="sip-analytics-breakdown"
      className={cn(
        'rounded-3xl bg-slate-900/90 border border-slate-800 transition-all duration-300 shadow-xl overflow-hidden',
        className
      )}
    >
      {/* Header with Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40">
        <button
          type="button"
          id="btn-toggle-sip-analytics"
          onClick={toggleExpand}
          className="flex items-center gap-3 text-left group cursor-pointer"
          aria-expanded={isExpanded}
          aria-controls="sip-analytics-content"
        >
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight font-heading group-hover:text-cyan-300 transition-colors">
                SIP Analytics Breakdown
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                Frequency Outflows
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Outflows distribution by deduction cadence (Monthly, Quarterly, Annually)
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {isExpanded && (
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                id="btn-mode-monthly"
                onClick={() => setCalculationMode('monthly')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px] font-mono',
                  calculationMode === 'monthly'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Normalize all frequencies into a monthly budget outflow"
              >
                Monthly Normalized
              </button>
              <button
                type="button"
                id="btn-mode-cycle"
                onClick={() => setCalculationMode('cycle')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px] font-mono',
                  calculationMode === 'cycle'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Per-installment face amount"
              >
                Per Cycle
              </button>
              <button
                type="button"
                id="btn-mode-annual"
                onClick={() => setCalculationMode('annual')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px] font-mono',
                  calculationMode === 'annual'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Annualized total outflow"
              >
                Annualized
              </button>
            </div>
          )}

          <button
            type="button"
            id="btn-collapse-sip-analytics"
            onClick={toggleExpand}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Collapse SIP Analytics' : 'Expand SIP Analytics'}
            title={isExpanded ? 'Collapse breakdown' : 'Expand breakdown'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div id="sip-analytics-content" className="p-5 space-y-5 animate-in fade-in duration-200">
          {/* Controls Bar: Active Only vs All SIPs toggle & summary indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Analyzed Outflow:</span>
              <span className="text-sm font-extrabold text-white font-mono">
                {formatRupee(totalOutflowSum)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                ({calculationMode === 'monthly' ? '/ month' : calculationMode === 'annual' ? '/ year' : 'per installment'})
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                id="checkbox-include-paused-sip"
                checked={includePaused}
                onChange={(e) => setIncludePaused(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-[11px] font-medium">Include Paused SIPs</span>
            </label>
          </div>

          {chartData.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No SIP mandates match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Doughnut Chart Section (Recharts) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
                <div className="w-full h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={78}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {chartData.map((entry) => (
                          <Cell key={`cell-${entry.id}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<SIPAnalyticsTooltip calculationMode={calculationMode} />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Overlay Info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                      Total SIPs
                    </span>
                    <span className="text-xl font-black text-white font-mono mt-0.5">
                      {filteredSIPs.length}
                    </span>
                    <span className="text-[10px] text-cyan-400/90 font-medium">
                      {frequencyStats.length} Frequency Cadence{frequencyStats.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown List by Frequency */}
              <div className="lg:col-span-7 space-y-3">
                {chartData.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs">
                        {/* Frequency Tag & Count */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono border',
                              item.badgeBg,
                              item.badgeText,
                              item.badgeBorder
                            )}
                          >
                            {item.name}
                          </span>
                          <span className="text-slate-400 text-[11px] font-mono">
                            {item.count} Mandate{item.count > 1 ? 's' : ''}
                            {item.count !== item.activeCount && (
                              <span className="text-slate-500 ml-1">({item.activeCount} Active)</span>
                            )}
                          </span>
                        </div>

                        {/* Amount & Percentage */}
                        <div className="text-right shrink-0">
                          <div className="flex items-baseline justify-end gap-1.5 font-mono">
                            <span className="text-sm font-bold text-white">
                              {formatRupee(item.value)}
                            </span>
                            <span className="text-xs font-semibold text-cyan-400">
                              {item.percentage}%
                            </span>
                          </div>
                          {calculationMode === 'monthly' && item.id !== 'monthly' && (
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Installment: {formatRupee(item.totalOutflow)} / cycle
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Percentage Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(3, parseFloat(item.percentage))}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Footnote on Normalized Outflow */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-1 pt-1 font-mono">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Monthly = 1x • Quarterly = 1/3x monthly • Annually = 1/12x monthly
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
