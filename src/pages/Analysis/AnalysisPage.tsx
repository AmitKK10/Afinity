import React, { useState, useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  History,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Camera,
  CheckCircle2,
  Coins,
  Building2,
  Landmark,
  Wallet,
  Sparkles,
  Scale,
} from 'lucide-react';
import { ComparisonPeriod, FinancialSnapshot, SnapshotLabel, SnapshotType } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Badge } from '../../components/ui/Badge';
import { AnalysisHero } from '../../components/analysis/AnalysisHero';
import { PeriodSelector } from '../../components/analysis/PeriodSelector';
import { NetWorthComparisonChart } from '../../components/analysis/NetWorthComparisonChart';
import { ChangeBreakdownCard } from '../../components/analysis/ChangeBreakdownCard';
import { CategoryComparisonTable } from '../../components/analysis/CategoryComparisonTable';
import { AssetLiabilityComparisonCards } from '../../components/analysis/AssetLiabilityComparisonCards';
import { MonthlyReviewCard } from '../../components/analysis/MonthlyReviewCard';
import { HistoricalMilestonesCard } from '../../components/analysis/HistoricalMilestonesCard';
import { CompositionAndHealthSection } from '../../components/analysis/CompositionAndHealthSection';
import { FinancialPositionBreakdown } from '../../components/analysis/FinancialPositionBreakdown';
import { SnapshotBrowser } from '../../components/analysis/SnapshotBrowser';
import { TakeSnapshotModal } from '../../components/analysis/TakeSnapshotModal';
import { CompareSnapshotsModal } from '../../components/analysis/CompareSnapshotsModal';

export const AnalysisPage: React.FC = () => {
  const {
    snapshots,
    totalAssets,
    totalLiabilities,
    netWorth,
    bankAccounts,
    fixedDeposits,
    cashHoldings,
    wallets,
    investments,
    khatabookEntries,
    creditCards,
    monthOverMonthComparison,
    getComparisonForPeriod,
    createSnapshot,
    deleteSnapshot,
  } = useFinancialData();

  const [selectedPeriod, setSelectedPeriod] = useState<ComparisonPeriod>('1M');
  const [isTakeSnapshotOpen, setIsTakeSnapshotOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [customCompareSnapA, setCustomCompareSnapA] = useState<FinancialSnapshot | null>(null);
  const [customCompareSnapB, setCustomCompareSnapB] = useState<FinancialSnapshot | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Get active period comparison
  const activeComparison = useMemo(() => {
    return getComparisonForPeriod(selectedPeriod);
  }, [getComparisonForPeriod, selectedPeriod]);

  const baselineDateString = activeComparison.baselineSnapshot
    ? activeComparison.baselineSnapshot.dateString || activeComparison.baselineSnapshot.date || null
    : null;

  const handleSaveSnapshot = async (options: {
    label: SnapshotLabel;
    note?: string;
    snapshotType: SnapshotType;
  }) => {
    try {
      const snap = await createSnapshot({
        label: options.label,
        note: options.note,
        snapshotType: options.snapshotType,
      });
      showToast(`✓ Valuation Snapshot Recorded (${snap.dateString || snap.date})`);
    } catch (err) {
      showToast('Failed to record snapshot');
    }
  };

  const handleOpenManualComparison = (snapA: FinancialSnapshot, snapB: FinancialSnapshot) => {
    setCustomCompareSnapA(snapA);
    setCustomCompareSnapB(snapB);
    setIsCompareModalOpen(true);
  };

  const handleGeneralCompareOpen = () => {
    setCustomCompareSnapA(null);
    setCustomCompareSnapB(null);
    setIsCompareModalOpen(true);
  };

  return (
    <div id="afinity-analysis-page" className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Hero Summary & Actions */}
      <AnalysisHero
        currentNetWorth={netWorth}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        comparison={activeComparison}
        onTakeSnapshot={() => setIsTakeSnapshotOpen(true)}
        onOpenCompareModal={handleGeneralCompareOpen}
        onOpenPdfExport={() => {
          window.dispatchEvent(new CustomEvent('afinity-open-pdf-export', { detail: { category: 'all' } }));
        }}
      />

      {/* 2. Standardized Comparison Timeframe Selector */}
      <PeriodSelector
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        baselineDateString={baselineDateString}
      />

      {/* 3. Comprehensive Financial Breakdown, Allocation Donut & Liquidity Ratios */}
      <FinancialPositionBreakdown
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
      />

      {/* 4. Valuation Trajectory & Historical Net-Worth Trend Chart */}
      <NetWorthComparisonChart
        snapshots={snapshots}
        currentNetWorth={netWorth}
        currentAssets={totalAssets}
        currentLiabilities={totalLiabilities}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
      />

      {/* 4. Why Did Net Worth Change? Granular Contribution Breakdown */}
      <ChangeBreakdownCard comparison={activeComparison} />

      {/* 5. Asset & Liability Category Side-by-Side Comparison */}
      <CategoryComparisonTable comparison={activeComparison} />

      {/* 6. Total Asset Expansion vs Total Debt Movement & Top Factors */}
      <AssetLiabilityComparisonCards comparison={activeComparison} />

      {/* 7. Compact Month-over-Month Review */}
      <MonthlyReviewCard mom={monthOverMonthComparison} />

      {/* 8. Historical Extremes (Highs/Lows) & Multi-Timeframe Velocity */}
      <HistoricalMilestonesCard
        snapshots={snapshots}
        currentNetWorth={netWorth}
      />

      {/* 9. Domain-Specific Portfolio Contributions & Financial Health Ratios */}
      <CompositionAndHealthSection
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
      />

      {/* 10. Valuation Snapshots History Log & 2-Snapshot Selector */}
      <SnapshotBrowser
        snapshots={snapshots}
        onTakeSnapshot={() => setIsTakeSnapshotOpen(true)}
        onCompareTwoSnapshots={handleOpenManualComparison}
        onDeleteSnapshot={deleteSnapshot}
      />

      {/* Take Snapshot Modal */}
      <TakeSnapshotModal
        isOpen={isTakeSnapshotOpen}
        onClose={() => setIsTakeSnapshotOpen(false)}
        onConfirm={handleSaveSnapshot}
        currentNetWorth={netWorth}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
      />

      {/* Compare Any Two Snapshots Modal */}
      <CompareSnapshotsModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        snapshots={snapshots}
        initialSnapA={customCompareSnapA}
        initialSnapB={customCompareSnapB}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#0f1d35] border border-cyan-500/50 shadow-2xl text-xs font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
