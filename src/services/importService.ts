/**
 * Afinity Data Import & Migration Engine
 * Supports importing previously exported Afinity JSON backups, Afinity Demo JSON datasets,
 * Master Combined CSV files, and individual module CSVs.
 *
 * Performs rigorous schema validation, duplicate detection, differential analysis (New vs. Update vs. Unchanged),
 * safe merging, and full transactional rollback protection.
 */

import { db } from './db';
import { repository, generateId } from './repository';
import {
  Bank,
  BankAccount,
  FixedDepositAccount,
  CashHoldingAccount,
  DigitalWallet,
  WalletTransaction,
  CreditCard,
  CreditLimitGroup,
  CreditCardPayment,
  InvestmentHolding,
  IPOApplication,
  KhatabookEntry,
  InternalTransferRecord,
  FinancialSnapshot,
  BalanceHistoryRecord,
  AuditEvent,
  UserSettings,
  ExportedBackupData,
  CashDenomination,
} from '../types';

export type ImportStrategy = 'merge' | 'add_only' | 'replace';

export type ImportFileFormat = 'json' | 'master_csv' | 'single_csv' | 'unknown';

export type ImportCategory =
  | 'bankAccounts'
  | 'fixedDeposits'
  | 'cashHoldings'
  | 'wallets'
  | 'creditCards'
  | 'creditLimitGroups'
  | 'investmentHoldings'
  | 'ipoApplications'
  | 'khatabookEntries'
  | 'transfers'
  | 'snapshots'
  | 'balanceHistory'
  | 'auditEvents';

export interface RecordDiffItem {
  id: string;
  category: ImportCategory;
  categoryLabel: string;
  name: string;
  subtitle?: string;
  amountOrValue?: number;
  status: 'new' | 'update' | 'unchanged' | 'error';
  existingRecord?: any;
  importedRecord: any;
  diffSummary?: string[];
  errorMessage?: string;
}

export interface ParsedImportData {
  format: ImportFileFormat;
  fileName: string;
  fileSize: number;
  exportedAt?: string;
  version?: number;
  isValid: boolean;
  validationErrors: string[];
  totalRecordsCount: number;
  categoriesPresent: ImportCategory[];

  // Parsed collections
  banks?: Bank[];
  bankAccounts: BankAccount[];
  fixedDeposits: FixedDepositAccount[];
  cashHoldings: CashHoldingAccount[];
  wallets: DigitalWallet[];
  walletTransactions?: WalletTransaction[];
  creditCards: CreditCard[];
  creditLimitGroups: CreditLimitGroup[];
  creditCardPayments?: CreditCardPayment[];
  investmentHoldings: InvestmentHolding[];
  ipoApplications: IPOApplication[];
  khatabookEntries: KhatabookEntry[];
  transfers?: InternalTransferRecord[];
  snapshots: FinancialSnapshot[];
  balanceHistory?: BalanceHistoryRecord[];
  auditEvents?: AuditEvent[];
  settings?: UserSettings;

  // Analysis result
  diffItems: RecordDiffItem[];
  counts: {
    total: number;
    newCount: number;
    updateCount: number;
    unchangedCount: number;
    errorCount: number;
    byCategory: Record<ImportCategory, { total: number; newCount: number; updateCount: number; unchangedCount: number }>;
  };
}

export interface ImportExecutionResult {
  success: boolean;
  strategy: ImportStrategy;
  importedAt: string;
  durationMs: number;
  totalProcessed: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
  categoryBreakdown: {
    category: string;
    added: number;
    updated: number;
    skipped: number;
  }[];
}

export const CATEGORY_META: Record<ImportCategory, { label: string; icon: string; singular: string }> = {
  bankAccounts: { label: 'Bank Accounts', icon: 'Building2', singular: 'Bank Account' },
  fixedDeposits: { label: 'Fixed Deposits', icon: 'Layers', singular: 'Fixed Deposit' },
  cashHoldings: { label: 'Cash Vaults', icon: 'Banknote', singular: 'Cash Vault' },
  wallets: { label: 'Digital Wallets', icon: 'Smartphone', singular: 'Digital Wallet' },
  creditCards: { label: 'Credit Cards', icon: 'CreditCard', singular: 'Credit Card' },
  creditLimitGroups: { label: 'Shared Limits', icon: 'Layers', singular: 'Shared Limit Group' },
  investmentHoldings: { label: 'Investments', icon: 'TrendingUp', singular: 'Investment Holding' },
  ipoApplications: { label: 'IPO Tracker', icon: 'Sparkles', singular: 'IPO Application' },
  khatabookEntries: { label: 'Dues & Receivables', icon: 'BookOpen', singular: 'Khatabook Record' },
  transfers: { label: 'Transfers', icon: 'ArrowRightLeft', singular: 'Transfer Log' },
  snapshots: { label: 'Snapshots', icon: 'History', singular: 'Historical Snapshot' },
  balanceHistory: { label: 'Balance Logs', icon: 'Activity', singular: 'Balance Log' },
  auditEvents: { label: 'Audit Trail', icon: 'Shield', singular: 'Audit Event' },
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  id: 'user_settings',
  currency: 'INR',
  theme: 'dark',
  numberingSystem: 'indian',
  biometricLock: false,
  dataVersion: 2,
};

/**
 * Standard CSV Parser handling RFC 4180 quotes, multiline values, and CRLF/LF.
 */
export function parseCsvRows(csvText: string): string[][] {
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((col) => col.trim().length > 0));
}

/**
 * Normalizes header strings for flexible matching (lowercase, no spaces/underscores/dashes).
 */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds index of matching column among header candidates.
 */
