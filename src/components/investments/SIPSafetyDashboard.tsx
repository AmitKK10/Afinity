import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { SIPRecord, SIPSafetyReport, BankAccount } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { Badge } from '../ui/Badge';
import { SIPCard } from './SIPCard';
import { SIPSafetyAlertBanner } from './SIPSafetyAlertBanner';
import { UpcomingPaymentRisksSection } from './UpcomingPaymentRisksSection';
import { UpcomingSIPTimeline } from './UpcomingSIPTimeline';
import { SIPAnalyticsBreakdown } from './SIPAnalyticsBreakdown';
import { formatRupee } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface SIPSafetyDashboardProps {
  sips: SIPRecord[];
  safetyReport: SIPSafetyReport | null;
  bankAccounts: BankAccount[];
  onAddSIP: () => void;
  onEditSIP: (sip: SIPRecord) => void;
  onToggleSIPStatus: (sip: SIPRecord) => void;
  onDeleteSIP: (sip: SIPRecord) => void;
  onViewDetailsSIP?: (sip: SIPRecord) => void;
  onRefreshSafety: () => void;
  onTransferFunds?: (bankId?: string) => void;
}

type SIPFilterStatus = 'all' | 'active' | 'stopped' | 'at_risk';
type SIPSortOption = 'date_asc' | 'amount_desc' | 'amount_asc' | 'name_asc';

