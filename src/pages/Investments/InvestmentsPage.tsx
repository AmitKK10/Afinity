import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  PieChart,
  Sparkles,
  Plus,
  Search,
  SlidersHorizontal,
  Layers,
  Archive,
  RefreshCw,
  Wallet,
  Building2,
  Coins,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Settings2,
  AlertCircle,
  WifiOff,
  FileText,
  Calendar,
} from 'lucide-react';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { FinancialCard } from '../../components/ui/FinancialCard';
import { MoneyDisplay } from '../../components/ui/MoneyDisplay';
import { Badge } from '../../components/ui/Badge';
import { SelectField } from '../../components/ui/SelectionSheet';
import { AddInvestmentModal } from '../../components/forms/AddInvestmentModal';
import { EditInvestmentModal } from '../../components/forms/EditInvestmentModal';
import { UpdateInvestmentPriceModal } from '../../components/forms/UpdateInvestmentPriceModal';
import { InvestmentPriceHistoryModal } from '../../components/forms/InvestmentPriceHistoryModal';
import { AddIPOModal } from '../../components/forms/AddIPOModal';
import { PriceRefreshSettingsModal } from '../../components/financial/PriceRefreshSettingsModal';
import { PriceRefreshSummaryModal } from '../../components/financial/PriceRefreshSummaryModal';
import { InvestmentHoldingCard } from '../../components/financial/InvestmentHoldingCard';
import { IPOHoldingCard } from '../../components/financial/IPOHoldingCard';
import { GrowwBalanceCard } from '../../components/financial/GrowwBalanceCard';
import { InvestmentAllocationCard } from '../../components/financial/InvestmentAllocationCard';
import { InvestmentTrendChart } from '../../components/financial/InvestmentTrendChart';
import { InvestmentPerformanceSection } from '../../components/financial/InvestmentPerformanceSection';
import { InvestmentDetailModal } from '../../components/financial/InvestmentDetailModal';
import { SIPSafetyAlertBanner } from '../../components/investments/SIPSafetyAlertBanner';
import { SIPSafetyDashboard } from '../../components/investments/SIPSafetyDashboard';
import { UpcomingSIPTimeline } from '../../components/investments/UpcomingSIPTimeline';
import { PaymentSafetySection } from '../../components/investments/PaymentSafetySection';
import { SIPModal } from '../../components/investments/SIPModal';
import { SIPDetailModal } from '../../components/investments/SIPDetailModal';
import { DeleteSIPModal } from '../../components/investments/DeleteSIPModal';
import { BankTransferModal } from '../../components/banks/BankTransferModal';
import { InvestmentHolding, IPOApplication, PortfolioPriceRefreshSummary, SIPRecord } from '../../types';
import {
  calculateTotalInvestmentValue,
  calculateTotalInvestedAmount,
  calculateTotalInvestmentProfitLoss,
  calculateTotalIPOBlockedFunds,
  calculateInvestmentValue,
  calculateInvestedAmount,
  calculateInvestmentProfitLoss,
  calculateInvestmentReturnPercentage,
  normalizeAssetType,
  categorizeHolding,
  getHoldingCategoryCounts,
} from '../../services/calculations';
import { formatRupee, formatPercentage, formatRelativeTime } from '../../utils/formatters';
import { useFinancialData } from '../../context/FinancialDataContext';
import { cn } from '../../utils/cn';

interface InvestmentsPageProps {
  onQuickUpdateClick?: () => void;
  initialTab?: string;
}

type PrimaryTab = 'holdings' | 'sips' | 'upcoming' | 'safety';
type HoldingCategoryTab = 'all' | 'stock' | 'etf' | 'mutual_fund' | 'gold' | 'unlisted' | 'other' | 'ipo' | 'groww' | 'archived';
type SortOption = 'value_desc' | 'profit_desc' | 'loss_desc' | 'return_desc' | 'name_asc';

