import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from 'recharts';
import {
  PieChart as PieChartIcon,
  Banknote,
  Building2,
  TrendingUp,
  Wallet,
  HandCoins,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface AssetClassItem {
  id: string;
  name: string;
  category: 'cash' | 'bank' | 'investment' | 'wallet' | 'receivables' | 'credit' | 'payables';
  value: number;
  color: string;
  gradient: [string, string];
  icon: React.ElementType;
  route: string;
  type: 'asset' | 'liability';
}

interface PortfolioDistributionDonutProps {
  cashTotal: number;
  bankTotal: number;
  walletTotal: number;
  investmentTotal: number;
  receivablesTotal: number;
  creditCardTotal: number;
  payablesTotal: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  className?: string;
}

const renderPortfolioActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
      />
    </g>
  );
};

const PortfolioDistributionTooltip: React.FC<any> = ({ active, payload, viewMode }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 rounded-2xl shadow-xl dark:shadow-2xl text-xs space-y-1 min-w-[150px]">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.name}</span>
        </div>
        <div className="text-slate-800 dark:text-slate-300 font-mono text-sm font-extrabold">
          {formatRupee(item.value)}
        </div>
        <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
          {item.formattedPct}% of {viewMode === 'assets' ? 'Total Assets' : 'Portfolio'}
        </div>
      </div>
    );
  }
  return null;
};

