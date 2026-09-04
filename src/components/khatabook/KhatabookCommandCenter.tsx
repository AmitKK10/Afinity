import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useFinancialData } from '../../context/FinancialDataContext';
import { Modal } from '../ui/Modal';
import {
  KhatabookEntry,
  PersonKhatabookBalance,
  KhatabookType,
} from '../../types';
import {
  KhatabookDashboardHero,
  KhatabookFilterTab,
  KhatabookViewMode,
  KhatabookSortOption,
} from './KhatabookDashboardHero';
import { KhatabookEntryCard } from './KhatabookEntryCard';
import { KhatabookPersonCard } from './KhatabookPersonCard';
import { AddKhatabookEntryModal } from './AddKhatabookEntryModal';
import { EditKhatabookEntryModal } from './EditKhatabookEntryModal';
import { KhatabookSettlementModal } from './KhatabookSettlementModal';
import { KhatabookHistoryModal } from './KhatabookHistoryModal';
import { KhatabookPersonDetailModal } from './KhatabookPersonDetailModal';
import {
  normalizeKhatabookType,
  getKhatabookOriginalAmount,
  getKhatabookRemainingAmount,
  getKhatabookStatus,
  getKhatabookDueInfo,
  calculatePersonBalance,
} from '../../services/calculations';
import { formatRupee } from '../../utils/formatters';

interface KhatabookCommandCenterProps {
  initialFilter?: KhatabookFilterTab;
}