export const SIPSafetyDashboard: React.FC<SIPSafetyDashboardProps> = ({
  sips,
  safetyReport,
  bankAccounts,
  onAddSIP,
  onEditSIP,
  onToggleSIPStatus,
  onDeleteSIP,
  onViewDetailsSIP,
  onRefreshSafety,
  onTransferFunds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SIPFilterStatus>('all');
  const [sortBy, setSortBy] = useState<SIPSortOption>('date_asc');
  const [activeSubView, setActiveSubView] = useState<'cards' | 'timeline' | 'bank_safety'>('cards');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualCheck = async () => {
    setIsRefreshing(true);
    await onRefreshSafety();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const activeSIPs = useMemo(() => sips.filter((s) => s.sipStatus === 'active'), [sips]);
  const stoppedSIPs = useMemo(() => sips.filter((s) => s.sipStatus === 'stopped'), [sips]);

  // Total monthly commitment
  const totalMonthlyCommitment = useMemo(() => {
    return activeSIPs.reduce((sum, s) => {
      // Normalize to monthly
      if (s.frequency === 'quarterly') return sum + s.amount / 3;
      if (s.frequency === 'weekly') return sum + s.amount * 4.33;
      return sum + s.amount;
    }, 0);
  }, [activeSIPs]);

  // Safety evaluations map
  const evaluationMap = useMemo(() => {
    const map = new Map<string, any>();
    const list = safetyReport?.sipEvaluations || safetyReport?.evaluations;
    if (list && Array.isArray(list)) {
      list.forEach((ev) => {
        map.set(ev.sipId, ev);
      });
    }
    return map;
  }, [safetyReport]);

  // Filtered & Sorted SIPs
  const filteredSIPs = useMemo(() => {
    return sips
      .filter((s) => {
        // Status filter
        if (statusFilter === 'active' && s.sipStatus !== 'active') return false;
        if (statusFilter === 'stopped' && s.sipStatus !== 'stopped') return false;
        if (statusFilter === 'at_risk') {
          if (s.sipStatus !== 'active') return false;
          const ev = evaluationMap.get(s.id);
          if (!ev || (ev.safetyStatus !== 'AT_RISK' && ev.safetyStatus !== 'CRITICAL_INSUFFICIENT' && ev.safetyStatus !== 'NO_BANK_LINKED')) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchFund = (s.fundName || '').toLowerCase().includes(q);
          const matchBank = (s.bankName || '').toLowerCase().includes(q);
          const matchPlatform = (s.platform || '').toLowerCase().includes(q);
          const matchFolio = (s.folioNumber || '').toLowerCase().includes(q);
          if (!matchFund && !matchBank && !matchPlatform && !matchFolio) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const evA = evaluationMap.get(a.id);
        const evB = evaluationMap.get(b.id);

        switch (sortBy) {
          case 'date_asc': {
            const dateA = evA?.nextDeductionDate || '9999-99-99';
            const dateB = evB?.nextDeductionDate || '9999-99-99';
            return dateA.localeCompare(dateB);
          }
          case 'amount_desc':
            return b.amount - a.amount;
          case 'amount_asc':
            return a.amount - b.amount;
          case 'name_asc':
            return a.fundName.localeCompare(b.fundName);
          default:
            return 0;
        }
      });
  }, [sips, statusFilter, searchQuery, sortBy, evaluationMap]);

  return (
    <div id="sip-safety-dashboard" className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP SUMMARY CARD (Active SIPs | Monthly Commitment | Upcoming 7-Day Requirement) */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#0c1f36] via-[#0d1629] to-[#070b16] border border-blue-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-300 font-heading">
                SIP Management
              </span>
              <Badge variant="blue" size="sm">
                {activeSIPs.length} Active • {stoppedSIPs.length} Paused
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-toggle-sip-analytics-hero"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer font-heading',
                  showAnalytics
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-950/40'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
                )}
                title="Toggle SIP Analytics & Outflows Breakdown"
              >
                <PieChartIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showAnalytics ? 'Hide Analytics' : 'SIP Analytics'}</span>
              </button>

              <button
                type="button"
                id="btn-manual-sip-check"
                disabled={isRefreshing}
                onClick={handleManualCheck}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer font-heading"
                title="Check account balances against all upcoming SIP commitments"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                <span>{isRefreshing ? 'Checking...' : 'Check Balance Safety'}</span>
              </button>

              <button
                type="button"
                id="btn-add-sip-hero"
                onClick={onAddSIP}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all active:scale-95 cursor-pointer font-heading"
              >
                <Plus className="w-4 h-4" />
                <span>+ New SIP</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Summary: Active SIPs | Monthly Commitment | Upcoming 7-Day Requirement */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* 1. Active SIPs */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                Active SIPs
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-black text-white font-mono">{activeSIPs.length}</span>
                <span className="text-xs text-slate-400 font-medium font-mono">
                  / {sips.length} Mandates ({stoppedSIPs.length} Paused)
                </span>
              </div>
              <span className="text-[10px] text-emerald-400/90 font-medium block mt-1">
                {activeSIPs.length > 0 ? '✓ Auto-debiting on schedule' : 'No active mandates'}
              </span>
            </div>

            {/* 2. Monthly Commitment */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                Monthly Commitment
              </span>
              <div className="mt-1.5">
                <MoneyDisplay
                  amount={totalMonthlyCommitment}
                  size="xl"
                  className="font-extrabold text-white"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Across active investment schedules
              </span>
            </div>

            {/* 3. Upcoming 7-Day Requirement */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                Upcoming 7-Day Requirement
              </span>
              <div className="mt-1.5">
                <MoneyDisplay
                  amount={safetyReport?.requiredInNext7Days || 0}
                  size="xl"
                  className="font-extrabold text-cyan-300"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Immediate liquidity needed next 7 days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. UPCOMING PAYMENT RISKS SECTION (Prioritizes Critical Shortfalls -> Low Buffers -> Safe) */}
      <UpcomingPaymentRisksSection
        evaluations={safetyReport?.sipEvaluations || safetyReport?.evaluations || []}
        sips={sips}
        bankAccounts={bankAccounts}
        onTransferFunds={onTransferFunds}
        onRefreshSafety={handleManualCheck}
        onEditSIP={onEditSIP}
        onViewDetailsSIP={onViewDetailsSIP}
      />

      {/* 2B. TOGGLEABLE SIP ANALYTICS BREAKDOWN (Doughnut chart by frequency) */}
      {showAnalytics && (
        <SIPAnalyticsBreakdown
          sips={sips}
          isExpanded={showAnalytics}
          onToggleExpand={() => setShowAnalytics(!showAnalytics)}
        />
      )}

      {/* 3. CLEAN ACTIVE / PAUSED / ALL FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
        {/* Segment Tabs: Active SIPs | Paused SIPs | All SIPs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80 shrink-0 overflow-x-auto">
          {[
            {
              key: 'active' as const,
              label: 'Active SIPs',
              count: activeSIPs.length,
              activeStyle: 'bg-emerald-600/90 text-white shadow-sm',
            },
            {
              key: 'stopped' as const,
              label: 'Paused SIPs',
              count: stoppedSIPs.length,
              activeStyle: 'bg-slate-800 text-amber-300 shadow-sm',
            },
            {
              key: 'all' as const,
              label: 'All SIPs',
              count: sips.length,
              activeStyle: 'bg-cyan-600 text-white shadow-sm',
            },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              id={`filter-sip-${f.key}`}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-heading min-h-[34px]',
                statusFilter === f.key
                  ? f.activeStyle
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              )}
            >
              <span>{f.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold',
                  statusFilter === f.key ? 'bg-black/25 text-white' : 'bg-slate-800 text-slate-400'
                )}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SIP name, bank, or platform..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 min-h-[36px]"
          />
        </div>

        {/* Sub-view Switcher (Cards / Timeline / Bank Safety) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubView('cards')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[30px]',
              activeSubView === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('timeline')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[30px]',
              activeSubView === 'timeline' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('bank_safety')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[30px]',
              activeSubView === 'bank_safety' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Bank Checker
          </button>
        </div>
      </div>

      {/* 4. SUBVIEWS */}
      {/* 4A. CARDS VIEW */}
      {activeSubView === 'cards' && (
        <div className="space-y-4">
          {filteredSIPs.length === 0 ? (
            <div className="p-10 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-base font-bold text-slate-300 font-heading">No SIP mandates found</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No SIP matches your current search or filter criteria. Try switching tabs or resetting search.'
                  : 'Start tracking your monthly mutual fund & stock SIPs with automated balance safety checks.'}
              </p>
              <button
                type="button"
                onClick={onAddSIP}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer font-heading min-h-[38px]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First SIP</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSIPs.map((sip) => (
                <SIPCard
                  key={sip.id}
                  sip={sip}
                  safetyEval={evaluationMap.get(sip.id)}
                  bankAccounts={bankAccounts}
                  onEdit={onEditSIP}
                  onToggleStatus={onToggleSIPStatus}
                  onDelete={onDeleteSIP}
                  onViewDetails={onViewDetailsSIP}
                  onTransferFunds={onTransferFunds}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4B. TIMELINE / CALENDAR VIEW */}
      {activeSubView === 'timeline' && (
        <UpcomingSIPTimeline
          evaluations={safetyReport?.sipEvaluations || safetyReport?.evaluations || []}
          onEditSIP={(sipId) => {
            const found = sips.find((s) => s.id === sipId);
            if (found) onEditSIP(found);
          }}
          onToggleSIPStatus={(sipId) => {
            const found = sips.find((s) => s.id === sipId);
            if (found) onToggleSIPStatus(found);
          }}
          onTransferFunds={onTransferFunds}
        />
      )}

      {/* 4C. BANK-BY-BANK SAFETY CHECKER */}
      {activeSubView === 'bank_safety' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
              Bank-Wise SIP Commitments & Balance Verification
            </span>
            <span className="text-xs text-slate-500">
              Evaluated against real-time account balances
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safetyReport?.bankEvaluations && safetyReport.bankEvaluations.length > 0 ? (
              safetyReport.bankEvaluations.map((be) => {
                const isShort = be.isInsufficient;
                const bankName = be.bankDisplayName || be.bankName || be.accountDisplayName || 'Bank Account';
                const totalDue = be.totalCommittedNext30Days ?? be.totalRequiredAmount ?? 0;
                const sipsList = be.sipsDue || be.sips?.map((s) => ({ sipId: s.id, fundName: s.fundName, amount: s.amount })) || [];

                return (
                  <div
                    key={be.bankAccountId}
                    className={cn(
                      'rounded-2xl p-4 border space-y-3 transition-all',
                      isShort
                        ? 'bg-rose-950/40 border-rose-600/50 shadow-lg shadow-rose-950/20'
                        : 'bg-slate-900/70 border-slate-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            'p-2 rounded-xl border shrink-0',
                            isShort ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-blue-400 border-slate-700'
                          )}
                        >
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{bankName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{be.accountNumberMasked}</span>
                        </div>
                      </div>

                      <Badge variant={isShort ? 'danger' : 'success'} size="sm">
                        {isShort ? 'Deficit' : 'Safe'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/80 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Balance</span>
                        <span className="text-slate-200 font-bold">{formatRupee(be.availableBalance)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Due (30d)</span>
                        <span className="text-cyan-300 font-bold">{formatRupee(totalDue)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">{isShort ? 'Shortfall' : 'Surplus'}</span>
                        <span className={cn('font-bold', isShort ? 'text-rose-400' : 'text-emerald-400')}>
                          {isShort ? `-${formatRupee(be.shortfall)}` : `+${formatRupee(be.availableBalance - totalDue)}`}
                        </span>
                      </div>
                    </div>

                    {/* Linked SIPs list */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Linked SIPs ({sipsList.length}):
                      </span>
                      {sipsList.map((s) => (
                        <div key={s.sipId} className="flex items-center justify-between text-[11px] text-slate-300">
                          <span className="truncate max-w-[170px]">{s.fundName}</span>
                          <span className="font-mono text-slate-400">{formatRupee(s.amount)}</span>
                        </div>
                      ))}
                    </div>

                    {isShort && onTransferFunds && (
                      <button
                        type="button"
                        onClick={() => onTransferFunds(be.bankAccountId)}
                        className="w-full py-1.5 px-3 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Transfer Funds to {bankName}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                No bank accounts linked to active SIPs yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
