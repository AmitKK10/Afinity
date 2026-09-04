import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Banknote,
  Smartphone,
  BookOpen,
  Plus,
  Landmark,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Archive,
  RotateCcw,
  SlidersHorizontal,
  ArrowRightLeft,
  Search,
  PiggyBank,
  History,
  Filter,
} from 'lucide-react';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { FinancialCard } from '../../components/ui/FinancialCard';
import { MoneyDisplay } from '../../components/ui/MoneyDisplay';
import { AccountCard } from '../../components/financial/AccountCard';
import { Badge } from '../../components/ui/Badge';
import { SelectField } from '../../components/ui/SelectionSheet';
import { AddAccountModal } from '../../components/forms/AddAccountModal';
import { AddKhatabookModal } from '../../components/forms/AddKhatabookModal';
import { KhatabookCommandCenter } from '../../components/khatabook/KhatabookCommandCenter';
import { CashVaultHero } from '../../components/cash/CashVaultHero';
import { DenominationBreakdownTable } from '../../components/cash/DenominationBreakdownTable';
import { CashDenominationEditorModal } from '../../components/cash/CashDenominationEditorModal';
import { AddCashVaultModal } from '../../components/cash/AddCashVaultModal';
import { CashTransferModal } from '../../components/cash/CashTransferModal';
import { CashVaultAnalytics } from '../../components/cash/CashVaultAnalytics';

// Step 4 Bank Components & Modals
import { BankDashboardHero } from '../../components/banks/BankDashboardHero';
import { BankCardGroup } from '../../components/banks/BankCardGroup';
import { BankAccountCard } from '../../components/banks/BankAccountCard';
import { FixedDepositCard } from '../../components/banks/FixedDepositCard';
import { AddBankAccountModal } from '../../components/banks/AddBankAccountModal';
import { EditBankAccountModal } from '../../components/banks/EditBankAccountModal';
import { BankAccountDetailModal } from '../../components/banks/BankAccountDetailModal';
import { AddFixedDepositModal } from '../../components/banks/AddFixedDepositModal';
import { EditFixedDepositModal } from '../../components/banks/EditFixedDepositModal';
import { BankTransferModal } from '../../components/banks/BankTransferModal';
import { FDActionModal } from '../../components/banks/FDActionModal';
import { UpdateBankBalanceModal } from '../../components/banks/UpdateBankBalanceModal';
import { CloseBankAccountModal } from '../../components/banks/CloseBankAccountModal';
import { BankTransferHistoryModal } from '../../components/banks/BankTransferHistoryModal';
import { STANDARD_DENOMINATIONS_LIST } from '../../components/cash/DenominationRow';

import { formatRupee, formatPriceUpdatedTime } from '../../utils/formatters';
import { useFinancialData } from '../../context/FinancialDataContext';
import { BankAccount, FixedDepositAccount, CashDenomination, DigitalWallet } from '../../types';

// Step 5 Wallet Components & Modals
import { WalletDashboardHero } from '../../components/wallets/WalletDashboardHero';
import { WalletDistributionChart } from '../../components/wallets/WalletDistributionChart';
import { WalletCard } from '../../components/wallets/WalletCard';
import { AddWalletModal } from '../../components/wallets/AddWalletModal';
import { EditWalletModal } from '../../components/wallets/EditWalletModal';
import { UpdateWalletBalanceModal } from '../../components/wallets/UpdateWalletBalanceModal';
import { AddCashbackModal } from '../../components/wallets/AddCashbackModal';
import { CashbackModal, CashbackModalMode } from '../../components/wallets/CashbackModal';
import { CashbackSection } from '../../components/wallets/CashbackSection';
import { CashbackHistoryModal } from '../../components/wallets/CashbackHistoryModal';
import { WalletSpendModal } from '../../components/wallets/WalletSpendModal';
import { WalletTransferModal } from '../../components/wallets/WalletTransferModal';
import { ArchiveWalletModal } from '../../components/wallets/ArchiveWalletModal';
import { WalletHistoryModal } from '../../components/wallets/WalletHistoryModal';
import { WalletTransferHistoryModal } from '../../components/wallets/WalletTransferHistoryModal';

