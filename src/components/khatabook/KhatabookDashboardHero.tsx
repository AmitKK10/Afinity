import React from 'react';
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  UserCheck,
  ListFilter,
  ShieldCheck,
} from 'lucide-react';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { SelectField } from '../ui/SelectionSheet';
import { KhatabookSummary } from '../../types';
import { formatRupee } from '../../utils/formatters';

export type KhatabookFilterTab = 'all' | 'receivable' | 'payable' | 'overdue' | 'paid' | 'archived';
export type KhatabookViewMode = 'entries' | 'people';
export type KhatabookSortOption = 'highest_remaining' | 'highest_amount' | 'nearest_due' | 'name';

interface KhatabookDashboardHeroProps {
  summary: KhatabookSummary;
  viewMode: KhatabookViewMode;
  onViewModeChange: (mode: KhatabookViewMode) => void;
  activeFilter: KhatabookFilterTab;
  onFilterChange: (tab: KhatabookFilterTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: KhatabookSortOption;
  onSortChange: (sort: KhatabookSortOption) => void;
  onAddEntry: () => void;
}

export const KhatabookDashboardHero: React.FC<KhatabookDashboardHeroProps> = ({
  summary,
  viewMode,
  onViewModeChange,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  onAddEntry,
}) => {
  const isNetPositive = summary.netPosition >= 0;

  return (
    <div className="space-y-4">
      {/* 1. Main Summary Header Card */}
      <FinancialCard
        variant="elevated"
        padding="lg"
        className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-slate-900 via-[#0a1224] to-[#0d1b33]"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-4">
          {/* Header row with badge & Add button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white font-heading tracking-tight">
                    Dues & Receivables Command Center
                  </h2>
                  <Badge variant="cyan" size="sm">
                    {summary.personCount} {summary.personCount === 1 ? 'Person' : 'People'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Track personal lendings, friend splits, and upcoming payables
                </p>
              </div>
            </div>

            <button
              type="button"
              id="khatabook-add-entry-btn"
              onClick={onAddEntry}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* You will receive (Receivable) */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 relative overflow-hidden group hover:border-cyan-700/60 transition-all">
              <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
                  You Will Receive
                </span>
                <span className="text-[10px] text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded-full font-medium">
                  {summary.activeReceivablesCount} active
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-cyan-200 font-mono tracking-tight">
                +{formatRupee(summary.totalReceivables)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Original: {formatRupee(summary.totalOriginalReceivables)}</span>
                <span className="text-emerald-400">Settled: {formatRupee(summary.totalSettledReceivables)}</span>
              </div>
            </div>

            {/* You owe (Payable) */}
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 relative overflow-hidden group hover:border-rose-700/60 transition-all">
              <div className="flex items-center justify-between text-xs text-rose-300 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  You Owe (Payable)
                </span>
                <span className="text-[10px] text-rose-400/80 bg-rose-500/10 px-2 py-0.5 rounded-full font-medium">
                  {summary.activePayablesCount} active
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-200 font-mono tracking-tight">
                -{formatRupee(summary.totalPayables)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Original: {formatRupee(summary.totalOriginalPayables)}</span>
                <span className="text-emerald-400">Paid: {formatRupee(summary.totalSettledPayables)}</span>
              </div>
            </div>

            {/* Net Balance */}
            <div
              className={`p-3.5 rounded-2xl border relative overflow-hidden group transition-all ${
                isNetPositive
                  ? 'bg-emerald-950/30 border-emerald-800/40 hover:border-emerald-700/60'
                  : 'bg-amber-950/30 border-amber-800/40 hover:border-amber-700/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className={`flex items-center gap-1.5 ${isNetPositive ? 'text-emerald-300' : 'text-amber-300'}`}>
                  <TrendingUp className="w-4 h-4" />
                  {isNetPositive ? 'Net Receivable' : 'Net Payable'}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isNetPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {isNetPositive ? 'Asset Surplus' : 'Liability Surplus'}
                </span>
              </div>
              <div
                className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                  isNetPositive ? 'text-emerald-200' : 'text-amber-200'
                }`}
              >
                {isNetPositive ? '+' : ''}
                {formatRupee(summary.netPosition)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {isNetPositive
                  ? 'Contributes positively to your net worth calculation'
                  : 'Subtracts from total liquid net worth'}
              </div>
            </div>
          </div>

          {/* Overdue / Due Soon Alert Ribbon (if any exist) */}
          {(summary.overdueCount > 0 || summary.dueSoonCount > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {summary.overdueCount > 0 && (
                <div className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-rose-200 block">
                        {summary.overdueCount} {summary.overdueCount === 1 ? 'Entry' : 'Entries'} Overdue
                      </span>
                      <span className="text-[10px] text-rose-300/80">
                        {summary.overdueReceivablesAmount > 0 && `Receivable: ${formatRupee(summary.overdueReceivablesAmount)}`}
                        {summary.overdueReceivablesAmount > 0 && summary.overduePayablesAmount > 0 && ' • '}
                        {summary.overduePayablesAmount > 0 && `Payable: ${formatRupee(summary.overduePayablesAmount)}`}
                      </span>
                    </div>
                  </div>
                  <Badge variant="rose" size="sm">
                    {formatRupee(summary.overdueAmount)}
                  </Badge>
                </div>
              )}

              {summary.dueSoonCount > 0 && (
                <div className="px-3.5 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-200 block">
                        {summary.dueSoonCount} {summary.dueSoonCount === 1 ? 'Entry' : 'Entries'} Due Soon
                      </span>
                      <span className="text-[10px] text-amber-300/80">Upcoming deadline in the next 7 days</span>
                    </div>
                  </div>
                  <Badge variant="amber" size="sm">
                    {formatRupee(summary.dueSoonAmount)}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Net Worth Contribution Informational pill */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                <strong className="text-slate-300">Net Worth Impact:</strong> +{formatRupee(summary.totalReceivables)} assets
                {' • '}-{formatRupee(summary.totalPayables)} liabilities ={' '}
                <strong className={isNetPositive ? 'text-emerald-400' : 'text-amber-400'}>
                  {isNetPositive ? '+' : ''}{formatRupee(summary.netPosition)}
                </strong>
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Atomic balance sync enabled</span>
          </div>
        </div>
      </FinancialCard>

      {/* 2. Controls & Filter Bar */}
      <div className="space-y-3">
        {/* Top bar: View Mode Switcher + Search + Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* View Mode Toggle: All Entries vs By Person */}
          <div className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800 self-start">
            <button
              type="button"
              id="khatabook-view-entries-tab"
              onClick={() => onViewModeChange('entries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'entries'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>All Entries</span>
            </button>
            <button
              type="button"
              id="khatabook-view-people-tab"
              onClick={() => onViewModeChange('people')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'people'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>By Person ({summary.personCount})</span>
            </button>
          </div>

          {/* Search and Sort controls */}
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="khatabook-search-input"
                placeholder="Search person or notes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="w-44 flex-shrink-0">
              <SelectField
                value={sortOption}
                onChange={(val) => onSortChange(val as KhatabookSortOption)}
                options={[
                  { value: 'highest_remaining', label: 'Highest Remaining', sublabel: 'Sort by balance pending' },
                  { value: 'highest_amount', label: 'Highest Original', sublabel: 'Sort by initial principal' },
                  { value: 'nearest_due', label: 'Nearest Due Date', sublabel: 'Sort by payment timeline' },
                  { value: 'name', label: 'Name (A-Z)', sublabel: 'Alphabetical order' },
                ]}
                triggerClassName="py-2 px-3 rounded-xl bg-slate-900/90 border-slate-800 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills (All / Receivable / Payable / Overdue / Paid / Archived) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            id="khatabook-filter-all"
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            id="khatabook-filter-receivable"
            onClick={() => onFilterChange('receivable')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'receivable'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-cyan-300 hover:bg-cyan-950/40'
            }`}
          >
            Receivable ({summary.activeReceivablesCount})
          </button>
          <button
            type="button"
            id="khatabook-filter-payable"
            onClick={() => onFilterChange('payable')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'payable'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-900 border border-slate-800 text-rose-300 hover:bg-rose-950/40'
            }`}
          >
            Payable ({summary.activePayablesCount})
          </button>
          <button
            type="button"
            id="khatabook-filter-overdue"
            onClick={() => onFilterChange('overdue')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'overdue'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : summary.overdueCount > 0
                ? 'bg-rose-950/40 border border-rose-700/50 text-rose-400'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Overdue {summary.overdueCount > 0 && `(${summary.overdueCount})`}
          </button>
          <button
            type="button"
            id="khatabook-filter-paid"
            onClick={() => onFilterChange('paid')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'paid'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Paid ({summary.settledCount})
          </button>
          <button
            type="button"
            id="khatabook-filter-archived"
            onClick={() => onFilterChange('archived')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'archived'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Archived
          </button>
        </div>
      </div>
    </div>
  );
};
