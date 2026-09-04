import React from 'react';
import {
  TrendingUp,
  Coins,
  CreditCard,
  Building2,
  PieChart as PieChartIcon,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Percent,
  Scale,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
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
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { FinancialCard } from '../ui/FinancialCard';
import { cn } from '../../utils/cn';

interface PortfolioStatisticsCardProps {
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
  onDrillDown?: (categoryKey: string) => void;
  className?: string;
}

export const PortfolioStatisticsCard: React.FC<PortfolioStatisticsCardProps> = ({
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
  onDrillDown,
  className,
}) => {
  // Safe filtering
  const activeCash = (cashHoldings || []).filter((c) => c?.status === 'active');
  const activeBanks = (bankAccounts || []).filter((b) => b?.status === 'active');
  const activeFds = (fixedDeposits || []).filter((f) => f?.status === 'active');
  const activeWallets = (wallets || []).filter((w) => w?.status === 'active');
  const activeInvs = (investments || []).filter((i) => i?.status === 'active' || i?.status === 'ACTIVE');
  const activeCards = (creditCards || []).filter((c) => c?.status === 'active');
  const activeReceivables = (khatabookEntries || []).filter((k) => k?.status === 'active' && k?.type === 'receivable' && !k?.isSettled);
  const activePayables = (khatabookEntries || []).filter((k) => k?.status === 'active' && k?.type === 'payable' && !k?.isSettled);

  // Asset Totals
  const physicalCashTotal = activeCash.reduce((s, c) => s + Math.max(0, Number(c?.balance || 0)), 0);
  const bankSavingsTotal = activeBanks.reduce((s, b) => s + Math.max(0, Number(b?.balance || 0)), 0);
  const fdTotal = activeFds.reduce((s, f) => {
    const v = f?.estimatedCurrentValue !== undefined ? Number(f.estimatedCurrentValue) : Number(f?.principal || f?.balance || 0);
    return s + Math.max(0, v);
  }, 0);
  const walletTotal = activeWallets.reduce((s, w) => {
    if (w?.includeInNetWorth === false) return s;
    return s + Math.max(0, Number(w?.balance || 0));
  }, 0);
  const investmentTotal = activeInvs.reduce((s, i) => {
    const qty = Number(i?.quantity !== undefined ? i.quantity : i?.unitsHeld || 0);
    const price = Number(i?.currentPrice || 0);
    const v = i?.currentValue !== undefined && i.currentValue > 0 ? Number(i.currentValue) : qty * price;
    return s + Math.max(0, v);
  }, 0);
  const receivablesTotal = activeReceivables.reduce((s, r) => s + Math.max(0, Number(r?.amount || 0)), 0);

  // Liabilities
  const creditCardOutstanding = activeCards.reduce((s, c) => {
    if (c?.includeInNetWorth === false) return s;
    const out = Number(c?.outstanding !== undefined ? c.outstanding : c?.outstandingBalance || 0);
    return s + (out > 0 ? out : 0);
  }, 0);
  const payablesTotal = activePayables.reduce((s, p) => s + Math.max(0, Number(p?.amount || 0)), 0);

  // Liquid Assets = Cash + Bank Savings + Positive Wallets
  const liquidAssets = physicalCashTotal + bankSavingsTotal + walletTotal;
  const netLiquidPostCards = liquidAssets - creditCardOutstanding;
  const netLiquidPostAllDebt = liquidAssets - totalLiabilities;

  const assetBase = totalAssets > 0 ? totalAssets : 1;
  const liabBase = totalLiabilities > 0 ? totalLiabilities : 1;

  // 1. Asset Allocation & Liquid Cash Percentage
  const liquidCashPercentage = Math.round((liquidAssets / assetBase) * 1000) / 10;
  const liquidStatus =
    liquidCashPercentage >= 20
      ? { label: 'Strong Cushion (≥20%)', color: 'text-emerald-400', badgeVariant: 'emerald' as const, bg: 'bg-emerald-500/10 border-emerald-500/30' }
      : liquidCashPercentage >= 10
      ? { label: 'Moderate Buffer (10–20%)', color: 'text-amber-400', badgeVariant: 'gold' as const, bg: 'bg-amber-500/10 border-amber-500/30' }
      : { label: 'Low Liquidity (<10%)', color: 'text-rose-400', badgeVariant: 'rose' as const, bg: 'bg-rose-500/10 border-rose-500/30' };

  // 2. Cash-to-Investment Ratio
  const totalCashAndTerm = physicalCashTotal + bankSavingsTotal + fdTotal + walletTotal;
  const cashToInvRatio = investmentTotal > 0 ? (totalCashAndTerm / investmentTotal) : 0;
  const cashToInvFormatted = investmentTotal > 0
    ? `${cashToInvRatio.toFixed(2)} : 1`
    : totalCashAndTerm > 0
    ? '100% Cash'
    : '0 : 0';

  const totalLiquidAndInv = totalCashAndTerm + investmentTotal;
  const cashShareOfBoth = totalLiquidAndInv > 0 ? Math.round((totalCashAndTerm / totalLiquidAndInv) * 100) : 0;
  const invShareOfBoth = totalLiquidAndInv > 0 ? 100 - cashShareOfBoth : 0;

  // 3. Investment Sub-Allocation
  let stocksTotal = 0;
  let mfTotal = 0;
  let goldSgbTotal = 0;
  let otherInvTotal = 0;

  activeInvs.forEach((inv) => {
    const qty = Number(inv?.quantity !== undefined ? inv.quantity : inv?.unitsHeld || 0);
    const price = Number(inv?.currentPrice || 0);
    const val = inv?.currentValue !== undefined && inv.currentValue > 0 ? Number(inv.currentValue) : qty * price;
    const rawType = (inv?.assetType || inv?.type || 'STOCK').toUpperCase();

    if (rawType.includes('STOCK') || rawType.includes('EQUITY')) stocksTotal += val;
    else if (rawType.includes('MUTUAL') || rawType.includes('MF') || rawType.includes('FUND')) mfTotal += val;
    else if (rawType.includes('GOLD') || rawType.includes('SGB')) goldSgbTotal += val;
    else otherInvTotal += val;
  });

  const invBase = investmentTotal > 0 ? investmentTotal : 1;
  const stocksPct = Math.round((stocksTotal / invBase) * 1000) / 10;
  const mfPct = Math.round((mfTotal / invBase) * 1000) / 10;
  const goldPct = Math.round((goldSgbTotal / invBase) * 1000) / 10;
  const otherInvPct = Math.round((otherInvTotal / invBase) * 1000) / 10;

  // 4. Credit Card Liability Percentage
  const ccLiabilityPctOfDebt = Math.round((creditCardOutstanding / liabBase) * 1000) / 10;
  const ccLiabilityPctOfAssets = Math.round((creditCardOutstanding / assetBase) * 1000) / 10;

  // 5. Largest Asset Category
  const assetCategories = [
    { key: 'investments', label: 'Investments & Portfolio', value: investmentTotal },
    { key: 'banks', label: 'Bank Balances (Savings)', value: bankSavingsTotal },
    { key: 'fixed_deposits', label: 'Fixed Deposits', value: fdTotal },
    { key: 'cash', label: 'Physical Cash Vaults', value: physicalCashTotal },
    { key: 'wallets', label: 'Digital Wallets', value: walletTotal },
    { key: 'receivables', label: 'Peer Receivables', value: receivablesTotal },
  ].sort((a, b) => b.value - a.value);

  const largestAsset = assetCategories[0];
  const largestAssetPct = Math.round((largestAsset.value / assetBase) * 1000) / 10;

  // Asset Concentration Status
  const assetConcentrationStatus =
    largestAssetPct <= 40
      ? { label: 'Well Diversified (≤40%)', color: 'text-emerald-400', badgeVariant: 'emerald' as const, icon: CheckCircle2 }
      : largestAssetPct <= 65
      ? { label: 'Moderate Concentration (40–65%)', color: 'text-amber-400', badgeVariant: 'gold' as const, icon: AlertTriangle }
      : { label: 'High Asset Concentration (>65%)', color: 'text-rose-400', badgeVariant: 'rose' as const, icon: AlertCircle };

  // 6. Largest Liability
  const liabilityCategories = [
    { key: 'credit_cards', label: 'Credit Card Outstanding', value: creditCardOutstanding },
    { key: 'payables', label: 'Peer Payables (Khatabook)', value: payablesTotal },
  ].sort((a, b) => b.value - a.value);

  const largestLiability = liabilityCategories[0].value > 0 ? liabilityCategories[0] : null;
  const largestLiabPct = largestLiability ? Math.round((largestLiability.value / liabBase) * 1000) / 10 : 0;

  // 7. Single Investment Concentration (Top individual stock/holding % of total investments)
  let topHolding = { name: 'None', value: 0, pct: 0 };
  if (activeInvs.length > 0 && investmentTotal > 0) {
    const sortedInvs = [...activeInvs].map((i) => {
      const qty = Number(i?.quantity !== undefined ? i.quantity : i?.unitsHeld || 0);
      const price = Number(i?.currentPrice || 0);
      const val = i?.currentValue !== undefined && i.currentValue > 0 ? Number(i.currentValue) : qty * price;
      return {
        name: i.name || i.displayName || i.symbol || 'Holding',
        value: val,
        pct: Math.round((val / investmentTotal) * 1000) / 10,
      };
    }).sort((a, b) => b.value - a.value);

    topHolding = sortedInvs[0];
  }

  const holdingConcentrationStatus =
    topHolding.pct <= 25
      ? { label: 'Well Distributed (≤25%)', color: 'text-emerald-400', badgeVariant: 'emerald' as const }
      : topHolding.pct <= 50
      ? { label: 'Moderate Single-Asset (25–50%)', color: 'text-amber-400', badgeVariant: 'gold' as const }
      : { label: 'High Single-Stock Exposure (>50%)', color: 'text-rose-400', badgeVariant: 'rose' as const };

  // 8. Single Bank Concentration
  let topBank = { name: 'None', balance: 0, pct: 0 };
  const totalBankBalAll = bankSavingsTotal + fdTotal;
  if (activeBanks.length > 0 && bankSavingsTotal > 0) {
    const sortedBanks = [...activeBanks].map((b) => {
      const bal = Math.max(0, Number(b?.balance || 0));
      return {
        name: b.name || b.bankName || 'Bank',
        balance: bal,
        pct: Math.round((bal / bankSavingsTotal) * 1000) / 10,
      };
    }).sort((a, b) => b.balance - a.balance);

    topBank = sortedBanks[0];
  }

  return (
    <div
      id="afinity-portfolio-derived-statistics"
      className={cn('space-y-4', className)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-heading">
              Financial Statistics & Concentration Metrics
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Mathematically derived ratios, allocation weights, and portfolio concentration indicators
          </p>
        </div>

        <Badge variant="cyan" size="sm">
          Factual Ratios
        </Badge>
      </div>

      {/* Grid of 6 Core Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Cash-to-Investment Ratio & Weight */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400">
                <Percent className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-300 font-heading">
                Cash-to-Investment Ratio
              </span>
            </div>
            <Badge variant="emerald" size="sm">
              {cashShareOfBoth}% Cash / {invShareOfBoth}% Inv
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {cashToInvFormatted}
              </span>
              <span className="text-xs text-slate-400 font-sans">
                ₹{formatRupee(totalCashAndTerm)} vs ₹{formatRupee(investmentTotal)}
              </span>
            </div>
            {/* Visual dual bar */}
            <div className="w-full h-2 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
              <div
                style={{ width: `${cashShareOfBoth}%` }}
                className="bg-cyan-400 h-full"
                title={`Cash & Term: ${cashShareOfBoth}%`}
              />
              <div
                style={{ width: `${invShareOfBoth}%` }}
                className="bg-emerald-400 h-full"
                title={`Investments: ${invShareOfBoth}%`}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            For every ₹1.00 deployed in growth investments, you maintain ₹{cashToInvRatio.toFixed(2)} in cash and bank reserves.
          </p>
        </FinancialCard>

        {/* 2. Liquid Cash Percentage & Cushion */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-300 font-heading">
                Liquid Cash Percentage
              </span>
            </div>
            <Badge variant={liquidStatus.badgeVariant} size="sm">
              {liquidStatus.label}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-mono">
              <span className={cn('text-xl sm:text-2xl font-black tracking-tight', liquidStatus.color)}>
                {liquidCashPercentage}%
              </span>
              <span className="text-xs text-slate-400 font-sans">
                {formatRupee(liquidAssets)} of {formatRupee(totalAssets)}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                style={{ width: `${Math.min(100, liquidCashPercentage)}%` }}
                className="bg-cyan-400 h-full"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Immediate liquid funds (Cash + Bank Savings + Wallets) represent {liquidCashPercentage}% of total wealth.
          </p>
        </FinancialCard>

        {/* 3. Net Liquidity (Surplus Buffer) */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-teal-950 border border-teal-800/60 text-teal-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-300 font-heading">
                Net Unencumbered Liquidity
              </span>
            </div>
            <Badge variant={netLiquidPostCards >= 0 ? 'emerald' : 'rose'} size="sm">
              {netLiquidPostCards >= 0 ? 'Surplus Reserve' : 'Cash Deficit'}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-mono">
              <span
                className={cn(
                  'text-xl sm:text-2xl font-black tracking-tight',
                  netLiquidPostCards >= 0 ? 'text-teal-300' : 'text-rose-400'
                )}
              >
                {formatRupee(netLiquidPostCards)}
              </span>
              <span className="text-xs text-slate-400 font-sans">
                Post-Cards
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/60">
              <span>Post-All-Debt Buffer:</span>
              <span className={cn('font-mono font-bold', netLiquidPostAllDebt >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {formatRupee(netLiquidPostAllDebt)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Cash retained immediately if all credit card dues ({formatRupee(creditCardOutstanding)}) are settled today.
          </p>
        </FinancialCard>

        {/* 4. Largest Asset Category & Concentration */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-950 border border-indigo-800/60 text-indigo-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-300 font-heading">
                Largest Asset Category
              </span>
            </div>
            <Badge variant={assetConcentrationStatus.badgeVariant} size="sm">
              {largestAssetPct}% of Assets
            </Badge>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold text-white truncate max-w-[170px] font-sans">
                {largestAsset.label}
              </span>
              <span className="text-sm font-black text-indigo-300">
                {formatRupee(largestAsset.value)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
              <span>Concentration Status:</span>
              <span className={cn('font-semibold', assetConcentrationStatus.color)}>
                {assetConcentrationStatus.label}
              </span>
            </div>
          </div>

          {onDrillDown && (
            <button
              type="button"
              onClick={() => onDrillDown(largestAsset.key)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors pt-1"
            >
              <span>Explore {largestAsset.label}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </FinancialCard>

        {/* 5. Largest Liability & Card Debt Share */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-rose-950 border border-rose-800/60 text-rose-400">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-300 font-heading">
                Largest Liability
              </span>
            </div>
            <Badge variant={totalLiabilities > 0 ? 'rose' : 'emerald'} size="sm">
              {totalLiabilities > 0 ? `${largestLiabPct}% of Debt` : 'Zero Debt'}
            </Badge>
          </div>

          <div className="space-y-1 font-mono">
            {largestLiability ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-bold text-white truncate max-w-[170px] font-sans">
                    {largestLiability.label}
                  </span>
                  <span className="text-sm font-black text-rose-400">
                    {formatRupee(largestLiability.value)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                  <span>Card Debt / Total Assets:</span>
                  <span className="font-semibold text-rose-300">{ccLiabilityPctOfAssets}%</span>
                </div>
              </>
            ) : (
              <div className="py-1">
                <span className="text-sm font-bold text-emerald-400 font-sans block">No Active Liabilities</span>
                <span className="text-[11px] text-slate-400 font-sans">100% debt-free capital structure</span>
              </div>
            )}
          </div>

          {largestLiability && onDrillDown && (
            <button
              type="button"
              onClick={() => onDrillDown('liabilities')}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors pt-1"
            >
              <span>Inspect Liability Dues</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </FinancialCard>

        {/* 6. Portfolio Concentration Indicators (Single Stock & Single Bank) */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-purple-950 border border-purple-800/60 text-purple-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-300 font-heading">
                Concentration Indicators
              </span>
            </div>
            <Badge variant={holdingConcentrationStatus.badgeVariant} size="sm">
              Single-Holding Risk
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            {/* Top Holding */}
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Top Single Holding</span>
                <span className="font-bold text-white truncate block max-w-[140px] font-sans">
                  {topHolding.name}
                </span>
              </div>
              <div className="text-right font-mono flex-shrink-0">
                <span className="font-bold text-white block">{formatRupee(topHolding.value)}</span>
                <span className={cn('text-[10px] font-bold', holdingConcentrationStatus.color)}>
                  {topHolding.pct}% of Invs
                </span>
              </div>
            </div>

            {/* Top Bank */}
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Top Bank Balance</span>
                <span className="font-bold text-white truncate block max-w-[140px] font-sans">
                  {topBank.name}
                </span>
              </div>
              <div className="text-right font-mono flex-shrink-0">
                <span className="font-bold text-blue-300 block">{formatRupee(topBank.balance)}</span>
                <span className="text-[10px] font-bold text-blue-400">
                  {topBank.pct}% of Banks
                </span>
              </div>
            </div>
          </div>
        </FinancialCard>
      </div>

      {/* Investment Allocation Sub-Breakdown Strip */}
      {investmentTotal > 0 && (
        <FinancialCard className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20 border border-emerald-500/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white font-heading">
                Investment Sub-Allocation Breakdown
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Total Portfolio:</span>
              <span className="font-bold text-emerald-400">{formatRupee(investmentTotal)}</span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
            {stocksPct > 0 && (
              <div
                style={{ width: `${stocksPct}%`, backgroundColor: '#10b981' }}
                title={`Stocks: ${stocksPct}% (${formatRupee(stocksTotal)})`}
                className="h-full hover:opacity-80 transition-all"
              />
            )}
            {mfPct > 0 && (
              <div
                style={{ width: `${mfPct}%`, backgroundColor: '#3b82f6' }}
                title={`Mutual Funds: ${mfPct}% (${formatRupee(mfTotal)})`}
                className="h-full hover:opacity-80 transition-all"
              />
            )}
            {goldPct > 0 && (
              <div
                style={{ width: `${goldPct}%`, backgroundColor: '#f59e0b' }}
                title={`Gold & SGB: ${goldPct}% (${formatRupee(goldSgbTotal)})`}
                className="h-full hover:opacity-80 transition-all"
              />
            )}
            {otherInvPct > 0 && (
              <div
                style={{ width: `${otherInvPct}%`, backgroundColor: '#8b5cf6' }}
                title={`Other: ${otherInvPct}% (${formatRupee(otherInvTotal)})`}
                className="h-full hover:opacity-80 transition-all"
              />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Stocks</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">{stocksPct}%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Mutual Funds</span>
              </div>
              <span className="font-mono font-bold text-blue-400">{mfPct}%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Gold &amp; SGB</span>
              </div>
              <span className="font-mono font-bold text-amber-400">{goldPct}%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">Other / Debt</span>
              </div>
              <span className="font-mono font-bold text-purple-400">{otherInvPct}%</span>
            </div>
          </div>
        </FinancialCard>
      )}
    </div>
  );
};