function findColIndex(headers: string[], candidates: string[]): number {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const cand of candidates) {
    const normCand = normalizeHeader(cand);
    const idx = normalizedHeaders.indexOf(normCand);
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Safely parses numeric values from inputs (handles commas, currency signs, etc.).
 */
function parseNumeric(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const str = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

// =========================================================================
// SANITIZERS FOR EACH ENTITY TYPE
// =========================================================================

function sanitizeBank(raw: any, index: number): Bank {
  const name = raw.name || raw.displayName || raw.bankName || `Bank #${index + 1}`;
  return {
    id: raw.id || `bank_inst_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name,
    displayName: raw.displayName || name,
    shortCode: raw.shortCode || name.slice(0, 6).toUpperCase(),
    status: raw.status === 'archived' ? 'archived' : 'active',
    colorTheme: raw.colorTheme || 'from-blue-700 to-indigo-900',
    notes: raw.notes || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function sanitizeBankAccount(raw: any, index: number): BankAccount {
  const bankName = raw.bankName || raw.institutionName || raw.bank || 'Primary Bank';
  const name = raw.name || raw.displayName || raw.accountName || `${bankName} Account`;
  const rawType = (raw.accountType || raw.type || 'savings').toLowerCase();
  const accountType = ['savings', 'current', 'salary', 'overdraft', 'other'].includes(rawType)
    ? rawType
    : 'savings';
  const balance = parseNumeric(raw.balance !== undefined ? raw.balance : raw.currentBalance, 0);
  const rawLast4 = String(raw.last4 || raw.lastFourDigits || raw.accountNumber || '').replace(/[^0-9]/g, '').slice(-4);
  const now = new Date().toISOString();

  return {
    id: raw.id || generateId('bank_acc'),
    bankId: raw.bankId || `bank_inst_${bankName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    bankName,
    name,
    displayName: raw.displayName || name,
    institutionName: raw.institutionName || bankName,
    category: 'bank',
    accountType: accountType as any,
    accountNumberMasked: raw.accountNumberMasked || (rawLast4 ? `•••• ${rawLast4}` : '•••• ••••'),
    last4: rawLast4 || '0000',
    balance,
    openingBalance: parseNumeric(raw.openingBalance, balance),
    openingDate: raw.openingDate || now.slice(0, 10),
    currency: 'INR',
    status: raw.status === 'archived' ? 'archived' : 'active',
    ifscCode: raw.ifscCode || undefined,
    hasDebitCard: Boolean(raw.hasDebitCard),
    overdraftLimit: raw.overdraftLimit !== undefined ? parseNumeric(raw.overdraftLimit) : undefined,
    colorTheme: raw.colorTheme || 'from-blue-600 to-indigo-900',
    notes: raw.notes || undefined,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    lastUpdated: raw.lastUpdated || now,
  };
}

function sanitizeFixedDeposit(raw: any, index: number): FixedDepositAccount {
  const bankName = raw.bankName || raw.institutionName || raw.bank || 'Primary Bank';
  const name = raw.name || raw.displayName || raw.fdName || `Fixed Deposit #${index + 1}`;
  const principal = parseNumeric(raw.principal !== undefined ? raw.principal : (raw.balance !== undefined ? raw.balance : raw.amount), 50000);
  const interestRate = parseNumeric(raw.interestRate !== undefined ? raw.interestRate : raw.rate, 7.0);
  const now = new Date().toISOString();
  const startDate = raw.startDate || now.slice(0, 10);
  const maturityDate = raw.maturityDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  const maturityAmount = parseNumeric(raw.maturityAmount !== undefined ? raw.maturityAmount : raw.maturityAmt, principal * (1 + interestRate / 100));

  return {
    id: raw.id || generateId('fd'),
    bankId: raw.bankId || `bank_inst_${bankName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    bankName,
    name,
    displayName: raw.displayName || name,
    category: 'fd',
    principal,
    balance: principal,
    interestRate,
    startDate,
    maturityDate,
    maturityAmount,
    interestType: raw.interestType || 'cumulative',
    autoRenew: Boolean(raw.autoRenew),
    fdStatus: raw.fdStatus || (raw.status === 'archived' ? 'matured' : 'active'),
    status: raw.status === 'archived' ? 'archived' : 'active',
    currency: 'INR',
    notes: raw.notes || undefined,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    lastUpdated: raw.lastUpdated || now,
  };
}

function sanitizeCashHolding(raw: any, index: number): CashHoldingAccount {
  const name = raw.name || raw.displayName || raw.vaultName || `Cash Vault #${index + 1}`;
  const balance = parseNumeric(raw.balance !== undefined ? raw.balance : (raw.totalCash !== undefined ? raw.totalCash : raw.amount), 0);
  const now = new Date().toISOString();

  let denominations: CashDenomination[] = Array.isArray(raw.denominations) ? raw.denominations : [];
  if (denominations.length === 0 && balance > 0) {
    denominations = [
      { denomination: 500, count: Math.floor(balance / 500), oldCount: 0, newCount: Math.floor(balance / 500), type: 'note', variantKey: '500_note' },
      { denomination: 100, count: Math.floor((balance % 500) / 100), oldCount: 0, newCount: Math.floor((balance % 500) / 100), type: 'note', variantKey: '100_note' },
    ];
  }

  return {
    id: raw.id || generateId('cash'),
    name,
    displayName: raw.displayName || name,
    category: 'cash',
    balance,
    currency: 'INR',
    status: raw.status === 'archived' ? 'archived' : 'active',
    location: raw.location || 'Physical Cash Storage',
    denominations,
    notes: raw.notes || undefined,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    lastUpdated: raw.lastUpdated || now,
  };
}

function sanitizeWallet(raw: any, index: number): DigitalWallet {
  const provider = raw.provider || raw.walletProvider || 'paytm';
  const name = raw.name || raw.displayName || `${provider} Wallet`;
  const balance = parseNumeric(raw.balance !== undefined ? raw.balance : raw.mainBalance, 0);
  const now = new Date().toISOString();

  return {
    id: raw.id || generateId('wallet'),
    category: 'wallet',
    name,
    displayName: raw.displayName || name,
    provider,
    walletType: raw.walletType || 'DIGITAL_WALLET',
    balance,
    owner: raw.owner || 'Self',
    status: raw.status === 'archived' ? 'archived' : 'active',
    currency: 'INR',
    includeInNetWorth: raw.includeInNetWorth !== false,
    notes: raw.notes || undefined,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    lastUpdated: raw.lastUpdated || now,
  };
}

function sanitizeCreditCard(raw: any, index: number): CreditCard {
  const bankName = raw.bankName || raw.issuer || 'Bank';
  const cardName = raw.cardName || raw.name || `${bankName} Credit Card`;
  const creditLimit = parseNumeric(raw.creditLimit !== undefined ? raw.creditLimit : (raw.totalLimit !== undefined ? raw.totalLimit : raw.limit), 100000);
  const outstanding = parseNumeric(raw.outstanding !== undefined ? raw.outstanding : (raw.currentOutstanding !== undefined ? raw.currentOutstanding : raw.balance), 0);
  const lastFourDigits = String(raw.lastFourDigits || raw.last4 || '0000').replace(/[^0-9]/g, '').slice(-4) || '0000';
  const now = new Date().toISOString();

  return {
    id: raw.id || generateId('card'),
    name: cardName,
    cardName,
    displayName: raw.displayName || cardName,
    bankName,
    issuer: bankName,
    lastFourDigits,
    creditLimit,
    outstanding,
    availableLimit: raw.availableLimit !== undefined ? parseNumeric(raw.availableLimit) : Math.max(0, creditLimit - outstanding),
    cardNetwork: raw.cardNetwork || 'visa',
    cardType: 'CREDIT_CARD',
    owner: raw.owner || 'Self',
    status: raw.status === 'blocked' ? 'blocked' : raw.status === 'archived' ? 'archived' : 'active',
    billingCycleDate: parseNumeric(raw.billingCycleDate || raw.billingCycleDay || 15, 15),
    statementDay: parseNumeric(raw.statementDay || raw.paymentDueDay || 5, 5),
    sharedLimitGroupId: raw.sharedLimitGroupId || raw.creditLimitGroupId || undefined,
    creditLimitGroupId: raw.creditLimitGroupId || raw.sharedLimitGroupId || undefined,
    includeInNetWorth: raw.includeInNetWorth !== false,
    notes: raw.notes || undefined,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    lastUpdated: raw.lastUpdated || now,
  };
}

function sanitizeCreditLimitGroup(raw: any, index: number): CreditLimitGroup {
  const bankName = raw.bankName || raw.issuer || 'Bank';
  const name = raw.name || `${bankName} Shared Limit Group`;
  const totalLimit = parseNumeric(raw.totalLimit !== undefined ? raw.totalLimit : (raw.sharedLimit !== undefined ? raw.sharedLimit : raw.limit), 200000);
  const now = new Date().toISOString();

  return {
    id: raw.id || generateId('limit_group'),
    name,
    issuer: bankName,
    bankName,
    totalLimit,
    sharedLimit: totalLimit,
    status: raw.status === 'archived' ? 'archived' : 'active',
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}

function sanitizeInvestmentHolding(raw: any, index: number): InvestmentHolding {
  const symbol = (raw.symbol || raw.ticker || `ASSET_${index + 1}`).toUpperCase();
  const name = raw.name || raw.companyName || symbol;
  const quantity = parseNumeric(raw.quantity !== undefined ? raw.quantity : (raw.qty !== undefined ? raw.qty : raw.shares), 1);
  const averageBuyPrice = parseNumeric(raw.averageBuyPrice !== undefined ? raw.averageBuyPrice : (raw.buyPrice !== undefined ? raw.buyPrice : raw.avgPrice), 100);
  const currentPrice = parseNumeric(raw.currentPrice !== undefined ? raw.currentPrice : (raw.cmp !== undefined ? raw.cmp : (raw.marketPrice !== undefined ? raw.marketPrice : averageBuyPrice)), averageBuyPrice);
  const investedAmount = parseNumeric(raw.investedAmount, quantity * averageBuyPrice);
  const currentValue = parseNumeric(raw.currentValue, quantity * currentPrice);
  const unrealizedProfitLoss = parseNumeric(raw.unrealizedProfitLoss, currentValue - investedAmount);
  const unrealizedProfitLossPercentage = averageBuyPrice > 0 ? ((currentPrice - averageBuyPrice) / averageBuyPrice) * 100 : 0;
  const rawType = (raw.assetType || raw.type || 'stock').toLowerCase();
  const assetType = ['stock', 'etf', 'mutual_fund', 'gold', 'sgb', 'other'].includes(rawType)
    ? rawType
    : rawType.includes('etf')
    ? 'etf'
    : 'stock';
  const broker = raw.broker || raw.platform || 'Zerodha';
  const now = new Date().toISOString();

  return {
    id: raw.id || generateId('inv'),
    name,
    symbol,
    assetType: assetType as any,
    type: assetType as any,
    quantity,
    averageBuyPrice,
    currentPrice,
    investedAmount,
    currentValue,
    unrealizedProfitLoss,
    unrealizedProfitLossPercentage,
    broker,
    platform: broker,
    status: raw.status === 'sold' ? 'closed' : raw.status === 'archived' ? 'archived' : 'active',
    includeInNetWorth: raw.includeInNetWorth !== false,
    notes: raw.notes || undefined,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    lastUpdated: raw.lastUpdated || now,
  };
}

function sanitizeIpoApplication(raw: any, index: number): IPOApplication {
  const companyName = raw.companyName || raw.name || `IPO Opportunity #${index + 1}`;
  const symbol = (raw.symbol || raw.ticker || companyName.slice(0, 8).replace(/[^a-zA-Z0-9]/g, '')).toUpperCase();
  const lotsApplied = parseNumeric(raw.lotsApplied !== undefined ? raw.lotsApplied : (raw.lots !== undefined ? raw.lots : 1), 1);
  const sharesPerLot = parseNumeric(raw.sharesPerLot, 100);
  const bidPrice = parseNumeric(raw.bidPrice !== undefined ? raw.bidPrice : (raw.price !== undefined ? raw.price : 150), 150);
  const blockedAmount = parseNumeric(raw.blockedAmount, lotsApplied * sharesPerLot * bidPrice);
  const rawStatus = (raw.ipoStatus || raw.status || 'applied').toLowerCase();
  const ipoStatus = ['applied', 'allotted', 'not_allotted', 'cancelled'].includes(rawStatus) ? rawStatus : 'applied';
  const now = new Date().toISOString();

  return {
    id: raw.id || generateId('ipo'),
    name: companyName,
    companyName,
    symbol,
    lotsApplied,
    sharesPerLot,
    bidPrice,
    blockedAmount,
    ipoStatus: ipoStatus as any,
    includeInNetWorth: raw.includeInNetWorth !== false,
    applicationDate: raw.applicationDate || now.slice(0, 10),
    allotmentDate: raw.allotmentDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    bankUsed: raw.bankUsed || 'Primary Bank',
    status: 'active',
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}

function sanitizeKhatabookEntry(raw: any, index: number): KhatabookEntry {
  const personName = raw.personName || raw.name || raw.contact || `Contact #${index + 1}`;
  const rawType = (raw.entryType || raw.type || 'RECEIVABLE').toString().toUpperCase();
  const entryType = rawType === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE';
  const originalAmount = parseNumeric(raw.originalAmount !== undefined ? raw.originalAmount : (raw.amount !== undefined ? raw.amount : raw.totalAmount), 5000);
  const paidAmount = parseNumeric(raw.paidAmount, 0);
  const remainingAmount = parseNumeric(raw.remainingAmount !== undefined ? raw.remainingAmount : (originalAmount - paidAmount), Math.max(0, originalAmount - paidAmount));
  const isSettled = Boolean(raw.isSettled || remainingAmount === 0);
  const now = new Date().toISOString();

  return {
    id: raw.id || generateId('khata'),
    name: personName,
    personName,
    entryType,
    type: entryType,
    originalAmount,
    paidAmount,
    remainingAmount,
    amount: remainingAmount,
    status: isSettled ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'OPEN',
    isSettled,
    notes: raw.notes || raw.description || 'Personal transaction',
    dueDate: raw.dueDate || undefined,
    includeInNetWorth: raw.includeInNetWorth !== false,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}

function sanitizeSnapshot(raw: any, index: number): FinancialSnapshot {
  const now = new Date().toISOString();
  const date = raw.date || raw.dateString || (raw.timestamp ? raw.timestamp.slice(0, 10) : now.slice(0, 10));
  const netWorth = parseNumeric(raw.netWorth !== undefined ? raw.netWorth : (raw.totalNetWorth !== undefined ? raw.totalNetWorth : 0), 0);
  const totalAssets = parseNumeric(raw.totalAssets, netWorth);
  const totalLiabilities = parseNumeric(raw.totalLiabilities, 0);

  return {
    id: raw.id || generateId('snap'),
    timestamp: raw.timestamp || new Date(date).toISOString(),
    date,
    dateString: date,
    netWorth,
    totalNetWorth: netWorth,
    totalAssets,
    totalLiabilities,
    totalCash: parseNumeric(raw.totalCash !== undefined ? raw.totalCash : raw.cashTotal, 0),
    totalBankBalance: parseNumeric(raw.totalBankBalance !== undefined ? raw.totalBankBalance : raw.bankTotal, 0),
    totalFixedDeposits: parseNumeric(raw.totalFixedDeposits, 0),
    totalWalletBalance: parseNumeric(raw.totalWalletBalance, 0),
    totalInvestments: parseNumeric(raw.totalInvestments !== undefined ? raw.totalInvestments : raw.investmentTotal, 0),
    totalReceivables: parseNumeric(raw.totalReceivables !== undefined ? raw.totalReceivables : raw.receivablesTotal, 0),
    totalCreditCardDue: parseNumeric(raw.totalCreditCardDue !== undefined ? raw.totalCreditCardDue : raw.creditCardTotal, 0),
    totalPayables: parseNumeric(raw.totalPayables !== undefined ? raw.totalPayables : raw.payablesTotal, 0),
    totalOverdraftLiabilities: parseNumeric(raw.totalOverdraftLiabilities, 0),
    totalIPOBlocked: parseNumeric(raw.totalIPOBlocked, 0),
    label: raw.label || 'Monthly',
    snapshotType: raw.snapshotType || 'monthly',
    note: raw.note || raw.notes || 'Imported Snapshot',
    createdAt: raw.createdAt || now,
  };
}

// =========================================================================
// MAIN ENTRY POINTS & PARSERS
// =========================================================================

export async function parseAndValidateImportFile(
  fileContent: string,
  fileName: string,
  fileSize: number
): Promise<ParsedImportData> {
  const isJson = fileName.toLowerCase().endsWith('.json') || fileContent.trim().startsWith('{') || fileContent.trim().startsWith('[');

  if (isJson) {
    return await parseJsonBackup(fileContent, fileName, fileSize);
  } else {
    return await parseCsvImport(fileContent, fileName, fileSize);
  }
}

/**
 * Extracts raw array from any object given potential keys.
 */
function extractArray(obj: any, keys: string[]): any[] {
  if (!obj || typeof obj !== 'object') return [];
  for (const k of keys) {
    if (Array.isArray(obj[k])) return obj[k];
    const foundKey = Object.keys(obj).find((actualKey) => actualKey.toLowerCase() === k.toLowerCase());
    if (foundKey && Array.isArray(obj[foundKey])) return obj[foundKey];
  }
  return [];
}

/**
 * Parses JSON backup files, supporting standard backups, Afinity demo datasets, nested structures, and arrays.
 */
async function parseJsonBackup(
  content: string,
  fileName: string,
  fileSize: number
): Promise<ParsedImportData> {
  const errors: string[] = [];
  let parsedObj: any = null;

  try {
    parsedObj = JSON.parse(content);
  } catch (err: any) {
    return createEmptyParsedData('json', fileName, fileSize, false, [
      `Invalid JSON syntax: ${err?.message || 'Could not parse JSON file'}`,
    ]);
  }

  if (!parsedObj || (typeof parsedObj !== 'object' && !Array.isArray(parsedObj))) {
    return createEmptyParsedData('json', fileName, fileSize, false, [
      'Invalid file content: Root is not a valid JSON object or array',
    ]);
  }

  // Handle case where root is a direct array of objects
  if (Array.isArray(parsedObj)) {
    const rawData = buildDataFromDirectArray(parsedObj);
    return await buildParsedDataAndDiffs(rawData, 'json', fileName, fileSize, errors);
  }

  // Unpack nested root if wrapped under "data", "payload", "afinityBackup", etc.
  const rootSource =
    parsedObj.data && typeof parsedObj.data === 'object' && !Array.isArray(parsedObj.data)
      ? { ...parsedObj.data, ...parsedObj }
      : parsedObj.afinityBackup && typeof parsedObj.afinityBackup === 'object'
      ? { ...parsedObj.afinityBackup, ...parsedObj }
      : parsedObj.backup && typeof parsedObj.backup === 'object'
      ? { ...parsedObj.backup, ...parsedObj }
      : parsedObj;

  // Extract raw collections with extensive alias and demo key support
  const rawBanks = extractArray(rootSource, ['banks', 'DEMO_BANKS', 'bankList', 'institutions']);
  const rawBankAccounts = extractArray(rootSource, ['bankAccounts', 'DEMO_BANK_ACCOUNTS', 'accounts', 'bank_accounts', 'banksAccounts']);
  const rawFDs = extractArray(rootSource, ['fixedDeposits', 'DEMO_FIXED_DEPOSITS', 'fds', 'deposits', 'fixed_deposits']);
  const rawCash = extractArray(rootSource, ['cashHoldings', 'DEMO_CASH_HOLDINGS', 'cash', 'cash_holdings', 'lockers', 'cashVaults']);
  const rawWallets = extractArray(rootSource, ['wallets', 'DEMO_WALLETS', 'digitalWallets', 'digital_wallets', 'ewallets']);
  const rawWalletTxns = extractArray(rootSource, ['walletTransactions', 'wallet_transactions', 'walletTxns']);
  const rawCards = extractArray(rootSource, ['creditCards', 'DEMO_CREDIT_CARDS', 'cards', 'credit_cards']);
  const rawGroups = extractArray(rootSource, ['creditLimitGroups', 'DEMO_CREDIT_LIMIT_GROUPS', 'limitGroups', 'sharedLimits']);
  const rawPayments = extractArray(rootSource, ['creditCardPayments', 'DEMO_CREDIT_CARD_PAYMENTS', 'cardPayments']);
  const rawInvestments = extractArray(rootSource, ['investmentHoldings', 'DEMO_INVESTMENTS', 'investments', 'holdings', 'investment_holdings', 'portfolio']);
  const rawIPOs = extractArray(rootSource, ['ipoApplications', 'DEMO_IPO_APPLICATIONS', 'ipos', 'ipo_applications']);
  const rawKhatabook = extractArray(rootSource, ['khatabookEntries', 'DEMO_KHATABOOK_ENTRIES', 'khatabook', 'dues', 'khatabook_entries']);
  const rawTransfers = extractArray(rootSource, ['transfers', 'DEMO_TRANSFERS', 'internalTransfers']);
  const rawSnapshots = extractArray(rootSource, ['snapshots', 'DEMO_HISTORICAL_SNAPSHOTS', 'financialSnapshots', 'snapshot_history']);
  const rawBalanceHistory = extractArray(rootSource, ['balanceHistory', 'balance_history']);
  const rawAuditEvents = extractArray(rootSource, ['auditEvents', 'audit_events']);

  // Sanitize each item
  const bankAccounts = rawBankAccounts.map(sanitizeBankAccount);
  const fixedDeposits = rawFDs.map(sanitizeFixedDeposit);
  const cashHoldings = rawCash.map(sanitizeCashHolding);
  const wallets = rawWallets.map(sanitizeWallet);
  const creditCards = rawCards.map(sanitizeCreditCard);
  const creditLimitGroups = rawGroups.map(sanitizeCreditLimitGroup);
  const investmentHoldings = rawInvestments.map(sanitizeInvestmentHolding);
  const ipoApplications = rawIPOs.map(sanitizeIpoApplication);
  const khatabookEntries = rawKhatabook.map(sanitizeKhatabookEntry);
  const snapshots = rawSnapshots.map(sanitizeSnapshot);
  let banks = rawBanks.map(sanitizeBank);

  // Auto-synthesize missing Bank entities from BankAccounts, FDs, and CreditCards
  const existingBankNames = new Set(banks.map((b) => normalizeHeader(b.name)));
  const discoveredBankNames = new Set<string>();

  for (const acc of bankAccounts) if (acc.bankName) discoveredBankNames.add(acc.bankName);
  for (const fd of fixedDeposits) if (fd.bankName) discoveredBankNames.add(fd.bankName);
  for (const card of creditCards) if (card.bankName) discoveredBankNames.add(card.bankName);

  for (const bankName of discoveredBankNames) {
    if (!existingBankNames.has(normalizeHeader(bankName))) {
      banks.push({
        id: `bank_inst_${bankName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: bankName,
        displayName: bankName,
        shortCode: bankName.slice(0, 6).toUpperCase(),
        status: 'active',
        colorTheme: 'from-blue-700 to-indigo-900',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      existingBankNames.add(normalizeHeader(bankName));
    }
  }

  const rawData: ExportedBackupData = {
    version: rootSource.version || 2,
    exportedAt: rootSource.exportedAt || new Date().toISOString(),
    dataVersion: 2,
    banks,
    bankAccounts,
    fixedDeposits,
    cashHoldings,
    wallets,
    walletTransactions: rawWalletTxns,
    creditCards,
    creditLimitGroups,
    creditCardPayments: rawPayments,
    investmentHoldings,
    ipoApplications,
    khatabookEntries,
    transfers: rawTransfers,
    snapshots,
    balanceHistory: rawBalanceHistory,
    auditEvents: rawAuditEvents,
    settings: rootSource.settings || DEFAULT_USER_SETTINGS,
  };

  return await buildParsedDataAndDiffs(rawData, 'json', fileName, fileSize, errors);
}

/**
 * Classifies items from a direct JSON array into respective ledger collections.
 */
function buildDataFromDirectArray(items: any[]): ExportedBackupData {
  const bankAccounts: BankAccount[] = [];
  const fixedDeposits: FixedDepositAccount[] = [];
  const cashHoldings: CashHoldingAccount[] = [];
  const wallets: DigitalWallet[] = [];
  const creditCards: CreditCard[] = [];
  const creditLimitGroups: CreditLimitGroup[] = [];
  const investmentHoldings: InvestmentHolding[] = [];
  const ipoApplications: IPOApplication[] = [];
  const khatabookEntries: KhatabookEntry[] = [];
  const snapshots: FinancialSnapshot[] = [];
  const banks: Bank[] = [];

  items.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    const keys = Object.keys(item).map((k) => k.toLowerCase());

    if (keys.some((k) => k.includes('ipo') || k.includes('lotsapplied') || k.includes('bidprice'))) {
      ipoApplications.push(sanitizeIpoApplication(item, idx));
    } else if (keys.some((k) => k.includes('interestrate') || k.includes('maturitydate') || k.includes('principal'))) {
      fixedDeposits.push(sanitizeFixedDeposit(item, idx));
    } else if (keys.some((k) => k.includes('symbol') || k.includes('ticker') || k.includes('averagebuyprice') || k.includes('currentprice') || k.includes('quantity'))) {
      investmentHoldings.push(sanitizeInvestmentHolding(item, idx));
    } else if (keys.some((k) => k.includes('personname') || k.includes('entrytype') || k.includes('originalamount') || k.includes('remainingamount'))) {
      khatabookEntries.push(sanitizeKhatabookEntry(item, idx));
    } else if (keys.some((k) => k.includes('creditlimit') || k.includes('lastfourdigits') || k.includes('cardname') || k.includes('billingcycledate'))) {
      creditCards.push(sanitizeCreditCard(item, idx));
    } else if (keys.some((k) => k.includes('sharedlimit') || k.includes('creditlimitgroup'))) {
      creditLimitGroups.push(sanitizeCreditLimitGroup(item, idx));
    } else if (keys.some((k) => k.includes('wallettype') || k.includes('provider') || k.includes('cashbackbalance'))) {
      wallets.push(sanitizeWallet(item, idx));
    } else if (keys.some((k) => k.includes('denominations') || k.includes('location') || k.includes('cashholding'))) {
      cashHoldings.push(sanitizeCashHolding(item, idx));
    } else if (keys.some((k) => k.includes('networth') || k.includes('totalassets') || k.includes('totalnetworth'))) {
      snapshots.push(sanitizeSnapshot(item, idx));
    } else if (keys.some((k) => k.includes('accounttype') || k.includes('bankname') || k.includes('balance'))) {
      bankAccounts.push(sanitizeBankAccount(item, idx));
    } else if (keys.some((k) => k.includes('shortcode') || k.includes('colortheme'))) {
      banks.push(sanitizeBank(item, idx));
    }
  });

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    dataVersion: 2,
    banks,
    bankAccounts,
    fixedDeposits,
    cashHoldings,
    wallets,
    creditCards,
    creditLimitGroups,
    investmentHoldings,
    ipoApplications,
    khatabookEntries,
    snapshots,
    balanceHistory: [],
    auditEvents: [],
    settings: DEFAULT_USER_SETTINGS,
  };
}

/**
 * Parses Master Combined CSV or Single Table CSV files.
 */
async function parseCsvImport(
  content: string,
  fileName: string,
  fileSize: number
): Promise<ParsedImportData> {
  const errors: string[] = [];

  if (content.includes('### SECTION:') || content.includes('AFINITY FINANCIAL DATA VAULT COMPLETE CSV EXPORT')) {
    return await parseMasterCsv(content, fileName, fileSize);
  }

  const rows = parseCsvRows(content);
  if (rows.length < 2) {
    return createEmptyParsedData('single_csv', fileName, fileSize, false, [
      'CSV file is empty or contains only header row with no data records',
    ]);
  }

  const headerRow = rows[0];
  const dataRows = rows.slice(1);

  const rawData: ExportedBackupData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    dataVersion: 2,
    bankAccounts: [],
    fixedDeposits: [],
    cashHoldings: [],
    wallets: [],
    creditCards: [],
    creditLimitGroups: [],
    investmentHoldings: [],
    ipoApplications: [],
    khatabookEntries: [],
    snapshots: [],
    balanceHistory: [],
    auditEvents: [],
    settings: DEFAULT_USER_SETTINGS,
  };

  const detectedCategory = detectCategoryFromHeaders(headerRow);

  if (!detectedCategory) {
    errors.push('Could not automatically determine the financial category from CSV column headers.');
    return createEmptyParsedData('single_csv', fileName, fileSize, false, errors);
  }

  switch (detectedCategory) {
    case 'bankAccounts':
      rawData.bankAccounts = parseBankAccountCsv(headerRow, dataRows);
      break;
    case 'fixedDeposits':
      rawData.fixedDeposits = parseFixedDepositCsv(headerRow, dataRows);
      break;
    case 'cashHoldings':
      rawData.cashHoldings = parseCashHoldingCsv(headerRow, dataRows);
      break;
    case 'wallets':
      rawData.wallets = parseWalletCsv(headerRow, dataRows);
      break;
    case 'creditCards':
      rawData.creditCards = parseCreditCardCsv(headerRow, dataRows);
      break;
    case 'creditLimitGroups':
      rawData.creditLimitGroups = parseCreditLimitGroupCsv(headerRow, dataRows);
      break;
    case 'investmentHoldings':
      rawData.investmentHoldings = parseInvestmentCsv(headerRow, dataRows);
      break;
    case 'ipoApplications':
      rawData.ipoApplications = parseIpoCsv(headerRow, dataRows);
      break;
    case 'khatabookEntries':
      rawData.khatabookEntries = parseKhatabookCsv(headerRow, dataRows);
      break;
    case 'snapshots':
      rawData.snapshots = parseSnapshotCsv(headerRow, dataRows);
      break;
  }

  return await buildParsedDataAndDiffs(rawData, 'single_csv', fileName, fileSize, errors);
}

/**
 * Parses Master Combined CSV containing multiple sections.
 */
async function parseMasterCsv(
  content: string,
  fileName: string,
  fileSize: number
): Promise<ParsedImportData> {
  const errors: string[] = [];

  const rawData: ExportedBackupData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    dataVersion: 2,
    bankAccounts: [],
    fixedDeposits: [],
    cashHoldings: [],
    wallets: [],
    creditCards: [],
    creditLimitGroups: [],
    investmentHoldings: [],
    ipoApplications: [],
    khatabookEntries: [],
    transfers: [],
    snapshots: [],
    balanceHistory: [],
    auditEvents: [],
    settings: DEFAULT_USER_SETTINGS,
  };

  const lines = content.split(/\r?\n/);
  let currentSection = '';
  let sectionCsvLines: string[] = [];

  const processSection = (sectionName: string, csvLines: string[]) => {
    if (!csvLines.length) return;
    const csvContent = csvLines.join('\n');
    const rows = parseCsvRows(csvContent);
    if (rows.length < 2) return;

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const norm = sectionName.toUpperCase();

    if (norm.includes('BANK ACCOUNT')) {
      rawData.bankAccounts = parseBankAccountCsv(headers, dataRows);
    } else if (norm.includes('FIXED DEPOSIT')) {
      rawData.fixedDeposits = parseFixedDepositCsv(headers, dataRows);
    } else if (norm.includes('CASH') || norm.includes('LOCKER')) {
      rawData.cashHoldings = parseCashHoldingCsv(headers, dataRows);
    } else if (norm.includes('WALLET')) {
      rawData.wallets = parseWalletCsv(headers, dataRows);
    } else if (norm.includes('CREDIT CARD')) {
      rawData.creditCards = parseCreditCardCsv(headers, dataRows);
    } else if (norm.includes('SHARED LIMIT') || norm.includes('LIMIT GROUP')) {
      rawData.creditLimitGroups = parseCreditLimitGroupCsv(headers, dataRows);
    } else if (norm.includes('INVESTMENT') || norm.includes('STOCK')) {
      rawData.investmentHoldings = parseInvestmentCsv(headers, dataRows);
    } else if (norm.includes('IPO')) {
      rawData.ipoApplications = parseIpoCsv(headers, dataRows);
    } else if (norm.includes('KHATABOOK') || norm.includes('DUE') || norm.includes('RECEIVABLE')) {
      rawData.khatabookEntries = parseKhatabookCsv(headers, dataRows);
    } else if (norm.includes('SNAPSHOT')) {
      rawData.snapshots = parseSnapshotCsv(headers, dataRows);
    }
  };

  for (const line of lines) {
    if (line.startsWith('### SECTION:')) {
      if (currentSection && sectionCsvLines.length > 0) {
        processSection(currentSection, sectionCsvLines);
      }
      currentSection = line.replace('### SECTION:', '').trim();
      sectionCsvLines = [];
    } else if (line.startsWith('### Description:') || line.startsWith('#')) {
      continue;
    } else if (line.trim().length > 0) {
      sectionCsvLines.push(line);
    }
  }

  if (currentSection && sectionCsvLines.length > 0) {
    processSection(currentSection, sectionCsvLines);
  }

  return await buildParsedDataAndDiffs(rawData, 'master_csv', fileName, fileSize, errors);
}

function detectCategoryFromHeaders(headers: string[]): ImportCategory | null {
  const normHeaders = headers.map(normalizeHeader);

  if (normHeaders.some((h) => h.includes('fd') || h.includes('interestrate') || h.includes('maturitydate') || h.includes('principal'))) {
    return 'fixedDeposits';
  }
  if (normHeaders.some((h) => h.includes('symbol') || h.includes('ticker') || h.includes('assettype') || h.includes('avgprice') || h.includes('quantity') || h.includes('broker'))) {
    return 'investmentHoldings';
  }
  if (normHeaders.some((h) => h.includes('personname') || h.includes('entrytype') || h.includes('originalamount') || h.includes('khatabook') || h.includes('paidamount'))) {
    return 'khatabookEntries';
  }
  if (normHeaders.some((h) => h.includes('cardname') || h.includes('totallimit') || h.includes('outstanding') || h.includes('cardtype') || h.includes('statementduedate'))) {
    return 'creditCards';
  }
  if (normHeaders.some((h) => h.includes('sharedlimit') || h.includes('creditlimitgroup') || h.includes('limitgroup'))) {
    return 'creditLimitGroups';
  }
  if (normHeaders.some((h) => h.includes('cashbackbalance') || h.includes('wallettype') || h.includes('digitalwallet') || h.includes('walletname'))) {
    return 'wallets';
  }
  if (normHeaders.some((h) => h.includes('locker') || h.includes('vaultname') || h.includes('cashholding') || h.includes('denominations'))) {
    return 'cashHoldings';
  }
  if (normHeaders.some((h) => h.includes('ipo') || h.includes('appliedshares') || h.includes('bidprice') || h.includes('applicationnumber'))) {
    return 'ipoApplications';
  }
  if (normHeaders.some((h) => h.includes('snapshot') || h.includes('networth') || h.includes('totalassets') || h.includes('totalliabilities'))) {
    return 'snapshots';
  }
  if (normHeaders.some((h) => h.includes('bankname') || h.includes('accounttype') || h.includes('ifsc') || h.includes('overdraftlimit') || (h.includes('accountname') && h.includes('balance')))) {
    return 'bankAccounts';
  }

  return null;
}

// ---- CSV Extractors ----

function parseBankAccountCsv(headers: string[], rows: string[][]): BankAccount[] {
  const idIdx = findColIndex(headers, ['Account ID', 'id']);
  const bankIdx = findColIndex(headers, ['Bank Name', 'Bank', 'Institution']);
  const nameIdx = findColIndex(headers, ['Account Name', 'Name']);
  const typeIdx = findColIndex(headers, ['Account Type', 'Type']);
  const last4Idx = findColIndex(headers, ['Last 4 Digits', 'Last 4', 'last4', 'Account Number']);
  const balIdx = findColIndex(headers, ['Balance (INR)', 'Balance', 'Current Balance', 'Amount']);
  const ifscIdx = findColIndex(headers, ['IFSC Code', 'IFSC']);
  const odIdx = findColIndex(headers, ['Overdraft Limit', 'OD Limit', 'overdraftLimit']);
  const notesIdx = findColIndex(headers, ['Notes', 'Note', 'Remarks']);
  const createdIdx = findColIndex(headers, ['Created At', 'createdAt']);

  return rows.map((r, i) => {
    const rawBal = balIdx !== -1 ? parseNumeric(r[balIdx]) : 0;
    const rawBank = bankIdx !== -1 && r[bankIdx] ? r[bankIdx] : 'Bank';
    const rawName = nameIdx !== -1 && r[nameIdx] ? r[nameIdx] : `Account #${i + 1}`;
    const rawLast4 = last4Idx !== -1 ? r[last4Idx].replace(/[^0-9]/g, '').slice(-4) : '';
    const rawType = typeIdx !== -1 ? (r[typeIdx].toLowerCase() as any) : 'savings';

    return sanitizeBankAccount(
      {
        id: idIdx !== -1 && r[idIdx] ? r[idIdx] : undefined,
        name: rawName,
        bankName: rawBank,
        accountType: rawType,
        balance: rawBal,
        last4: rawLast4,
        ifscCode: ifscIdx !== -1 ? r[ifscIdx] : undefined,
        overdraftLimit: odIdx !== -1 ? parseNumeric(r[odIdx]) : undefined,
        notes: notesIdx !== -1 ? r[notesIdx] : undefined,
        createdAt: createdIdx !== -1 && r[createdIdx] ? r[createdIdx] : undefined,
      },
      i
    );
  });
}

function parseFixedDepositCsv(headers: string[], rows: string[][]): FixedDepositAccount[] {
  const idIdx = findColIndex(headers, ['FD ID', 'id']);
  const nameIdx = findColIndex(headers, ['FD Name / Number', 'FD Name', 'Name', 'Deposit Name']);
  const bankIdx = findColIndex(headers, ['Bank Name', 'Bank', 'Institution']);
  const prinIdx = findColIndex(headers, ['Principal Amount (INR)', 'Principal', 'Amount', 'Balance']);
  const rateIdx = findColIndex(headers, ['Interest Rate (%)', 'Interest Rate', 'Rate', 'ROI']);
  const startIdx = findColIndex(headers, ['Start Date', 'Opening Date', 'startDate']);
  const matDateIdx = findColIndex(headers, ['Maturity Date', 'maturityDate']);
  const matAmtIdx = findColIndex(headers, ['Maturity Amount (INR)', 'Maturity Amount', 'maturityAmount']);
  const notesIdx = findColIndex(headers, ['Notes', 'Note']);

  return rows.map((r, i) => {
    return sanitizeFixedDeposit(
      {
        id: idIdx !== -1 && r[idIdx] ? r[idIdx] : undefined,
        name: nameIdx !== -1 && r[nameIdx] ? r[nameIdx] : undefined,
        bankName: bankIdx !== -1 && r[bankIdx] ? r[bankIdx] : undefined,
        principal: prinIdx !== -1 ? parseNumeric(r[prinIdx]) : undefined,
        interestRate: rateIdx !== -1 ? parseNumeric(r[rateIdx]) : undefined,
        startDate: startIdx !== -1 ? r[startIdx] : undefined,
        maturityDate: matDateIdx !== -1 ? r[matDateIdx] : undefined,
        maturityAmount: matAmtIdx !== -1 ? parseNumeric(r[matAmtIdx]) : undefined,
        notes: notesIdx !== -1 ? r[notesIdx] : undefined,
      },
      i
    );
  });
}

function parseCashHoldingCsv(headers: string[], rows: string[][]): CashHoldingAccount[] {
  const idIdx = findColIndex(headers, ['Locker / Vault ID', 'id']);
  const nameIdx = findColIndex(headers, ['Locker / Vault Name', 'Name', 'Vault Name']);
  const locIdx = findColIndex(headers, ['Physical Location', 'Location']);
  const balIdx = findColIndex(headers, ['Total Cash Value (INR)', 'Balance', 'Amount', 'Total Cash']);
  const notesIdx = findColIndex(headers, ['Notes', 'Note']);

  return rows.map((r, i) => {
    return sanitizeCashHolding(
      {
        id: idIdx !== -1 && r[idIdx] ? r[idIdx] : undefined,
        name: nameIdx !== -1 && r[nameIdx] ? r[nameIdx] : undefined,
        location: locIdx !== -1 && r[locIdx] ? r[locIdx] : undefined,
        balance: balIdx !== -1 ? parseNumeric(r[balIdx]) : undefined,
        notes: notesIdx !== -1 ? r[notesIdx] : undefined,
      },
      i
    );
  });
}

function parseWalletCsv(headers: string[], rows: string[][]): DigitalWallet[] {
  const idIdx = findColIndex(headers, ['Wallet ID', 'id']);
  const nameIdx = findColIndex(headers, ['Wallet Name', 'Name']);
  const provIdx = findColIndex(headers, ['Provider', 'Wallet Provider']);
  const balIdx = findColIndex(headers, ['Main Balance (INR)', 'Balance', 'Main Balance']);
  const notesIdx = findColIndex(headers, ['Notes', 'Note']);

  return rows.map((r, i) => {
    return sanitizeWallet(
      {
        id: idIdx !== -1 && r[idIdx] ? r[idIdx] : undefined,
        name: nameIdx !== -1 && r[nameIdx] ? r[nameIdx] : undefined,
        provider: provIdx !== -1 && r[provIdx] ? r[provIdx] : undefined,
        balance: balIdx !== -1 ? parseNumeric(r[balIdx]) : undefined,
        notes: notesIdx !== -1 ? r[notesIdx] : undefined,
      },
      i
    );
  });
}

function parseCreditCardCsv(headers: string[], rows: string[][]): CreditCard[] {
  const idIdx = findColIndex(headers, ['Card ID', 'id']);
  const nameIdx = findColIndex(headers, ['Card Name', 'Name']);
  const bankIdx = findColIndex(headers, ['Bank / Issuer', 'Bank', 'Issuer']);
  const outIdx = findColIndex(headers, ['Current Outstanding (INR)', 'Outstanding', 'Current Outstanding', 'Balance']);
  const limitIdx = findColIndex(headers, ['Total Credit Limit (INR)', 'Total Limit', 'Credit Limit', 'Limit']);
  const last4Idx = findColIndex(headers, ['Last 4 Digits', 'Last 4', 'last4']);
  const dueDayIdx = findColIndex(headers, ['Statement Due Day', 'Due Day', 'Due Date']);
  const billDayIdx = findColIndex(headers, ['Billing Cycle Day', 'Bill Day', 'Billing Day']);
  const notesIdx = findColIndex(headers, ['Notes', 'Note']);

  return rows.map((r, i) => {
    return sanitizeCreditCard(
      {
        id: idIdx !== -1 && r[idIdx] ? r[idIdx] : undefined,
        cardName: nameIdx !== -1 && r[nameIdx] ? r[nameIdx] : undefined,
        bankName: bankIdx !== -1 && r[bankIdx] ? r[bankIdx] : undefined,
        outstanding: outIdx !== -1 ? parseNumeric(r[outIdx]) : undefined,
        creditLimit: limitIdx !== -1 ? parseNumeric(r[limitIdx]) : undefined,
        lastFourDigits: last4Idx !== -1 ? r[last4Idx] : undefined,
        statementDay: dueDayIdx !== -1 ? parseNumeric(r[dueDayIdx]) : undefined,
        billingCycleDate: billDayIdx !== -1 ? parseNumeric(r[billDayIdx]) : undefined,
        notes: notesIdx !== -1 ? r[notesIdx] : undefined,
      },
      i
    );
  });
}

function parseCreditLimitGroupCsv(headers: string[], rows: string[][]): CreditLimitGroup[] {
  const idIdx = findColIndex(headers, ['Group ID', 'id']);
  const nameIdx = findColIndex(headers, ['Group Name', 'Name']);
  const bankIdx = findColIndex(headers, ['Bank / Issuer', 'Bank', 'Issuer']);
  const limitIdx = findColIndex(headers, ['Shared Limit (INR)', 'Shared Limit', 'Limit', 'Total Limit']);

  return rows.map((r, i) => {
    return sanitizeCreditLimitGroup(
      {
        id: idIdx !== -1 && r[idIdx] ? r[idIdx] : undefined,
        name: nameIdx !== -1 && r[nameIdx] ? r[nameIdx] : undefined,
        bankName: bankIdx !== -1 && r[bankIdx] ? r[bankIdx] : undefined,
        totalLimit: limitIdx !== -1 ? parseNumeric(r[limitIdx]) : undefined,
      },
      i
    );
  });
}

function parseInvestmentCsv(headers: string[], rows: string[][]): InvestmentHolding[] {
  const idIdx = findColIndex(headers, ['Holding ID', 'id']);
  const symIdx = findColIndex(headers, ['Symbol / Ticker', 'Symbol', 'Ticker']);
  const nameIdx = findColIndex(headers, ['Asset Name', 'Name', 'Company Name']);
  const typeIdx = findColIndex(headers, ['Asset Type', 'Type', 'Category']);
  const qtyIdx = findColIndex(headers, ['Quantity', 'Units', 'Qty']);
  const buyIdx = findColIndex(headers, ['Avg Buy Price (INR)', 'Buy Price', 'Average Price', 'Avg Price']);
  const curIdx = findColIndex(headers, ['Current Market Price (INR)', 'Current Price', 'Market Price', 'CMP']);
  const brokerIdx = findColIndex(headers, ['Broker / Platform', 'Broker', 'Platform']);
  const notesIdx = findColIndex(headers, ['Notes', 'Note']);

  return rows.map((r, i) => {
    return sanitizeInvestmentHolding(
      {
        id: idIdx !== -1 && r[idIdx] ? r[idIdx] : undefined,
        symbol: symIdx !== -1 && r[symIdx] ? r[symIdx] : undefined,
        name: nameIdx !== -1 && r[nameIdx] ? r[nameIdx] : undefined,
        assetType: typeIdx !== -1 && r[typeIdx] ? r[typeIdx] : undefined,
        quantity: qtyIdx !== -1 ? parseNumeric(r[qtyIdx]) : undefined,
        averageBuyPrice: buyIdx !== -1 ? parseNumeric(r[buyIdx]) : undefined,
        currentPrice: curIdx !== -1 ? parseNumeric(r[curIdx]) : undefined,
        broker: brokerIdx !== -1 && r[brokerIdx] ? r[brokerIdx] : undefined,
        notes: notesIdx !== -1 ? r[notesIdx] : undefined,
      },
      i
    );
  });
}

function parseIpoCsv(headers: string[], rows: string[][]): IPOApplication[] {
  const idIdx = findColIndex(headers, ['IPO ID', 'id']);
  const compIdx = findColIndex(headers, ['Company Name', 'Name', 'Company']);
  const symIdx = findColIndex(headers, ['Symbol', 'Ticker']);
  const sharesIdx = findColIndex(headers, ['Applied Shares', 'Shares', 'Lots']);
  const priceIdx = findColIndex(headers, ['Bid Price (INR)', 'Bid Price', 'Price']);
  const blockedIdx = findColIndex(headers, ['Total Blocked Amount (INR)', 'Blocked Amount', 'Total Amount']);
  const statusIdx = findColIndex(headers, ['Allotment Status', 'Status', 'IPO Status']);

  return rows.map((r, i) => {
    return sanitizeIpoApplication(
      {
        id: idIdx !== -1 && r[idIdx] ? r[idIdx] : undefined,
        companyName: compIdx !== -1 && r[compIdx] ? r[compIdx] : undefined,
        symbol: symIdx !== -1 && r[symIdx] ? r[symIdx] : undefined,
        lotsApplied: sharesIdx !== -1 ? parseNumeric(r[sharesIdx]) : undefined,
        bidPrice: priceIdx !== -1 ? parseNumeric(r[priceIdx]) : undefined,
        blockedAmount: blockedIdx !== -1 ? parseNumeric(r[blockedIdx]) : undefined,
        ipoStatus: statusIdx !== -1 && r[statusIdx] ? r[statusIdx] : undefined,
      },
      i
    );
  });
}

function parseKhatabookCsv(headers: string[], rows: string[][]): KhatabookEntry[] {
  const idIdx = findColIndex(headers, ['Entry ID', 'id']);
  const personIdx = findColIndex(headers, ['Person Name', 'Person', 'Name', 'Contact']);
  const typeIdx = findColIndex(headers, ['Entry Type', 'Type', 'Direction']);
  const origIdx = findColIndex(headers, ['Original Amount (INR)', 'Original Amount', 'Amount', 'Total']);
  const paidIdx = findColIndex(headers, ['Paid Amount (INR)', 'Paid Amount', 'Paid']);
  const remIdx = findColIndex(headers, ['Remaining Amount (INR)', 'Remaining Amount', 'Remaining', 'Balance']);
  const descIdx = findColIndex(headers, ['Description', 'Notes', 'Reason', 'Note']);
  const dueIdx = findColIndex(headers, ['Due Date', 'dueDate']);

  return rows.map((r, i) => {
    return sanitizeKhatabookEntry(
      {
        id: idIdx !== -1 && r[idIdx] ? r[idIdx] : undefined,
        personName: personIdx !== -1 && r[personIdx] ? r[personIdx] : undefined,
        entryType: typeIdx !== -1 && r[typeIdx] ? r[typeIdx] : undefined,
        originalAmount: origIdx !== -1 ? parseNumeric(r[origIdx]) : undefined,
        paidAmount: paidIdx !== -1 ? parseNumeric(r[paidIdx]) : undefined,
        remainingAmount: remIdx !== -1 ? parseNumeric(r[remIdx]) : undefined,
        notes: descIdx !== -1 ? r[descIdx] : undefined,
        dueDate: dueIdx !== -1 ? r[dueIdx] : undefined,
      },
      i
    );
  });
}

function parseSnapshotCsv(headers: string[], rows: string[][]): FinancialSnapshot[] {
  const idIdx = findColIndex(headers, ['Snapshot ID', 'id']);
  const dateIdx = findColIndex(headers, ['Date', 'Date String', 'date']);
  const nwIdx = findColIndex(headers, ['Net Worth (INR)', 'Net Worth', 'netWorth']);
  const assetsIdx = findColIndex(headers, ['Total Assets (INR)', 'Total Assets', 'totalAssets']);
  const liabIdx = findColIndex(headers, ['Total Liabilities (INR)', 'Total Liabilities', 'totalLiabilities']);
  const notesIdx = findColIndex(headers, ['Notes', 'Note', 'label']);

  return rows.map((r, i) => {
    return sanitizeSnapshot(
      {
        id: idIdx !== -1 && r[idIdx] ? r[idIdx] : undefined,
        date: dateIdx !== -1 && r[dateIdx] ? r[dateIdx] : undefined,
        netWorth: nwIdx !== -1 ? parseNumeric(r[nwIdx]) : undefined,
        totalAssets: assetsIdx !== -1 ? parseNumeric(r[assetsIdx]) : undefined,
        totalLiabilities: liabIdx !== -1 ? parseNumeric(r[liabIdx]) : undefined,
        note: notesIdx !== -1 ? r[notesIdx] : undefined,
      },
      i
    );
  });
}

// =========================================================================
// DIFFERENTIAL ANALYSIS & RECORD DIFF ENGINE
// =========================================================================

async function buildParsedDataAndDiffs(
  data: ExportedBackupData,
  format: ImportFileFormat,
  fileName: string,
  fileSize: number,
  initialErrors: string[]
): Promise<ParsedImportData> {
  const validationErrors = [...initialErrors];

  // Fetch current database records to compare against (strictly read-only)
  const [
    curBanks,
    curBankAccounts,
    curFDs,
    curCash,
    curWallets,
    curCards,
    curGroups,
    curInvestments,
    curIPOs,
    curKhatabook,
    curSnapshots,
  ] = await Promise.all([
    db.banks.toArray(),
    db.bankAccounts.toArray(),
    db.fixedDeposits.toArray(),
    db.cashHoldings.toArray(),
    db.wallets.toArray(),
    db.creditCards.toArray(),
    db.creditLimitGroups.toArray(),
    db.investmentHoldings.toArray(),
    db.ipoApplications.toArray(),
    db.khatabookEntries.toArray(),
    db.snapshots.toArray(),
  ]);

  const diffItems: RecordDiffItem[] = [];

  const checkDiff = <T extends { id: string }>(
    incomingList: T[] | undefined,
    currentList: T[],
    category: ImportCategory,
    nameGetter: (item: T) => string,
    subGetter: (item: T) => string | undefined,
    valGetter: (item: T) => number | undefined,
    matchPredicate: (incoming: T, existing: T) => boolean,
    customDiffCompare?: (incoming: T, existing: T) => string[]
  ) => {
    if (!incomingList || !incomingList.length) return;

    for (const incoming of incomingList) {
      if (!incoming) continue;
      const existingMatch = currentList.find(
        (e) => (incoming.id && e.id === incoming.id) || matchPredicate(incoming, e)
      );

      const name = nameGetter(incoming);
      const subtitle = subGetter(incoming);
      const val = valGetter(incoming);

      if (!existingMatch) {
        diffItems.push({
          id: incoming.id || generateId(category.slice(0, 4)),
          category,
          categoryLabel: CATEGORY_META[category]?.label || category,
          name,
          subtitle,
          amountOrValue: val,
          status: 'new',
          importedRecord: incoming,
        });
      } else {
        const diffs: string[] = [];

        if (customDiffCompare) {
          diffs.push(...customDiffCompare(incoming, existingMatch));
        } else {
          const incVal = valGetter(incoming);
          const exVal = valGetter(existingMatch);
          if (incVal !== undefined && exVal !== undefined && Math.abs(incVal - exVal) > 0.01) {
            diffs.push(`Value: ₹${exVal.toLocaleString()} → ₹${incVal.toLocaleString()}`);
          }
        }

        const isUnchanged = diffs.length === 0;

        diffItems.push({
          id: incoming.id || existingMatch.id,
          category,
          categoryLabel: CATEGORY_META[category]?.label || category,
          name,
          subtitle: subtitle || subGetter(existingMatch),
          amountOrValue: valGetter(incoming) ?? valGetter(existingMatch),
          status: isUnchanged ? 'unchanged' : 'update',
          existingRecord: existingMatch,
          importedRecord: incoming,
          diffSummary: diffs,
        });
      }
    }
  };

  // 1. Bank Accounts
  checkDiff(
    data.bankAccounts,
    curBankAccounts,
    'bankAccounts',
    (i) => i.name || `${i.bankName} Account`,
    (i) => `${i.bankName} • ${i.accountType?.toUpperCase()}${i.last4 ? ` • ••••${i.last4}` : ''}`,
    (i) => i.balance,
    (inc, ex) =>
      (inc.last4 && ex.last4 && inc.last4 === ex.last4 && normalizeHeader(inc.bankName || '') === normalizeHeader(ex.bankName || '')) ||
      (normalizeHeader(inc.name) === normalizeHeader(ex.name) && normalizeHeader(inc.bankName || '') === normalizeHeader(ex.bankName || '')),
    (inc, ex) => {
      const d: string[] = [];
      if (Math.abs(inc.balance - ex.balance) > 0.01) {
        d.push(`Balance: ₹${ex.balance.toLocaleString()} → ₹${inc.balance.toLocaleString()}`);
      }
      if (inc.status !== ex.status) {
        d.push(`Status: ${ex.status} → ${inc.status}`);
      }
      return d;
    }
  );

  // 2. Fixed Deposits
  checkDiff(
    data.fixedDeposits,
    curFDs,
    'fixedDeposits',
    (i) => i.name,
    (i) => `${i.bankName} • ${i.interestRate}% • Mat: ${i.maturityDate}`,
    (i) => i.principal || i.balance,
    (inc, ex) =>
      normalizeHeader(inc.name) === normalizeHeader(ex.name) &&
      normalizeHeader(inc.bankName || '') === normalizeHeader(ex.bankName || ''),
    (inc, ex) => {
      const d: string[] = [];
      if (Math.abs(inc.principal - ex.principal) > 0.01) {
        d.push(`Principal: ₹${ex.principal.toLocaleString()} → ₹${inc.principal.toLocaleString()}`);
      }
      if (Math.abs(inc.interestRate - ex.interestRate) > 0.01) {
        d.push(`Rate: ${ex.interestRate}% → ${inc.interestRate}%`);
      }
      return d;
    }
  );

  // 3. Cash Holdings
  checkDiff(
    data.cashHoldings,
    curCash,
    'cashHoldings',
    (i) => i.name,
    (i) => i.location || 'Physical Cash',
    (i) => i.balance,
    (inc, ex) => normalizeHeader(inc.name) === normalizeHeader(ex.name),
    (inc, ex) => {
      const d: string[] = [];
      if (Math.abs(inc.balance - ex.balance) > 0.01) {
        d.push(`Cash Balance: ₹${ex.balance.toLocaleString()} → ₹${inc.balance.toLocaleString()}`);
      }
      return d;
    }
  );

  // 4. Digital Wallets
  checkDiff(
    data.wallets,
    curWallets,
    'wallets',
    (i) => i.name,
    (i) => `${i.provider} Wallet`,
    (i) => i.balance,
    (inc, ex) =>
      normalizeHeader(inc.name) === normalizeHeader(ex.name) &&
      normalizeHeader(inc.provider || '') === normalizeHeader(ex.provider || ''),
    (inc, ex) => {
      const d: string[] = [];
      if (Math.abs(inc.balance - ex.balance) > 0.01) {
        d.push(`Balance: ₹${ex.balance.toLocaleString()} → ₹${inc.balance.toLocaleString()}`);
      }
      return d;
    }
  );

  // 5. Credit Cards
  checkDiff(
    data.creditCards,
    curCards,
    'creditCards',
    (i) => i.cardName || i.name,
    (i) => `${i.bankName || i.issuer} • Limit: ₹${(i.creditLimit || 0).toLocaleString()}`,
    (i) => i.outstanding,
    (inc, ex) =>
      (inc.lastFourDigits && ex.lastFourDigits && inc.lastFourDigits === ex.lastFourDigits && normalizeHeader(inc.bankName || inc.issuer || '') === normalizeHeader(ex.bankName || ex.issuer || '')) ||
      (normalizeHeader(inc.cardName || inc.name) === normalizeHeader(ex.cardName || ex.name) && normalizeHeader(inc.bankName || inc.issuer || '') === normalizeHeader(ex.bankName || ex.issuer || '')),
    (inc, ex) => {
      const d: string[] = [];
      if (Math.abs(inc.outstanding - ex.outstanding) > 0.01) {
        d.push(`Outstanding: ₹${ex.outstanding.toLocaleString()} → ₹${inc.outstanding.toLocaleString()}`);
      }
      if (Math.abs(inc.creditLimit - ex.creditLimit) > 0.01) {
        d.push(`Limit: ₹${ex.creditLimit.toLocaleString()} → ₹${inc.creditLimit.toLocaleString()}`);
      }
      return d;
    }
  );

  // 6. Credit Limit Groups
  checkDiff(
    data.creditLimitGroups,
    curGroups,
    'creditLimitGroups',
    (i) => i.name,
    (i) => `${i.bankName || i.issuer} Shared Limit`,
    (i) => i.totalLimit || i.sharedLimit,
    (inc, ex) =>
      normalizeHeader(inc.name) === normalizeHeader(ex.name) &&
      normalizeHeader(inc.bankName || inc.issuer || '') === normalizeHeader(ex.bankName || ex.issuer || '')
  );

  // 7. Investments
  checkDiff(
    data.investmentHoldings,
    curInvestments,
    'investmentHoldings',
    (i) => i.name || i.symbol || 'Investment',
    (i) => `${i.symbol} • ${i.quantity} units @ ₹${i.averageBuyPrice} (${i.broker || i.platform || 'Broker'})`,
    (i) => i.currentValue || i.investedAmount,
    (inc, ex) =>
      normalizeHeader(inc.symbol || '') === normalizeHeader(ex.symbol || '') &&
      normalizeHeader(inc.broker || inc.platform || '') === normalizeHeader(ex.broker || ex.platform || ''),
    (inc, ex) => {
      const d: string[] = [];
      if (Math.abs((inc.quantity || 0) - (ex.quantity || 0)) > 0.001) {
        d.push(`Units: ${ex.quantity} → ${inc.quantity}`);
      }
      if (Math.abs(inc.currentPrice - ex.currentPrice) > 0.01) {
        d.push(`Price: ₹${ex.currentPrice.toLocaleString()} → ₹${inc.currentPrice.toLocaleString()}`);
      }
      if (Math.abs(inc.averageBuyPrice - ex.averageBuyPrice) > 0.01) {
        d.push(`Avg Buy: ₹${ex.averageBuyPrice.toLocaleString()} → ₹${inc.averageBuyPrice.toLocaleString()}`);
      }
      return d;
    }
  );

  // 8. IPO Applications
  checkDiff(
    data.ipoApplications,
    curIPOs,
    'ipoApplications',
    (i) => i.companyName || i.name,
    (i) => `${i.lotsApplied || 1} Lots @ ₹${i.bidPrice} • Status: ${i.ipoStatus?.toUpperCase()}`,
    (i) => i.blockedAmount,
    (inc, ex) => normalizeHeader(inc.companyName || inc.name) === normalizeHeader(ex.companyName || ex.name),
    (inc, ex) => {
      const d: string[] = [];
      if (inc.ipoStatus !== ex.ipoStatus) {
        d.push(`Status: ${ex.ipoStatus} → ${inc.ipoStatus}`);
      }
      return d;
    }
  );

  // 9. Khatabook Entries
  checkDiff(
    data.khatabookEntries,
    curKhatabook,
    'khatabookEntries',
    (i) => i.personName,
    (i) => `${i.entryType === 'RECEIVABLE' ? 'Receivable from' : 'Payable to'} ${i.personName} • ${i.notes || 'Ledger'}`,
    (i) => i.remainingAmount ?? i.amount ?? i.originalAmount,
    (inc, ex) =>
      normalizeHeader(inc.personName) === normalizeHeader(ex.personName) &&
      inc.entryType === ex.entryType,
    (inc, ex) => {
      const d: string[] = [];
      if (Math.abs(inc.remainingAmount - ex.remainingAmount) > 0.01) {
        d.push(`Remaining: ₹${ex.remainingAmount.toLocaleString()} → ₹${inc.remainingAmount.toLocaleString()}`);
      }
      if (inc.status !== ex.status) {
        d.push(`Status: ${ex.status} → ${inc.status}`);
      }
      return d;
    }
  );

  // 10. Snapshots
  checkDiff(
    data.snapshots,
    curSnapshots,
    'snapshots',
    (i) => `Snapshot ${i.date || i.dateString || i.timestamp?.slice(0, 10)}`,
    (i) => `Net Worth: ₹${(i.netWorth ?? i.totalNetWorth ?? 0).toLocaleString()}`,
    (i) => i.netWorth ?? i.totalNetWorth,
    (inc, ex) => inc.date === ex.date || inc.dateString === ex.dateString
  );

  const categoriesPresent = Array.from(new Set(diffItems.map((d) => d.category))) as ImportCategory[];
  const totalCount = diffItems.length;
  const newCount = diffItems.filter((d) => d.status === 'new').length;
  const updateCount = diffItems.filter((d) => d.status === 'update').length;
  const unchangedCount = diffItems.filter((d) => d.status === 'unchanged').length;
  const errorCount = diffItems.filter((d) => d.status === 'error').length;

  const byCategory = {} as ParsedImportData['counts']['byCategory'];
  for (const cat of Object.keys(CATEGORY_META) as ImportCategory[]) {
    const items = diffItems.filter((d) => d.category === cat);
    byCategory[cat] = {
      total: items.length,
      newCount: items.filter((d) => d.status === 'new').length,
      updateCount: items.filter((d) => d.status === 'update').length,
      unchangedCount: items.filter((d) => d.status === 'unchanged').length,
    };
  }

  if (totalCount === 0 && validationErrors.length === 0) {
    validationErrors.push('No importable financial records found in this file.');
  }

  return {
    format,
    fileName,
    fileSize,
    exportedAt: data.exportedAt,
    version: data.version,
    isValid: validationErrors.length === 0 && totalCount > 0,
    validationErrors,
    totalRecordsCount: totalCount,
    categoriesPresent,
    banks: data.banks || [],
    bankAccounts: data.bankAccounts || [],
    fixedDeposits: data.fixedDeposits || [],
    cashHoldings: data.cashHoldings || [],
    wallets: data.wallets || [],
    walletTransactions: data.walletTransactions || [],
    creditCards: data.creditCards || [],
    creditLimitGroups: data.creditLimitGroups || [],
    creditCardPayments: data.creditCardPayments || [],
    investmentHoldings: data.investmentHoldings || [],
    ipoApplications: data.ipoApplications || [],
    khatabookEntries: data.khatabookEntries || [],
    transfers: data.transfers || [],
    snapshots: data.snapshots || [],
    balanceHistory: data.balanceHistory || [],
    auditEvents: data.auditEvents || [],
    settings: data.settings,
    diffItems,
    counts: {
      total: totalCount,
      newCount,
      updateCount,
      unchangedCount,
      errorCount,
      byCategory,
    },
  };
}

function createEmptyParsedData(
  format: ImportFileFormat,
  fileName: string,
  fileSize: number,
  isValid: boolean,
  errors: string[]
): ParsedImportData {
  return {
    format,
    fileName,
    fileSize,
    isValid,
    validationErrors: errors,
    totalRecordsCount: 0,
    categoriesPresent: [],
    bankAccounts: [],
    fixedDeposits: [],
    cashHoldings: [],
    wallets: [],
    creditCards: [],
    creditLimitGroups: [],
    investmentHoldings: [],
    ipoApplications: [],
    khatabookEntries: [],
    snapshots: [],
    diffItems: [],
    counts: {
      total: 0,
      newCount: 0,
      updateCount: 0,
      unchangedCount: 0,
      errorCount: 0,
      byCategory: {} as any,
    },
  };
}

// =========================================================================
// TRANSACTIONAL EXECUTION ENGINE (3 STRATEGIES)
// =========================================================================

export async function executeImport(
  parsed: ParsedImportData,
  strategy: ImportStrategy
): Promise<ImportExecutionResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const categoryBreakdown: ImportExecutionResult['categoryBreakdown'] = [];

  try {
    if (strategy === 'replace') {
      // Complete Restore: Full atomic replacement of all tables
      await repository.importAllData({
        version: parsed.version || 2,
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        dataVersion: 2,
        banks: parsed.banks,
        bankAccounts: parsed.bankAccounts,
        fixedDeposits: parsed.fixedDeposits,
        cashHoldings: parsed.cashHoldings,
        wallets: parsed.wallets,
        walletTransactions: parsed.walletTransactions,
        creditCards: parsed.creditCards,
        creditLimitGroups: parsed.creditLimitGroups,
        creditCardPayments: parsed.creditCardPayments,
        investmentHoldings: parsed.investmentHoldings,
        ipoApplications: parsed.ipoApplications,
        khatabookEntries: parsed.khatabookEntries,
        transfers: parsed.transfers,
        snapshots: parsed.snapshots,
        balanceHistory: parsed.balanceHistory || [],
        auditEvents: parsed.auditEvents || [],
        settings: parsed.settings || (await repository.getSettings()),
      });

      addedCount = parsed.totalRecordsCount;

      for (const cat of parsed.categoriesPresent) {
        categoryBreakdown.push({
          category: CATEGORY_META[cat]?.label || cat,
          added: parsed.counts.byCategory[cat]?.total || 0,
          updated: 0,
          skipped: 0,
        });
      }
    } else {
      // Merge & Update OR Add New Only
      await db.transaction(
        'rw',
        [
          db.banks,
          db.bankAccounts,
          db.fixedDeposits,
          db.cashHoldings,
          db.wallets,
          db.walletTransactions,
          db.creditCards,
          db.creditLimitGroups,
          db.creditCardPayments,
          db.investmentHoldings,
          db.ipoApplications,
          db.khatabookEntries,
          db.transfers,
          db.snapshots,
          db.auditEvents,
          db.settings,
        ],
        async () => {
          for (const diff of parsed.diffItems) {
            const table = (db as any)[diff.category];
            if (!table) continue;

            if (diff.status === 'new') {
              const recordToInsert = { ...diff.importedRecord };
              if (!recordToInsert.id) {
                recordToInsert.id = generateId(diff.category.slice(0, 4));
              }
              await table.put(recordToInsert);
              addedCount++;
            } else if (diff.status === 'update') {
              if (strategy === 'merge') {
                const existingId = diff.existingRecord?.id || diff.importedRecord?.id;
                const mergedRecord = {
                  ...diff.existingRecord,
                  ...diff.importedRecord,
                  id: existingId,
                  updatedAt: new Date().toISOString(),
                  lastUpdated: new Date().toISOString(),
                };
                await table.put(mergedRecord);
                updatedCount++;
              } else {
                skippedCount++;
              }
            } else {
              skippedCount++;
            }
          }

          // Merge or add Banks if present
          if (parsed.banks && parsed.banks.length > 0) {
            await db.banks.bulkPut(parsed.banks);
          }

          // Save auxiliary transactions / payments / transfers if available
          if (parsed.walletTransactions && parsed.walletTransactions.length > 0) {
            await db.walletTransactions.bulkPut(parsed.walletTransactions);
          }
          if (parsed.creditCardPayments && parsed.creditCardPayments.length > 0) {
            await db.creditCardPayments.bulkPut(parsed.creditCardPayments);
          }
          if (parsed.transfers && parsed.transfers.length > 0) {
            await db.transfers.bulkPut(parsed.transfers);
          }
          if (strategy === 'merge' && parsed.settings) {
            await db.settings.put(parsed.settings);
          }

          // Write audit log
          await db.auditEvents.add({
            id: generateId('audit'),
            type: 'DATA_IMPORTED',
            entityType: 'system',
            entityId: 'vault',
            entityName: `Import (${strategy === 'merge' ? 'Merge & Update' : 'Add New Only'})`,
            timestamp: new Date().toISOString(),
            metadata: {
              fileName: parsed.fileName,
              format: parsed.format,
              strategy,
              addedCount,
              updatedCount,
              skippedCount,
            },
          });
        }
      );

      for (const cat of parsed.categoriesPresent) {
        const catStats = parsed.counts.byCategory[cat];
        if (catStats) {
          categoryBreakdown.push({
            category: CATEGORY_META[cat]?.label || cat,
            added: catStats.newCount,
            updated: strategy === 'merge' ? catStats.updateCount : 0,
            skipped: catStats.unchangedCount + (strategy === 'add_only' ? catStats.updateCount : 0),
          });
        }
      }
    }

    return {
      success: true,
      strategy,
      importedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      totalProcessed: addedCount + updatedCount + skippedCount,
      addedCount,
      updatedCount,
      skippedCount,
      errors,
      categoryBreakdown,
    };
  } catch (err: any) {
    errors.push(err?.message || 'Database transaction error during import');
    return {
      success: false,
      strategy,
      importedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      totalProcessed: 0,
      addedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors,
      categoryBreakdown: [],
    };
  }
}