interface AccountsPageProps {
  onQuickUpdateClick: () => void;
  initialTab?: 'all' | 'banks' | 'cash' | 'wallets' | 'khatabook';
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ onQuickUpdateClick, initialTab }) => {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as 'all' | 'banks' | 'cash' | 'wallets' | 'khatabook' | null;

  const [activeTab, setActiveTab] = useState<'all' | 'banks' | 'cash' | 'wallets' | 'khatabook'>(
    initialTab || (urlTab && ['all', 'banks', 'cash', 'wallets', 'khatabook'].includes(urlTab) ? urlTab : 'all')
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (urlTab && ['all', 'banks', 'cash', 'wallets', 'khatabook'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [initialTab, urlTab]);
  const [selectedCashVaultId, setSelectedCashVaultId] = useState<string | 'all'>('all');

  // Search and filter for banks
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');
  const [bankTypeFilter, setBankTypeFilter] = useState<'all' | 'savings' | 'salary' | 'current' | 'overdraft' | 'fd'>('all');

  // Bank Modals state
  const [isAddBankAccountOpen, setIsAddBankAccountOpen] = useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<BankAccount | null>(null);
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<BankAccount | null>(null);
  const [isAddFDOpen, setIsAddFDOpen] = useState(false);
  const [isBankTransferOpen, setIsBankTransferOpen] = useState(false);
  const [transferDefaultBankId, setTransferDefaultBankId] = useState<string | undefined>();
  const [isTransferHistoryOpen, setIsTransferHistoryOpen] = useState(false);

  const [selectedAccountForBalanceUpdate, setSelectedAccountForBalanceUpdate] = useState<BankAccount | null>(null);
  const [selectedAccountForClosure, setSelectedAccountForClosure] = useState<BankAccount | null>(null);

  const [selectedFDForAction, setSelectedFDForAction] = useState<FixedDepositAccount | null>(null);
  const [selectedFDForEdit, setSelectedFDForEdit] = useState<FixedDepositAccount | null>(null);
  const [fdInitialAction, setFdInitialAction] = useState<'withdraw' | 'renew' | 'close'>('withdraw');

  // Wallet State & Modals
  const [walletSearchQuery, setWalletSearchQuery] = useState<string>('');
  const [walletFilter, setWalletFilter] = useState<'all' | 'active' | 'archived' | 'included' | 'excluded'>('all');
  const [walletSortBy, setWalletSortBy] = useState<'balance_desc' | 'balance_asc' | 'recent' | 'name'>('balance_desc');
  const [isAddWalletOpen, setIsAddWalletOpen] = useState<boolean>(false);
  const [selectedWalletForEdit, setSelectedWalletForEdit] = useState<DigitalWallet | null>(null);
  const [selectedWalletForBalanceUpdate, setSelectedWalletForBalanceUpdate] = useState<DigitalWallet | null>(null);
  const [selectedWalletForCashback, setSelectedWalletForCashback] = useState<DigitalWallet | null>(null);
  const [isCashbackModalOpen, setIsCashbackModalOpen] = useState<boolean>(false);
  const [cashbackModalMode, setCashbackModalMode] = useState<CashbackModalMode>('earn');
  const [isCashbackHistoryOpen, setIsCashbackHistoryOpen] = useState<boolean>(false);
  const [selectedWalletForSpend, setSelectedWalletForSpend] = useState<DigitalWallet | null>(null);
  const [isWalletTransferOpen, setIsWalletTransferOpen] = useState<boolean>(false);
  const [walletTransferInitialWalletId, setWalletTransferInitialWalletId] = useState<string | undefined>();
  const [walletTransferInitialMode, setWalletTransferInitialMode] = useState<any>('bank_to_wallet');
  const [isWalletTransferHistoryOpen, setIsWalletTransferHistoryOpen] = useState<boolean>(false);
  const [selectedWalletForTransferHistory, setSelectedWalletForTransferHistory] = useState<DigitalWallet | null>(null);
  const [selectedWalletForArchive, setSelectedWalletForArchive] = useState<DigitalWallet | null>(null);
  const [selectedWalletForHistory, setSelectedWalletForHistory] = useState<DigitalWallet | null>(null);

  // Other Modals state
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddKhatabookModalOpen, setIsAddKhatabookModalOpen] = useState(false);
  const [isDenomEditorOpen, setIsDenomEditorOpen] = useState(false);
  const [isAddCashVaultOpen, setIsAddCashVaultOpen] = useState(false);
  const [isCashTransferOpen, setIsCashTransferOpen] = useState(false);
  const [cashTransferMode, setCashTransferMode] = useState<'transfer' | 'atm'>('transfer');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    banks,
    bankAccounts,
    fixedDeposits,
    cashHoldings,
    wallets,
    khatabookEntries,
    khatabookSummary,
    bankPosition,
    walletPosition,
    cashbackSummary,
    updateCashDenominations,
    toggleSettleKhatabook,
    archiveBankAccount,
    restoreBankAccount,
    deleteBankAccount,
    archiveFixedDeposit,
    restoreFixedDeposit,
    deleteFixedDeposit,
    addWallet,
    updateWallet,
    updateWalletBalance,
    addCashbackCredit,
    recordWalletSpend,
    recordCashbackEarned,
    recordCashbackUsed,
    recordCashbackAdjustment,
    archiveWallet,
    restoreWallet,
    deleteWallet,
    deleteCashHolding,
    deleteKhatabookEntry,
    transferBankToWallet,
    transferWalletToBank,
    transferWalletToWallet,
    transferCashToWallet,
    transferWalletToCash,
    balanceHistory,
    walletTransactions,
    auditEvents,
    transfers,
    snapshots,
  } = useFinancialData();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeBanks = bankAccounts.filter((b) => b.status === 'active');
  const activeFds = fixedDeposits.filter((f) => f.status === 'active');
  const activeCash = cashHoldings.filter((c) => c.status === 'active');
  const activeWallets = wallets.filter((w) => w.status === 'active');
  const activeKb = khatabookEntries.filter((k) => k.status === 'active');

  const totalBankBalance = activeBanks.reduce((sum, b) => sum + Number(b.balance || 0), 0);
  const totalFDBalance = activeFds.reduce((sum, f) => sum + Number(f.balance !== undefined && f.balance !== null ? f.balance : f.principal || 0), 0);
  const totalCashBalance = activeCash.reduce((sum, c) => sum + Number(c.balance || 0), 0);
  const totalWalletBalance = activeWallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
  const totalReceivables = activeKb.filter((k) => k.type === 'receivable' && !k.isSettled).reduce((sum, k) => sum + Number(k.amount || 0), 0);
  const totalPayables = activeKb.filter((k) => k.type === 'payable' && !k.isSettled).reduce((sum, k) => sum + Number(k.amount || 0), 0);

  const totalLiquid = totalBankBalance + totalFDBalance + totalCashBalance + totalWalletBalance;

  // Selected cash vault for denomination display
  const currentCashVault = selectedCashVaultId === 'all'
    ? null
    : activeCash.find((c) => c.id === selectedCashVaultId);

  // Helper to normalize denomination keys
  const getNormKey = (d: { denomination: number; type?: string; variantKey?: string }) => {
    if (d.variantKey) return d.variantKey;
    if (d.type === 'coin' && (d.denomination === 20 || d.denomination === 10)) {
      return `${d.denomination}_coin`;
    }
    if (d.type === 'note' && (d.denomination === 20 || d.denomination === 10)) {
      return `${d.denomination}_note`;
    }
    if (d.denomination === 5 || d.denomination === 2 || d.denomination === 1) {
      return `${d.denomination}_currency`;
    }
    return `${d.denomination}_note`;
  };

  // Compute aggregated denominations for 'all' or specific vault
  const displayedDenominations: CashDenomination[] = useMemo(() => {
    if (currentCashVault && currentCashVault.denominations) {
      return currentCashVault.denominations;
    }

    const aggMap: Record<string, CashDenomination> = {};

    // Seed standard structure so all rows are present
    STANDARD_DENOMINATIONS_LIST.forEach((cfg) => {
      aggMap[cfg.key] = {
        denomination: cfg.denomination,
        count: 0,
        oldCount: 0,
        newCount: 0,
        type: cfg.type,
        variantKey: cfg.key,
      };
    });

    activeCash.forEach((vault) => {
      vault.denominations?.forEach((d) => {
        const key = getNormKey(d);

        if (!aggMap[key]) {
          aggMap[key] = {
            denomination: d.denomination,
            count: 0,
            oldCount: 0,
            newCount: 0,
            type: d.type || (d.denomination >= 50 ? 'note' : d.denomination <= 5 ? 'coin' : 'both'),
            variantKey: key,
          };
        }

        const o = Number(d.oldCount || 0);
        const explicitSum = o + Number(d.newCount || 0);
        const c = explicitSum > 0 ? explicitSum : Number(d.count || 0);
        const n = Number(d.newCount || 0) > 0 ? Number(d.newCount) : Math.max(0, c - o);
        aggMap[key].oldCount = (aggMap[key].oldCount || 0) + o;
        aggMap[key].newCount = (aggMap[key].newCount || 0) + n;
        aggMap[key].count = (aggMap[key].count || 0) + c;
      });
    });

    return Object.values(aggMap);
  }, [currentCashVault, activeCash]);

  const { totalNotesCount, totalCoinsCount } = useMemo(() => {
    let notes = 0;
    let coins = 0;
    displayedDenominations.forEach((d) => {
      const explicitVariantsSum = Number(d.oldCount || 0) + Number(d.newCount || 0);
      const count = Math.max(0, Number(d.count !== undefined ? d.count : explicitVariantsSum));
      if (d.type === 'coin') {
        coins += count;
      } else if (d.type === 'both') {
        notes += Number(d.oldCount || 0);
        coins += Number(d.newCount || 0);
      } else {
        notes += count;
      }
    });
    return { totalNotesCount: notes, totalCoinsCount: coins };
  }, [displayedDenominations]);

  const currentDisplayCash = currentCashVault ? Number(currentCashVault.balance || 0) : totalCashBalance;

  const lastVaultUpdatedTimestamp = currentCashVault?.lastUpdated || currentCashVault?.updatedAt || activeCash[0]?.lastUpdated || activeCash[0]?.updatedAt;
  const vaultUpdatedDisplay = lastVaultUpdatedTimestamp ? formatPriceUpdatedTime(lastVaultUpdatedTimestamp) : 'Just now';

  const handleUpdateSingleDenom = async (updated: CashDenomination) => {
    const targetVault = currentCashVault || activeCash[0];
    if (!targetVault) return;

    const targetKey = getNormKey(updated);

    const existingDenoms = targetVault.denominations || [];
    const otherDenoms = existingDenoms.filter((d) => getNormKey(d) !== targetKey);
    const normalizedUpdated: CashDenomination = {
      ...updated,
      variantKey: targetKey,
    };
    const newDenoms = [...otherDenoms, normalizedUpdated];

    await updateCashDenominations(targetVault.id, newDenoms);
    showToast(`✓ Updated ₹${updated.denomination} ${updated.type === 'coin' ? 'coin' : 'notes'} count`);
  };

  // Grouped Banks Computation
  const groupedBankInstitutions = useMemo(() => {
    const query = bankSearchQuery.toLowerCase().trim();

    // Group active accounts by bankId or institutionName
    const bankGroupsMap = new Map<
      string,
      {
        bank?: (typeof banks)[0];
        accounts: BankAccount[];
        fixedDeposits: FixedDepositAccount[];
      }
    >();

    // Initialize with known bank institutions
    banks.forEach((b) => {
      bankGroupsMap.set(b.id, {
        bank: b,
        accounts: [],
        fixedDeposits: [],
      });
    });

    // Distribute accounts
    activeBanks.forEach((acc) => {
      // Filter by type
      if (bankTypeFilter !== 'all' && bankTypeFilter !== 'fd' && acc.accountType !== bankTypeFilter) {
        return;
      }
      if (bankTypeFilter === 'fd') return;

      // Filter by search query
      if (
        query &&
        !acc.name.toLowerCase().includes(query) &&
        !acc.displayName?.toLowerCase().includes(query) &&
        !acc.institutionName.toLowerCase().includes(query) &&
        !acc.accountNumberMasked?.toLowerCase().includes(query) &&
        !acc.last4?.toLowerCase().includes(query)
      ) {
        return;
      }

      let key = acc.bankId;
      if (!key || !bankGroupsMap.has(key)) {
        // Try matching by institutionName
        const matchingBank = banks.find(
          (b) => b.name.toLowerCase() === acc.institutionName.toLowerCase()
        );
        key = matchingBank ? matchingBank.id : acc.institutionName;
      }

      if (!bankGroupsMap.has(key)) {
        bankGroupsMap.set(key, {
          accounts: [],
          fixedDeposits: [],
        });
      }
      bankGroupsMap.get(key)!.accounts.push(acc);
    });

    // Distribute FDs
    activeFds.forEach((fd) => {
      if (bankTypeFilter !== 'all' && bankTypeFilter !== 'fd') return;

      if (
        query &&
        !fd.name.toLowerCase().includes(query) &&
        !fd.displayName?.toLowerCase().includes(query) &&
        !fd.institutionName.toLowerCase().includes(query) &&
        !fd.bankName?.toLowerCase().includes(query)
      ) {
        return;
      }

      let key = fd.bankId;
      if (!key || !bankGroupsMap.has(key)) {
        const matchingBank = banks.find(
          (b) => b.name.toLowerCase() === fd.institutionName.toLowerCase()
        );
        key = matchingBank ? matchingBank.id : fd.institutionName;
      }

      if (!bankGroupsMap.has(key)) {
        bankGroupsMap.set(key, {
          accounts: [],
          fixedDeposits: [],
        });
      }
      bankGroupsMap.get(key)!.fixedDeposits.push(fd);
    });

    // Filter out empty groups unless user is searching
    return Array.from(bankGroupsMap.values()).filter(
      (g) => g.accounts.length > 0 || g.fixedDeposits.length > 0
    );
  }, [banks, activeBanks, activeFds, bankSearchQuery, bankTypeFilter]);

  // Filtered and Sorted Digital Wallets Computation
  const filteredWallets = useMemo(() => {
    const query = walletSearchQuery.toLowerCase().trim();

    return wallets
      .filter((w) => {
        // Status & Net Worth filters
        const isArchived = w.status === 'archived' || w.status === 'closed';
        if (walletFilter === 'active' && isArchived) return false;
        if (walletFilter === 'archived' && !isArchived) return false;
        if (walletFilter === 'included' && (isArchived || w.includeInNetWorth === false)) return false;
        if (walletFilter === 'excluded' && (isArchived || w.includeInNetWorth !== false)) return false;

        // Search query
        if (query) {
          const matchName = (w.displayName || w.name).toLowerCase().includes(query);
          const matchProvider = (w.provider || '').toLowerCase().includes(query);
          const matchProviderName = (w.providerName || '').toLowerCase().includes(query);
          const matchNotes = (w.notes || '').toLowerCase().includes(query);
          const matchMobile = (w.linkedMobile || '').toLowerCase().includes(query);
          if (!matchName && !matchProvider && !matchProviderName && !matchNotes && !matchMobile) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (walletSortBy === 'balance_desc') return Number(b.balance || 0) - Number(a.balance || 0);
        if (walletSortBy === 'balance_asc') return Number(a.balance || 0) - Number(b.balance || 0);
        if (walletSortBy === 'name') return (a.displayName || a.name).localeCompare(b.displayName || b.name);
        return new Date(b.updatedAt || b.lastUpdated || 0).getTime() - new Date(a.updatedAt || a.lastUpdated || 0).getTime();
      });
  }, [wallets, walletSearchQuery, walletFilter, walletSortBy]);

  // Live dynamic resolved objects for edit and detail modals
  const activeAccountForEdit = selectedAccountForEdit
    ? bankAccounts.find((a) => a.id === selectedAccountForEdit.id) || selectedAccountForEdit
    : null;

  const activeAccountForDetail = selectedAccountForDetail
    ? bankAccounts.find((a) => a.id === selectedAccountForDetail.id) || selectedAccountForDetail
    : null;

  return (
    <div id="afinity-accounts-page" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Liquid Cash & Overview */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#111c34] via-[#0d1629] to-[#0a0f1d] border border-slate-700/60 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-heading">
              Liquid Cash & Bank Vaults
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <MoneyDisplay amount={totalLiquid} size="2xl" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTransferDefaultBankId(undefined);
                setIsBankTransferOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition-all active:scale-95 cursor-pointer font-heading"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddBankAccountOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all active:scale-95 cursor-pointer font-heading"
            >
              <Plus className="w-4 h-4" />
              <span>+ Bank Account</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Instant liquidity across {activeBanks.length} bank accounts, {activeFds.length} FDs, {activeCash.length} cash vaults & {activeWallets.length} digital wallets.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto pb-1">
        {[
          { key: 'all' as const, label: 'All Vaults' },
          { key: 'banks' as const, label: `Banks & FDs (${activeBanks.length + activeFds.length})` },
          { key: 'cash' as const, label: `Cash Vault (${formatRupee(totalCashBalance)})` },
          { key: 'wallets' as const, label: `Wallets (${formatRupee(totalWalletBalance)})` },
          { key: 'khatabook' as const, label: `Dues & Receivables (${khatabookSummary.activeReceivablesCount + khatabookSummary.activePayablesCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-heading ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. BANK ACCOUNTS & FIXED DEPOSITS DASHBOARD (When on 'banks' or 'all') */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'banks') && (
        <div className="space-y-5 pt-1">
          {/* Bank Dashboard Hero */}
          <BankDashboardHero
            bankPosition={bankPosition}
            onNewTransferClick={() => {
              setTransferDefaultBankId(undefined);
              setIsBankTransferOpen(true);
            }}
            onNewAccountClick={() => setIsAddBankAccountOpen(true)}
            onNewFDClick={() => setIsAddFDOpen(true)}
            onExportPdfClick={() => {
              window.dispatchEvent(new CustomEvent('afinity-open-pdf-export', { detail: { category: 'banks' } }));
            }}
          />

          {/* Search, Filter & Audit Log Trigger Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={bankSearchQuery}
                onChange={(e) => setBankSearchQuery(e.target.value)}
                placeholder="Search bank name, account nickname, or last 4 digits..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Type Filter Chips & History CTA */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'all' as const, label: 'All' },
                { key: 'salary' as const, label: 'Salary' },
                { key: 'savings' as const, label: 'Savings' },
                { key: 'current' as const, label: 'Current' },
                { key: 'overdraft' as const, label: 'Overdraft' },
                { key: 'fd' as const, label: 'FDs' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setBankTypeFilter(f.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    bankTypeFilter === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <button
                onClick={() => setIsTransferHistoryOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all whitespace-nowrap"
                title="View Transfer Logs"
              >
                <History className="w-3.5 h-3.5 text-blue-400" />
                <span>Logs</span>
              </button>
            </div>
          </div>

          {/* Grouped Bank Institutions */}
          <div className="space-y-4">
            {groupedBankInstitutions.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                <Landmark className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">No matching bank accounts found</div>
                <div className="text-xs text-slate-500">
                  Try adjusting your search query or filter criteria
                </div>
              </div>
            ) : (
              groupedBankInstitutions.map((grp, idx) => (
                <BankCardGroup
                  key={grp.bank?.id || `bank-grp-${idx}`}
                  bank={grp.bank}
                  accounts={grp.accounts}
                  fixedDeposits={grp.fixedDeposits}
                  onUpdateBalance={(acc) => setSelectedAccountForBalanceUpdate(acc)}
                  onEditAccount={(acc) => setSelectedAccountForEdit(acc)}
                  onViewDetails={(acc) => setSelectedAccountForDetail(acc)}
                  onTransfer={(acc) => {
                    setTransferDefaultBankId(acc.id);
                    setIsBankTransferOpen(true);
                  }}
                  onCloseAccount={(acc) => setSelectedAccountForClosure(acc)}
                  onArchiveAccountToggle={async (acc) => {
                    if (acc.status === 'archived') {
                      await restoreBankAccount(acc.id);
                      showToast(`✓ Restored ${acc.name}`);
                    } else {
                      await archiveBankAccount(acc.id);
                      showToast(`✓ Archived ${acc.name}`);
                    }
                  }}
                  onFDActionClick={(fd, action) => {
                    setSelectedFDForAction(fd);
                    setFdInitialAction(action);
                  }}
                  onFDEdit={(fd) => {
                    setSelectedFDForEdit(fd);
                  }}
                  onFDArchiveToggle={async (fd) => {
                    if (fd.status === 'archived') {
                      await restoreFixedDeposit(fd.id);
                      showToast(`✓ Restored ${fd.name}`);
                    } else {
                      await archiveFixedDeposit(fd.id);
                      showToast(`✓ Archived ${fd.name}`);
                    }
                  }}
                  onDeleteAccount={async (acc) => {
                    if (window.confirm(`Are you sure you want to permanently delete bank account "${acc.displayName || acc.name}"?`)) {
                      await deleteBankAccount(acc.id);
                      showToast(`✓ Deleted ${acc.displayName || acc.name}`);
                    }
                  }}
                  onDeleteFD={async (fd) => {
                    if (window.confirm(`Are you sure you want to permanently delete Fixed Deposit "${fd.name}"?`)) {
                      await deleteFixedDeposit(fd.id);
                      showToast(`✓ Deleted Fixed Deposit ${fd.name}`);
                    }
                  }}
                  onAddAccountToBank={() => setIsAddBankAccountOpen(true)}
                />
              ))
            )}
          </div>

          {/* Quick Manual Past FD Entry Helper Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-[#0c1427] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">Have Existing / Past Created Fixed Deposits?</h4>
                <p className="text-xs text-slate-400">
                  Add your past created FDs manually with deposit start date, maturity date, interest rate & accrued interest calculation.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddFDOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer font-heading whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Past / Created FD</span>
            </button>
          </div>

          {/* Bank & Past Net Worth History Dashboard */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0a101f] border border-blue-900/40 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">Bank & Past Net Worth History</h3>
                  <p className="text-xs text-slate-400">Historical valuation milestones, snapshot trajectory & bank balance records</p>
                </div>
              </div>
              <Badge variant="blue">{snapshots.length} Snapshots Recorded</Badge>
            </div>

            {/* Snapshots & Balance Milestones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {snapshots.slice(-3).reverse().map((snap) => (
                <div
                  key={snap.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">{snap.dateString || snap.date}</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 text-[10px] font-bold">
                      {snap.label || 'Snapshot'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Net Worth</span>
                    <div className="text-lg font-bold text-white font-mono">{formatRupee(snap.netWorth)}</div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80 text-slate-400">
                    <span>Liquid Bank & Cash</span>
                    <span className="text-emerald-400 font-mono font-semibold">{formatRupee(snap.totalAssets || 0)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Balance History Log */}
            {balanceHistory.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 font-heading">
                  Recent Bank Balance Audit Events ({Math.min(balanceHistory.length, 5)})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {balanceHistory.slice(0, 5).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{new Date(rec.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span className="text-white font-medium">{rec.accountName || 'Bank Account'}</span>
                        {rec.reason && <span className="text-slate-500 text-[11px]">({rec.reason})</span>}
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500 line-through">{formatRupee(rec.previousBalance)}</span>
                        <span className="text-cyan-400 font-bold">{formatRupee(rec.newBalance)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PHYSICAL CASH VAULT HERO & ADVANCED DENOMINATIONS (When on 'cash' or 'all') */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'cash') && (
        <div className="space-y-4 pt-1">
          <SectionHeader
            title="Physical Cash Vaults & Denominations"
            subtitle="Real-time physical note tracking & multi-vault management"
            badge={<Badge variant="success">{formatRupee(totalCashBalance)}</Badge>}
          />

          {/* Main Cash Vault Hero Card */}
          <CashVaultHero
            totalCash={totalCashBalance}
            totalNotes={totalNotesCount}
            totalCoins={totalCoinsCount}
            vaults={activeCash}
            selectedVaultId={selectedCashVaultId}
            onSelectVault={(id) => setSelectedCashVaultId(id)}
            onOpenDenominationEditor={() => setIsDenomEditorOpen(true)}
            onOpenAddVault={() => setIsAddCashVaultOpen(true)}
            onOpenTransfer={() => {
              setCashTransferMode('transfer');
              setIsCashTransferOpen(true);
            }}
            onOpenAtmWithdrawal={() => {
              setCashTransferMode('atm');
              setIsCashTransferOpen(true);
            }}
            lastUpdatedDateString={vaultUpdatedDisplay}
          />

          {/* Cash Analytics: High-value vs Mid vs Small change progress bars */}
          <CashVaultAnalytics
            denominations={displayedDenominations}
            totalCash={currentDisplayCash}
          />

          {/* Full Denominations Inventory with Old / New variant breakdown */}
          <DenominationBreakdownTable
            denominations={displayedDenominations}
            totalCash={currentDisplayCash}
            isEditable={true}
            onUpdateDenomination={handleUpdateSingleDenom}
            onOpenEditAll={() => setIsDenomEditorOpen(true)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DIGITAL WALLETS & STORED VALUE (When on 'wallets' or 'all') */}
      {/* ========================================================================= */}
      {activeTab === 'wallets' && (
        <div className="space-y-5 pt-1 animate-in fade-in duration-200">
          {/* Wallet Dashboard Hero */}
          <WalletDashboardHero
            summary={walletPosition}
            onAddWallet={() => setIsAddWalletOpen(true)}
            onTransfer={() => {
              setWalletTransferInitialWalletId(undefined);
              setWalletTransferInitialMode('bank_to_wallet');
              setIsWalletTransferOpen(true);
            }}
            onViewTransferHistory={() => {
              setSelectedWalletForTransferHistory(null);
              setIsWalletTransferHistoryOpen(true);
            }}
          />

          {/* Step 5D Dedicated Cashback Tracking Section */}
          <CashbackSection
            summary={cashbackSummary}
            wallets={activeWallets}
            transactions={walletTransactions}
            onAddCashback={() => {
              setCashbackModalMode('earn');
              setSelectedWalletForCashback(null);
              setIsCashbackModalOpen(true);
            }}
            onUseCashback={() => {
              setCashbackModalMode('use');
              setSelectedWalletForCashback(null);
              setIsCashbackModalOpen(true);
            }}
            onAdjustCashback={() => {
              setCashbackModalMode('adjust');
              setSelectedWalletForCashback(null);
              setIsCashbackModalOpen(true);
            }}
            onViewHistory={() => setIsCashbackHistoryOpen(true)}
          />

          {/* Wallet Distribution Chart (when multiple wallets exist) */}
          {activeWallets.length > 0 && (
            <WalletDistributionChart wallets={activeWallets} />
          )}

          {/* Search, Filter & Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={walletSearchQuery}
                onChange={(e) => setWalletSearchQuery(e.target.value)}
                placeholder="Search wallet name, provider (Amazon, Paytm), notes..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Chips & Sort */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'all' as const, label: 'All' },
                { key: 'active' as const, label: 'Active' },
                { key: 'archived' as const, label: 'Archived' },
                { key: 'included' as const, label: 'Included in Net Worth' },
                { key: 'excluded' as const, label: 'Excluded' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setWalletFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    walletFilter === f.key
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <div className="min-w-[140px]">
                <SelectField
                  value={walletSortBy}
                  onChange={(val) => setWalletSortBy(val as any)}
                  options={[
                    { value: 'balance_desc', label: 'Highest Balance', badge: 'High', badgeColor: 'purple' },
                    { value: 'balance_asc', label: 'Lowest Balance', badge: 'Low', badgeColor: 'slate' },
                    { value: 'recent', label: 'Recently Updated', badge: 'Time', badgeColor: 'cyan' },
                    { value: 'name', label: 'Name A-Z', badge: 'A-Z', badgeColor: 'blue' },
                  ]}
                  triggerClassName="py-1.5 px-3 rounded-xl bg-neutral-800 text-neutral-200 border-neutral-700 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Wallets Grid */}
          <div className="space-y-4">
            {filteredWallets.length === 0 ? (
              <div className="p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800 text-center space-y-3">
                <Smartphone className="w-8 h-8 text-neutral-600 mx-auto" />
                <div className="text-sm font-bold text-neutral-300">
                  {walletFilter === 'archived'
                    ? 'No archived wallets found'
                    : 'No matching wallets found'}
                </div>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  {walletFilter === 'archived'
                    ? 'Closed or archived wallets will appear here with preserved audit records.'
                    : 'Add a new digital wallet like Amazon Pay, Paytm, or a custom stored balance.'}
                </p>
                {walletFilter !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => setIsAddWalletOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Wallet</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredWallets.map((wallet) => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    onTransfer={(w) => {
                      setWalletTransferInitialWalletId(w.id);
                      setWalletTransferInitialMode('bank_to_wallet');
                      setIsWalletTransferOpen(true);
                    }}
                    onUpdateBalance={(w) => setSelectedWalletForBalanceUpdate(w)}
                    onViewHistory={(w) => setSelectedWalletForHistory(w)}
                    onEdit={(w) => setSelectedWalletForEdit(w)}
                    onArchive={(w) => setSelectedWalletForArchive(w)}
                    onRestore={(w) => {
                      restoreWallet(w.id).then(() =>
                        showToast(`✓ Restored ${w.displayName || w.name}`)
                      );
                    }}
                    onDelete={async (w) => {
                      if (window.confirm(`Are you sure you want to permanently delete wallet "${w.displayName || w.name}"?`)) {
                        await deleteWallet(w.id);
                        showToast(`✓ Deleted wallet ${w.displayName || w.name}`);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* When on 'all' tab, show compact preview with link to full tab */}
      {activeTab === 'all' && (
        <div className="space-y-3 pt-2">
          <SectionHeader
            title="Digital Wallets & Stored Value"
            subtitle="Instant UPI, shopping balances & rewards"
            badge={<Badge variant="purple">{activeWallets.length} Wallets</Badge>}
            actionText="Manage all →"
            onActionClick={() => setActiveTab('wallets')}
          />
          {activeWallets.length === 0 ? (
            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center">
              <p className="text-xs text-neutral-400">No active digital wallets configured.</p>
              <button
                type="button"
                onClick={() => setIsAddWalletOpen(true)}
                className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                + Add Amazon Pay, Paytm or Cashback Wallet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeWallets.map((w) => (
                <WalletCard
                  key={w.id}
                  wallet={w}
                  onTransfer={(wallet) => {
                    setWalletTransferInitialWalletId(wallet.id);
                    setWalletTransferInitialMode('bank_to_wallet');
                    setIsWalletTransferOpen(true);
                  }}
                  onUpdateBalance={(w) => setSelectedWalletForBalanceUpdate(w)}
                  onViewHistory={(w) => setSelectedWalletForHistory(w)}
                  onEdit={(w) => setSelectedWalletForEdit(w)}
                  onArchive={(w) => setSelectedWalletForArchive(w)}
                  onRestore={(w) => {
                    restoreWallet(w.id).then(() =>
                      showToast(`✓ Restored ${w.displayName || w.name}`)
                    );
                  }}
                  onDelete={async (wallet) => {
                    if (window.confirm(`Are you sure you want to permanently delete wallet "${wallet.displayName || wallet.name}"?`)) {
                      await deleteWallet(wallet.id);
                      showToast(`✓ Deleted wallet ${wallet.displayName || wallet.name}`);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. KHATABOOK COMMAND CENTER & PERSONAL LEDGER (Step 8B) */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'khatabook') && (
        <div className="space-y-4 pt-2">
          {activeTab === 'all' && (
            <SectionHeader
              title="Dues & Receivables"
              subtitle="Pending lendings, friend splits, and upcoming payables"
              badge={
                <Badge variant="cyan">
                  {khatabookSummary.personCount} {khatabookSummary.personCount === 1 ? 'Person' : 'People'}
                </Badge>
              }
              actionText="Manage Dues & Receivables →"
              onActionClick={() => setActiveTab('khatabook')}
            />
          )}

          <KhatabookCommandCenter initialFilter="all" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4 BANK MODALS */}
      {/* ========================================================================= */}

      {/* Add Bank Account Modal */}
      <AddBankAccountModal
        isOpen={isAddBankAccountOpen}
        onClose={() => setIsAddBankAccountOpen(false)}
        onAccountCreated={(acc) => showToast(`✓ Added ${acc.displayName || acc.name}`)}
      />

      {/* Edit Bank Account Details & Average Balance Modal */}
      <EditBankAccountModal
        isOpen={!!selectedAccountForEdit}
        account={activeAccountForEdit}
        onClose={() => setSelectedAccountForEdit(null)}
        onAccountUpdated={(acc) => showToast(`✓ Updated ${acc.displayName || acc.name}`)}
      />

      {/* Comprehensive Bank Account Details & Average Balance Manager Modal */}
      <BankAccountDetailModal
        isOpen={!!selectedAccountForDetail}
        account={activeAccountForDetail}
        onClose={() => setSelectedAccountForDetail(null)}
        onEditAccount={(acc) => {
          setSelectedAccountForDetail(null);
          setSelectedAccountForEdit(acc);
        }}
        onUpdateBalance={(acc) => {
          setSelectedAccountForDetail(null);
          setSelectedAccountForBalanceUpdate(acc);
        }}
        onTransfer={(acc) => {
          setSelectedAccountForDetail(null);
          setTransferDefaultBankId(acc.id);
          setIsBankTransferOpen(true);
        }}
        onCloseAccount={(acc) => {
          setSelectedAccountForDetail(null);
          setSelectedAccountForClosure(acc);
        }}
      />

      {/* Add Fixed Deposit Modal (New & Past Created FDs) */}
      <AddFixedDepositModal
        isOpen={isAddFDOpen}
        onClose={() => setIsAddFDOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Edit Fixed Deposit Modal */}
      <EditFixedDepositModal
        isOpen={!!selectedFDForEdit}
        onClose={() => setSelectedFDForEdit(null)}
        fd={selectedFDForEdit}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Internal Fund Transfer Modal */}
      <BankTransferModal
        isOpen={isBankTransferOpen}
        onClose={() => setIsBankTransferOpen(false)}
        defaultSourceBankId={transferDefaultBankId}
      />

      {/* Update Bank Balance Modal */}
      <UpdateBankBalanceModal
        isOpen={!!selectedAccountForBalanceUpdate}
        onClose={() => setSelectedAccountForBalanceUpdate(null)}
        account={selectedAccountForBalanceUpdate}
      />

      {/* Close Bank Account Modal */}
      <CloseBankAccountModal
        isOpen={!!selectedAccountForClosure}
        onClose={() => setSelectedAccountForClosure(null)}
        account={selectedAccountForClosure}
      />

      {/* Fixed Deposit Actions Modal (Withdraw / Renew / Close) */}
      <FDActionModal
        isOpen={!!selectedFDForAction}
        onClose={() => setSelectedFDForAction(null)}
        fd={selectedFDForAction}
        initialAction={fdInitialAction}
      />

      {/* Transfer History Audit Logs Modal */}
      <BankTransferHistoryModal
        isOpen={isTransferHistoryOpen}
        onClose={() => setIsTransferHistoryOpen(false)}
      />

      {/* ========================================================================= */}
      {/* STEP 5 DIGITAL WALLET MODALS */}
      {/* ========================================================================= */}

      {/* Add New Wallet Modal */}
      <AddWalletModal
        isOpen={isAddWalletOpen}
        onClose={() => setIsAddWalletOpen(false)}
        onCreateWallet={async (data) => {
          const w = await addWallet(data);
          showToast(`✓ Created ${w.displayName || w.name}`);
          return w;
        }}
        onAdd={async (data) => {
          const w = await addWallet(data);
          showToast(`✓ Created ${w.displayName || w.name}`);
          return w;
        }}
      />

      {/* Edit Wallet Details Modal */}
      <EditWalletModal
        isOpen={!!selectedWalletForEdit}
        wallet={selectedWalletForEdit}
        onClose={() => setSelectedWalletForEdit(null)}
        onUpdate={async (id, updates) => {
          const w = await updateWallet(id, updates);
          showToast(`✓ Updated ${w.displayName || w.name}`);
          return w;
        }}
      />

      {/* Direct Balance Adjustment Modal */}
      <UpdateWalletBalanceModal
        isOpen={!!selectedWalletForBalanceUpdate}
        wallet={selectedWalletForBalanceUpdate}
        onClose={() => setSelectedWalletForBalanceUpdate(null)}
        onUpdateBalance={async (id, newBal, reason) => {
          const w = await updateWalletBalance(id, newBal, reason);
          showToast(`✓ Stored balance updated`);
          return w;
        }}
      />

      {/* Step 5D Unified Cashback Modal (Earn / Use / Adjust) */}
      <CashbackModal
        isOpen={isCashbackModalOpen}
        initialMode={cashbackModalMode}
        wallets={wallets}
        preselectedWalletId={selectedWalletForCashback?.id}
        onClose={() => {
          setIsCashbackModalOpen(false);
          setSelectedWalletForCashback(null);
        }}
        onRecordEarned={async (walletId, amount, source, date, description) => {
          const res = await recordCashbackEarned(walletId, amount, source, date, description);
          showToast(`✓ Credited ₹${amount.toLocaleString('en-IN')} cashback`);
          return res;
        }}
        onRecordUsed={async (walletId, amount, source, date, description) => {
          const res = await recordCashbackUsed(walletId, amount, source, date, description);
          showToast(`✓ Used ₹${amount.toLocaleString('en-IN')} cashback`);
          return res;
        }}
        onRecordAdjustment={async (walletId, newBalance, source, date, description) => {
          const res = await recordCashbackAdjustment(walletId, newBalance, source, date, description);
          showToast(`✓ Adjusted cashback balance to ₹${newBalance.toLocaleString('en-IN')}`);
          return res;
        }}
      />

      {/* Step 5D Cashback History Modal */}
      <CashbackHistoryModal
        isOpen={isCashbackHistoryOpen}
        onClose={() => setIsCashbackHistoryOpen(false)}
        wallets={wallets}
        transactions={walletTransactions}
      />

      {/* Legacy Cashback / Reward Credit Modal */}
      <AddCashbackModal
        isOpen={!!selectedWalletForCashback && !isCashbackModalOpen}
        wallets={wallets}
        preselectedWalletId={selectedWalletForCashback?.id}
        onClose={() => setSelectedWalletForCashback(null)}
        onAddCashback={async (walletId, amount, reason) => {
          const w = await addCashbackCredit(walletId, amount, reason);
          showToast(`✓ Added ₹${amount.toLocaleString('en-IN')} cashback`);
          return w;
        }}
      />

      {/* Wallet Spend / Redemption Modal */}
      <WalletSpendModal
        isOpen={!!selectedWalletForSpend}
        wallets={wallets}
        preselectedWalletId={selectedWalletForSpend?.id}
        onClose={() => setSelectedWalletForSpend(null)}
        onSpend={async (walletId, amount, purpose) => {
          const w = await recordWalletSpend(walletId, amount, purpose);
          showToast(`✓ Recorded ₹${amount.toLocaleString('en-IN')} spend`);
          return w;
        }}
      />

      {/* Multi-Account Transfer / Top-up Modal */}
      <WalletTransferModal
        isOpen={isWalletTransferOpen}
        wallets={wallets}
        bankAccounts={bankAccounts}
        cashHoldings={cashHoldings}
        initialWalletId={walletTransferInitialWalletId}
        initialMode={walletTransferInitialMode}
        onClose={() => setIsWalletTransferOpen(false)}
        onTransferBankToWallet={async (bankId, walletId, amount, notes) => {
          const res = await transferBankToWallet(bankId, walletId, amount, notes);
          showToast(`✓ Loaded ₹${amount.toLocaleString('en-IN')} into wallet`);
          return res;
        }}
        onTransferWalletToBank={async (walletId, bankId, amount, notes) => {
          const res = await transferWalletToBank(walletId, bankId, amount, notes);
          showToast(`✓ Withdrew ₹${amount.toLocaleString('en-IN')} to bank`);
          return res;
        }}
        onTransferWalletToWallet={async (fromId, toId, amount, notes) => {
          const res = await transferWalletToWallet(fromId, toId, amount, notes);
          showToast(`✓ Transferred ₹${amount.toLocaleString('en-IN')} between wallets`);
          return res;
        }}
        onTransferCashToWallet={async (cashId, walletId, amount, notes) => {
          const res = await transferCashToWallet(cashId, walletId, amount, notes);
          showToast(`✓ Deposited ₹${amount.toLocaleString('en-IN')} cash into wallet`);
          return res;
        }}
        onTransferWalletToCash={async (walletId, cashId, amount, notes) => {
          const res = await transferWalletToCash(walletId, cashId, amount, notes);
          showToast(`✓ Withdrew ₹${amount.toLocaleString('en-IN')} physical cash from wallet`);
          return res;
        }}
      />

      {/* Archive / Close Wallet Modal */}
      <ArchiveWalletModal
        isOpen={!!selectedWalletForArchive}
        wallet={selectedWalletForArchive}
        onClose={() => setSelectedWalletForArchive(null)}
        onArchive={async (id, closureDate, finalBalance, closureNote) => {
          await archiveWallet(id, closureDate, finalBalance, closureNote);
          showToast(`✓ Wallet archived`);
        }}
      />

      {/* Wallet History & Audit Trail Modal */}
      <WalletHistoryModal
        isOpen={!!selectedWalletForHistory}
        wallet={selectedWalletForHistory}
        balanceHistory={balanceHistory}
        walletTransactions={walletTransactions}
        auditEvents={auditEvents}
        transfers={transfers}
        onClose={() => setSelectedWalletForHistory(null)}
      />

      {/* Wallet Transfer History Log Modal (Date | Source | Destination | Amount | Status | Note) */}
      <WalletTransferHistoryModal
        isOpen={isWalletTransferHistoryOpen}
        transfers={transfers}
        walletId={selectedWalletForTransferHistory?.id}
        walletName={selectedWalletForTransferHistory?.displayName || selectedWalletForTransferHistory?.name}
        onClose={() => {
          setIsWalletTransferHistoryOpen(false);
          setSelectedWalletForTransferHistory(null);
        }}
      />

      {/* ========================================================================= */}
      {/* PREVIOUS STEP MODALS */}
      {/* ========================================================================= */}

      {/* Add Generic Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Add Khatabook Modal */}
      <AddKhatabookModal
        isOpen={isAddKhatabookModalOpen}
        onClose={() => setIsAddKhatabookModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Physical Cash Full Denomination Recount Modal */}
      <CashDenominationEditorModal
        isOpen={isDenomEditorOpen}
        onClose={() => setIsDenomEditorOpen(false)}
        vaultId={selectedCashVaultId === 'all' ? undefined : selectedCashVaultId}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Create New Cash Vault Modal */}
      <AddCashVaultModal
        isOpen={isAddCashVaultOpen}
        onClose={() => setIsAddCashVaultOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Cash Transfer & ATM Withdrawal Modal */}
      <CashTransferModal
        isOpen={isCashTransferOpen}
        onClose={() => setIsCashTransferOpen(false)}
        mode={cashTransferMode}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#0f1d35] border border-cyan-500/50 shadow-2xl text-xs font-bold text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