export const KhatabookCommandCenter: React.FC<KhatabookCommandCenterProps> = ({
  initialFilter = 'all',
}) => {
  const {
    khatabookEntries,
    khatabookSummary,
    archiveKhatabookEntry,
    restoreKhatabookEntry,
    deleteKhatabookEntry,
  } = useFinancialData();

  // State
  const [viewMode, setViewMode] = useState<KhatabookViewMode>('entries');
  const [activeFilter, setActiveFilter] = useState<KhatabookFilterTab>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<KhatabookSortOption>('highest_remaining');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialPerson, setAddModalInitialPerson] = useState('');
  const [addModalInitialType, setAddModalInitialType] = useState<KhatabookType>('receivable');

  const [selectedEntryForSettle, setSelectedEntryForSettle] = useState<KhatabookEntry | null>(null);
  const [selectedEntryForEdit, setSelectedEntryForEdit] = useState<KhatabookEntry | null>(null);
  const [selectedEntryForHistory, setSelectedEntryForHistory] = useState<KhatabookEntry | null>(null);
  const [selectedPersonForDetail, setSelectedPersonForDetail] = useState<PersonKhatabookBalance | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<KhatabookEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handlers
  const handleOpenAddEntry = (personName = '', type: KhatabookType = 'receivable') => {
    setAddModalInitialPerson(personName);
    setAddModalInitialType(type);
    setIsAddModalOpen(true);
  };

  const handleArchive = async (entry: KhatabookEntry) => {
    try {
      await archiveKhatabookEntry(entry.id);
      showToast(`✓ Archived entry for ${entry.personName}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to archive entry');
    }
  };

  const handleRestore = async (entry: KhatabookEntry) => {
    try {
      await restoreKhatabookEntry(entry.id);
      showToast(`✓ Restored entry for ${entry.personName}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to restore entry');
    }
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteKhatabookEntry(entryToDelete.id);
      showToast(`✓ Deleted entry for ${entryToDelete.personName}`);
      setEntryToDelete(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete entry');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered & Sorted Entries
  const processedEntries = useMemo(() => {
    let list = [...khatabookEntries];

    // Filter by tab
    if (activeFilter === 'archived') {
      list = list.filter((e) => (e.status || '').toString().toUpperCase() === 'ARCHIVED');
    } else {
      // Exclude archived from normal views
      list = list.filter((e) => (e.status || '').toString().toUpperCase() !== 'ARCHIVED');

      if (activeFilter === 'receivable') {
        list = list.filter((e) => {
          const type = normalizeKhatabookType(e.entryType || e.type);
          const status = getKhatabookStatus(e);
          return type === 'RECEIVABLE' && status !== 'PAID';
        });
      } else if (activeFilter === 'payable') {
        list = list.filter((e) => {
          const type = normalizeKhatabookType(e.entryType || e.type);
          const status = getKhatabookStatus(e);
          return type === 'PAYABLE' && status !== 'PAID';
        });
      } else if (activeFilter === 'overdue') {
        list = list.filter((e) => getKhatabookStatus(e) === 'OVERDUE');
      } else if (activeFilter === 'paid') {
        list = list.filter((e) => getKhatabookStatus(e) === 'PAID');
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.personName || '').toLowerCase().includes(q) ||
          (e.phone || '').toLowerCase().includes(q) ||
          (e.notes || '').toLowerCase().includes(q) ||
          (e.reason || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortOption === 'highest_remaining') {
        return getKhatabookRemainingAmount(b) - getKhatabookRemainingAmount(a);
      }
      if (sortOption === 'highest_amount') {
        return getKhatabookOriginalAmount(b) - getKhatabookOriginalAmount(a);
      }
      if (sortOption === 'nearest_due') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortOption === 'name') {
        return (a.personName || '').localeCompare(b.personName || '');
      }
      return 0;
    });

    return list;
  }, [khatabookEntries, activeFilter, searchQuery, sortOption]);

  // Filtered & Sorted Persons
  const processedPersons = useMemo(() => {
    let persons = [...khatabookSummary.personBalances];

    // Filter by tab
    if (activeFilter === 'receivable') {
      persons = persons.filter((p) => p.totalReceivable > 0);
    } else if (activeFilter === 'payable') {
      persons = persons.filter((p) => p.totalPayable > 0);
    } else if (activeFilter === 'overdue') {
      persons = persons.filter((p) => p.hasOverdue);
    } else if (activeFilter === 'paid') {
      persons = persons.filter((p) => p.totalReceivable === 0 && p.totalPayable === 0);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      persons = persons.filter(
        (p) =>
          p.personName.toLowerCase().includes(q) ||
          (p.phone || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    persons.sort((a, b) => {
      if (sortOption === 'highest_remaining') {
        return Math.abs(b.netBalance) - Math.abs(a.netBalance);
      }
      if (sortOption === 'highest_amount') {
        return (
          b.totalOriginalReceivable +
          b.totalOriginalPayable -
          (a.totalOriginalReceivable + a.totalOriginalPayable)
        );
      }
      if (sortOption === 'name') {
        return a.personName.localeCompare(b.personName);
      }
      return 0;
    });

    return persons;
  }, [khatabookSummary.personBalances, activeFilter, searchQuery, sortOption]);

  return (
    <div className="space-y-5">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-bold shadow-2xl shadow-emerald-950/80 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Hero & Controls */}
      <KhatabookDashboardHero
        summary={khatabookSummary}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOption={sortOption}
        onSortChange={setSortOption}
        onAddEntry={() => handleOpenAddEntry('', 'receivable')}
      />

      {/* 2. Main Content Grid / List */}
      {viewMode === 'entries' ? (
        <div className="space-y-3">
          {processedEntries.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-white">No Dues & Receivables Records Found</h4>
                <p className="text-xs text-slate-400">
                  {searchQuery
                    ? `No entries match "${searchQuery}". Try clearing your search.`
                    : activeFilter !== 'all'
                    ? `No entries match the "${activeFilter}" filter.`
                    : 'Start tracking lendings, friend splits, and payables effortlessly.'}
                </p>
              </div>
              <button
                type="button"
                id="khatabook-empty-add-btn"
                onClick={() => handleOpenAddEntry('', 'receivable')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-900/30 cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Entry</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {processedEntries.map((entry) => (
                <KhatabookEntryCard
                  key={entry.id}
                  entry={entry}
                  onSettle={setSelectedEntryForSettle}
                  onEdit={setSelectedEntryForEdit}
                  onViewHistory={setSelectedEntryForHistory}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onDelete={setEntryToDelete}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* People View */
        <div className="space-y-3">
          {processedPersons.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-white">No People Records</h4>
                <p className="text-xs text-slate-400">
                  {searchQuery
                    ? `No person matches "${searchQuery}".`
                    : 'Add a new transaction to begin grouping records by person.'}
                </p>
              </div>
              <button
                type="button"
                id="khatabook-empty-add-person-btn"
                onClick={() => handleOpenAddEntry('', 'receivable')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-900/30 cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Record</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {processedPersons.map((person) => (
                <KhatabookPersonCard
                  key={person.personName}
                  person={person}
                  onClick={setSelectedPersonForDetail}
                  onAddEntryForPerson={(name) => handleOpenAddEntry(name, 'receivable')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddKhatabookEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialPersonName={addModalInitialPerson}
        initialType={addModalInitialType}
        onSuccess={showToast}
      />

      <EditKhatabookEntryModal
        isOpen={!!selectedEntryForEdit}
        entry={selectedEntryForEdit}
        onClose={() => setSelectedEntryForEdit(null)}
        onSuccess={showToast}
      />

      <KhatabookSettlementModal
        isOpen={!!selectedEntryForSettle}
        entry={selectedEntryForSettle}
        onClose={() => setSelectedEntryForSettle(null)}
        onSuccess={showToast}
      />

      <KhatabookHistoryModal
        isOpen={!!selectedEntryForHistory}
        entry={selectedEntryForHistory}
        onClose={() => setSelectedEntryForHistory(null)}
      />

      <KhatabookPersonDetailModal
        isOpen={!!selectedPersonForDetail}
        person={selectedPersonForDetail}
        onClose={() => setSelectedPersonForDetail(null)}
        onSettleEntry={setSelectedEntryForSettle}
        onEditEntry={setSelectedEntryForEdit}
        onViewHistory={setSelectedEntryForHistory}
        onAddEntryForPerson={(name) => handleOpenAddEntry(name, 'receivable')}
        onDeleteEntry={setEntryToDelete}
      />

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <Modal
          isOpen={!!entryToDelete}
          onClose={() => setEntryToDelete(null)}
          title="Delete Due / Receivable Entry"
          subtitle={`Are you sure you want to delete the entry for ${entryToDelete.personName}?`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-white font-medium">
                  This transaction of{' '}
                  <span className="font-bold text-rose-300">
                    {formatRupee(getKhatabookOriginalAmount(entryToDelete))}
                  </span>{' '}
                  with <span className="font-bold text-white">{entryToDelete.personName}</span> will be permanently removed.
                </p>
                <p className="text-slate-400 text-[11px]">
                  All associated settlement history and net balance calculations will be recalculated immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-950/40 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
