import React from 'react';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  CreditCard,
  Receipt,
  ShieldCheck,
  Coins,
  Building2,
  Landmark,
  Wallet,
  Scale,
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
import { cn } from '../../utils/cn';

interface CompositionAndHealthSectionProps {
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

export const CompositionAndHealthSection: React.FC<CompositionAndHealthSectionProps> = ({
  netWorth = 0,
  totalAssets = 0,
  totalLiabilities = 0,
  cashHoldings = [],
  bankAccounts = [],
  fixedDeposits = [],
  wallets = [],
  investments = [],
  creditCards = [],
  khatabookEntries = [],
  className,
}) => {
  const activeCash = (cashHoldings || []).filter((c) => c?.status === 'active');
  const activeBanks = (bankAccounts || []).filter((b) => b?.status === 'active');
  const activeFds = (fixedDeposits || []).filter((f) => f?.status === 'active');
  const activeWallets = (wallets || []).filter((w) => w?.status === 'active');
  const activeInvs = (investments || []).filter((i) => i?.status === 'active');
  const activeCards = (creditCards || []).filter((c) => c?.status === 'active');
  const activeKhatabook = (khatabookEntries || []).filter((k) => k?.status === 'active' && !k.isSettled);

  // Calculations
  const cashVal = activeCash.reduce((s, c) => s + Math.max(0, Number(c?.balance || 0)), 0);
  const bankVal = activeBanks.reduce((s, b) => s + Math.max(0, Number(b?.balance || 0)), 0);
  const fdVal = activeFds.reduce((s, f) => s + Math.max(0, Number(f?.balance || 0)), 0);
  const walletVal = activeWallets.reduce((s, w) => s + Math.max(0, Number(w?.balance || 0)), 0);
  const liquidFunds = cashVal + bankVal + walletVal;

  const invSummary = calculateTotalInvestmentProfitLoss(activeInvs);
  const invAllocation = calculateInvestmentAllocation(activeInvs);

  const totalCreditLimit = calculateTotalCreditLimit(activeCards);
  const totalAvailableCredit = calculateTotalAvailableCredit(activeCards);
  const totalOutstandingBalance = calculateTotalCreditOutstanding(activeCards);

  const kbSummary = calculateKhatabookSummary(activeKhatabook);
  const activeKbCount = (kbSummary?.activeReceivablesCount || 0) + (kbSummary?.activePayablesCount || 0);

  const healthMetrics = calculateFinancialHealthMetrics(
    totalAssets,
    totalLiabilities,
    liquidFunds,
    totalCreditLimit,
    totalOutstandingBalance
  );

  const invNwPct = netWorth > 0 ? Math.round((invSummary.totalCurrent / netWorth) * 1000) / 10 : 0;
  const ccAssetPct = totalAssets > 0 ? Math.round((totalOutstandingBalance / totalAssets) * 1000) / 10 : 0;

  return (
    <div className={cn('space-y-4', className)} id="composition-and-domain-contributions">
      {/* 1. Four Domain Contribution Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* A. Investment Contribution Card (Step 7D connection) */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/25 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">
                  Investments & Portfolio
                </h4>
                <p className="text-[11px] text-slate-400">
                  {activeInvs.length} active holdings across asset classes
                </p>
              </div>
            </div>
            <Badge variant="cyan" size="sm">
              {invNwPct}% of Net Worth
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Current Value</span>
              <span className="font-bold text-white text-xs sm:text-sm">
                {formatRupee(invSummary.totalCurrent)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Invested</span>
              <span className="text-slate-300 font-medium text-xs">
                {formatRupee(invSummary.totalInvested)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Unrealized P/L</span>
              <span
                className={cn(
                  'font-bold text-xs sm:text-sm',
                  invSummary.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {invSummary.profitLoss >= 0 ? '+' : ''}{formatRupee(invSummary.profitLoss)}
              </span>
            </div>
          </div>

          {/* Mini Allocation Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-cyan-300">
              Stocks: {invAllocation.byAssetType['STOCK']?.percentage || 0}%
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-blue-300">
              ETF: {invAllocation.byAssetType['ETF']?.percentage || 0}%
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-emerald-300">
              MF: {invAllocation.byAssetType['MUTUAL_FUND']?.percentage || 0}%
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-amber-300">
              Gold/SGB: {Math.round(((invAllocation.byAssetType['GOLD']?.percentage || 0) + (invAllocation.byAssetType['SGB']?.percentage || 0)) * 10) / 10}%
            </span>
          </div>
        </FinancialCard>

        {/* B. Credit Cards Contribution Card (Step 6D connection) */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20 border border-rose-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">
                  Credit Cards & Limits
                </h4>
                <p className="text-[11px] text-slate-400">
                  {activeCards.length} cards with ₹{totalCreditLimit.toLocaleString('en-IN')} total limit
                </p>
              </div>
            </div>
            <Badge variant={healthMetrics.creditUtilizationRatio > 30 ? 'gold' : 'emerald'} size="sm">
              {healthMetrics.creditUtilizationRatio}% Limit Used
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Outstanding</span>
              <span className="font-bold text-rose-400 text-xs sm:text-sm">
                {formatRupee(totalOutstandingBalance)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Available Limit</span>
              <span className="text-emerald-400 font-medium text-xs">
                {formatRupee(totalAvailableCredit)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Debt vs Assets</span>
              <span className="font-bold text-slate-200 text-xs sm:text-sm">
                {ccAssetPct}%
              </span>
            </div>
          </div>

          <ProgressBar
            value={totalOutstandingBalance}
            max={totalCreditLimit || 1}
            label={`Limit Utilization: ${healthMetrics.creditUtilizationRatio}%`}
            variant={healthMetrics.creditUtilizationRatio > 30 ? 'gold' : 'emerald'}
            size="sm"
          />
        </FinancialCard>

        {/* C. Khatabook Contribution Card (Step 8B connection) */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/20 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">
                  Dues & Receivables (Lending / Borrowing)
                </h4>
                <p className="text-[11px] text-slate-400">
                  {activeKbCount} unsettled peer party entries
                </p>
              </div>
            </div>
            <Badge variant={kbSummary.netPosition >= 0 ? 'emerald' : 'gold'} size="sm">
              Net {kbSummary.netPosition >= 0 ? '+' : ''}{formatRupee(kbSummary.netPosition)}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Receivables (Asset)</span>
              <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                {formatRupee(kbSummary.totalReceivables)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Payables (Debt)</span>
              <span className="text-rose-400 font-bold text-xs sm:text-sm">
                {formatRupee(kbSummary.totalPayables)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Overdue Count</span>
              <span className="font-bold text-amber-400 text-xs sm:text-sm">
                {kbSummary.overdueCount} {kbSummary.overdueCount === 1 ? 'Party' : 'Parties'}
              </span>
            </div>
          </div>
        </FinancialCard>

        {/* D. Factual Financial Health Ratios (Requirement 26) */}
        <FinancialCard className="p-4 sm:p-5 space-y-3 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 border border-indigo-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">
                  Financial Balance & Liquidity Ratios
                </h4>
                <p className="text-[11px] text-slate-400">
                  Strictly factual balance sheet proportion metrics
                </p>
              </div>
            </div>
            <Badge variant="cyan" size="sm">
              Factual Ratios
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Solvency Ratio</span>
              <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                {healthMetrics.solvencyRatio}%
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Debt / Assets</span>
              <span className="font-bold text-slate-200 text-xs sm:text-sm">
                {healthMetrics.debtToAssetRatio}%
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Liquid Coverage</span>
              <span className="font-bold text-cyan-300 text-xs sm:text-sm">
                {healthMetrics.liquidCoveragePercentage}%
              </span>
            </div>
          </div>
        </FinancialCard>
      </div>
    </div>
  );
};