export const PortfolioDistributionDonut: React.FC<PortfolioDistributionDonutProps> = ({
  cashTotal,
  bankTotal,
  walletTotal,
  investmentTotal,
  receivablesTotal,
  creditCardTotal,
  payablesTotal,
  totalAssets,
  totalLiabilities,
  netWorth,
  className,
}) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'assets' | 'all'>('assets');

  // Asset classes distribution data (strictly positive asset items)
  const assetItems = useMemo<AssetClassItem[]>(() => {
    const list: AssetClassItem[] = [
      {
        id: 'investments',
        name: 'Investments & Equities',
        category: 'investment',
        value: Math.max(0, investmentTotal),
        color: '#10b981', // Emerald
        gradient: ['#34d399', '#059669'],
        icon: TrendingUp,
        route: '/investments',
        type: 'asset',
      },
      {
        id: 'banks',
        name: 'Bank Accounts & FDs',
        category: 'bank',
        value: Math.max(0, bankTotal),
        color: '#3b82f6', // Blue
        gradient: ['#60a5fa', '#2563eb'],
        icon: Building2,
        route: '/banks',
        type: 'asset',
      },
      {
        id: 'cash',
        name: 'Physical Cash Vault',
        category: 'cash',
        value: Math.max(0, cashTotal),
        color: '#f59e0b', // Amber
        gradient: ['#fbbf24', '#d97706'],
        icon: Banknote,
        route: '/cash-denominations',
        type: 'asset',
      },
      {
        id: 'wallets',
        name: 'Digital Wallets',
        category: 'wallet',
        value: Math.max(0, walletTotal),
        color: '#8b5cf6', // Purple/Violet
        gradient: ['#a78bfa', '#7c3aed'],
        icon: Wallet,
        route: '/wallets',
        type: 'asset',
      },
      {
        id: 'receivables',
        name: 'Dues & Receivables',
        category: 'receivables',
        value: Math.max(0, receivablesTotal),
        color: '#06b6d4', // Cyan
        gradient: ['#22d3ee', '#0891b2'],
        icon: HandCoins,
        route: '/dues-receivables',
        type: 'asset',
      },
    ];

    return list.filter((item) => item.value > 0);
  }, [investmentTotal, bankTotal, cashTotal, walletTotal, receivablesTotal]);

  // Gross Assets Total (sum of active asset classes or canonical totalAssets)
  const grossAssets = useMemo(() => {
    const sum = assetItems.reduce((acc, item) => acc + item.value, 0);
    return Math.max(sum, totalAssets || 0);
  }, [assetItems, totalAssets]);

  // Gross Liabilities Total
  const grossLiabilities = useMemo(() => {
    return Math.max(0, (creditCardTotal || 0) + (payablesTotal || 0), totalLiabilities || 0);
  }, [creditCardTotal, payablesTotal, totalLiabilities]);

  // Net Capital = Assets minus Liabilities
  const netCapital = useMemo(() => {
    return grossAssets - grossLiabilities;
  }, [grossAssets, grossLiabilities]);

  // Liabilities items for Net Capital deductions breakdown
  const liabilityItems = useMemo<AssetClassItem[]>(() => {
    const list: AssetClassItem[] = [];
    if (creditCardTotal > 0) {
      list.push({
        id: 'credit_cards',
        name: 'Credit Card Dues',
        category: 'credit',
        value: creditCardTotal,
        color: '#f43f5e',
        gradient: ['#fb7185', '#e11d48'],
        icon: CreditCard,
        route: '/credit',
        type: 'liability',
      });
    }
    if (payablesTotal > 0) {
      list.push({
        id: 'payables',
        name: 'Payables (You Owe)',
        category: 'payables',
        value: payablesTotal,
        color: '#ec4899',
        gradient: ['#f472b6', '#db2777'],
        icon: HandCoins,
        route: '/dues-receivables',
        type: 'liability',
      });
    }
    return list;
  }, [creditCardTotal, payablesTotal]);

  // The Pie Chart exclusively represents the Asset Allocation so assets and liabilities are never mixed
  const pieData = useMemo(() => {
    if (grossAssets <= 0 || assetItems.length === 0) {
      return [];
    }

    // Hare-Niemeyer / Largest Remainder algorithm to guarantee exact 100.0% sum
    let roundedSum = 0;
    const mapped = assetItems.map((item) => {
      const rawPct = (item.value / grossAssets) * 100;
      const rounded = Math.round(rawPct * 10) / 10;
      roundedSum += rounded;
      return {
        ...item,
        percentage: rawPct,
        roundedPct: rounded,
      };
    });

    const diff = Math.round((100.0 - roundedSum) * 10) / 10;
    if (diff !== 0 && mapped.length > 0) {
      let maxIdx = 0;
      let maxVal = mapped[0].value;
      for (let i = 1; i < mapped.length; i++) {
        if (mapped[i].value > maxVal) {
          maxVal = mapped[i].value;
          maxIdx = i;
        }
      }
      mapped[maxIdx].roundedPct = Math.round((mapped[maxIdx].roundedPct + diff) * 10) / 10;
    }

    return mapped.map((item) => ({
      ...item,
      formattedPct: item.roundedPct.toFixed(1),
    }));
  }, [assetItems, grossAssets]);

  // Active highlighted slice info
  const activeItem = useMemo(() => {
    if (activeIndex !== null && pieData[activeIndex]) {
      return pieData[activeIndex];
    }
    return null;
  }, [activeIndex, pieData]);

  if (grossAssets === 0) {
    return null;
  }

  return (
    <motion.div
      id="portfolio-distribution-donut-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'p-5 sm:p-6 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-slate-900/80 dark:to-slate-950/90 border border-slate-200/90 dark:border-slate-800/80 shadow-md shadow-slate-200/40 dark:shadow-xl backdrop-blur-sm space-y-5',
        className
      )}
    >
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/50 text-cyan-600 dark:text-cyan-400">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white font-heading tracking-tight flex items-center gap-2">
              <span>Asset Distribution</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {pieData.length} Classes
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Percentage allocation across your liquid, invested &amp; credit assets
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center self-start sm:self-auto bg-slate-100 dark:bg-slate-950/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setViewMode('assets');
              setActiveIndex(null);
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-all font-heading select-none cursor-pointer',
              viewMode === 'assets'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            Asset Classes
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('all');
              setActiveIndex(null);
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-all font-heading select-none cursor-pointer',
              viewMode === 'all'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            Net Capital
          </button>
        </div>
      </div>

      {/* Main Content Grid: Donut Chart on Left, Legend Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-1">
        {/* Donut Chart Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="w-full h-56 sm:h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderPortfolioActiveShape}
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={96}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={(entry: any) => {
                    const route = entry?.payload?.route || entry?.route;
                    if (route) {
                      navigate(route);
                    }
                  }}
                  cursor="pointer"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`donut-cell-${entry.id}-${index}`}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                      className="transition-opacity duration-200"
                    />
                  ))}
                </Pie>
                <Tooltip content={<PortfolioDistributionTooltip viewMode={viewMode} />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Dynamic Label in Donut Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
              {activeItem ? (
                <>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider line-clamp-1 max-w-[110px]"
                    style={{ color: activeItem.color }}
                  >
                    {activeItem.name}
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono leading-tight mt-0.5">
                    {formatRupee(activeItem.value)}
                  </span>
                  <span className="text-[11px] font-bold font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeItem.formattedPct}%
                  </span>
                </>
              ) : viewMode === 'all' ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-heading">
                    Net Capital
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono leading-tight mt-0.5">
                    {formatRupee(netCapital)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    Assets − Liabilities
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-heading">
                    Total Assets
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono leading-tight mt-0.5">
                    {formatRupee(grossAssets)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    100% Allocated
                  </span>
                </>
              )}
            </div>
          </div>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-1">
            Tap on any slice to filter and navigate to that asset class
          </span>
        </div>

        {/* Legend Breakdown Grid */}
        <div className="lg:col-span-7 space-y-2.5">
          {pieData.map((item, idx) => {
            const Icon = item.icon;
            const isHovered = activeIndex === idx;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={() => navigate(item.route)}
                className={cn(
                  'p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer select-none group',
                  isHovered
                    ? 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-300 dark:border-slate-600 shadow-md scale-[1.01]'
                    : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="p-1.5 rounded-xl border flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${item.color}15`,
                        borderColor: `${item.color}35`,
                        color: item.color,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors truncate">
                          {item.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-right shrink-0">
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatRupee(item.value)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {item.formattedPct}%
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-white group-hover:bg-cyan-600 transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Progress Bar representation */}
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Net Capital Mode: Dedicated Liabilities and Net Worth Summary */}
          {viewMode === 'all' && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {liabilityItems.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-rose-500 uppercase tracking-wider px-1">
                    <span>Liabilities &amp; Dues Offset</span>
                    <span className="font-mono font-bold">−{formatRupee(grossLiabilities)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {liabilityItems.map((liab) => {
                      const LiabIcon = liab.icon;
                      return (
                        <div
                          key={liab.id}
                          onClick={() => navigate(liab.route)}
                          className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between cursor-pointer hover:border-rose-400 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                              <LiabIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                              {liab.name}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0">
                            −{formatRupee(liab.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 px-1 font-medium">
                  Zero liabilities recorded • Net Capital equals Total Assets
                </div>
              )}

              {/* Net Capital Result Strip */}
              <div className="p-3 rounded-2xl bg-cyan-950/20 dark:bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-cyan-400 block font-heading">
                    Net Capital (Net Worth)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Gross Assets ({formatRupee(grossAssets)}) − Liabilities ({formatRupee(grossLiabilities)})
                  </span>
                </div>
                <span className="text-sm sm:text-base font-black font-mono text-white">
                  {formatRupee(netCapital)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
