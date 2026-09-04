import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import {
  PieChart as PieChartIcon,
  Coins,
  Building2,
  Landmark,
  Wallet,
  TrendingUp,
  Receipt,
  CreditCard,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export type AllocationChartMode = 'asset_composition' | 'liquidity_tiers' | 'liabilities';

export interface AllocationSlice {
  id: string;
  name: string;
  category: string;
  value: number;
  color: string;
  icon: React.ElementType;
  percentage: number;
  description?: string;
  type: 'asset' | 'liability';
}

interface AnalysisAllocationDonutProps {
  cashTotal: number;
  bankSavingsTotal: number;
  fdTotal: number;
  walletTotal: number;
  investmentTotal: number;
  receivablesTotal: number;
  creditCardTotal: number;
  payablesTotal: number;
  overdraftTotal: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
  onSelectCategory?: (category: string) => void;
  className?: string;
}

const renderAnalysisActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: `drop-shadow(0px 0px 8px ${fill}80)`,
          transition: 'all 0.3s ease',
        }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 13}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
};

export const AnalysisAllocationDonut: React.FC<AnalysisAllocationDonutProps> = ({
  cashTotal,
  bankSavingsTotal,
  fdTotal,
  walletTotal,
  investmentTotal,
  receivablesTotal,
  creditCardTotal,
  payablesTotal,
  overdraftTotal,
  totalAssets,
  totalLiabilities,
  netWorth,
  liquidAssets,
  onSelectCategory,
  className,
}) => {
  const [chartMode, setChartMode] = useState<AllocationChartMode>('asset_composition');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 1. Asset Composition Slices
  const assetSlices = useMemo<AllocationSlice[]>(() => {
    const total = totalAssets > 0 ? totalAssets : 1;
    const raw: Omit<AllocationSlice, 'percentage'>[] = [
      {
        id: 'investments',
        name: 'Investments & Equities',
        category: 'Investments',
        value: Math.max(0, investmentTotal),
        color: '#10b981', // Emerald
        icon: TrendingUp,
        description: 'Stocks, Mutual Funds, SGB, Bullion',
        type: 'asset',
      },
      {
        id: 'banks',
        name: 'Bank Savings & Current',
        category: 'Banks',
        value: Math.max(0, bankSavingsTotal),
        color: '#3b82f6', // Blue
        icon: Building2,
        description: 'Liquid bank account balances',
        type: 'asset',
      },
      {
        id: 'fixedDeposits',
        name: 'Fixed Deposits (FD)',
        category: 'Fixed Deposits',
        value: Math.max(0, fdTotal),
        color: '#06b6d4', // Cyan
        icon: Landmark,
        description: 'Term deposits with accrued interest',
        type: 'asset',
      },
      {
        id: 'cash',
        name: 'Physical Cash Vaults',
        category: 'Cash',
        value: Math.max(0, cashTotal),
        color: '#f59e0b', // Amber
        icon: Coins,
        description: 'Physical currency & notes in vault',
        type: 'asset',
      },
      {
        id: 'wallets',
        name: 'Digital Wallets',
        category: 'Wallets',
        value: Math.max(0, walletTotal),
        color: '#8b5cf6', // Purple
        icon: Wallet,
        description: 'UPI, PayTM, Amazon Pay balances',
        type: 'asset',
      },
      {
        id: 'receivables',
        name: 'Dues & Receivables',
        category: 'Receivables',
        value: Math.max(0, receivablesTotal),
        color: '#ec4899', // Pink
        icon: Receipt,
        description: 'Lending money owed back to you',
        type: 'asset',
      },
    ];

    return raw
      .filter((s) => s.value > 0)
      .map((s) => ({
        ...s,
        percentage: Math.round((s.value / total) * 1000) / 10,
      }));
  }, [totalAssets, investmentTotal, bankSavingsTotal, fdTotal, cashTotal, walletTotal, receivablesTotal]);

  // 2. Liquidity Tiers Slices (Liquid Cash vs Term vs Long-Term Growth)
  const liquidityTierSlices = useMemo<AllocationSlice[]>(() => {
    const total = totalAssets > 0 ? totalAssets : 1;
    const raw: Omit<AllocationSlice, 'percentage'>[] = [
      {
        id: 'liquid_funds',
        name: 'Instant Liquid Assets',
        category: 'Immediate Cash',
        value: Math.max(0, liquidAssets),
        color: '#06b6d4', // Cyan
        icon: Coins,
        description: 'Physical cash, bank balances & digital wallets',
        type: 'asset',
      },
      {
        id: 'fixed_income',
        name: 'Fixed Deposits (Term)',
        category: 'Semi-Liquid',
        value: Math.max(0, fdTotal),
        color: '#3b82f6', // Blue
        icon: Landmark,
        description: 'Fixed deposits and term savings',
        type: 'asset',
      },
      {
        id: 'market_investments',
        name: 'Market Portfolio & Equities',
        category: 'Growth Assets',
        value: Math.max(0, investmentTotal),
        color: '#10b981', // Emerald
        icon: TrendingUp,
        description: 'Stocks, mutual funds, gold & bonds',
        type: 'asset',
      },
      {
        id: 'peer_receivables',
        name: 'Peer Receivables',
        category: 'Uncollected',
        value: Math.max(0, receivablesTotal),
        color: '#ec4899', // Pink
        icon: Receipt,
        description: 'Lent dues pending collection',
        type: 'asset',
      },
    ];

    return raw
      .filter((s) => s.value > 0)
      .map((s) => ({
        ...s,
        percentage: Math.round((s.value / total) * 1000) / 10,
      }));
  }, [totalAssets, liquidAssets, fdTotal, investmentTotal, receivablesTotal]);

  // 3. Liabilities Breakdown Slices
  const liabilitySlices = useMemo<AllocationSlice[]>(() => {
    const total = totalLiabilities > 0 ? totalLiabilities : 1;
    const raw: Omit<AllocationSlice, 'percentage'>[] = [
      {
        id: 'credit_cards',
        name: 'Credit Card Dues',
        category: 'Credit Cards',
        value: Math.max(0, creditCardTotal),
        color: '#f43f5e', // Rose
        icon: CreditCard,
        description: 'Unpaid billing cycle outstanding',
        type: 'liability',
      },
      {
        id: 'payables',
        name: 'Borrowings & Payables',
        category: 'Payables',
        value: Math.max(0, payablesTotal),
        color: '#fb923c', // Orange
        icon: AlertCircle,
        description: 'Dues owed to friends, family & vendors',
        type: 'liability',
      },
      {
        id: 'overdrafts',
        name: 'Bank Overdrafts',
        category: 'Overdraft',
        value: Math.max(0, overdraftTotal),
        color: '#ef4444', // Red
        icon: PiggyBank,
        description: 'Negative bank account balances',
        type: 'liability',
      },
    ];

    return raw
      .filter((s) => s.value > 0)
      .map((s) => ({
        ...s,
        percentage: Math.round((s.value / total) * 1000) / 10,
      }));
  }, [totalLiabilities, creditCardTotal, payablesTotal, overdraftTotal]);

  // Active dataset depending on mode
  const currentSlices = useMemo(() => {
    switch (chartMode) {
      case 'liquidity_tiers':
        return liquidityTierSlices;
      case 'liabilities':
        return liabilitySlices;
      case 'asset_composition':
      default:
        return assetSlices;
    }
  }, [chartMode, assetSlices, liquidityTierSlices, liabilitySlices]);

  const currentTotal = useMemo(() => {
    switch (chartMode) {
      case 'liabilities':
        return totalLiabilities;
      case 'liquidity_tiers':
      case 'asset_composition':
      default:
        return totalAssets;
    }
  }, [chartMode, totalAssets, totalLiabilities]);

  // Selected item data for center and callout
  const activeSlice = useMemo(() => {
    if (activeIndex !== null && currentSlices[activeIndex]) {
      return currentSlices[activeIndex];
    }
    return null;
  }, [activeIndex, currentSlices]);

  return (
    <div
      id="afinity-analysis-allocation-donut-card"
      className={cn(
        'rounded-3xl p-5 sm:p-6 bg-slate-900/90 border border-slate-800 shadow-xl space-y-5',
        className
      )}
    >
      {/* Header & Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white font-heading">
              Portfolio Allocation & Class Distribution
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Interactive multi-tier donut breakdown with live percentage allocation
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            id="tab-allocation-asset-comp"
            onClick={() => {
              setChartMode('asset_composition');
              setActiveIndex(null);
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold font-heading transition-all cursor-pointer whitespace-nowrap min-h-[36px]',
              chartMode === 'asset_composition'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Asset Classes ({assetSlices.length})
          </button>

          <button
            type="button"
            id="tab-allocation-liquidity-tiers"
            onClick={() => {
              setChartMode('liquidity_tiers');
              setActiveIndex(null);
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold font-heading transition-all cursor-pointer whitespace-nowrap min-h-[36px]',
              chartMode === 'liquidity_tiers'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Liquidity Tiers
          </button>

          <button
            type="button"
            id="tab-allocation-liabilities"
            onClick={() => {
              setChartMode('liabilities');
              setActiveIndex(null);
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold font-heading transition-all cursor-pointer whitespace-nowrap min-h-[36px]',
              chartMode === 'liabilities'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Liabilities ({liabilitySlices.length})
          </button>
        </div>
      </div>

      {/* Main Chart + Legend Visual Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Donut Chart with Center Readout */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[280px] sm:min-h-[310px]">
          {currentSlices.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <PieChartIcon className="w-10 h-10 text-slate-600" />
              <p className="text-sm font-medium">No active records in this view</p>
            </div>
          ) : (
            <div className="w-full h-[280px] sm:h-[310px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentSlices}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                    activeShape={renderAnalysisActiveShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(_, index) => setActiveIndex(activeIndex === index ? null : index)}
                    cursor="pointer"
                    animationDuration={600}
                  >
                    {currentSlices.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.id}-${index}`}
                        fill={entry.color}
                        stroke="#0f172a"
                        strokeWidth={2}
                        className="transition-all duration-200 outline-none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Dynamic Metric Readout */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '135px', height: '135px' }}
              >
                {activeSlice ? (
                  <div className="space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate max-w-[120px]">
                      {activeSlice.category}
                    </span>
                    <span className="text-sm sm:text-base font-black text-white font-mono block tracking-tight truncate max-w-[125px]">
                      {formatRupee(activeSlice.value)}
                    </span>
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold font-mono"
                      style={{
                        backgroundColor: `${activeSlice.color}25`,
                        color: activeSlice.color,
                      }}
                    >
                      {activeSlice.percentage}%
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {chartMode === 'liabilities' ? 'Total Debt' : 'Total Assets'}
                    </span>
                    <span className="text-sm sm:text-base font-black text-white font-mono block tracking-tight">
                      {formatRupee(currentTotal)}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-medium block">
                      {currentSlices.length} {currentSlices.length === 1 ? 'Sector' : 'Sectors'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 text-center -mt-2">
            Hover or tap any sector for deep allocation metrics
          </p>
        </div>

        {/* Right: Rich Interactive Legend & Allocation Breakdown Cards */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pb-1">
            <span>Allocation Breakdown ({chartMode.replace('_', ' ').toUpperCase()})</span>
            <span>Share & Value</span>
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {currentSlices.map((slice, index) => {
              const IconComponent = slice.icon;
              const isSelected = activeIndex === index;

              return (
                <div
                  key={slice.id}
                  id={`allocation-slice-row-${slice.id}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => setActiveIndex(isSelected ? null : index)}
                  className={cn(
                    'p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group',
                    isSelected
                      ? 'bg-slate-850 border-cyan-500/50 shadow-md translate-x-1'
                      : 'bg-slate-950/60 hover:bg-slate-950/90 border-slate-800/80 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 group-hover:text-white flex-shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white font-heading truncate">
                          {slice.name}
                        </span>
                      </div>
                      {slice.description && (
                        <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                          {slice.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-bold font-mono text-white block">
                        {formatRupee(slice.value)}
                      </span>
                      <span
                        className="text-[11px] font-extrabold font-mono"
                        style={{ color: slice.color }}
                      >
                        {slice.percentage}%
                      </span>
                    </div>

                    {/* Proportional Mini Bar */}
                    <div className="w-12 sm:w-16 h-2 rounded-full bg-slate-800 overflow-hidden hidden xs:block">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(4, slice.percentage))}%`,
                          backgroundColor: slice.color,
                        }}
                      />
                    </div>

                    {onSelectCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetMap: Record<string, string> = {
                            investments: 'investments',
                            banks: 'banks',
                            fixedDeposits: 'fixed_deposits',
                            fixed_deposits: 'fixed_deposits',
                            fixed_income: 'fixed_deposits',
                            cash: 'cash',
                            liquid_funds: 'cash',
                            wallets: 'wallets',
                            receivables: 'receivables',
                            peer_receivables: 'receivables',
                            credit_cards: 'liabilities',
                            payables: 'liabilities',
                            overdrafts: 'liabilities',
                            market_investments: 'investments',
                          };
                          onSelectCategory(targetMap[slice.id] || 'investments');
                        }}
                        className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-400 hover:text-cyan-300 transition-colors text-[10px] hidden sm:flex items-center gap-1 cursor-pointer"
                        title="Drill down to details"
                      >
                        <span className="font-sans">Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Summary Pill Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-800/80 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Net Worth:</span>
              <span className="font-bold text-cyan-400">{formatRupee(netWorth)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Liquid Reserve:</span>
              <span className="font-bold text-emerald-400">{formatRupee(liquidAssets)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
