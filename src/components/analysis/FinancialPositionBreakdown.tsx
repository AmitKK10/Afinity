import React, { useState, useRef } from 'react';
import {
  Wallet,
  Coins,
  Building2,
  Landmark,
  TrendingUp,
  CreditCard,
  Receipt,
  Scale,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  PiggyBank,
  CheckCircle2,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  Zap,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import {
  InvestmentHolding,
  CreditCard as CreditCardType,
  KhatabookEntry,
  BankAccount,
  CashHoldingAccount,
  FixedDepositAccount,
  DigitalWallet,
} from '../../types';
import {
  calculateInvestmentAllocation,
  calculateTotalInvestmentProfitLoss,
  calculateTotalCreditLimit,
  calculateTotalAvailableCredit,
  calculateTotalCreditOutstanding,
  calculateKhatabookSummary,
  calculateFinancialHealthMetrics,
} from '../../services/calculations';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { FinancialCard } from '../ui/FinancialCard';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { AnalysisAllocationDonut } from './AnalysisAllocationDonut';
import { AnalysisDrillDownExplorer, DrillDownCategoryKey } from './AnalysisDrillDownExplorer';
import { PortfolioStatisticsCard } from './PortfolioStatisticsCard';
import { cn } from '../../utils/cn';

interface FinancialPositionBreakdownProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  cashHoldings: CashHoldingAccount[];
  bankAccounts: BankAccount[];
  fixedDeposits: FixedDepositAccount[];
  wallets: DigitalWallet[];
  investments: InvestmentHolding[];
  creditCards: CreditCardType[];
  khatabookEntries: KhatabookEntry[];
  className?: string;
}

