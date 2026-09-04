import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Banknote,
  Building2,
  CreditCard,
  TrendingUp,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  LayoutGrid,
  Layers,
  PieChart,
  LineChart,
} from 'lucide-react';
import { NetWorthHero } from '../../components/financial/NetWorthHero';
import { AssetLiabilityGrid } from '../../components/financial/AssetLiabilityGrid';
import { PortfolioDistributionDonut } from '../../components/financial/PortfolioDistributionDonut';
import { NetWorthTrendChart } from '../../components/financial/NetWorthTrendChart';
import { CreditCardVisual } from '../../components/financial/CreditCardVisual';
import { AccountCard } from '../../components/financial/AccountCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { QuickAction } from '../../components/ui/QuickAction';
import { Skeleton } from '../../components/ui/Skeleton';
import { TimePeriod } from '../../types/navigation';
import { useFinancialData } from '../../context/FinancialDataContext';
import { CashDenominationEditorModal } from '../../components/cash/CashDenominationEditorModal';
import { KhatabookHomeWidget } from '../../components/khatabook/KhatabookHomeWidget';
import { AddKhatabookEntryModal } from '../../components/khatabook/AddKhatabookEntryModal';
import { KhatabookSettlementModal } from '../../components/khatabook/KhatabookSettlementModal';
import { DashboardCustomizationModal } from '../../components/dashboard/DashboardCustomizationModal';
import { QuickFinancialSnapshot } from '../../components/dashboard/QuickFinancialSnapshot';
import { AndroidWidgetModal } from '../../components/widgets/AndroidWidgetModal';
import { FinancialHealthSummary } from '../../components/dashboard/FinancialHealthSummary';
import { AvailableCashCommitmentsCard } from '../../components/dashboard/AvailableCashCommitmentsCard';
import { ActionRequiredAlerts } from '../../components/dashboard/ActionRequiredAlerts';
import { UpcomingCommitmentsTimeline } from '../../components/dashboard/UpcomingCommitmentsTimeline';
import { DataHealthIndicator } from '../../components/dashboard/DataHealthIndicator';
import { KhatabookEntry, DashboardCardId, DashboardPresetKey } from '../../types';
import { formatRupee, formatFinancialDate, formatPercentage, formatPriceUpdatedTime, formatLastSyncedTime } from '../../utils/formatters';
import {
  calculateCardBillingCycle,
  getCreditUtilizationInfo,
  calculateTotalInvestmentProfitLoss,
  calculateTotalInvestmentValue,
  getHoldingCategoryCounts,
} from '../../services/calculations';
import { auditFinancialDataIntegrity } from '../../services/reconciliationService';
import {
  getResolvedDashboardLayout,
  getCardDefinition,
  DEFAULT_DASHBOARD_ORDER,
  DASHBOARD_PRESETS,
} from '../../services/dashboardConfig';
import { cn } from '../../utils/cn';

const dashboardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const dashboardItemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface HomePageProps {
  onQuickUpdateClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onQuickUpdateClick }) => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [isCashModalOpen, setIsCashModalOpen] = useState<boolean>(false);
  const [isAddKhatabookOpen, setIsAddKhatabookOpen] = useState<boolean>(false);
  const [settleKhatabookTarget, setSettleKhatabookTarget] = useState<KhatabookEntry | null>(null);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState<boolean>(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [snapshotHeroMode, setSnapshotHeroMode] = useState<'net_worth' | 'cashflow'>('net_worth');

  const {
    isLoading,
    portfolioSummary,
    totalAssets,
    totalLiabilities,
    netWorth,
    bankAccounts,
    fixedDeposits,
    cashHoldings,
    wallets,
    creditCards,
    creditLimitGroups,
    creditPosition,
    investments,
    sips,
    khatabookEntries,
    snapshots,
    settings,
    lastSyncedAt,
    isSyncing,
    refreshAllData,
    updateUserSettings,
  } = useFinancialData();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Resolved layout from settings
  const resolvedLayout = getResolvedDashboardLayout(settings);
  const { cardOrder, hiddenCards, visibleCards, preset } = resolvedLayout;

  // Dynamic values depending on period selection
  const getPeriodMultiplier = (period: TimePeriod) => {
    switch (period) {
      case '1M': return { changeAmount: 18420, changePct: 3.96 };
      case '3M': return { changeAmount: 37075, changePct: 8.32 };
      case '6M': return { changeAmount: 83775, changePct: 20.99 };
      case '1Y': return { changeAmount: 100475, changePct: 26.27 };
      case 'ALL': return { changeAmount: 135400, changePct: 38.96 };
    }
  };

  const periodStats = getPeriodMultiplier(selectedPeriod);

  const activeBanks = (bankAccounts || []).filter((b) => b?.status === 'active');
  const activeFds = (fixedDeposits || []).filter((f) => f?.status === 'active');
  const activeCash = (cashHoldings || []).filter((c) => c?.status === 'active');
  const activeWallets = (wallets || []).filter((w) => w?.status === 'active');
  const activeCards = (creditCards || []).filter((c) => c?.status === 'active');
  const activeInvs = (investments || []).filter((i) => i?.status === 'active');
  const activeReceivables = (khatabookEntries || []).filter((k) => k?.status === 'active' && k?.type === 'receivable' && !k?.isSettled);
  const activePayables = (khatabookEntries || []).filter((k) => k?.status === 'active' && k?.type === 'payable' && !k?.isSettled);

  const cashTotal = activeCash.reduce((s, c) => s + Math.max(0, Number(c?.balance || 0)), 0);
  const bankTotal =
    activeBanks.reduce((s, b) => s + Math.max(0, Number(b?.balance || 0)), 0) +
    activeFds.reduce((s, f) => s + Math.max(0, Number(f?.balance !== undefined && f?.balance !== null ? f.balance : f?.principal || 0)), 0);
  const walletTotal = activeWallets.reduce((s, w) => s + Math.max(0, Number(w?.balance || 0)), 0);
  const investmentTotal = calculateTotalInvestmentValue(activeInvs);
  const receivablesTotal = activeReceivables.reduce((s, r) => s + Math.max(0, Number(r?.amount || 0)), 0);
  const creditCardTotal = activeCards.reduce((s, c) => s + Math.max(0, Number(c?.outstanding !== undefined ? c.outstanding : c?.outstandingBalance || 0)), 0);
  const payablesTotal = activePayables.reduce((s, p) => s + Math.max(0, Number(p?.amount || 0)), 0);

  // Compute nearest due card
  const nearestDueInfo = React.useMemo(() => {
    if (activeCards.length === 0) return null;
    const cardsWithDue = activeCards
      .map((c) => {
        const cycle = calculateCardBillingCycle(c);
        const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
        return { card: c, cycle, out };
      })
      .filter((i) => i.out > 0)
      .sort((a, b) => a.cycle.daysUntilDue - b.cycle.daysUntilDue);

    if (cardsWithDue.length === 0) return null;
    return cardsWithDue[0];
  }, [activeCards]);

  const utilInfo = getCreditUtilizationInfo(creditPosition.totalUtilization);

  // Investment summary metrics
  const investmentValuation = React.useMemo(() => {
    const summary = calculateTotalInvestmentProfitLoss(activeInvs);

    // Latest price update timestamp
    let latestTimestamp: string | null = null;
    activeInvs.forEach((inv) => {
      const ts = inv.priceUpdatedAt || inv.updatedAt;
      if (ts && (!latestTimestamp || new Date(ts).getTime() > new Date(latestTimestamp).getTime())) {
        latestTimestamp = ts;
      }
    });

    return {
      totalVal: summary.totalCurrent,
      totalInvested: summary.totalInvested,
      totalPnl: summary.profitLoss,
      totalRetPct: summary.returnPercentage,
      isPositive: summary.profitLoss >= 0,
      latestTimestamp,
    };
  }, [activeInvs]);

  // Holding category counts (stocks, ETFs, mutual funds, gold)
  const holdingCounts = React.useMemo(
    () => getHoldingCategoryCounts(activeInvs),
    [activeInvs]
  );

  // Cashflow calculations for Quick Snapshot
  const cashflowMetrics = React.useMemo(() => {
    const fdMonthlyYield = Math.round(
      activeFds.reduce((sum, fd) => {
        const principal = Number(fd.principal || fd.balance || 0);
        const rate = Number(fd.interestRate || 0);
        return sum + (principal * (rate / 100)) / 12;
      }, 0)
    );
    const estimatedBaseSalary = 125000;
    const monthlyInflow = estimatedBaseSalary + fdMonthlyYield + Math.min(12450, receivablesTotal);
    const monthlyOutflow = Math.max(38000, creditCardTotal + Math.min(25000, payablesTotal) + 24000);
    const monthlyNetCashflow = monthlyInflow - monthlyOutflow;
    const savingsRate = monthlyInflow > 0 ? Math.max(0, Math.min(100, Math.round((monthlyNetCashflow / monthlyInflow) * 100))) : 54;

    return {
      fdMonthlyYield,
      monthlyInflow,
      monthlyOutflow,
      monthlyNetCashflow,
      savingsRate,
    };
  }, [activeFds, receivablesTotal, creditCardTotal, payablesTotal]);

  // Comprehensive Financial Integrity & Reconciliation Audit (SSOT across all modules)
  const reconciliationReport = React.useMemo(() => {
    return auditFinancialDataIntegrity({
      bankAccounts,
      fixedDeposits,
      cashHoldings,
      wallets,
      creditCards,
      creditLimitGroups,
      investments,
      sips,
      khatabookEntries,
      totalAssets,
      totalLiabilities,
      netWorth,
      portfolioSummary,
      creditPosition,
    });
  }, [
    bankAccounts,
    fixedDeposits,
    cashHoldings,
    wallets,
    creditCards,
    creditLimitGroups,
    investments,
    sips,
    khatabookEntries,
    totalAssets,
    totalLiabilities,
    netWorth,
    portfolioSummary,
    creditPosition,
  ]);

  // Quick inline move handler for live edit mode
  const handleInlineMove = async (cardId: DashboardCardId, direction: 'up' | 'down') => {
    const currentIndex = cardOrder.indexOf(cardId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= cardOrder.length) return;

    const newOrder = [...cardOrder];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    await updateUserSettings({
      dashboardCardOrder: newOrder,
      dashboardPreset: 'custom',
    });
    showToast(`✓ Moved "${getCardDefinition(cardId).title}" ${direction}`);
  };

  // Quick inline hide handler for live edit mode
  const handleInlineHide = async (cardId: DashboardCardId) => {
    if (visibleCards.length <= 1 && !hiddenCards.has(cardId)) {
      showToast('At least 1 card must remain visible on the dashboard');
      return;
    }

    const nextHidden = new Set(hiddenCards);
    if (nextHidden.has(cardId)) {
      nextHidden.delete(cardId);
      showToast(`✓ Unhid "${getCardDefinition(cardId).title}"`);
    } else {
      nextHidden.add(cardId);
      showToast(`✓ Hidden "${getCardDefinition(cardId).title}"`);
    }

    await updateUserSettings({
      hiddenDashboardCards: Array.from(nextHidden),
      dashboardPreset: 'custom',
    });
  };

  if (isLoading) {
    return (
      <div id="afinity-home-page-loading" className="space-y-6 sm:space-y-8 animate-pulse">
        <Skeleton className="h-64 sm:h-72 w-full rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  // Render individual card content by ID
  const renderCardContent = (cardId: DashboardCardId) => {
    switch (cardId) {
      case 'quick_financial_snapshot':
        return (
          <QuickFinancialSnapshot
            onQuickUpdateClick={onQuickUpdateClick}
            onOpenWidgetCompanion={() => setIsWidgetModalOpen(true)}
          />
        );

      case 'financial_health_summary':
        return <FinancialHealthSummary />;

      case 'action_required':
        return <ActionRequiredAlerts />;

      case 'safe_cash_commitments':
        return <AvailableCashCommitmentsCard />;

      case 'upcoming_30_days':
        return <UpcomingCommitmentsTimeline />;

      case 'net_worth_hero':
        return (
          <NetWorthHero
            netWorth={netWorth}
            changeAmount={periodStats.changeAmount}
            changePercentage={periodStats.changePct}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            lastUpdated={`Synced ${formatLastSyncedTime(lastSyncedAt)}`}
            onQuickUpdate={onQuickUpdateClick}
            snapshots={snapshots}
            snapshotMode={snapshotHeroMode}
            onSnapshotModeChange={setSnapshotHeroMode}
            monthlyInflow={cashflowMetrics.monthlyInflow}
            monthlyOutflow={cashflowMetrics.monthlyOutflow}
            monthlyNetCashflow={cashflowMetrics.monthlyNetCashflow}
            savingsRate={cashflowMetrics.savingsRate}
            fdMonthlyYield={cashflowMetrics.fdMonthlyYield}
            creditCardDues={creditCardTotal}
            receivablesDue={receivablesTotal}
            payablesDue={payablesTotal}
          />
        );

      case 'quick_actions':
        return (
          <div>
            <SectionHeader
              title="Quick Vault Actions"
              subtitle="Fast balance adjustments and transaction logging"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <QuickAction
                label="Physical Cash"
                sublabel="Notes & Denominations"
                icon={Banknote}
                iconColor="gold"
                onClick={() => setIsCashModalOpen(true)}
              />
              <QuickAction
                label="Bank Balance"
                sublabel="Update closing"
                icon={Building2}
                iconColor="blue"
                onClick={onQuickUpdateClick}
              />
              <QuickAction
                label="Credit Dues"
                sublabel="Bill & limits"
                icon={CreditCard}
                iconColor="coral"
                onClick={() => navigate('/credit')}
              />
              <QuickAction
                label="Investments"
                sublabel="Valuation check"
                icon={TrendingUp}
                iconColor="emerald"
                onClick={() => navigate('/investments')}
              />
            </div>
          </div>
        );

      case 'asset_liability_grid':
        return (
          <AssetLiabilityGrid
            cashTotal={cashTotal}
            bankTotal={bankTotal}
            walletTotal={walletTotal}
            investmentTotal={investmentTotal}
            receivablesTotal={receivablesTotal}
            creditCardTotal={creditCardTotal}
            payablesTotal={payablesTotal}
            onSelectCategory={(cat) => {
              if (cat === 'credit_cards') navigate('/credit');
              else if (cat === 'investments') navigate('/investments');
              else navigate('/accounts');
            }}
          />
        );

      case 'asset_distribution':
        return (
          <PortfolioDistributionDonut
            cashTotal={cashTotal}
            bankTotal={bankTotal}
            walletTotal={walletTotal}
            investmentTotal={investmentTotal}
            receivablesTotal={receivablesTotal}
            creditCardTotal={creditCardTotal}
            payablesTotal={payablesTotal}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            netWorth={netWorth}
          />
        );

      case 'net_worth_trend':
        return (
          <NetWorthTrendChart
            snapshots={snapshots}
            currentNetWorth={netWorth}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
          />
        );

      case 'investments_summary':
        if (activeInvs.length === 0) return null;
        return (
          <div className="space-y-3">
            <SectionHeader
              title="Investment Portfolio"
              subtitle="Market valuation, unrealized returns, and asset class holdings"
              actionText={`Holdings (${activeInvs.length})`}
              onActionClick={() => navigate('/investments')}
            />

            <div
              id="home-investment-summary-card"
              onClick={() => navigate('/investments')}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-slate-900 border border-cyan-500/30 hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg group space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform flex-shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading">
                        Investment Value
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-md font-bold font-mono border ${
                          investmentValuation.isPositive
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                            : 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                        }`}
                      >
                        {investmentValuation.isPositive ? '+' : ''}
                        {formatPercentage(investmentValuation.totalRetPct, true)}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-0.5">
                      {formatRupee(investmentValuation.totalVal)}
                    </div>
                  </div>
                </div>

                {/* Profit/Loss & Invested Status */}
                <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Invested Amount</span>
                    <div className="text-xs sm:text-sm font-bold font-mono text-slate-200 mt-0.5">
                      {formatRupee(investmentValuation.totalInvested)}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Profit / Loss</span>
                    <div
                      className={`text-xs sm:text-sm font-bold font-mono mt-0.5 ${
                        investmentValuation.isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {investmentValuation.isPositive ? '+' : ''}
                      {formatRupee(investmentValuation.totalPnl)}
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:bg-cyan-600 group-hover:text-white transition-all flex-shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Number of Stocks, ETFs, Mutual Funds Pill Strip */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                <div className="px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-1.5">
                  <span className="text-slate-400">Stocks:</span>
                  <span className="font-mono font-bold text-cyan-400">{holdingCounts.stocksCount}</span>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-1.5">
                  <span className="text-slate-400">ETFs:</span>
                  <span className="font-mono font-bold text-blue-400">{holdingCounts.etfCount}</span>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-1.5">
                  <span className="text-slate-400">Mutual Funds:</span>
                  <span className="font-mono font-bold text-emerald-400">{holdingCounts.mfCount}</span>
                </div>
                {holdingCounts.goldCount > 0 && (
                  <div className="px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-1.5">
                    <span className="text-slate-400">Gold / SGB:</span>
                    <span className="font-mono font-bold text-amber-300">{holdingCounts.goldCount}</span>
                  </div>
                )}
                {investmentValuation.latestTimestamp && (
                  <span className="text-[10px] text-slate-500 ml-auto hidden sm:inline">
                    Updated {formatPriceUpdatedTime(investmentValuation.latestTimestamp)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 'credit_cards_summary':
        if (activeCards.length === 0) return null;
        return (
          <div className="space-y-3">
            <SectionHeader
              title="Credit Cards & Dues"
              subtitle="Live exposure, overall utilization, and upcoming statement deadlines"
              actionText={`Command Center (${activeCards.length})`}
              onActionClick={() => navigate('/credit')}
            />

            {/* Compact Credit Summary Widget */}
            <div
              onClick={() => navigate('/credit')}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900/90 to-slate-900 border border-rose-500/30 hover:border-rose-500/50 transition-all cursor-pointer shadow-lg group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform flex-shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading">
                        Credit Outstanding
                      </span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-md font-bold border ${utilInfo.badgeClass}`}>
                        {creditPosition.totalUtilization}% Utilized
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-0.5">
                      {formatRupee(creditPosition.totalCreditLiability)}
                    </div>
                  </div>
                </div>

                {/* Nearest Due Date or Status */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Nearest Payment Deadline</span>
                    {nearestDueInfo ? (
                      <div className="text-xs font-bold text-slate-200 mt-0.5">
                        <span className={nearestDueInfo.cycle.daysUntilDue <= 3 ? 'text-amber-300 font-extrabold' : 'text-slate-200'}>
                          {nearestDueInfo.cycle.currentDueDate ? formatFinancialDate(nearestDueInfo.cycle.currentDueDate) : 'Due Soon'}
                        </span>
                        <span className="text-slate-400 font-normal"> • {nearestDueInfo.card.displayName || nearestDueInfo.card.cardName}</span>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center sm:justify-end gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>All Dues Settled</span>
                      </div>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:bg-rose-600 group-hover:text-white transition-all flex-shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Top 2 Cards Visual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {activeCards.slice(0, 2).map((card) => (
                <CreditCardVisual
                  key={card.id}
                  card={card}
                  onClick={() => navigate('/credit')}
                />
              ))}
            </div>
          </div>
        );

      case 'bank_accounts_summary':
        if (activeBanks.length === 0) return null;
        return (
          <div>
            <SectionHeader
              title="Primary Bank Accounts"
              subtitle="Core operational checking and savings accounts"
              actionText="View all"
              onActionClick={() => navigate('/accounts')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeBanks.slice(0, 2).map((bank) => (
                <AccountCard
                  key={bank.id}
                  account={bank}
                  onClick={() => navigate('/accounts')}
                  badge="Active Bank"
                  badgeVariant="blue"
                />
              ))}
            </div>
          </div>
        );

      case 'khatabook_widget':
        return (
          <KhatabookHomeWidget
            onNavigateToKhatabook={() => navigate('/accounts')}
            onAddEntry={() => setIsAddKhatabookOpen(true)}
            onSettleEntry={(entry) => setSettleKhatabookTarget(entry)}
          />
        );

      default:
        return null;
    }
  };

  const cardsToRender = isEditMode
    ? cardOrder // in edit mode, show all cards so user can reorder and unhide
    : visibleCards;

  return (
    <motion.div
      id="afinity-home-page"
      variants={dashboardContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-5"
    >
      {/* Dashboard Top Customization Utility Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-bold font-heading">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="capitalize">{preset} Layout</span>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {visibleCards.length} of {cardOrder.length} cards active
          </span>

          {hiddenCards.size > 0 && !isEditMode && (
            <span className="text-[11px] text-amber-400/90 font-mono bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-800/40">
              {hiddenCards.size} hidden
            </span>
          )}

          {/* Financial Data Reconciliation & Accuracy Indicator */}
          <DataHealthIndicator
            report={reconciliationReport}
            onRefresh={() => refreshAllData()}
          />

          {/* Quick Status Pill */}
          <button
            type="button"
            onClick={() => refreshAllData()}
            disabled={isSyncing}
            title="IndexedDB Local Vault Status. Click to refresh."
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-400/90 font-medium">
              {isSyncing ? 'Syncing...' : `Synced ${formatLastSyncedTime(lastSyncedAt)}`}
            </span>
            <RefreshCw className={cn('w-2.5 h-2.5 text-slate-500', isSyncing && 'animate-spin text-cyan-400')} />
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Toggle In-Place Live Reorder Mode */}
          <button
            type="button"
            id="dashboard-live-edit-mode-btn"
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border',
              isEditMode
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
            )}
          >
            {isEditMode ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                <span>Quick Reorder</span>
              </>
            )}
          </button>

          {/* Full Customization Modal Trigger */}
          <button
            type="button"
            id="dashboard-customize-modal-trigger-btn"
            onClick={() => setIsCustomizeModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Customize Layout</span>
          </button>
        </div>
      </div>

      {/* Live Customization Active Banner */}
      {isEditMode && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/60 shadow-lg flex items-center justify-between gap-3 text-xs animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0">
              <GripVertical className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white font-heading">
                Live Reorder &amp; Toggle Mode Active
              </p>
              <p className="text-[11px] text-cyan-200/80">
                Use the top-right controls on each card below to reorder with arrows or toggle visibility.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsCustomizeModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Preset Manager
            </button>
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="px-3 py-1 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Ordered Summary Cards List */}
      {cardsToRender.map((cardId, index) => {
        const isCardHidden = hiddenCards.has(cardId);
        const cardDef = getCardDefinition(cardId);
        const cardContent = renderCardContent(cardId);

        if (!cardContent && !isEditMode) return null;

        return (
          <motion.div
            key={cardId}
            variants={dashboardItemVariants}
            className={cn(
              'relative transition-all',
              isEditMode && 'p-3 sm:p-4 rounded-2xl border border-cyan-500/40 bg-slate-900/40 ring-1 ring-cyan-500/20',
              isEditMode && isCardHidden && 'opacity-60 border-dashed border-slate-700 bg-slate-950/60'
            )}
          >
            {/* Inline Card Customization Header Bar (Visible in Edit Mode) */}
            {isEditMode && (
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800/80 bg-slate-950/70 p-2.5 rounded-2xl">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-[11px] font-bold">
                    #{index + 1}
                  </span>
                  <span className="text-xs font-bold text-white font-heading truncate">
                    {cardDef.title}
                  </span>
                  {isCardHidden && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800/40">
                      Hidden from Dashboard
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleInlineMove(cardId, 'up')}
                    disabled={index === 0}
                    title="Move up"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInlineMove(cardId, 'down')}
                    disabled={index === cardOrder.length - 1}
                    title="Move down"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInlineHide(cardId)}
                    title={isCardHidden ? 'Show card on dashboard' : 'Hide card from dashboard'}
                    className={cn(
                      'px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border',
                      isCardHidden
                        ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        : 'bg-cyan-950 text-cyan-300 border-cyan-800 hover:bg-cyan-900'
                    )}
                  >
                    {isCardHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isCardHidden ? 'Show' : 'Hide'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Card Main Render */}
            {cardContent}
          </motion.div>
        );
      })}

      {/* Hidden Cards Indicator Footer when not in edit mode */}
      {hiddenCards.size > 0 && !isEditMode && (
        <div className="p-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>
              {hiddenCards.size} card{hiddenCards.size > 1 ? 's are' : ' is'} currently hidden based on your custom preferences.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCustomizeModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
          >
            Manage Card Visibility
          </button>
        </div>
      )}

      {/* Full Dashboard Customization Modal */}
      <DashboardCustomizationModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        onSuccessToast={(msg) => showToast(msg)}
      />

      {/* Add Khatabook Entry Modal */}
      <AddKhatabookEntryModal
        isOpen={isAddKhatabookOpen}
        onClose={() => setIsAddKhatabookOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Settle Khatabook Modal */}
      <KhatabookSettlementModal
        isOpen={!!settleKhatabookTarget}
        entry={settleKhatabookTarget}
        onClose={() => setSettleKhatabookTarget(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Cash Denomination Recount Modal */}
      <CashDenominationEditorModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Android Widget Companion Modal */}
      <AndroidWidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#0f1d35] border border-cyan-500/50 shadow-2xl text-xs font-bold text-white">
          {toastMessage}
        </div>
      )}
    </motion.div>
  );
};

