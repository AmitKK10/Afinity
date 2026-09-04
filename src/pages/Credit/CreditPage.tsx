/**
 * CreditPage.tsx — Final Credit Command Center & Integration (Step 6D)
 * Consolidates all Credit Card functionality into a unified, premium command center:
 * - Top-Level Metrics Hero (Deduplicated Limit, Total Outstanding, Available, Utilization, Owner & Managed chips)
 * - Urgent Overdue Alert Banner & Upcoming Payment Deadlines Queue
 * - Legal Owner vs Operational Payment Responsibility Breakdown
 * - Historical Utilization Trend Analytics (30D, 90D, 6M, 1Y)
 * - Dedicated Shared Limit Pools Section (with deduplicated exposure)
 * - Visual Cards Portfolio with rich filters, search, and sorting
 * - Billing Cycles & Settlement Schedule Sub-View
 * - Full CRUD, Payment Settlement, and Balance History modals
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard as CreditCardIcon,
  Search,
  SlidersHorizontal,
  Layers,
  Archive,
  Sparkles,
  Plus,
  RefreshCw,
  Info,
  Calendar,
  LayoutGrid,
  TrendingDown,
  Activity,
  Users,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CreditDashboardHero } from '../../components/financial/CreditDashboardHero';
import { CreditCardItem } from '../../components/financial/CreditCardItem';
import { CreditUpcomingQueue } from '../../components/financial/CreditUpcomingQueue';
import { CreditPaymentSafetySection } from '../../components/financial/CreditPaymentSafetySection';
import { CreditBreakdownSection } from '../../components/financial/CreditBreakdownSection';
import { CreditHistoricalUtilization } from '../../components/financial/CreditHistoricalUtilization';
import { SharedLimitSection } from '../../components/financial/SharedLimitSection';
import { CreditBillingSummaryView } from '../../components/financial/CreditBillingSummaryView';
import { AddCreditCardModal } from '../../components/forms/AddCreditCardModal';
import { EditCreditCardModal } from '../../components/forms/EditCreditCardModal';
import { UpdateOutstandingModal } from '../../components/forms/UpdateOutstandingModal';
import { RecordCardPaymentModal } from '../../components/forms/RecordCardPaymentModal';
import { CardHistoryModal } from '../../components/forms/CardHistoryModal';
import { ManageSharedGroupModal } from '../../components/forms/ManageSharedGroupModal';
import { BankTransferModal } from '../../components/banks/BankTransferModal';
import { SelectField } from '../../components/ui/SelectionSheet';
import { useFinancialData } from '../../context/FinancialDataContext';
import { CreditCard, CreditLimitGroup } from '../../types';
import { calculateCardBillingCycle } from '../../services/calculations';

interface CreditPageProps {
  onQuickUpdateClick: () => void;
  initialTab?: 'all' | 'self' | 'parent' | 'managed_by_me' | 'due_soon' | 'overdue' | 'shared_pools' | 'archived';
  initialViewMode?: 'command_center' | 'billing' | 'shared_pools';
}

export const CreditPage: React.FC<CreditPageProps> = ({
  onQuickUpdateClick,
  initialTab,
  initialViewMode,
}) => {
  const {
    creditCards,
    creditLimitGroups,
    creditPosition,
    creditCardPayments,
    bankAccounts,
    sips,
    snapshots,
    archiveCreditCard,
    restoreCreditCard,
    deleteCreditCard,
  } = useFinancialData();

  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as
    | 'all'
    | 'self'
    | 'parent'
    | 'managed_by_me'
    | 'due_soon'
    | 'overdue'
    | 'shared_pools'
    | 'archived'
    | null;
  const urlView = searchParams.get('view') as 'command_center' | 'billing' | 'shared_pools' | null;

  // Top Sub-Views: Command Center Overview vs Billing Schedule vs Shared Pools
  const [viewMode, setViewMode] = useState<'command_center' | 'billing' | 'shared_pools'>(
    initialViewMode || (urlView && ['command_center', 'billing', 'shared_pools'].includes(urlView) ? urlView : 'command_center')
  );

  // Filters and Search State
  const [filterTab, setFilterTab] = useState<
    'all' | 'self' | 'parent' | 'managed_by_me' | 'due_soon' | 'overdue' | 'shared_pools' | 'archived'
  >(
    initialTab ||
      (urlTab && ['all', 'self', 'parent', 'managed_by_me', 'due_soon', 'overdue', 'shared_pools', 'archived'].includes(urlTab)
        ? urlTab
        : 'all')
  );

  useEffect(() => {
    if (initialTab) {
      setFilterTab(initialTab);
    } else if (urlTab && ['all', 'self', 'parent', 'managed_by_me', 'due_soon', 'overdue', 'shared_pools', 'archived'].includes(urlTab)) {
      setFilterTab(urlTab);
    }
  }, [initialTab, urlTab]);

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    } else if (urlView && ['command_center', 'billing', 'shared_pools'].includes(urlView)) {
      setViewMode(urlView);
    }
  }, [initialViewMode, urlView]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'outstanding_desc' | 'utilization_desc' | 'due_date' | 'name_asc'
  >('outstanding_desc');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [cardToPay, setCardToPay] = useState<CreditCard | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDestinationBankId, setTransferDestinationBankId] = useState<string | undefined>(undefined);

  const [isManageGroupModalOpen, setIsManageGroupModalOpen] = useState(false);
  const [selectedGroupToEdit, setSelectedGroupToEdit] = useState<CreditLimitGroup | null>(null);

  const [cardToUpdate, setCardToUpdate] = useState<CreditCard | null>(null);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [cardForHistory, setCardForHistory] = useState<CreditCard | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Archive and Restore Handlers
  const handleArchiveCard = async (card: CreditCard) => {
    if (
      window.confirm(
        `Archive credit card "${card.displayName || card.cardName}"? It will be excluded from active totals.`
      )
    ) {
      await archiveCreditCard(card.id);
      showToast(`Archived card: ${card.displayName || card.cardName}`);
    }
  };

  const handleRestoreCard = async (card: CreditCard) => {
    await restoreCreditCard(card.id);
    showToast(`Restored card: ${card.displayName || card.cardName}`);
  };

  // Filter and Sort Cards
  const processedCards = useMemo(() => {
    return creditCards
      .filter((card) => {
        // Tab Filtering
        if (filterTab === 'archived') {
          if (card.status !== 'archived') return false;
        } else {
          if (card.status === 'archived') return false;

          if (filterTab === 'self') {
            const o = String(card.owner || '').toUpperCase();
            if (o !== 'SELF') return false;
          } else if (filterTab === 'parent') {
            const o = String(card.owner || '').toUpperCase();
            if (o !== 'PARENT') return false;
          } else if (filterTab === 'managed_by_me') {
            const m = String(card.managedBy || (card.owner === 'SELF' ? 'ME' : 'ME')).toUpperCase();
            const iPay = card.iPayThisCard !== undefined ? card.iPayThisCard : m === 'ME' || m === 'SELF';
            if (!iPay) return false;
          } else if (filterTab === 'shared_pools') {
            if (!card.creditLimitGroupId && !card.sharedLimitGroupId) return false;
          } else if (filterTab === 'due_soon') {
            const cycle = calculateCardBillingCycle(card);
            const out = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
            if (out <= 0 || cycle.isOverdue || cycle.daysUntilDue > 3) return false;
          } else if (filterTab === 'overdue') {
            const cycle = calculateCardBillingCycle(card);
            const out = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
            if (out <= 0 || !cycle.isOverdue) return false;
          }
        }

        // Search Query Filtering
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = `${card.cardName || ''} ${card.displayName || ''} ${card.name || ''}`.toLowerCase();
          const issuer = `${card.issuer || ''} ${card.bankName || ''}`.toLowerCase();
          const digits = String(card.lastFourDigits || '');
          const owner = String(card.owner || '').toLowerCase();
          return name.includes(q) || issuer.includes(q) || digits.includes(q) || owner.includes(q);
        }

        return true;
      })
      .sort((a, b) => {
        const outA = Number(a.outstanding !== undefined ? a.outstanding : a.outstandingBalance || 0);
        const outB = Number(b.outstanding !== undefined ? b.outstanding : b.outstandingBalance || 0);

        if (sortBy === 'outstanding_desc') {
          return outB - outA;
        }
        if (sortBy === 'utilization_desc') {
          const utilA = a.creditLimit > 0 ? (outA / a.creditLimit) * 100 : 0;
          const utilB = b.creditLimit > 0 ? (outB / b.creditLimit) * 100 : 0;
          return utilB - utilA;
        }
        if (sortBy === 'due_date') {
          const cycleA = calculateCardBillingCycle(a);
          const cycleB = calculateCardBillingCycle(b);
          return cycleA.daysUntilDue - cycleB.daysUntilDue;
        }
        if (sortBy === 'name_asc') {
          const nameA = a.displayName || a.cardName || a.name || '';
          const nameB = b.displayName || b.cardName || b.name || '';
          return nameA.localeCompare(nameB);
        }
        return 0;
      });
  }, [creditCards, filterTab, searchQuery, sortBy]);

  return (
    <div id="afinity-credit-command-center" className="space-y-6 animate-in fade-in duration-300 pb-20 sm:pb-16">
      {/* 1. Credit Command Center Hero */}
      <CreditDashboardHero
        creditPosition={creditPosition}
        onAddCardClick={() => setIsAddModalOpen(true)}
        onManageGroupsClick={() => {
          setSelectedGroupToEdit(null);
          setIsManageGroupModalOpen(true);
        }}
        onPayCardClick={() => {
          setCardToPay(null);
          setIsPayModalOpen(true);
        }}
        onExportPdfClick={() => {
          window.dispatchEvent(new CustomEvent('afinity-open-pdf-export', { detail: { category: 'credit' } }));
        }}
      />

      {/* 2. Top-Level Mode Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('command_center')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-heading flex items-center gap-1.5 ${
              viewMode === 'command_center'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('billing')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-heading flex items-center gap-1.5 ${
              viewMode === 'billing'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Billing Cycles</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('shared_pools')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-heading flex items-center gap-1.5 ${
              viewMode === 'shared_pools'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Shared Pools ({creditLimitGroups.filter((g) => g.status !== 'archived').length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setCardToPay(null);
            setIsPayModalOpen(true);
          }}
          className="py-1.5 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer font-heading transition-all"
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Pay Any Card</span>
        </button>
      </div>

      {/* View Mode 1: Billing Cycles & Settlement Schedule */}
      {viewMode === 'billing' && (
        <CreditBillingSummaryView
          creditCards={creditCards}
          payments={creditCardPayments}
          onPayCard={(card) => {
            setCardToPay(card);
            setIsPayModalOpen(true);
          }}
        />
      )}

      {/* View Mode 2: Dedicated Shared Pools */}
      {viewMode === 'shared_pools' && (
        <SharedLimitSection
          groups={creditLimitGroups}
          creditCards={creditCards}
          onAddGroup={() => {
            setSelectedGroupToEdit(null);
            setIsManageGroupModalOpen(true);
          }}
          onEditGroup={(group) => {
            setSelectedGroupToEdit(group);
            setIsManageGroupModalOpen(true);
          }}
          onSelectCard={(card) => setCardToUpdate(card)}
        />
      )}

      {/* View Mode 3: Unified Command Center Overview */}
      {viewMode === 'command_center' && (
        <div className="space-y-6">
          {/* 3.0 Credit Card Payment Safety & Auto-Pay Balance Verification */}
          <CreditPaymentSafetySection
            creditCards={creditCards}
            bankAccounts={bankAccounts}
            sips={sips}
            onTransferFunds={(bankId) => {
              setTransferDestinationBankId(bankId);
              setIsTransferModalOpen(true);
            }}
            onPayCard={(card) => {
              setCardToPay(card);
              setIsPayModalOpen(true);
            }}
            onSelectCard={(card) => setCardToUpdate(card)}
          />

          {/* 3.1 Urgent Overdue Banner & Upcoming Payment Deadlines Queue */}
          <CreditUpcomingQueue
            creditCards={creditCards}
            onPayCard={(card) => {
              setCardToPay(card);
              setIsPayModalOpen(true);
            }}
            onSelectCard={(card) => setCardToUpdate(card)}
          />

          {/* 3.2 Legal Owner vs Operational Responsibility Breakdown */}
          <CreditBreakdownSection creditPosition={creditPosition} />

          {/* 3.3 Historical Utilization Trend Analytics */}
          <CreditHistoricalUtilization
            snapshots={snapshots}
            creditCards={creditCards}
            creditLimitGroups={creditLimitGroups}
            currentUtilization={creditPosition.totalUtilization}
          />

          {/* 3.4 Shared Pools Compact Snapshot (if any active groups) */}
          {creditLimitGroups.filter((g) => g.status !== 'archived').length > 0 && (
            <SharedLimitSection
              groups={creditLimitGroups}
              creditCards={creditCards}
              onAddGroup={() => {
                setSelectedGroupToEdit(null);
                setIsManageGroupModalOpen(true);
              }}
              onEditGroup={(group) => {
                setSelectedGroupToEdit(group);
                setIsManageGroupModalOpen(true);
              }}
              onSelectCard={(card) => setCardToUpdate(card)}
            />
          )}

          {/* 3.5 All Cards Directory: Search, Filters, Sorting & Grid */}
          <div className="space-y-3 pt-2">
            <SectionHeader
              title="All Credit Cards"
              subtitle={`Managing ${creditCards.filter((c) => c.status === 'active').length} cards across portfolios`}
              actionText="+ Add Card"
              onActionClick={() => setIsAddModalOpen(true)}
            />

            {/* Search & Sort Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by card name, bank, last 4 digits, owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="w-full sm:w-56">
                <SelectField
                  value={sortBy}
                  onChange={(val) => setSortBy(val as any)}
                  options={[
                    { value: 'outstanding_desc', label: 'Highest Outstanding', sublabel: 'Sort by exposure amount' },
                    { value: 'utilization_desc', label: 'Highest Utilization', sublabel: 'Sort by credit limit %' },
                    { value: 'due_date', label: 'Nearest Due Date', sublabel: 'Sort by payment urgency' },
                    { value: 'name_asc', label: 'Card Name (A–Z)', sublabel: 'Alphabetical ordering' },
                  ]}
                  triggerClassName="py-2 px-3 rounded-2xl bg-slate-900 border-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto">
              {[
                { key: 'all' as const, label: `All Active (${creditCards.filter((c) => c.status === 'active').length})` },
                { key: 'self' as const, label: `My Cards (${creditCards.filter((c) => c.status === 'active' && c.owner === 'SELF').length})` },
                { key: 'parent' as const, label: `Parent's (${creditCards.filter((c) => c.status === 'active' && c.owner === 'PARENT').length})` },
                { key: 'managed_by_me' as const, label: 'I Pay / Manage' },
                { key: 'due_soon' as const, label: 'Due Soon' },
                { key: 'overdue' as const, label: 'Overdue' },
                { key: 'shared_pools' as const, label: 'Shared Pools' },
                { key: 'archived' as const, label: `Archived (${creditCards.filter((c) => c.status === 'archived').length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterTab(tab.key)}
                  className={`whitespace-nowrap py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer font-heading ${
                    filterTab === tab.key
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cards Grid */}
            {processedCards.length === 0 ? (
              <div className="p-10 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                <CreditCardIcon className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-slate-300 font-bold font-heading text-sm">No credit cards match this filter</p>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  {searchQuery
                    ? `No cards matching "${searchQuery}". Try a different query.`
                    : filterTab === 'archived'
                    ? 'No archived cards.'
                    : 'Add a new card to start tracking exposure and payment deadlines.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-bold shadow-lg shadow-rose-950/40 cursor-pointer font-heading"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Credit Card</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedCards.map((card) => {
                  const sharedGroup = creditLimitGroups.find(
                    (g) => g.id === card.creditLimitGroupId || g.id === card.sharedLimitGroupId
                  );

                  return (
                    <CreditCardItem
                      key={card.id}
                      card={card}
                      sharedGroup={sharedGroup}
                      onPayCard={(c) => {
                        setCardToPay(c);
                        setIsPayModalOpen(true);
                      }}
                      onUpdateOutstanding={(c) => setCardToUpdate(c)}
                      onEditCard={(c) => setCardToEdit(c)}
                      onViewHistory={(c) => setCardForHistory(c)}
                      onArchiveCard={handleArchiveCard}
                      onRestoreCard={handleRestoreCard}
                      onDeleteCard={async (c) => {
                        if (window.confirm(`Are you sure you want to permanently delete ${c.name || 'this card'}?`)) {
                          await deleteCreditCard(c.id);
                        }
                      }}
                      onManageGroup={(c) => {
                        if (sharedGroup) {
                          setSelectedGroupToEdit(sharedGroup);
                        } else {
                          setSelectedGroupToEdit(null);
                        }
                        setIsManageGroupModalOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Modals */}
      {/* Record Card Payment Modal */}
      <RecordCardPaymentModal
        isOpen={isPayModalOpen}
        card={cardToPay}
        onClose={() => {
          setIsPayModalOpen(false);
          setCardToPay(null);
        }}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Add Card Modal */}
      <AddCreditCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Edit Card Modal */}
      <EditCreditCardModal
        isOpen={!!cardToEdit}
        card={cardToEdit}
        onClose={() => setCardToEdit(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Update Outstanding Balance Modal */}
      <UpdateOutstandingModal
        isOpen={!!cardToUpdate}
        card={cardToUpdate}
        onClose={() => setCardToUpdate(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Card Balance History Drawer */}
      <CardHistoryModal
        isOpen={!!cardForHistory}
        card={cardForHistory}
        onClose={() => setCardForHistory(null)}
      />

      {/* Manage Shared Limit Group Modal */}
      <ManageSharedGroupModal
        isOpen={isManageGroupModalOpen}
        groupToEdit={selectedGroupToEdit}
        onClose={() => {
          setIsManageGroupModalOpen(false);
          setSelectedGroupToEdit(null);
        }}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Bank Transfer / Top-Up Modal for Payment Safety Shortfall */}
      <BankTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferDestinationBankId(undefined);
        }}
        defaultDestinationBankId={transferDestinationBankId}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#0f1d35] border border-cyan-500/50 shadow-2xl text-xs font-bold text-white flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