export const FinancialPositionBreakdown: React.FC<FinancialPositionBreakdownProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
  cashHoldings = [],
  bankAccounts = [],
  fixedDeposits = [],
  wallets = [],
  investments = [],
  creditCards = [],
  khatabookEntries = [],
  className,
}) => {
  const [selectedDrillDownCategory, setSelectedDrillDownCategory] = useState<DrillDownCategoryKey>('investments');
  const drillDownRef = useRef<HTMLDivElement>(null);

  const handleCategorySelect = (categoryKey: string) => {
    const validKey = (categoryKey as DrillDownCategoryKey) || 'investments';
    setSelectedDrillDownCategory(validKey);
    if (drillDownRef.current) {
      drillDownRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Safe active filters
  const activeCash = (cashHoldings || []).filter((c) => c?.status === 'active');
  const activeBanks = (bankAccounts || []).filter((b) => b?.status === 'active');
  const activeFds = (fixedDeposits || []).filter((f) => f?.status === 'active');
  const activeWallets = (wallets || []).filter((w) => w?.status === 'active');
  const activeInvs = (investments || []).filter((i) => i?.status === 'active' || i?.status === 'ACTIVE');
  const activeCards = (creditCards || []).filter((c) => c?.status === 'active');
  const activeKhatabook = (khatabookEntries || []).filter((k) => k?.status === 'active' && !k.isSettled);

  // Values calculation
  const physicalCashTotal = activeCash.reduce((s, c) => s + Math.max(0, Number(c?.balance || 0)), 0);
  const bankSavingsTotal = activeBanks.reduce((s, b) => {
    const bal = Number(b?.balance || 0);
    return s + (bal > 0 ? bal : 0);
  }, 0);
  const bankOverdraftTotal = activeBanks.reduce((s, b) => {
    const bal = Number(b?.balance || 0);
    return s + (bal < 0 ? Math.abs(bal) : 0);
  }, 0);

  const fdTotal = activeFds.reduce((s, f) => {
    const val = f?.estimatedCurrentValue !== undefined
      ? Number(f.estimatedCurrentValue)
      : Number(f?.principal || f?.balance || 0);
    return s + Math.max(0, val);
  }, 0);

  const totalBankBalance = bankSavingsTotal + fdTotal;

  const walletTotal = activeWallets.reduce((s, w) => {
    if (w?.includeInNetWorth === false) return s;
    return s + Math.max(0, Number(w?.balance || 0));
  }, 0);

  // Liquid Assets = Physical Cash + Bank Savings + Positive Wallets
  const liquidAssets = physicalCashTotal + bankSavingsTotal + walletTotal;

  // Credit Card Outstanding (Short-term debt)
  const creditCardOutstanding = activeCards.reduce((s, c) => {
    if (c?.includeInNetWorth === false) return s;
    const out = Number(c?.outstanding !== undefined ? c.outstanding : c?.outstandingBalance || 0);
    return s + (out > 0 ? out : 0);
  }, 0);

  // Net Liquid Assets after Credit Card Dues (true unencumbered cash cushion)
  const netLiquidAssetsAfterCreditCards = liquidAssets - creditCardOutstanding;

  // Investments total
  const invSummary = calculateTotalInvestmentProfitLoss(activeInvs);
  const investmentTotal = invSummary?.totalCurrent || 0;

  // Receivables & Payables
  const kbSummary = calculateKhatabookSummary(activeKhatabook);
  const receivablesTotal = kbSummary?.totalReceivables || 0;
  const payablesTotal = kbSummary?.totalPayables || 0;

  // Credit Limits & Utilization
  const totalCreditLimit = calculateTotalCreditLimit(activeCards);
  const totalAvailableCredit = calculateTotalAvailableCredit(activeCards);
  const totalOutstandingBalance = calculateTotalCreditOutstanding(activeCards);

  // Health Metrics
  const healthMetrics = calculateFinancialHealthMetrics(
    totalAssets,
    totalLiabilities,
    liquidAssets,
    totalCreditLimit,
    totalOutstandingBalance
  );

  // Advanced Liquidity & Debt Ratios
  const creditDuesDenominator = creditCardOutstanding > 0 ? creditCardOutstanding : 1;
  const cardLiquidityCoverageRatio = creditCardOutstanding > 0
    ? Math.round((liquidAssets / creditDuesDenominator) * 100) / 100
    : null;

  const totalDebtLiquidityRatio = totalLiabilities > 0
    ? Math.round((liquidAssets / totalLiabilities) * 100) / 100
    : 10;

  // Debt-to-Liquid-Assets Ratio: Total Liabilities / Liquid Assets * 100
  const debtToLiquidAssetsRatio = liquidAssets > 0
    ? Math.round((totalLiabilities / liquidAssets) * 1000) / 10
    : 0;

  // Percentages of Total Assets
  const assetBase = totalAssets > 0 ? totalAssets : 1;
  const cashPct = Math.round((physicalCashTotal / assetBase) * 1000) / 10;
  const bankSavingsPct = Math.round((bankSavingsTotal / assetBase) * 1000) / 10;
  const fdPct = Math.round((fdTotal / assetBase) * 1000) / 10;
  const walletPct = Math.round((walletTotal / assetBase) * 1000) / 10;
  const invPct = Math.round((investmentTotal / assetBase) * 1000) / 10;
  const recPct = Math.round((receivablesTotal / assetBase) * 1000) / 10;
  const liquidPct = Math.round((liquidAssets / assetBase) * 1000) / 10;

  // Percentages of Total Liabilities
  const liabBase = totalLiabilities > 0 ? totalLiabilities : 1;
  const ccLiabPct = Math.round((creditCardOutstanding / liabBase) * 1000) / 10;
  const payablesLiabPct = Math.round((payablesTotal / liabBase) * 1000) / 10;
  const overdraftLiabPct = Math.round((bankOverdraftTotal / liabBase) * 1000) / 10;

  return (
    <div id="afinity-financial-position-breakdown-section" className={cn('space-y-6 sm:space-y-8', className)}>
      {/* 1. Seven Key Metric Cards: Net Worth, Liquid Assets, Net Liquid After CC, Investments, Physical Cash, Bank Balances, Liabilities */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="text-base sm:text-lg font-bold text-white font-heading flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Comprehensive Financial Breakdown & Liquidity
            </h3>
            <p className="text-xs text-slate-400">
              Live valuation across 7 core dimensions of your wealth and obligations — click any card to inspect items
            </p>
          </div>

          <Badge variant="cyan" size="sm">
            Single Source of Truth
          </Badge>
        </div>

        {/* 7-Card Responsive Wealth Position Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Net Worth */}
          <FinancialCard
            onClick={() => handleCategorySelect('investments')}
            className={cn(
              'p-4 sm:p-5 space-y-2 bg-gradient-to-br from-slate-900 via-slate-900 to-[#121c38] border transition-all cursor-pointer group',
              selectedDrillDownCategory === 'investments'
                ? 'border-cyan-400 ring-1 ring-cyan-500/40 shadow-lg shadow-cyan-950/40'
                : 'border-cyan-500/40 hover:border-cyan-400/80'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-heading">
                1. Total Net Worth
              </span>
              <div className="p-1 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight block">
                {formatRupee(netWorth)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Assets ({formatRupee(totalAssets)}) - Debt ({formatRupee(totalLiabilities)})
              </span>
            </div>
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Solvency</span>
              <span className="font-bold text-emerald-400 font-mono">{healthMetrics.solvencyRatio}%</span>
            </div>
          </FinancialCard>

          {/* 2. Liquid Assets */}
          <FinancialCard
            onClick={() => handleCategorySelect('cash')}
            className={cn(
              'p-4 sm:p-5 space-y-2 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/25 border transition-all cursor-pointer group',
              selectedDrillDownCategory === 'cash'
                ? 'border-emerald-400 ring-1 ring-emerald-500/40 shadow-lg'
                : 'border-emerald-500/30 hover:border-emerald-400/80'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-heading">
                2. Liquid Assets
              </span>
              <div className="p-1 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 group-hover:scale-110 transition-transform">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight block">
                {formatRupee(liquidAssets)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Cash + Bank + Wallets ({liquidPct}% of Assets)
              </span>
            </div>
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Liquidity Buffer</span>
              <span className="font-bold text-emerald-400 font-mono">
                {totalDebtLiquidityRatio >= 1 ? `${totalDebtLiquidityRatio}x Debt` : 'Partial'}
              </span>
            </div>
          </FinancialCard>

          {/* 3. Net Liquid Assets After Credit Card Dues */}
          <FinancialCard
            onClick={() => handleCategorySelect('liabilities')}
            className={cn(
              'p-4 sm:p-5 space-y-2 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/25 border transition-all cursor-pointer group',
              selectedDrillDownCategory === 'liabilities'
                ? 'border-teal-400 ring-1 ring-teal-500/40 shadow-lg'
                : 'border-teal-500/30 hover:border-teal-400/80'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 font-heading">
                3. Net Liquid Post-Card Dues
              </span>
              <div className="p-1 rounded-lg bg-teal-950/80 border border-teal-800/60 text-teal-400 group-hover:scale-110 transition-transform">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <span
                className={cn(
                  'text-xl sm:text-2xl font-black font-mono tracking-tight block',
                  netLiquidAssetsAfterCreditCards >= 0 ? 'text-teal-300' : 'text-rose-400'
                )}
              >
                {formatRupee(netLiquidAssetsAfterCreditCards)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Liquid ({formatRupee(liquidAssets)}) - Card Dues ({formatRupee(creditCardOutstanding)})
              </span>
            </div>
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Card Coverage</span>
              <span className="font-bold text-teal-400 font-mono">
                {cardLiquidityCoverageRatio !== null ? `${cardLiquidityCoverageRatio}x Covered` : '100% Free'}
              </span>
            </div>
          </FinancialCard>

          {/* 4. Investments */}
          <FinancialCard
            onClick={() => handleCategorySelect('investments')}
            className={cn(
              'p-4 sm:p-5 space-y-2 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/25 border transition-all cursor-pointer group',
              selectedDrillDownCategory === 'investments'
                ? 'border-indigo-400 ring-1 ring-indigo-500/40 shadow-lg'
                : 'border-indigo-500/30 hover:border-indigo-400/80'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 font-heading">
                4. Investments & Portfolio
              </span>
              <div className="p-1 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight block">
                {formatRupee(investmentTotal)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Stocks, Mutual Funds, SGB ({invPct}% of Assets)
              </span>
            </div>
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Unrealized P/L</span>
              <span
                className={cn(
                  'font-bold font-mono',
                  invSummary.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {invSummary.profitLoss >= 0 ? '+' : ''}{formatRupee(invSummary.profitLoss)}
              </span>
            </div>
          </FinancialCard>

          {/* 5. Physical Cash */}
          <FinancialCard
            onClick={() => handleCategorySelect('cash')}
            className={cn(
              'p-4 sm:p-5 space-y-2 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border transition-all cursor-pointer group',
              selectedDrillDownCategory === 'cash'
                ? 'border-amber-400 ring-1 ring-amber-500/40 shadow-lg'
                : 'border-amber-500/30 hover:border-amber-400/80'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-heading">
                5. Physical Cash Vaults
              </span>
              <div className="p-1 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400 group-hover:scale-110 transition-transform">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight block">
                {formatRupee(physicalCashTotal)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Audited notes in {activeCash.length} vaults ({cashPct}%)
              </span>
            </div>
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Cash-to-Liquid</span>
              <span className="font-bold text-amber-400 font-mono">
                {liquidAssets > 0 ? Math.round((physicalCashTotal / liquidAssets) * 100) : 0}%
              </span>
            </div>
          </FinancialCard>

          {/* 6. Bank Balances (Savings + FDs) */}
          <FinancialCard
            onClick={() => handleCategorySelect('banks')}
            className={cn(
              'p-4 sm:p-5 space-y-2 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/20 border transition-all cursor-pointer group',
              selectedDrillDownCategory === 'banks' || selectedDrillDownCategory === 'fixed_deposits'
                ? 'border-blue-400 ring-1 ring-blue-500/40 shadow-lg'
                : 'border-blue-500/30 hover:border-blue-400/80'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 font-heading">
                6. Bank Balances & FDs
              </span>
              <div className="p-1 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono tracking-tight block">
                {formatRupee(totalBankBalance)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Savings: {formatRupee(bankSavingsTotal)} | FDs: {formatRupee(fdTotal)}
              </span>
            </div>
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Bank Accounts</span>
              <span className="font-bold text-blue-300 font-mono">
                {activeBanks.length} Accts + {activeFds.length} FDs
              </span>
            </div>
          </FinancialCard>

          {/* 7. Total Liabilities & Obligations */}
          <FinancialCard
            onClick={() => handleCategorySelect('liabilities')}
            className={cn(
              'p-4 sm:p-5 space-y-2 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/25 border transition-all cursor-pointer group sm:col-span-2',
              selectedDrillDownCategory === 'liabilities'
                ? 'border-rose-400 ring-1 ring-rose-500/40 shadow-lg'
                : 'border-rose-500/30 hover:border-rose-400/80'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 font-heading">
                7. Total Liabilities & Obligations
              </span>
              <div className="p-1 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-400 group-hover:scale-110 transition-transform">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-0.5">
                <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight block">
                  {formatRupee(totalLiabilities)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Active card balances + khatabook payables
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                <span className="text-[10px] text-slate-400 font-sans block">Cards Due</span>
                <span className="font-bold text-rose-400">{formatRupee(creditCardOutstanding)}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                <span className="text-[10px] text-slate-400 font-sans block">Peer Payables</span>
                <span className="font-bold text-orange-400">{formatRupee(payablesTotal)}</span>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Debt-to-Liquid-Assets</span>
              <span className="font-bold text-rose-400 font-mono">{debtToLiquidAssetsRatio}% of liquid cash</span>
            </div>
          </FinancialCard>
        </div>
      </div>

      {/* 2. Portfolio Derived Financial Statistics & Concentration Indicators */}
      <PortfolioStatisticsCard
        netWorth={netWorth}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        cashHoldings={cashHoldings}
        bankAccounts={bankAccounts}
        fixedDeposits={fixedDeposits}
        wallets={wallets}
        investments={investments}
        creditCards={creditCards}
        khatabookEntries={khatabookEntries}
        onDrillDown={(catKey) => handleCategorySelect(catKey)}
      />

      {/* 3. Interactive Donut / Pie Allocation Charts Section */}
      <AnalysisAllocationDonut
        cashTotal={physicalCashTotal}
        bankSavingsTotal={bankSavingsTotal}
        fdTotal={fdTotal}
        walletTotal={walletTotal}
        investmentTotal={investmentTotal}
        receivablesTotal={receivablesTotal}
        creditCardTotal={creditCardOutstanding}
        payablesTotal={payablesTotal}
        overdraftTotal={bankOverdraftTotal}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        netWorth={netWorth}
        liquidAssets={liquidAssets}
        onSelectCategory={(catId) => handleCategorySelect(catId)}
      />

      {/* 4. Percentage Breakdown Bars (Asset Composition % & Liability Breakdown %) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Asset Proportional Composition Bar */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white font-heading">
                Asset Allocation Breakdown
              </h4>
              <p className="text-[11px] text-slate-400">
                Proportional contribution of each asset class to total ₹{totalAssets.toLocaleString('en-IN')}
              </p>
            </div>
            <Badge variant="emerald" size="sm">
              100% Assets
            </Badge>
          </div>

          {/* Stacked Proportional Bar */}
          <div className="w-full h-3 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
            {invPct > 0 && (
              <div
                style={{ width: `${invPct}%`, backgroundColor: '#10b981' }}
                title={`Investments: ${invPct}% (${formatRupee(investmentTotal)})`}
                onClick={() => handleCategorySelect('investments')}
                className="h-full hover:opacity-80 transition-all cursor-pointer"
              />
            )}
            {bankSavingsPct > 0 && (
              <div
                style={{ width: `${bankSavingsPct}%`, backgroundColor: '#3b82f6' }}
                title={`Bank Savings: ${bankSavingsPct}% (${formatRupee(bankSavingsTotal)})`}
                onClick={() => handleCategorySelect('banks')}
                className="h-full hover:opacity-80 transition-all cursor-pointer"
              />
            )}
            {fdPct > 0 && (
              <div
                style={{ width: `${fdPct}%`, backgroundColor: '#06b6d4' }}
                title={`Fixed Deposits: ${fdPct}% (${formatRupee(fdTotal)})`}
                onClick={() => handleCategorySelect('fixed_deposits')}
                className="h-full hover:opacity-80 transition-all cursor-pointer"
              />
            )}
            {cashPct > 0 && (
              <div
                style={{ width: `${cashPct}%`, backgroundColor: '#f59e0b' }}
                title={`Cash Vault: ${cashPct}% (${formatRupee(physicalCashTotal)})`}
                onClick={() => handleCategorySelect('cash')}
                className="h-full hover:opacity-80 transition-all cursor-pointer"
              />
            )}
            {walletPct > 0 && (
              <div
                style={{ width: `${walletPct}%`, backgroundColor: '#8b5cf6' }}
                title={`Wallets: ${walletPct}% (${formatRupee(walletTotal)})`}
                onClick={() => handleCategorySelect('wallets')}
                className="h-full hover:opacity-80 transition-all cursor-pointer"
              />
            )}
            {recPct > 0 && (
              <div
                style={{ width: `${recPct}%`, backgroundColor: '#ec4899' }}
                title={`Receivables: ${recPct}% (${formatRupee(receivablesTotal)})`}
                onClick={() => handleCategorySelect('receivables')}
                className="h-full hover:opacity-80 transition-all cursor-pointer"
              />
            )}
          </div>

          {/* Detailed Sector Percentage Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => handleCategorySelect('investments')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Investments</span>
              </div>
              <span className="font-mono font-bold text-emerald-400 ml-1">{invPct}%</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('banks')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Bank Balances</span>
              </div>
              <span className="font-mono font-bold text-blue-400 ml-1">{bankSavingsPct}%</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('fixed_deposits')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Fixed Deposits</span>
              </div>
              <span className="font-mono font-bold text-cyan-400 ml-1">{fdPct}%</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('cash')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Physical Cash</span>
              </div>
              <span className="font-mono font-bold text-amber-400 ml-1">{cashPct}%</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('wallets')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Wallets</span>
              </div>
              <span className="font-mono font-bold text-purple-400 ml-1">{walletPct}%</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('receivables')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Receivables</span>
              </div>
              <span className="font-mono font-bold text-pink-400 ml-1">{recPct}%</span>
            </button>
          </div>
        </FinancialCard>

        {/* Liabilities Composition Bar */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white font-heading">
                Liability & Debt Breakdown
              </h4>
              <p className="text-[11px] text-slate-400">
                Total outstanding obligations: ₹{totalLiabilities.toLocaleString('en-IN')}
              </p>
            </div>
            <Badge variant="rose" size="sm">
              {totalLiabilities > 0 ? 'Active Dues' : 'Zero Debt'}
            </Badge>
          </div>

          {/* Stacked Proportional Bar */}
          <div className="w-full h-3 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
            {ccLiabPct > 0 && (
              <div
                style={{ width: `${ccLiabPct}%`, backgroundColor: '#f43f5e' }}
                title={`Credit Cards: ${ccLiabPct}% (${formatRupee(creditCardOutstanding)})`}
                onClick={() => handleCategorySelect('liabilities')}
                className="h-full hover:opacity-80 transition-all cursor-pointer"
              />
            )}
            {payablesLiabPct > 0 && (
              <div
                style={{ width: `${payablesLiabPct}%`, backgroundColor: '#fb923c' }}
                title={`Payables: ${payablesLiabPct}% (${formatRupee(payablesTotal)})`}
                onClick={() => handleCategorySelect('liabilities')}
                className="h-full hover:opacity-80 transition-all cursor-pointer"
              />
            )}
            {overdraftLiabPct > 0 && (
              <div
                style={{ width: `${overdraftLiabPct}%`, backgroundColor: '#ef4444' }}
                title={`Overdrafts: ${overdraftLiabPct}% (${formatRupee(bankOverdraftTotal)})`}
                onClick={() => handleCategorySelect('liabilities')}
                className="h-full hover:opacity-80 transition-all cursor-pointer"
              />
            )}
          </div>

          {/* Detailed Sector Percentage Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => handleCategorySelect('liabilities')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Credit Cards</span>
              </div>
              <span className="font-mono font-bold text-rose-400 ml-1">{ccLiabPct}%</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('liabilities')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0" />
                <span className="text-slate-300 truncate">Peer Payables</span>
              </div>
              <span className="font-mono font-bold text-orange-400 ml-1">{payablesLiabPct}%</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('liabilities')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Overdrafts</span>
              </div>
              <span className="font-mono font-bold text-red-400 ml-1">{overdraftLiabPct}%</span>
            </button>
          </div>
        </FinancialCard>
      </div>

      {/* 5. Interactive Asset & Liability Drill-Down Section */}
      <div ref={drillDownRef}>
        <AnalysisDrillDownExplorer
          netWorth={netWorth}
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
          cashHoldings={cashHoldings}
          bankAccounts={bankAccounts}
          fixedDeposits={fixedDeposits}
          wallets={wallets}
          investments={investments}
          creditCards={creditCards}
          khatabookEntries={khatabookEntries}
          selectedCategory={selectedDrillDownCategory}
          onSelectCategory={(cat) => setSelectedDrillDownCategory(cat)}
        />
      </div>

      {/* 6. Financial Health & Ratio Command Center */}
      <FinancialCard className="p-5 sm:p-6 space-y-4 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 border border-indigo-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-heading">
                Financial Health & Liquidity Ratios
              </h4>
              <p className="text-xs text-slate-400">
                Objective solvency, liquidity cushion, and debt safety indicators
              </p>
            </div>
          </div>

          <Badge
            variant={
              healthMetrics.solvencyRatio >= 80 && healthMetrics.creditUtilizationRatio <= 30
                ? 'emerald'
                : 'gold'
            }
            size="sm"
          >
            {healthMetrics.solvencyRatio >= 80 ? 'High Resilience' : 'Balanced Structure'}
          </Badge>
        </div>

        {/* 4 Core Ratio Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Liquidity Ratio */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Liquidity Ratio
              </span>
              <Badge variant={totalDebtLiquidityRatio >= 1.5 ? 'emerald' : totalDebtLiquidityRatio >= 1 ? 'gold' : 'rose'} size="sm">
                {totalDebtLiquidityRatio >= 1.5 ? 'Strong Cushion' : totalDebtLiquidityRatio >= 1 ? 'Adequate' : 'Deficit Risk'}
              </Badge>
            </div>
            <span className="text-lg sm:text-xl font-black text-white font-mono block">
              {totalDebtLiquidityRatio}x
            </span>
            <p className="text-[11px] text-slate-400">
              Liquid assets cover {totalDebtLiquidityRatio}x of all liabilities.
            </p>
          </div>

          {/* Debt-to-Liquid-Assets Ratio */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Debt / Liquid Cash
              </span>
              <Badge variant={debtToLiquidAssetsRatio <= 30 ? 'emerald' : debtToLiquidAssetsRatio <= 60 ? 'gold' : 'rose'} size="sm">
                {debtToLiquidAssetsRatio <= 30 ? 'Minimal (≤30%)' : debtToLiquidAssetsRatio <= 60 ? 'Moderate (30-60%)' : 'High Debt (>60%)'}
              </Badge>
            </div>
            <span className="text-lg sm:text-xl font-black text-rose-400 font-mono block">
              {debtToLiquidAssetsRatio}%
            </span>
            <p className="text-[11px] text-slate-400">
              {debtToLiquidAssetsRatio}% of liquid cash needed to wipe all debt today.
            </p>
          </div>

          {/* Solvency Ratio */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Solvency Ratio
              </span>
              <Badge variant={healthMetrics.solvencyRatio >= 75 ? 'emerald' : 'gold'} size="sm">
                {healthMetrics.solvencyRatio >= 75 ? 'Strong (≥75%)' : 'Adequate'}
              </Badge>
            </div>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono block">
              {healthMetrics.solvencyRatio}%
            </span>
            <p className="text-[11px] text-slate-400">
              Assets comprise {healthMetrics.solvencyRatio}% of total balance sheet base.
            </p>
          </div>

          {/* Credit Limit Utilization */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Card Utilization
              </span>
              <Badge variant={healthMetrics.creditUtilizationRatio <= 30 ? 'emerald' : healthMetrics.creditUtilizationRatio <= 50 ? 'gold' : 'rose'} size="sm">
                {healthMetrics.creditUtilizationRatio <= 30 ? 'Optimal (≤30%)' : healthMetrics.creditUtilizationRatio <= 50 ? 'Moderate' : 'High Risk'}
              </Badge>
            </div>
            <span className="text-lg sm:text-xl font-black text-cyan-300 font-mono block">
              {healthMetrics.creditUtilizationRatio}%
            </span>
            <p className="text-[11px] text-slate-400">
              ₹{totalOutstandingBalance.toLocaleString('en-IN')} used of ₹{totalCreditLimit.toLocaleString('en-IN')} limit.
            </p>
          </div>
        </div>

        {/* Factual Financial Health Interpretations Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">
              <strong>Unencumbered Liquid Cushion:</strong> After clearing all credit cards, you retain{' '}
              <strong className="text-white font-mono">{formatRupee(netLiquidAssetsAfterCreditCards)}</strong> in immediate reserves.
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px] self-start sm:self-auto">
            Updated Real-Time
          </span>
        </div>
      </FinancialCard>
    </div>
  );
};