export const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ onQuickUpdateClick, initialTab }) => {
  const {
    investments,
    ipoApplications,
    wallets,
    settings,
    snapshots,
    sips,
    activeSIPs,
    stoppedSIPs,
    sipSafetyReport,
    bankAccounts,
    isOffline,
    isPriceRefreshing,
    lastPriceRefreshSummary,
    refreshInvestmentPrices,
    updateInvestment,
    updateInvestmentPrice,
    archiveInvestment,
    restoreInvestment,
    deleteInvestment,
    addIPOApplication,
    updateIPOApplication,
    archiveIPOApplication,
    restoreIPOApplication,
    deleteIPOApplication,
    addSIP,
    updateSIP,
    toggleSIPStatus,
    deleteSIP,
    refreshSIPSafety,
  } = useFinancialData();

  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  // Determine initial primary and sub-category tabs
  const getInitialTabs = (): { primary: PrimaryTab; category: HoldingCategoryTab } => {
    const rawTab = initialTab || urlTab;
    if (rawTab === 'sips') return { primary: 'sips', category: 'all' };
    if (rawTab === 'upcoming') return { primary: 'upcoming', category: 'all' };
    if (rawTab === 'safety' || rawTab === 'payment_safety') return { primary: 'safety', category: 'all' };
    if (rawTab && ['all', 'stock', 'etf', 'mutual_fund', 'gold', 'ipo', 'groww', 'archived'].includes(rawTab)) {
      return { primary: 'holdings', category: rawTab as HoldingCategoryTab };
    }
    return { primary: 'holdings', category: 'all' };
  };

  const initialParsed = getInitialTabs();
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>(initialParsed.primary);
  const [holdingCategory, setHoldingCategory] = useState<HoldingCategoryTab>(initialParsed.category);

  useEffect(() => {
    const rawTab = initialTab || urlTab;
    if (rawTab === 'sips') {
      setPrimaryTab('sips');
    } else if (rawTab === 'upcoming') {
      setPrimaryTab('upcoming');
    } else if (rawTab === 'safety' || rawTab === 'payment_safety') {
      setPrimaryTab('safety');
    } else if (rawTab && ['all', 'stock', 'etf', 'mutual_fund', 'gold', 'ipo', 'groww', 'archived'].includes(rawTab)) {
      setPrimaryTab('holdings');
      setHoldingCategory(rawTab as HoldingCategoryTab);
    }
  }, [initialTab, urlTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('value_desc');

  // Modals state
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [isAddIpoOpen, setIsAddIpoOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [activeSummary, setActiveSummary] = useState<PortfolioPriceRefreshSummary | null>(null);
  const [editingHolding, setEditingHolding] = useState<InvestmentHolding | null>(null);
  const [editingIpo, setEditingIpo] = useState<IPOApplication | null>(null);
  const [priceUpdateHolding, setPriceUpdateHolding] = useState<InvestmentHolding | null>(null);
  const [historyHolding, setHistoryHolding] = useState<InvestmentHolding | null>(null);
  const [detailHolding, setDetailHolding] = useState<InvestmentHolding | null>(null);

  // SIP Modals State
  const [isAddSIPOpen, setIsAddSIPOpen] = useState(false);
  const [selectedSIPForEdit, setSelectedSIPForEdit] = useState<SIPRecord | null>(null);
  const [selectedSIPForDetail, setSelectedSIPForDetail] = useState<SIPRecord | null>(null);
  const [selectedSIPForDelete, setSelectedSIPForDelete] = useState<SIPRecord | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDefaultBankId, setTransferDefaultBankId] = useState<string | undefined>();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleManualRefresh = async (force: boolean = false) => {
    try {
      const result = await refreshInvestmentPrices({ force });
      setActiveSummary(result);
      setIsSummaryModalOpen(true);
      if (result.totalUpdated > 0) {
        showToast(`✓ Updated ${result.totalUpdated} investment holding(s)`);
      } else if (result.totalSkippedDueToInterval > 0 && !force) {
        showToast(`Prices are already up to date (${settings.priceRefreshFrequency || 'twice daily'} mode)`);
      } else if (result.totalFailed > 0) {
        showToast(`Updated with manual fallbacks for unlisted items`);
      } else {
        showToast(`✓ Investment prices are current`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Price refresh failed. Retaining current valuations.');
    }
  };

  // 1. Centralized Calculations
  const activeHoldings = useMemo(
    () => investments.filter((i) => i.status === 'active' || !i.status),
    [investments]
  );
  const archivedHoldings = useMemo(
    () => investments.filter((i) => i.status === 'archived'),
    [investments]
  );

  const activeIpos = useMemo(
    () => ipoApplications.filter((i) => i.status === 'active' || !i.status),
    [ipoApplications]
  );
  const archivedIpos = useMemo(
    () => ipoApplications.filter((i) => i.status === 'archived'),
    [ipoApplications]
  );

  // Groww balance from wallets
  const growwWallet = useMemo(
    () => wallets.find((w) => w.provider === 'Groww' || w.name.toLowerCase().includes('groww')),
    [wallets]
  );
  const growwCashBalance = growwWallet ? growwWallet.balance : 0;

  // Portfolio Totals
  const portfolioTotals = useMemo(() => {
    const totalInvested = calculateTotalInvestedAmount(activeHoldings);
    const totalCurrent = calculateTotalInvestmentValue(activeHoldings);
    const plSummary = calculateTotalInvestmentProfitLoss(activeHoldings);
    const ipoBlocked = calculateTotalIPOBlockedFunds(activeIpos);

    return {
      totalInvested,
      totalCurrent,
      totalPL: plSummary.profitLoss,
      returnPct: plSummary.returnPercentage,
      ipoBlocked,
    };
  }, [activeHoldings, activeIpos]);

  // Helper to categorize holdings reliably without category collision or leakage
  const matchesHoldingCategory = (holding: InvestmentHolding, cat: string) => {
    const norm = categorizeHolding(holding);
    switch (cat) {
      case 'all':
        return true;
      case 'stock':
        return norm === 'STOCK';
      case 'etf':
        return norm === 'ETF';
      case 'mutual_fund':
        return norm === 'MUTUAL_FUND';
      case 'gold':
        return norm === 'GOLD' || norm === 'SGB';
      case 'unlisted':
        return norm === 'UNLISTED_EQUITY';
      case 'other':
        return norm === 'OTHER';
      default:
        return true;
    }
  };

  // Counts by category derived cleanly from getHoldingCategoryCounts (Single Source of Truth)
  const holdingCounts = useMemo(
    () => getHoldingCategoryCounts(activeHoldings),
    [activeHoldings]
  );
  const { stocksCount, etfCount, mfCount, goldCount, unlistedCount, otherCount } = holdingCounts;

  // Count upcoming payments in next 30 days
  const upcomingPaymentsCount = useMemo(() => {
    const list = sipSafetyReport?.sipEvaluations || sipSafetyReport?.evaluations;
    if (!list) return 0;
    return list.filter((e) => !e.isStopped && (e.daysUntil !== undefined ? e.daysUntil <= 30 : e.daysUntilDeduction <= 30)).length;
  }, [sipSafetyReport]);

  // Filtered Holdings
  const displayedHoldings = useMemo(() => {
    let list = holdingCategory === 'archived' ? [...archivedHoldings] : [...activeHoldings];

    if (holdingCategory !== 'all' && holdingCategory !== 'archived') {
      list = list.filter((i) => matchesHoldingCategory(i, holdingCategory));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.displayName && i.displayName.toLowerCase().includes(q)) ||
          (i.symbol && i.symbol.toLowerCase().includes(q)) ||
          (i.ticker && i.ticker.toLowerCase().includes(q)) ||
          (i.broker && i.broker.toLowerCase().includes(q)) ||
          (i.platform && i.platform.toLowerCase().includes(q)) ||
          (i.amfiSchemeCode && i.amfiSchemeCode.toLowerCase().includes(q)) ||
          (i.schemeCode && i.schemeCode.toLowerCase().includes(q)) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const qtyA = Number(a.quantity !== undefined ? a.quantity : a.unitsHeld || 0);
      const qtyB = Number(b.quantity !== undefined ? b.quantity : b.unitsHeld || 0);
      const valA = a.currentValue !== undefined && a.currentValue > 0 ? Number(a.currentValue) : calculateInvestmentValue(qtyA, a.currentPrice || 0);
      const valB = b.currentValue !== undefined && b.currentValue > 0 ? Number(b.currentValue) : calculateInvestmentValue(qtyB, b.currentPrice || 0);
      const invA = a.investedAmount !== undefined && a.investedAmount > 0 ? Number(a.investedAmount) : calculateInvestedAmount(qtyA, a.averageBuyPrice || 0);
      const invB = b.investedAmount !== undefined && b.investedAmount > 0 ? Number(b.investedAmount) : calculateInvestedAmount(qtyB, b.averageBuyPrice || 0);
      const plA = calculateInvestmentProfitLoss(a);
      const plB = calculateInvestmentProfitLoss(b);
      const retA = calculateInvestmentReturnPercentage(invA, valA);
      const retB = calculateInvestmentReturnPercentage(invB, valB);

      switch (sortBy) {
        case 'value_desc':
          return valB - valA;
        case 'profit_desc':
          return plB - plA;
        case 'loss_desc':
          return plA - plB;
        case 'return_desc':
          return retB - retA;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        default:
          return valB - valA;
      }
    });

    return list;
  }, [activeHoldings, archivedHoldings, holdingCategory, searchQuery, sortBy]);

  // Filtered IPO Applications
  const displayedIpos = useMemo(() => {
    let list = holdingCategory === 'archived' ? [...archivedIpos] : [...activeIpos];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.companyName.toLowerCase().includes(q) ||
          i.applicationNo?.toLowerCase().includes(q) ||
          i.broker?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeIpos, archivedIpos, holdingCategory, searchQuery]);

  return (
    <div id="investments-page-root" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. HERO PORTFOLIO VALUE & QUICK ACTIONS */}
      <div className="rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#0a1224] via-[#091630] to-[#060b18] border border-cyan-500/30 shadow-2xl space-y-6">
        {/* Header Title & Top Level Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
                Investment Portfolio & SIPs
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live market valuations, SIP payment safety, and IPO allotment tracker
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Prominent + Add SIP Button */}
            <button
              type="button"
              id="btn-hero-add-sip"
              onClick={() => setIsAddSIPOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition-all hover:scale-102 active:scale-98 cursor-pointer font-heading min-h-[42px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add SIP</span>
            </button>

            <button
              type="button"
              id="btn-hero-add-holding"
              onClick={() => setIsAddHoldingOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all active:scale-98 cursor-pointer min-h-[42px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Holding</span>
            </button>

            <button
              type="button"
              id="btn-hero-track-ipo"
              onClick={() => setIsAddIpoOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all active:scale-98 cursor-pointer min-h-[42px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Track IPO</span>
            </button>
          </div>
        </div>

        {/* Portfolio Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {/* Current Valuation */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Portfolio Value
            </span>
            <MoneyDisplay
              amount={portfolioTotals.totalCurrent}
              size="xl"
              className="font-extrabold text-white"
            />
            <div className="text-[11px] text-slate-500 font-mono">
              Invested: {formatRupee(portfolioTotals.totalInvested)}
            </div>
          </div>

          {/* Overall Profit / Loss */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Returns (P&L)
            </span>
            <div className="flex items-baseline gap-2">
              <MoneyDisplay
                amount={portfolioTotals.totalPL}
                size="xl"
                className={cn(
                  'font-extrabold',
                  portfolioTotals.totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              />
              <span
                className={cn(
                  'text-xs font-mono font-bold px-1.5 py-0.5 rounded',
                  portfolioTotals.totalPL >= 0
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                )}
              >
                {formatPercentage(portfolioTotals.returnPct)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {activeHoldings.length} Active Asset{activeHoldings.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Active SIPs & Monthly Commitment */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active SIP Mandates
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-cyan-300 font-mono">
                {activeSIPs.length}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({stoppedSIPs.length} paused)
              </span>
            </div>
            <div className="text-[11px] text-cyan-400 font-mono truncate">
              {formatRupee(activeSIPs.reduce((sum, s) => sum + s.amount, 0))}/mo commitment
            </div>
          </div>

          {/* IPO Blocked & Groww Cash */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Groww Cash & IPO Funds
            </span>
            <div className="flex items-baseline gap-2">
              <MoneyDisplay
                amount={growwCashBalance}
                size="lg"
                className="font-extrabold text-emerald-300"
              />
              <span className="text-[11px] text-slate-400">Wallet</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              IPO Blocked: {formatRupee(portfolioTotals.ipoBlocked)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY SECTION NAVIGATION TABS (Holdings, SIPs, Upcoming Payments, Payment Safety) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
        {[
          { key: 'holdings' as const, label: 'Holdings', count: activeHoldings.length },
          { key: 'sips' as const, label: 'SIPs', count: sips.length },
          { key: 'upcoming' as const, label: 'Upcoming Payments', count: upcomingPaymentsCount },
          {
            key: 'safety' as const,
            label: 'Payment Safety',
            alert: (sipSafetyReport?.insufficientBankAccounts?.length || 0) > 0,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            id={`nav-tab-${tab.key}`}
            onClick={() => setPrimaryTab(tab.key)}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer font-heading flex items-center gap-2 min-h-[42px]',
              primaryTab === tab.key
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-mono font-bold',
                  primaryTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
            {tab.alert && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* 3. SECTION 1: HOLDINGS VIEW */}
      {primaryTab === 'holdings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Market Price Sync Strip */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#091224]/90 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 shrink-0">
                <RefreshCw className={cn('w-4 h-4', isPriceRefreshing && 'animate-spin text-cyan-300')} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">
                    {isPriceRefreshing
                      ? 'Refreshing Market Prices...'
                      : isOffline
                      ? 'Offline Valuation Mode'
                      : 'Market Data Sync'}
                  </span>

                  {isOffline ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/50">
                      <WifiOff className="w-3 h-3" />
                      Cached Prices
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {settings.priceRefreshFrequency === 'once_daily'
                        ? 'Once Daily (24h)'
                        : settings.priceRefreshFrequency === 'manual_only'
                        ? 'Manual On-Demand'
                        : 'Twice Daily (12h)'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {settings.lastMarketPriceRefreshAt
                    ? `Last synced ${formatRelativeTime(settings.lastMarketPriceRefreshAt)} via AMFI / NSE public feeds`
                    : 'Using initial entry prices. Tap Refresh to fetch latest market quotes.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {lastPriceRefreshSummary && (
                <button
                  type="button"
                  id="btn-view-price-report"
                  onClick={() => {
                    setActiveSummary(lastPriceRefreshSummary);
                    setIsSummaryModalOpen(true);
                  }}
                  className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  Report
                </button>
              )}

              <button
                type="button"
                id="btn-price-settings"
                onClick={() => setIsSettingsModalOpen(true)}
                aria-label="Price sync settings"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Configure update frequency"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="btn-refresh-market-prices"
                disabled={isPriceRefreshing || isOffline}
                onClick={() => handleManualRefresh(false)}
                className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-600/50 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px]"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isPriceRefreshing && 'animate-spin')} />
                <span>{isPriceRefreshing ? 'Updating...' : 'Refresh Prices'}</span>
              </button>
            </div>
          </div>

          {/* Holdings Category Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto pb-1">
            {[
              { key: 'all' as const, label: 'All Holdings', count: activeHoldings.length },
              { key: 'stock' as const, label: 'Stocks', count: stocksCount },
              { key: 'etf' as const, label: 'ETFs', count: etfCount },
              { key: 'mutual_fund' as const, label: 'Mutual Funds', count: mfCount },
              { key: 'gold' as const, label: 'Gold & SGB', count: goldCount },
              ...(unlistedCount > 0
                ? [{ key: 'unlisted' as const, label: 'Unlisted', count: unlistedCount }]
                : []),
              ...(otherCount > 0
                ? [{ key: 'other' as const, label: 'Other', count: otherCount }]
                : []),
              { key: 'ipo' as const, label: 'IPO Bids', count: activeIpos.length },
              { key: 'groww' as const, label: 'Groww Cash', count: undefined },
              { key: 'archived' as const, label: 'Archived', count: archivedHoldings.length + archivedIpos.length },
            ].map((cat) => (
              <button
                key={cat.key}
                type="button"
                id={`cat-${cat.key}`}
                onClick={() => setHoldingCategory(cat.key)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-heading flex items-center gap-1.5 min-h-[38px]',
                  holdingCategory === cat.key
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                      holdingCategory === cat.key
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400'
                    )}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Allocation and Trends (When category is 'all') */}
          {activeHoldings.length > 0 && holdingCategory === 'all' && (
            <div className="space-y-4">
              <InvestmentAllocationCard holdings={activeHoldings} />
              <InvestmentPerformanceSection
                holdings={activeHoldings}
                onSelectHolding={(h) => setDetailHolding(h)}
                onEditHolding={(h) => setEditingHolding(h)}
                onUpdatePrice={(h) => setPriceUpdateHolding(h)}
              />
              <InvestmentTrendChart
                snapshots={snapshots}
                currentPortfolioValue={portfolioTotals.totalCurrent}
              />
            </div>
          )}

          {/* Search & Sort Toolbar */}
          {holdingCategory !== 'groww' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search company, ticker, fund, broker..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {holdingCategory !== 'ipo' && (
                <div className="w-full sm:w-48 shrink-0">
                  <SelectField
                    value={sortBy}
                    onChange={(val) => setSortBy(val as SortOption)}
                    options={[
                      { value: 'value_desc', label: 'Highest Valuation', badge: 'Valuation', badgeColor: 'cyan' },
                      { value: 'profit_desc', label: 'Highest Profit', badge: 'Profit', badgeColor: 'emerald' },
                      { value: 'loss_desc', label: 'Highest Loss', badge: 'Loss', badgeColor: 'rose' },
                      { value: 'return_desc', label: 'Highest Return %', badge: 'CAGR', badgeColor: 'amber' },
                      { value: 'name_asc', label: 'Name (A-Z)', badge: 'A-Z', badgeColor: 'blue' },
                    ]}
                    triggerClassName="py-2.5 px-3 rounded-xl bg-slate-900 border-slate-800 text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Groww Balance View */}
          {holdingCategory === 'groww' && (
            <GrowwBalanceCard growwWallet={growwWallet} holdings={activeHoldings} />
          )}

          {/* Holdings Cards List */}
          {holdingCategory !== 'ipo' && holdingCategory !== 'groww' && (
            <div className="space-y-3">
              <SectionHeader
                title={
                  holdingCategory === 'archived'
                    ? 'Archived Holdings'
                    : holdingCategory === 'stock'
                    ? 'Direct Equities'
                    : holdingCategory === 'etf'
                    ? 'Exchange Traded Funds (ETFs)'
                    : holdingCategory === 'mutual_fund'
                    ? 'Mutual Fund Schemes'
                    : holdingCategory === 'gold'
                    ? 'Gold & Sovereign Bonds'
                    : 'Portfolio Holdings'
                }
                subtitle="Equities, ETFs, mutual funds & sovereign bonds"
                badge={
                  <Badge variant="cyan" size="sm">
                    {displayedHoldings.length} {displayedHoldings.length === 1 ? 'Holding' : 'Holdings'}
                  </Badge>
                }
                actionText="Update Valuation"
                onActionClick={() => {
                  if (activeHoldings.length > 0) {
                    setPriceUpdateHolding(activeHoldings[0]);
                  } else {
                    setIsAddHoldingOpen(true);
                  }
                }}
              />

              {displayedHoldings.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <Layers className="w-10 h-10 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300 font-heading">
                    {searchQuery ? 'No matching holdings found' : 'No holdings in this category'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery
                      ? 'Try searching with a different ticker, scheme name, or broker.'
                      : 'Add direct stocks, mutual funds, or gold bonds to start tracking.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddHoldingOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Holding</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {displayedHoldings.map((holding) => (
                    <InvestmentHoldingCard
                      key={holding.id}
                      holding={holding}
                      isArchived={holdingCategory === 'archived'}
                      onSelect={(h) => setDetailHolding(h)}
                      onUpdatePrice={(h) => setPriceUpdateHolding(h)}
                      onEdit={(h) => setEditingHolding(h)}
                      onViewHistory={(h) => setHistoryHolding(h)}
                      onArchive={async (id) => {
                        await archiveInvestment(id);
                        showToast(`✓ Holding archived`);
                      }}
                      onRestore={async (id) => {
                        await restoreInvestment(id);
                        showToast(`✓ Holding restored to active portfolio`);
                      }}
                      onDelete={async (id) => {
                        if (window.confirm('Are you sure you want to permanently delete this investment holding?')) {
                          await deleteInvestment(id);
                          showToast(`✓ Holding deleted permanently`);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* IPO Bids List */}
          {(holdingCategory === 'all' || holdingCategory === 'ipo' || holdingCategory === 'archived') && (
            <div className="space-y-3 pt-2">
              <SectionHeader
                title={holdingCategory === 'archived' ? 'Archived IPOs' : 'Active IPO Tracker'}
                subtitle="ASBA blocked funds & application statuses"
                badge={
                  <Badge variant="cyan" size="sm">
                    {displayedIpos.length} {displayedIpos.length === 1 ? 'Application' : 'Applications'}
                  </Badge>
                }
                actionText="+ Track New IPO"
                onActionClick={() => setIsAddIpoOpen(true)}
              />

              {displayedIpos.length === 0 ? (
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <Building2 className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    {holdingCategory === 'archived' ? 'No archived IPO applications.' : 'No active IPO applications.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {displayedIpos.map((ipo) => (
                    <IPOHoldingCard
                      key={ipo.id}
                      ipo={ipo}
                      isArchived={holdingCategory === 'archived'}
                      onEdit={(item) => setEditingIpo(item)}
                      onArchive={async (id) => {
                        await archiveIPOApplication(id);
                        showToast(`✓ IPO application archived`);
                      }}
                      onRestore={async (id) => {
                        await restoreIPOApplication(id);
                        showToast(`✓ IPO restored to active tracker`);
                      }}
                      onDelete={async (id) => {
                        if (window.confirm('Are you sure you want to delete this IPO record?')) {
                          await deleteIPOApplication(id);
                          showToast(`✓ IPO record deleted`);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. SECTION 2: SIPS TAB (Displays ALL SIP records, prominent + Add SIP, full 3-dot menu) */}
      {primaryTab === 'sips' && (
        <SIPSafetyDashboard
          sips={sips}
          safetyReport={sipSafetyReport}
          bankAccounts={bankAccounts}
          onAddSIP={() => setIsAddSIPOpen(true)}
          onEditSIP={(sip) => setSelectedSIPForEdit(sip)}
          onToggleSIPStatus={async (sip) => {
            const nextStatus = sip.sipStatus === 'active' ? 'stopped' : 'active';
            await toggleSIPStatus(sip.id, nextStatus);
            showToast(`✓ SIP ${nextStatus === 'active' ? 'resumed' : 'paused'} for ${sip.fundName}`);
          }}
          onDeleteSIP={(sip) => setSelectedSIPForDelete(sip)}
          onViewDetailsSIP={(sip) => setSelectedSIPForDetail(sip)}
          onRefreshSafety={async () => {
            await refreshSIPSafety();
            showToast('✓ Evaluated bank balances for upcoming SIPs');
          }}
          onTransferFunds={(bankId) => {
            setTransferDefaultBankId(bankId);
            setIsTransferModalOpen(true);
          }}
        />
      )}

      {/* 5. SECTION 3: UPCOMING PAYMENTS TIMELINE */}
      {primaryTab === 'upcoming' && (
        <UpcomingSIPTimeline
          evaluations={sipSafetyReport?.sipEvaluations || sipSafetyReport?.evaluations || []}
          onEditSIP={(sipId) => {
            const found = sips.find((s) => s.id === sipId);
            if (found) setSelectedSIPForEdit(found);
          }}
          onToggleSIPStatus={async (sipId) => {
            const found = sips.find((s) => s.id === sipId);
            if (found) {
              const nextStatus = found.sipStatus === 'active' ? 'stopped' : 'active';
              await toggleSIPStatus(found.id, nextStatus);
              showToast(`✓ SIP ${nextStatus === 'active' ? 'resumed' : 'paused'} for ${found.fundName}`);
            }
          }}
          onAddSIP={() => setIsAddSIPOpen(true)}
          onTransferFunds={(bankId) => {
            setTransferDefaultBankId(bankId);
            setIsTransferModalOpen(true);
          }}
        />
      )}

      {/* 6. SECTION 4: PAYMENT SAFETY & LIQUIDITY */}
      {primaryTab === 'safety' && (
        <PaymentSafetySection
          sips={sips}
          safetyReport={sipSafetyReport}
          bankAccounts={bankAccounts}
          onRefreshSafety={async () => {
            await refreshSIPSafety();
            showToast('✓ Evaluated bank balances for upcoming SIPs');
          }}
          onTransferFunds={(bankId) => {
            setTransferDefaultBankId(bankId);
            setIsTransferModalOpen(true);
          }}
          onEditSIP={(sip) => setSelectedSIPForEdit(sip)}
        />
      )}

      {/* 7. ALL MODALS */}
      {/* SIP Detail Modal */}
      <SIPDetailModal
        isOpen={!!selectedSIPForDetail}
        sip={selectedSIPForDetail}
        safetyEval={
          selectedSIPForDetail
            ? (sipSafetyReport?.sipEvaluations || sipSafetyReport?.evaluations || []).find(
                (e) => e.sipId === selectedSIPForDetail.id
              )
            : undefined
        }
        onClose={() => setSelectedSIPForDetail(null)}
        onEdit={(sip) => {
          setSelectedSIPForDetail(null);
          setSelectedSIPForEdit(sip);
        }}
        onToggleStatus={async (sip) => {
          const nextStatus = sip.sipStatus === 'active' ? 'stopped' : 'active';
          await toggleSIPStatus(sip.id, nextStatus);
          showToast(`✓ SIP ${nextStatus === 'active' ? 'resumed' : 'paused'} for ${sip.fundName}`);
        }}
        onDelete={(sip) => {
          setSelectedSIPForDetail(null);
          setSelectedSIPForDelete(sip);
        }}
        onTransferFunds={(bankId) => {
          setTransferDefaultBankId(bankId);
          setIsTransferModalOpen(true);
        }}
      />

      {/* Holding Detail Modal */}
      <InvestmentDetailModal
        isOpen={!!detailHolding}
        holding={detailHolding}
        onClose={() => setDetailHolding(null)}
        onUpdatePrice={(h) => setPriceUpdateHolding(h)}
        onEdit={(h) => setEditingHolding(h)}
        onViewHistory={(h) => setHistoryHolding(h)}
        onArchive={async (id) => {
          await archiveInvestment(id);
          setDetailHolding(null);
          showToast(`✓ Holding archived`);
        }}
        onRestore={async (id) => {
          await restoreInvestment(id);
          setDetailHolding(null);
          showToast(`✓ Holding restored to active portfolio`);
        }}
      />

      {/* Add Investment Modal */}
      <AddInvestmentModal
        isOpen={isAddHoldingOpen}
        onClose={() => setIsAddHoldingOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Edit Investment Modal */}
      <EditInvestmentModal
        isOpen={!!editingHolding}
        onClose={() => setEditingHolding(null)}
        holding={editingHolding}
        onSave={async (id, updates) => {
          await updateInvestment(id, updates);
        }}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Manual Price Update Modal */}
      <UpdateInvestmentPriceModal
        isOpen={!!priceUpdateHolding}
        onClose={() => setPriceUpdateHolding(null)}
        holding={priceUpdateHolding}
        onUpdatePrice={async (id, newPrice, source) => {
          await updateInvestmentPrice(id, newPrice, source);
        }}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Investment Price History Modal */}
      <InvestmentPriceHistoryModal
        isOpen={!!historyHolding}
        onClose={() => setHistoryHolding(null)}
        holding={historyHolding}
      />

      {/* Price Refresh Settings Modal */}
      <PriceRefreshSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onForceRefresh={() => handleManualRefresh(true)}
      />

      {/* Price Refresh Summary Modal */}
      <PriceRefreshSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={activeSummary || lastPriceRefreshSummary}
        onForceRefresh={() => handleManualRefresh(true)}
      />

      {/* Add / Edit IPO Modal */}
      <AddIPOModal
        isOpen={isAddIpoOpen || !!editingIpo}
        onClose={() => {
          setIsAddIpoOpen(false);
          setEditingIpo(null);
        }}
        initialData={editingIpo}
        onSave={async (data) => {
          if (editingIpo) {
            await updateIPOApplication(editingIpo.id, data);
          } else {
            await addIPOApplication(data);
          }
        }}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Add / Edit SIP Modal */}
      <SIPModal
        isOpen={isAddSIPOpen || !!selectedSIPForEdit}
        sipToEdit={selectedSIPForEdit}
        onClose={() => {
          setIsAddSIPOpen(false);
          setSelectedSIPForEdit(null);
        }}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Delete SIP Confirmation Modal */}
      <DeleteSIPModal
        isOpen={!!selectedSIPForDelete}
        sip={selectedSIPForDelete}
        onClose={() => setSelectedSIPForDelete(null)}
        onConfirmDelete={async (sip) => {
          await deleteSIP(sip.id);
          showToast(`✓ Deleted SIP mandate for ${sip.fundName}`);
        }}
      />

      {/* Fund Transfer Modal (Triggered by SIP Insufficient Balance Alert) */}
      <BankTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultDestinationBankId={transferDefaultBankId}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#0f1d35] border border-cyan-500/60 shadow-2xl text-xs font-bold text-white flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
