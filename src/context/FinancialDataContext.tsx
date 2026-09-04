/**
 * Afinity Centralized Financial Data Context & State Management
 * Connects UI directly to Repository / IndexedDB with optimistic reactivity.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Bank,
  BankAccount,
  BankAverageBalanceRecord,
  FixedDepositAccount,
  CashHoldingAccount,
  DigitalWallet,
  CreditCard,
  CreditLimitGroup,
  CreditCardPayment,
  CreditCardPaymentMethod,
  InvestmentHolding,
  IPOApplication,
  KhatabookEntry,
  SIPRecord,
  AddSIPInput,
  UpdateSIPInput,
  SIPSafetyReport,
  InternalTransferRecord,
  FinancialSnapshot,
  BalanceHistoryRecord,
  AuditEvent,
  UserSettings,
  PortfolioSummary,
  CashDenomination,
  ExportedBackupData,
  WalletTransaction,
  CashbackSource,
  CashbackType,
  InvestmentPriceRefreshFrequency,
  PortfolioPriceRefreshSummary,
  KhatabookSummary,
  SettleKhatabookParams,
  KhatabookSettlementResult,
  ComparisonPeriod,
  NetWorthComparisonResult,
  MonthOverMonthComparison,
  SnapshotLabel,
  SnapshotType,
} from '../types';
import { repository } from '../services/repository';
import { marketPriceService } from '../services/marketPrice/marketPriceService';
import { sipSafetyService } from '../services/sipSafetyService';
import {
  calculateTotalAssets,
  calculateTotalLiabilities,
  calculateNetWorth,
  calculateLiquidAssets,
  generatePortfolioSummary,
  calculateBankPosition,
  BankPositionSummary,
  calculateWalletPosition,
  WalletPositionSummary,
  calculateCashbackSummary,
  CashbackSummary,
  calculateCreditPositionSummary,
  CreditPositionSummary,
  calculateKhatabookSummary,
  calculateKhatabookNetPosition,
  createSnapshotDataFromInput,
  compareNetWorthWithPeriod,
  compareMonthOverMonth,
} from '../services/calculations';

interface FinancialDataContextType {
  isLoading: boolean;
  isOffline: boolean;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  // Raw and active entity arrays
  banks: Bank[];
  bankAccounts: BankAccount[];
  fixedDeposits: FixedDepositAccount[];
  cashHoldings: CashHoldingAccount[];
  wallets: DigitalWallet[];
  creditCards: CreditCard[];
  creditLimitGroups: CreditLimitGroup[];
  investments: InvestmentHolding[];
  ipoApplications: IPOApplication[];
  khatabookEntries: KhatabookEntry[];
  sips: SIPRecord[];
  activeSIPs: SIPRecord[];
  stoppedSIPs: SIPRecord[];
  sipSafetyReport: SIPSafetyReport;
  transfers: InternalTransferRecord[];
  snapshots: FinancialSnapshot[];
  balanceHistory: BalanceHistoryRecord[];
  walletTransactions: WalletTransaction[];
  auditEvents: AuditEvent[];
  settings: UserSettings;

  // Real-time derived aggregations
  portfolioSummary: PortfolioSummary;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
  bankPosition: BankPositionSummary;
  walletPosition: WalletPositionSummary;
  cashbackSummary: CashbackSummary;
  creditPosition: CreditPositionSummary;
  khatabookSummary: KhatabookSummary;
  khatabookNetPosition: number;

  // Step 9A: Comparison & Historical Analysis
  monthOverMonthComparison: MonthOverMonthComparison;
  getComparisonForPeriod: (period: ComparisonPeriod) => NetWorthComparisonResult;

  // Bank & Account CRUD actions
  addBank: (data: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Bank>;
  updateBank: (id: string, updates: Partial<Bank>) => Promise<Bank>;
  archiveBank: (id: string) => Promise<void>;

  addBankAccount: (data: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => Promise<BankAccount>;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => Promise<BankAccount>;
  updateBankAccountBalance: (id: string, newBalance: number, reason?: string) => Promise<BankAccount>;
  logBankAccountAverageBalance: (id: string, recordData: Omit<BankAverageBalanceRecord, 'id' | 'createdAt'>) => Promise<BankAccount>;
  closeBankAccount: (id: string, closureDate: string, finalBalance?: number, notes?: string) => Promise<BankAccount>;
  archiveBankAccount: (id: string) => Promise<void>;
  restoreBankAccount: (id: string) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;

  // Transfers
  transferBankToBank: (fromBankId: string, toBankId: string, amount: number, notes?: string) => Promise<{ from: BankAccount; to: BankAccount; transfer: InternalTransferRecord }>;
  withdrawBankToCash: (bankId: string, cashId: string, amount: number, notes?: string) => Promise<{ bank: BankAccount; cash: CashHoldingAccount; transfer: InternalTransferRecord }>;
  transferCashToBank: (cashId: string, bankId: string, amount: number, notes?: string) => Promise<{ cash: CashHoldingAccount; bank: BankAccount; transfer: InternalTransferRecord }>;
  transferBankToWallet: (bankId: string, walletId: string, amount: number, notes?: string) => Promise<{ bank: BankAccount; wallet: DigitalWallet; transfer: InternalTransferRecord }>;
  transferWalletToBank: (walletId: string, bankId: string, amount: number, notes?: string) => Promise<{ wallet: DigitalWallet; bank: BankAccount; transfer: InternalTransferRecord }>;
  transferWalletToWallet: (fromWalletId: string, toWalletId: string, amount: number, notes?: string) => Promise<{ from: DigitalWallet; to: DigitalWallet; transfer: InternalTransferRecord }>;
  transferCashToWallet: (cashId: string, walletId: string, amount: number, notes?: string) => Promise<{ cash: CashHoldingAccount; wallet: DigitalWallet; transfer: InternalTransferRecord }>;
  transferWalletToCash: (walletId: string, cashId: string, amount: number, notes?: string) => Promise<{ wallet: DigitalWallet; cash: CashHoldingAccount; transfer: InternalTransferRecord }>;

  // Fixed Deposits
  addFixedDeposit: (data: Omit<FixedDepositAccount, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => Promise<FixedDepositAccount>;
  updateFixedDeposit: (id: string, updates: Partial<FixedDepositAccount>) => Promise<FixedDepositAccount>;
  matureOrWithdrawFD: (fdId: string, destinationBankId?: string, payoutAmount?: number, action?: 'withdraw' | 'renew' | 'close', notes?: string) => Promise<{ fd: FixedDepositAccount; bank?: BankAccount }>;
  renewFD: (oldFdId: string, newPrincipal: number, newInterestRate: number, newMaturityDate: string, notes?: string) => Promise<{ oldFd: FixedDepositAccount; newFd: FixedDepositAccount }>;
  archiveFixedDeposit: (id: string) => Promise<void>;
  restoreFixedDeposit: (id: string) => Promise<void>;
  deleteFixedDeposit: (id: string) => Promise<void>;

  // Cash Vaults
  addCashHolding: (data: Omit<CashHoldingAccount, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => Promise<CashHoldingAccount>;
  updateCashHolding: (id: string, updates: Partial<CashHoldingAccount>) => Promise<CashHoldingAccount>;
  updateCashDenominations: (id: string, denominations: CashDenomination[]) => Promise<CashHoldingAccount>;
  transferCashBetweenVaults: (fromId: string, toId: string, amount: number, notes?: string) => Promise<{ from: CashHoldingAccount; to: CashHoldingAccount }>;
  archiveCashHolding: (id: string) => Promise<void>;
  restoreCashHolding: (id: string) => Promise<void>;
  deleteCashHolding: (id: string) => Promise<void>;

  // Wallets
  addWallet: (data: Omit<DigitalWallet, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => Promise<DigitalWallet>;
  updateWallet: (id: string, updates: Partial<DigitalWallet>) => Promise<DigitalWallet>;
  updateWalletBalance: (id: string, newBalance: number, reason?: string) => Promise<DigitalWallet>;
  addCashbackCredit: (id: string, amount: number, reason?: string) => Promise<DigitalWallet>;
  recordWalletSpend: (id: string, amount: number, reason?: string) => Promise<DigitalWallet>;
  recordCashbackEarned: (walletId: string, amount: number, source?: CashbackSource | string, date?: string, description?: string) => Promise<{ wallet: DigitalWallet; transaction: WalletTransaction }>;
  recordCashbackUsed: (walletId: string, amount: number, source?: CashbackSource | string, date?: string, description?: string) => Promise<{ wallet: DigitalWallet; transaction: WalletTransaction }>;
  recordCashbackAdjustment: (walletId: string, newBalance: number, source?: CashbackSource | string, date?: string, description?: string) => Promise<{ wallet: DigitalWallet; transaction: WalletTransaction }>;
  archiveWallet: (id: string, closureDate?: string, finalBalance?: number, closureNote?: string) => Promise<void>;
  restoreWallet: (id: string) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;

  // Credit Cards (Step 6A & 6C)
  creditCardPayments: CreditCardPayment[];
  addCreditCard: (data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CreditCard>;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => Promise<CreditCard>;
  updateCreditCardOutstanding: (id: string, newOutstanding: number, reason?: string) => Promise<CreditCard>;
  recordCreditCardPayment: (params: {
    cardId: string;
    amount: number;
    paymentDate?: string;
    paymentMethod: CreditCardPaymentMethod;
    sourceAccountId?: string;
    notes?: string;
  }) => Promise<{
    card: CreditCard;
    payment: CreditCardPayment;
    bank?: BankAccount;
    cash?: CashHoldingAccount;
    transfer?: InternalTransferRecord;
  }>;
  deleteCreditCardPayment: (id: string) => Promise<void>;
  archiveCreditCard: (id: string) => Promise<void>;
  restoreCreditCard: (id: string) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;

  // Credit Limit Groups (Step 6A)
  addCreditLimitGroup: (data: Omit<CreditLimitGroup, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CreditLimitGroup>;
  updateCreditLimitGroup: (id: string, updates: Partial<CreditLimitGroup>) => Promise<CreditLimitGroup>;
  archiveCreditLimitGroup: (id: string) => Promise<void>;
  deleteCreditLimitGroup: (id: string) => Promise<void>;

  // Investments
  addInvestment: (data: Omit<InvestmentHolding, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => Promise<InvestmentHolding>;
  updateInvestment: (id: string, updates: Partial<InvestmentHolding>) => Promise<InvestmentHolding>;
  updateInvestmentPrice: (id: string, newPrice: number, priceSource?: string, metadata?: any) => Promise<InvestmentHolding>;
  archiveInvestment: (id: string) => Promise<void>;
  restoreInvestment: (id: string) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  isPriceRefreshing: boolean;
  lastPriceRefreshSummary: PortfolioPriceRefreshSummary | null;
  refreshInvestmentPrices: (options?: { force?: boolean }) => Promise<PortfolioPriceRefreshSummary>;
  updatePriceRefreshFrequency: (frequency: InvestmentPriceRefreshFrequency) => Promise<void>;
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<UserSettings>;

  // IPO Applications (Step 7A / 7B)
  addIPOApplication: (data: Omit<IPOApplication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IPOApplication>;
  updateIPOApplication: (id: string, updates: Partial<IPOApplication>) => Promise<IPOApplication>;
  archiveIPOApplication: (id: string) => Promise<void>;
  restoreIPOApplication: (id: string) => Promise<void>;
  deleteIPOApplication: (id: string) => Promise<void>;

  // Khatabook (Step 8A)
  addKhatabookEntry: (data: Omit<KhatabookEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => Promise<KhatabookEntry>;
  updateKhatabookEntry: (id: string, updates: Partial<KhatabookEntry>) => Promise<KhatabookEntry>;
  toggleSettleKhatabook: (id: string) => Promise<KhatabookEntry>;
  settleKhatabookEntry: (params: SettleKhatabookParams) => Promise<KhatabookSettlementResult>;
  settleKhatabook: (params: SettleKhatabookParams) => Promise<KhatabookSettlementResult>;
  archiveKhatabookEntry: (id: string) => Promise<void>;
  restoreKhatabookEntry: (id: string) => Promise<void>;
  deleteKhatabookEntry: (id: string) => Promise<void>;

  // Systematic Investment Plans & Payment Safety (Step 10A)
  addSIP: (data: AddSIPInput) => Promise<SIPRecord>;
  updateSIP: (id: string, updates: UpdateSIPInput) => Promise<SIPRecord>;
  toggleSIPStatus: (id: string, newStatus?: 'active' | 'stopped') => Promise<SIPRecord>;
  deleteSIP: (id: string) => Promise<void>;
  refreshSIPSafety: () => SIPSafetyReport;
  sipReminderPreferences: Record<string, boolean>;
  toggleSIPReminder: (sipId: string) => boolean;
  setSIPReminder: (sipId: string, enabled: boolean) => void;
  isSIPReminderEnabled: (sipId: string) => boolean;

  // System & Snapshots (Step 9A)
  createSnapshot: (options?: { label?: SnapshotLabel; note?: string; snapshotType?: SnapshotType }) => Promise<FinancialSnapshot>;
  createDailySnapshot: () => Promise<{ snapshot: FinancialSnapshot; isUpdated: boolean }>;
  createManualSnapshot: (label?: SnapshotLabel, note?: string) => Promise<FinancialSnapshot>;
  saveOrUpdateDailySnapshot: () => Promise<{ snapshot: FinancialSnapshot; isUpdated: boolean }>;
  deleteSnapshot: (id: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  resetToDemoData: () => Promise<void>;
  exportBackup: () => Promise<ExportedBackupData>;
  importBackup: (backup: ExportedBackupData) => Promise<boolean>;
}

const FinancialDataContext = createContext<FinancialDataContextType | null>(null);

export const FinancialDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Entities
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDepositAccount[]>([]);
  const [cashHoldings, setCashHoldings] = useState<CashHoldingAccount[]>([]);
  const [wallets, setWallets] = useState<DigitalWallet[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [creditLimitGroups, setCreditLimitGroups] = useState<CreditLimitGroup[]>([]);
  const [creditCardPayments, setCreditCardPayments] = useState<CreditCardPayment[]>([]);
  const [investments, setInvestments] = useState<InvestmentHolding[]>([]);
  const [ipoApplications, setIpoApplications] = useState<IPOApplication[]>([]);
  const [khatabookEntries, setKhatabookEntries] = useState<KhatabookEntry[]>([]);
  const [sips, setSips] = useState<SIPRecord[]>([]);
  const [sipReminderPreferences, setSipReminderPreferences] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('afinity_sip_reminder_prefs');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored SIP reminder preferences:', e);
    }
    return {};
  });
  const [transfers, setTransfers] = useState<InternalTransferRecord[]>([]);
  const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryRecord[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isPriceRefreshing, setIsPriceRefreshing] = useState<boolean>(false);
  const [lastPriceRefreshSummary, setLastPriceRefreshSummary] = useState<PortfolioPriceRefreshSummary | null>(null);
  const hasCheckedStartupRefreshRef = useRef<boolean>(false);
  const hasCheckedStartupDailySnapshotRef = useRef<boolean>(false);
  const [settings, setSettings] = useState<UserSettings>({
    id: 'user_settings',
    currency: 'INR',
    theme: 'midnight_dark',
    numberingSystem: 'indian',
    biometricLock: true,
    priceRefreshFrequency: 'twice_daily',
    dataVersion: 1,
  });

  // Synchronize active visual theme with DOM root and localStorage
  useEffect(() => {
    const isLight = settings.theme === 'light' || settings.theme === 'light_contrast';
    if (isLight) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light', 'theme-light');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('afinity_theme', 'light');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#f1f5f9');
    } else {
      document.documentElement.classList.remove('light', 'theme-light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('afinity_theme', 'dark');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#080c16');
    }
  }, [settings.theme]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch all state from Dexie
  const refreshAllData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [
        bList,
        baList,
        fds,
        cash,
        w,
        cards,
        limitGroups,
        ccPayments,
        invs,
        ipos,
        kb,
        sipsData,
        trfs,
        snaps,
        history,
        wTx,
        audits,
        userSettings,
      ] = await Promise.all([
        repository.getAllBanks(),
        repository.getAllBankAccounts(),
        repository.getAllFixedDeposits(),
        repository.getAllCashHoldings(),
        repository.getAllWallets(),
        repository.getAllCreditCards(),
        repository.getAllCreditLimitGroups(),
        repository.getCreditCardPayments(),
        repository.getAllInvestments(),
        repository.getAllIPOApplications(),
        repository.getAllKhatabookEntries(),
        repository.getAllSIPs(),
        repository.getAllTransfers(),
        repository.getAllSnapshots(),
        repository.getBalanceHistory(),
        repository.getWalletTransactions(),
        repository.getAuditEvents(),
        repository.getSettings(),
      ]);

      setBanks(bList);
      setBankAccounts(baList);
      setFixedDeposits(fds);
      setCashHoldings(cash);
      setWallets(w);
      setCreditCards(cards);
      setCreditLimitGroups(limitGroups);
      setCreditCardPayments(ccPayments);
      setInvestments(invs);
      setIpoApplications(ipos);
      setKhatabookEntries(kb);
      setSips(sipsData);
      setTransfers(trfs);
      setSnapshots(snaps);
      setBalanceHistory(history);
      setWalletTransactions(wTx);
      setAuditEvents(audits);
      setSettings(userSettings);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error fetching financial data from repository:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await repository.initDatabase();
        await refreshAllData();
      } catch (err) {
        console.error('Failed to init local database:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [refreshAllData]);

  // Derived financial calculations
  const calculationInput = useMemo(
    () => ({
      bankAccounts,
      fixedDeposits,
      cashHoldings,
      wallets,
      investments,
      creditCards,
      creditLimitGroups,
      khatabookEntries,
    }),
    [bankAccounts, fixedDeposits, cashHoldings, wallets, investments, creditCards, creditLimitGroups, khatabookEntries]
  );

  const totalAssets = useMemo(() => calculateTotalAssets(calculationInput), [calculationInput]);
  const totalLiabilities = useMemo(() => calculateTotalLiabilities(calculationInput), [calculationInput]);
  const netWorth = useMemo(() => calculateNetWorth(totalAssets, totalLiabilities), [totalAssets, totalLiabilities]);
  const liquidAssets = useMemo(() => calculateLiquidAssets(calculationInput), [calculationInput]);
  const portfolioSummary = useMemo(() => generatePortfolioSummary(calculationInput, '1M'), [calculationInput]);
  const bankPosition = useMemo(() => calculateBankPosition(bankAccounts, fixedDeposits), [bankAccounts, fixedDeposits]);
  const walletPosition = useMemo(() => calculateWalletPosition(wallets), [wallets]);
  const cashbackSummary = useMemo(
    () => calculateCashbackSummary(wallets, walletTransactions),
    [wallets, walletTransactions]
  );
  const creditPosition = useMemo(
    () => calculateCreditPositionSummary(creditCards, creditLimitGroups),
    [creditCards, creditLimitGroups]
  );
  const khatabookSummary = useMemo(
    () => calculateKhatabookSummary(khatabookEntries),
    [khatabookEntries]
  );
  const khatabookNetPosition = useMemo(
    () => calculateKhatabookNetPosition(khatabookEntries),
    [khatabookEntries]
  );

  // Systematic Investment Plans (Step 10A)
  const activeSIPs = useMemo(
    () => sips.filter((s) => s.sipStatus === 'active' && s.status !== 'archived'),
    [sips]
  );
  const stoppedSIPs = useMemo(
    () => sips.filter((s) => s.sipStatus === 'stopped' && s.status !== 'archived'),
    [sips]
  );
  const sipSafetyReport = useMemo(
    () => sipSafetyService.evaluatePaymentSafety(sips, bankAccounts),
    [sips, bankAccounts]
  );

  // Step 9A: Derived Historical Comparisons
  const monthOverMonthComparison = useMemo(() => {
    return compareMonthOverMonth(snapshots, calculationInput);
  }, [snapshots, calculationInput]);

  const getComparisonForPeriod = useCallback(
    (period: ComparisonPeriod): NetWorthComparisonResult => {
      return compareNetWorthWithPeriod(calculationInput, snapshots, period);
    },
    [calculationInput, snapshots]
  );

  // Automated Daily Snapshot: On startup, ensure today's valuation is captured/updated
  useEffect(() => {
    if (isLoading) return;
    if (hasCheckedStartupDailySnapshotRef.current) return;
    hasCheckedStartupDailySnapshotRef.current = true;

    const performDailySnapshotCheck = async () => {
      try {
        const snapData = createSnapshotDataFromInput(calculationInput, {
          label: 'Daily',
          snapshotType: 'daily',
        });
        const result = await repository.saveOrUpdateDailySnapshot(snapData);
        if (result.snapshot) {
          const allSnaps = await repository.getAllSnapshots();
          setSnapshots(allSnaps);
        }
      } catch (err) {
        console.warn('Auto daily snapshot recording notice:', err);
      }
    };

    performDailySnapshotCheck();
  }, [isLoading, calculationInput]);

  // Bank Actions
  const addBank = async (data: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await repository.createBank(data);
    await refreshAllData();
    return result;
  };

  const updateBank = async (id: string, updates: Partial<Bank>) => {
    const result = await repository.updateBank(id, updates);
    await refreshAllData();
    return result;
  };

  const archiveBank = async (id: string) => {
    await repository.archiveBank(id);
    await refreshAllData();
  };

  // Bank Account Actions
  const addBankAccount = async (data: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => {
    const result = await repository.createBankAccount(data);
    await refreshAllData();
    return result;
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    const result = await repository.updateBankAccount(id, updates);
    await refreshAllData();
    return result;
  };

  const updateBankAccountBalance = async (id: string, newBalance: number, reason?: string) => {
    const result = await repository.updateBankAccountBalance(id, newBalance, reason);
    await refreshAllData();
    return result;
  };

  const logBankAccountAverageBalance = async (
    id: string,
    recordData: Omit<BankAverageBalanceRecord, 'id' | 'createdAt'>
  ) => {
    const result = await repository.logBankAccountAverageBalance(id, recordData);
    await refreshAllData();
    return result;
  };

  const closeBankAccount = async (id: string, closureDate: string, finalBalance: number = 0, notes?: string) => {
    const result = await repository.closeBankAccount(id, closureDate, finalBalance, notes);
    await refreshAllData();
    return result;
  };

  const archiveBankAccount = async (id: string) => {
    await repository.archiveBankAccount(id);
    await refreshAllData();
  };

  const restoreBankAccount = async (id: string) => {
    await repository.restoreBankAccount(id);
    await refreshAllData();
  };

  const deleteBankAccount = async (id: string) => {
    await repository.deleteBankAccount(id);
    await refreshAllData();
  };

  // Transfer Actions
  const transferBankToBank = async (fromBankId: string, toBankId: string, amount: number, notes?: string) => {
    const result = await repository.transferBankToBank(fromBankId, toBankId, amount, notes);
    await refreshAllData();
    return result;
  };

  const withdrawBankToCash = async (bankId: string, cashId: string, amount: number, notes?: string) => {
    const result = await repository.withdrawBankToCash(bankId, cashId, amount, notes);
    await refreshAllData();
    return result;
  };

  const transferCashToBank = async (cashId: string, bankId: string, amount: number, notes?: string) => {
    const result = await repository.transferCashToBank(cashId, bankId, amount, notes);
    await refreshAllData();
    return result;
  };

  const transferBankToWallet = async (bankId: string, walletId: string, amount: number, notes?: string) => {
    const result = await repository.transferBankToWallet(bankId, walletId, amount, notes);
    await refreshAllData();
    return result;
  };

  const transferWalletToBank = async (walletId: string, bankId: string, amount: number, notes?: string) => {
    const result = await repository.transferWalletToBank(walletId, bankId, amount, notes);
    await refreshAllData();
    return result;
  };

  const transferWalletToWallet = async (fromWalletId: string, toWalletId: string, amount: number, notes?: string) => {
    const result = await repository.transferWalletToWallet(fromWalletId, toWalletId, amount, notes);
    await refreshAllData();
    return result;
  };

  const transferCashToWallet = async (cashId: string, walletId: string, amount: number, notes?: string) => {
    const result = await repository.transferCashToWallet(cashId, walletId, amount, notes);
    await refreshAllData();
    return result;
  };

  const transferWalletToCash = async (walletId: string, cashId: string, amount: number, notes?: string) => {
    const result = await repository.transferWalletToCash(walletId, cashId, amount, notes);
    await refreshAllData();
    return result;
  };

  // Fixed Deposit Actions
  const addFixedDeposit = async (data: Omit<FixedDepositAccount, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => {
    const result = await repository.createFixedDeposit(data);
    await refreshAllData();
    return result;
  };

  const updateFixedDeposit = async (id: string, updates: Partial<FixedDepositAccount>) => {
    const result = await repository.updateFixedDeposit(id, updates);
    await refreshAllData();
    return result;
  };

  const matureOrWithdrawFD = async (
    fdId: string,
    destinationBankId?: string,
    payoutAmount?: number,
    action: 'withdraw' | 'renew' | 'close' = 'withdraw',
    notes?: string
  ) => {
    const result = await repository.matureOrWithdrawFD(fdId, destinationBankId, payoutAmount, action, notes);
    await refreshAllData();
    return result;
  };

  const renewFD = async (oldFdId: string, newPrincipal: number, newInterestRate: number, newMaturityDate: string, notes?: string) => {
    const result = await repository.renewFD(oldFdId, newPrincipal, newInterestRate, newMaturityDate, notes);
    await refreshAllData();
    return result;
  };

  const archiveFixedDeposit = async (id: string) => {
    await repository.archiveFixedDeposit(id);
    await refreshAllData();
  };

  const restoreFixedDeposit = async (id: string) => {
    await repository.restoreFixedDeposit(id);
    await refreshAllData();
  };

  const deleteFixedDeposit = async (id: string) => {
    await repository.deleteFixedDeposit(id);
    await refreshAllData();
  };

  // Cash Holding Actions
  const addCashHolding = async (data: Omit<CashHoldingAccount, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => {
    const result = await repository.createCashHolding(data);
    await refreshAllData();
    return result;
  };

  const updateCashHolding = async (id: string, updates: Partial<CashHoldingAccount>) => {
    const result = await repository.updateCashHolding(id, updates);
    await refreshAllData();
    return result;
  };

  const updateCashDenominations = async (id: string, denominations: CashDenomination[]) => {
    const result = await repository.updateCashDenominations(id, denominations);
    await refreshAllData();
    return result;
  };

  const transferCashBetweenVaults = async (fromId: string, toId: string, amount: number, notes?: string) => {
    const result = await repository.transferCashBetweenVaults(fromId, toId, amount, notes);
    await refreshAllData();
    return result;
  };

  const archiveCashHolding = async (id: string) => {
    await repository.archiveCashHolding(id);
    await refreshAllData();
  };

  const restoreCashHolding = async (id: string) => {
    await repository.restoreCashHolding(id);
    await refreshAllData();
  };

  const deleteCashHolding = async (id: string) => {
    await repository.deleteCashHolding(id);
    await refreshAllData();
  };

  // Wallet Actions
  const addWallet = async (data: Omit<DigitalWallet, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => {
    const result = await repository.createWallet(data);
    await refreshAllData();
    return result;
  };

  const updateWallet = async (id: string, updates: Partial<DigitalWallet>) => {
    const result = await repository.updateWallet(id, updates);
    await refreshAllData();
    return result;
  };

  const updateWalletBalance = async (id: string, newBalance: number, reason?: string) => {
    const result = await repository.updateWalletBalance(id, newBalance, reason);
    await refreshAllData();
    return result;
  };

  const addCashbackCredit = async (id: string, amount: number, reason?: string) => {
    const result = await repository.addCashbackCredit(id, amount, reason);
    await refreshAllData();
    return result;
  };

  const recordWalletSpend = async (id: string, amount: number, reason?: string) => {
    const result = await repository.recordWalletSpend(id, amount, reason);
    await refreshAllData();
    return result;
  };

  const recordCashbackEarned = async (
    walletId: string,
    amount: number,
    source?: CashbackSource | string,
    date?: string,
    description?: string
  ) => {
    const result = await repository.recordCashbackEarned(walletId, amount, source, date, description);
    await refreshAllData();
    return result;
  };

  const recordCashbackUsed = async (
    walletId: string,
    amount: number,
    source?: CashbackSource | string,
    date?: string,
    description?: string
  ) => {
    const result = await repository.recordCashbackUsed(walletId, amount, source, date, description);
    await refreshAllData();
    return result;
  };

  const recordCashbackAdjustment = async (
    walletId: string,
    newBalance: number,
    source?: CashbackSource | string,
    date?: string,
    description?: string
  ) => {
    const result = await repository.recordCashbackAdjustment(walletId, newBalance, source, date, description);
    await refreshAllData();
    return result;
  };

  const archiveWallet = async (id: string, closureDate?: string, finalBalance?: number, closureNote?: string) => {
    await repository.archiveWallet(id, closureDate, finalBalance, closureNote);
    await refreshAllData();
  };

  const restoreWallet = async (id: string) => {
    await repository.restoreWallet(id);
    await refreshAllData();
  };

  const deleteWallet = async (id: string) => {
    await repository.deleteWallet(id);
    await refreshAllData();
  };

  // Credit Card Actions (Step 6A)
  const addCreditCard = async (data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await repository.createCreditCard(data);
    await refreshAllData();
    return result;
  };

  const updateCreditCard = async (id: string, updates: Partial<CreditCard>) => {
    const result = await repository.updateCreditCard(id, updates);
    await refreshAllData();
    return result;
  };

  const updateCreditCardOutstanding = async (id: string, newOutstanding: number, reason?: string) => {
    const result = await repository.updateCreditCardOutstanding(id, newOutstanding, reason);
    await refreshAllData();
    return result;
  };

  const recordCreditCardPayment = async (params: {
    cardId: string;
    amount: number;
    paymentDate?: string;
    paymentMethod: CreditCardPaymentMethod;
    sourceAccountId?: string;
    notes?: string;
  }) => {
    const result = await repository.recordCreditCardPayment(params);
    await refreshAllData();
    return result;
  };

  const deleteCreditCardPayment = async (id: string) => {
    await repository.deleteCreditCardPayment(id);
    await refreshAllData();
  };

  const archiveCreditCard = async (id: string) => {
    await repository.archiveCreditCard(id);
    await refreshAllData();
  };

  const restoreCreditCard = async (id: string) => {
    await repository.restoreCreditCard(id);
    await refreshAllData();
  };

  const deleteCreditCard = async (id: string) => {
    await repository.deleteCreditCard(id);
    await refreshAllData();
  };

  // Credit Limit Group Actions (Step 6A)
  const addCreditLimitGroup = async (data: Omit<CreditLimitGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await repository.createCreditLimitGroup(data);
    await refreshAllData();
    return result;
  };

  const updateCreditLimitGroup = async (id: string, updates: Partial<CreditLimitGroup>) => {
    const result = await repository.updateCreditLimitGroup(id, updates);
    await refreshAllData();
    return result;
  };

  const archiveCreditLimitGroup = async (id: string) => {
    await repository.archiveCreditLimitGroup(id);
    await refreshAllData();
  };

  const deleteCreditLimitGroup = async (id: string) => {
    await repository.deleteCreditLimitGroup(id);
    await refreshAllData();
  };

  // Investment Actions
  const addInvestment = async (data: Omit<InvestmentHolding, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => {
    const result = await repository.createInvestment(data);
    await refreshAllData();
    return result;
  };

  const updateInvestment = async (id: string, updates: Partial<InvestmentHolding>) => {
    const result = await repository.updateInvestment(id, updates);
    await refreshAllData();
    return result;
  };

  const updateInvestmentPrice = async (
    id: string,
    newPrice: number,
    priceSource?: string,
    metadata?: any
  ) => {
    const result = await repository.updateInvestmentPrice(id, newPrice, priceSource, metadata);
    await refreshAllData();
    return result;
  };

  const archiveInvestment = async (id: string) => {
    await repository.archiveInvestment(id);
    await refreshAllData();
  };

  const restoreInvestment = async (id: string) => {
    await repository.restoreInvestment(id);
    await refreshAllData();
  };

  const deleteInvestment = async (id: string) => {
    await repository.deleteInvestment(id);
    await refreshAllData();
  };

  const updatePriceRefreshFrequency = async (frequency: InvestmentPriceRefreshFrequency) => {
    const updated = await repository.updateSettings({ priceRefreshFrequency: frequency });
    setSettings(updated);
  };

  const updateUserSettings = async (updates: Partial<UserSettings>) => {
    const updated = await repository.updateSettings(updates);
    setSettings(updated);
    return updated;
  };

  const refreshInvestmentPrices = async (options: { force?: boolean } = {}): Promise<PortfolioPriceRefreshSummary> => {
    setIsPriceRefreshing(true);
    try {
      const allHoldings = await repository.getAllInvestments();
      const currentSettings = await repository.getSettings();
      const frequency = currentSettings.priceRefreshFrequency || 'twice_daily';

      const summary = await marketPriceService.refreshPortfolioPrices(allHoldings, {
        force: options.force,
        frequency,
      });

      setLastPriceRefreshSummary(summary);
      // Reload fresh state to trigger recalculations
      await refreshAllData();
      return summary;
    } finally {
      setIsPriceRefreshing(false);
    }
  };

  // Perform a silent background auto-refresh on startup if due
  useEffect(() => {
    if (!isLoading && !isOffline && !hasCheckedStartupRefreshRef.current && investments.length > 0) {
      hasCheckedStartupRefreshRef.current = true;
      const frequency = settings.priceRefreshFrequency || 'twice_daily';
      if (frequency !== 'manual_only') {
        const anyDue = investments.some((h) => marketPriceService.isHoldingDueForRefresh(h, frequency, false));
        if (anyDue) {
          refreshInvestmentPrices({ force: false }).catch((err) => {
            console.warn('Background auto-refresh skipped or deferred:', err);
          });
        }
      }
    }
  }, [isLoading, isOffline, investments.length, settings.priceRefreshFrequency]);

  // IPO Application Actions
  const addIPOApplication = async (data: Omit<IPOApplication, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await repository.createIPOApplication(data);
    await refreshAllData();
    return result;
  };

  const updateIPOApplication = async (id: string, updates: Partial<IPOApplication>) => {
    const result = await repository.updateIPOApplication(id, updates);
    await refreshAllData();
    return result;
  };

  const archiveIPOApplication = async (id: string) => {
    await repository.archiveIPOApplication(id);
    await refreshAllData();
  };

  const restoreIPOApplication = async (id: string) => {
    await repository.restoreIPOApplication(id);
    await refreshAllData();
  };

  const deleteIPOApplication = async (id: string) => {
    await repository.deleteIPOApplication(id);
    await refreshAllData();
  };

  // Khatabook Actions (Step 8A)
  const addKhatabookEntry = async (data: Omit<KhatabookEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => {
    const result = await repository.createKhatabookEntry(data);
    await refreshAllData();
    return result;
  };

  const updateKhatabookEntry = async (id: string, updates: Partial<KhatabookEntry>) => {
    const result = await repository.updateKhatabookEntry(id, updates);
    await refreshAllData();
    return result;
  };

  const toggleSettleKhatabook = async (id: string) => {
    const entry = khatabookEntries.find((k) => k.id === id);
    if (!entry) throw new Error('Khatabook entry not found');
    const willBeSettled = !entry.isSettled;
    const orig =
      entry.originalAmount !== undefined
        ? Number(entry.originalAmount)
        : Number(entry.amount || 0);

    const result = await repository.updateKhatabookEntry(id, {
      isSettled: willBeSettled,
      paidAmount: willBeSettled ? orig : 0,
      remainingAmount: willBeSettled ? 0 : orig,
      amount: willBeSettled ? 0 : orig,
      status: willBeSettled ? 'PAID' : 'OPEN',
      settledDate: willBeSettled ? new Date().toISOString() : undefined,
    });
    await refreshAllData();
    return result;
  };

  const settleKhatabookEntry = async (params: SettleKhatabookParams) => {
    const result = await repository.settleKhatabookEntry(params);
    await refreshAllData();
    return result;
  };

  const archiveKhatabookEntry = async (id: string) => {
    await repository.archiveKhatabookEntry(id);
    await refreshAllData();
  };

  const restoreKhatabookEntry = async (id: string) => {
    await repository.restoreKhatabookEntry(id);
    await refreshAllData();
  };

  const deleteKhatabookEntry = async (id: string) => {
    await repository.deleteKhatabookEntry(id);
    await refreshAllData();
  };

  // Systematic Investment Plans & Payment Safety (Step 10A)
  const addSIP = async (data: AddSIPInput): Promise<SIPRecord> => {
    const created = await repository.createSIP(data);
    await refreshAllData();
    return created;
  };

  const updateSIP = async (id: string, updates: UpdateSIPInput): Promise<SIPRecord> => {
    const updated = await repository.updateSIP(id, updates);
    await refreshAllData();
    return updated;
  };

  const toggleSIPStatus = async (id: string, newStatus?: 'active' | 'stopped'): Promise<SIPRecord> => {
    const updated = await repository.toggleSIPStatus(id, newStatus);
    await refreshAllData();
    return updated;
  };

  const deleteSIP = async (id: string): Promise<void> => {
    await repository.deleteSIP(id);
    await refreshAllData();
  };

  const refreshSIPSafety = useCallback((): SIPSafetyReport => {
    return sipSafetyService.evaluatePaymentSafety(sips, bankAccounts);
  }, [sips, bankAccounts]);

  const toggleSIPReminder = useCallback((sipId: string): boolean => {
    let nextVal = false;
    setSipReminderPreferences((prev) => {
      nextVal = !prev[sipId];
      const updated = { ...prev, [sipId]: nextVal };
      try {
        localStorage.setItem('afinity_sip_reminder_prefs', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save SIP reminder preferences to localStorage', err);
      }
      return updated;
    });
    return nextVal;
  }, []);

  const setSIPReminder = useCallback((sipId: string, enabled: boolean) => {
    setSipReminderPreferences((prev) => {
      const updated = { ...prev, [sipId]: enabled };
      try {
        localStorage.setItem('afinity_sip_reminder_prefs', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save SIP reminder preferences to localStorage', err);
      }
      return updated;
    });
  }, []);

  const isSIPReminderEnabled = useCallback(
    (sipId: string): boolean => {
      return Boolean(sipReminderPreferences[sipId]);
    },
    [sipReminderPreferences]
  );

  // Snapshots & System (Step 9A)
  const createSnapshot = async (options?: {
    label?: SnapshotLabel;
    note?: string;
    snapshotType?: SnapshotType;
  }): Promise<FinancialSnapshot> => {
    const snapData = createSnapshotDataFromInput(calculationInput, options);
    const snap = await repository.createFinancialSnapshot(snapData);
    await refreshAllData();
    return snap;
  };

  const createDailySnapshot = async (): Promise<{ snapshot: FinancialSnapshot; isUpdated: boolean }> => {
    const snapData = createSnapshotDataFromInput(calculationInput, {
      label: 'Daily',
      snapshotType: 'daily',
    });
    const result = await repository.saveOrUpdateDailySnapshot(snapData);
    await refreshAllData();
    return result;
  };

  const createManualSnapshot = async (
    label: SnapshotLabel = 'Manual',
    note?: string
  ): Promise<FinancialSnapshot> => {
    const snapData = createSnapshotDataFromInput(calculationInput, {
      label,
      snapshotType: 'manual',
      note,
    });
    const snap = await repository.createFinancialSnapshot(snapData);
    await refreshAllData();
    return snap;
  };

  const saveOrUpdateDailySnapshot = async (): Promise<{ snapshot: FinancialSnapshot; isUpdated: boolean }> => {
    const snapData = createSnapshotDataFromInput(calculationInput, {
      label: 'Daily',
      snapshotType: 'daily',
    });
    const result = await repository.saveOrUpdateDailySnapshot(snapData);
    await refreshAllData();
    return result;
  };

  const deleteSnapshot = async (id: string) => {
    await repository.deleteSnapshot(id);
    await refreshAllData();
  };

  const clearAllData = async () => {
    await repository.clearAllData();
    await refreshAllData();
  };

  const resetToDemoData = async () => {
    await repository.resetToDemoData();
    await refreshAllData();
  };

  const exportBackup = async () => {
    return await repository.exportAllData();
  };

  const importBackup = async (backup: ExportedBackupData) => {
    const success = await repository.importAllData(backup);
    await refreshAllData();
    return success;
  };

  return (
    <FinancialDataContext.Provider
      value={{
        isLoading,
        isOffline,
        banks,
        bankAccounts,
        fixedDeposits,
        cashHoldings,
        wallets,
        creditCards,
        creditLimitGroups,
        investments,
        ipoApplications,
        khatabookEntries,
        transfers,
        snapshots,
        balanceHistory,
        walletTransactions,
        auditEvents,
        settings,
        portfolioSummary,
        totalAssets,
        totalLiabilities,
        netWorth,
        liquidAssets,
        bankPosition,
        walletPosition,
        cashbackSummary,
        creditPosition,
        khatabookSummary,
        khatabookNetPosition,
        monthOverMonthComparison,
        getComparisonForPeriod,
        addBank,
        updateBank,
        archiveBank,
        addBankAccount,
        updateBankAccount,
        updateBankAccountBalance,
        logBankAccountAverageBalance,
        closeBankAccount,
        archiveBankAccount,
        restoreBankAccount,
        deleteBankAccount,
        transferBankToBank,
        withdrawBankToCash,
        transferCashToBank,
        transferBankToWallet,
        transferWalletToBank,
        transferWalletToWallet,
        transferCashToWallet,
        transferWalletToCash,
        addFixedDeposit,
        updateFixedDeposit,
        matureOrWithdrawFD,
        renewFD,
        archiveFixedDeposit,
        restoreFixedDeposit,
        deleteFixedDeposit,
        addCashHolding,
        updateCashHolding,
        updateCashDenominations,
        transferCashBetweenVaults,
        archiveCashHolding,
        restoreCashHolding,
        deleteCashHolding,
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
        addCreditCard,
        updateCreditCard,
        updateCreditCardOutstanding,
        recordCreditCardPayment,
        deleteCreditCardPayment,
        archiveCreditCard,
        restoreCreditCard,
        deleteCreditCard,
        creditCardPayments,
        addCreditLimitGroup,
        updateCreditLimitGroup,
        archiveCreditLimitGroup,
        deleteCreditLimitGroup,
        addInvestment,
        updateInvestment,
        updateInvestmentPrice,
        archiveInvestment,
        restoreInvestment,
        deleteInvestment,
        isPriceRefreshing,
        lastPriceRefreshSummary,
        refreshInvestmentPrices,
        updatePriceRefreshFrequency,
        updateUserSettings,
        addIPOApplication,
        updateIPOApplication,
        archiveIPOApplication,
        restoreIPOApplication,
        deleteIPOApplication,
        addKhatabookEntry,
        updateKhatabookEntry,
        toggleSettleKhatabook,
        settleKhatabookEntry,
        settleKhatabook: settleKhatabookEntry,
        archiveKhatabookEntry,
        restoreKhatabookEntry,
        deleteKhatabookEntry,
        sips,
        activeSIPs,
        stoppedSIPs,
        sipSafetyReport,
        addSIP,
        updateSIP,
        toggleSIPStatus,
        deleteSIP,
        refreshSIPSafety,
        sipReminderPreferences,
        toggleSIPReminder,
        setSIPReminder,
        isSIPReminderEnabled,
        createSnapshot,
        createDailySnapshot,
        createManualSnapshot,
        saveOrUpdateDailySnapshot,
        deleteSnapshot,
        refreshAllData,
        lastSyncedAt,
        isSyncing,
        clearAllData,
        resetToDemoData,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = () => {
  const context = useContext(FinancialDataContext);
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
};
