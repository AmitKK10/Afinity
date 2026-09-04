/**
 * Afinity Core Domain Types & Data Models
 * Local-First IndexedDB Persistence & Future Supabase Sync Architecture
 */

export type CurrencyCode = 'INR' | 'USD' | 'EUR';

export type AccountCategory = 
  | 'cash' 
  | 'bank' 
  | 'wallet' 
  | 'investment' 
  | 'receivable' 
  | 'credit_card' 
  | 'payable' 
  | 'fd';

export type InvestmentType = 
  | 'stock' 
  | 'etf'
  | 'mutual_fund' 
  | 'ipo' 
  | 'fixed_deposit' 
  | 'gold' 
  | 'crypto' 
  | 'other';

export type KhatabookType = 'RECEIVABLE' | 'PAYABLE' | 'receivable' | 'payable';

export type KhatabookStatus =
  | 'OPEN'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'ARCHIVED'
  | 'active'
  | 'archived'
  | 'settled'
  | string;

export type KhatabookPaymentSourceType = 'bank' | 'cash' | 'wallet' | 'none' | 'other';

export interface SettleKhatabookParams {
  entryId: string;
  amount: number;
  settlementDate?: string;
  sourceOrDestinationType?: KhatabookPaymentSourceType;
  sourceOrDestinationAccountId?: string;
  notes?: string;
  referenceNumber?: string;
}

export interface KhatabookSettlementResult {
  entry: KhatabookEntry;
  bank?: BankAccount;
  cash?: CashHoldingAccount;
  wallet?: DigitalWallet;
  transfer?: InternalTransferRecord;
  historyRecord?: BalanceHistoryRecord;
}

export interface PersonKhatabookBalance {
  personName: string;
  phone?: string;
  totalReceivable: number; // sum of remaining receivables
  totalPayable: number; // sum of remaining payables
  netBalance: number; // totalReceivable - totalPayable (positive = they owe me, negative = I owe them)
  totalOriginalReceivable: number;
  totalOriginalPayable: number;
  totalSettledReceivable: number;
  totalSettledPayable: number;
  activeEntriesCount: number;
  settledEntriesCount: number;
  entries: KhatabookEntry[];
  hasOverdue: boolean;
}

export interface KhatabookSummary {
  totalReceivables: number; // active outstanding receivables
  totalPayables: number; // active outstanding payables
  netPosition: number; // totalReceivables - totalPayables
  totalOriginalReceivables: number;
  totalOriginalPayables: number;
  totalSettledReceivables: number;
  totalSettledPayables: number;
  activeReceivablesCount: number;
  activePayablesCount: number;
  settledCount: number;
  overdueCount: number;
  overdueAmount: number;
  overdueReceivablesAmount: number;
  overduePayablesAmount: number;
  dueSoonCount: number;
  dueSoonAmount: number;
  personCount: number;
  personBalances: PersonKhatabookBalance[];
}

export type EntityStatus =
  | 'active'
  | 'archived'
  | 'closed'
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'CLOSED'
  | string;

export type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

/** Generic Financial Account Base */
export interface BaseEntity {
  id: string;
  name: string;
  displayName?: string;
  status: EntityStatus;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  archivedAt?: string; // ISO 8601 string
  notes?: string;
}

/** Financial Account */
export interface FinancialAccount extends BaseEntity {
  category: AccountCategory;
  institutionName?: string;
  accountNumberMasked?: string;
  balance: number; // Stored as pure numeric (can be negative for overdrawn/overdraft)
  currency: CurrencyCode;
  lastUpdated: string;
  iconName?: string;
  colorTheme?: string;
}

/** Cash & Physical Denomination breakdown with Old / New variant support */
export interface CashDenomination {
  denomination: number; // e.g. 2000, 500, 200, 100, 50, 20, 10, 5, 2, 1
  count: number; // Total count of this denomination
  oldCount?: number; // Quantity of Old edition notes/coins
  newCount?: number; // Quantity of New edition notes/coins
  type?: 'note' | 'coin' | 'both';
  variantKey?: string; // Unique key e.g. '20_note', '20_coin', '10_note', '10_coin'
}

export interface CashHoldingAccount extends FinancialAccount {
  category: 'cash';
  denominations: CashDenomination[];
  location?: string; // e.g. "Home Locker", "Wallet", "Office Drawer"
}

/** Bank Entity (Institution level) */
export interface Bank extends BaseEntity {
  shortCode?: string; // e.g. "HDFC", "SBI", "ICICI", "KOTAK", "AXIS"
  logo?: string;
  colorTheme?: string;
}

export type BankAccountType = 'savings' | 'current' | 'salary' | 'overdraft' | 'other';

export type AverageBalancePeriod = 'monthly' | 'quarterly';
export type AverageBalanceSource = 'manual' | 'calculated';

export interface BankAverageBalanceRecord {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD or ISO timestamp)
  period: AverageBalancePeriod;
  periodLabel?: string; // e.g. "August 2026", "Q3 2026"
  amount: number;
  source: AverageBalanceSource;
  requiredAmount?: number;
  isMaintained?: boolean;
  deficit?: number;
  notes?: string;
  createdAt?: string;
}

/** Bank Account & Fixed Deposits */
export interface BankAccount extends FinancialAccount {
  category: 'bank';
  bankId?: string; // Link to parent Bank
  bankName?: string;
  accountType: BankAccountType | string;
  customAccountType?: string;
  last4?: string; // Last 4 digits for privacy
  overdraftLimit?: number;
  allowNegativeBalance?: boolean;
  openingBalance?: number;
  openingDate?: string;
  ifscCode?: string;
  hasDebitCard?: boolean;
  closureDate?: string;
  closureNote?: string;
  // Average & Minimum Balance Management
  averageBalanceMonitoringEnabled?: boolean;
  averageBalanceRequirement?: number; // Configured requirement (e.g. ₹10,000)
  requiredAverageBalance?: number; // Alias
  minimumBalanceRequirement?: number; // Minimum balance requirement threshold
  averageBalancePeriod?: AverageBalancePeriod; // 'monthly' | 'quarterly'
  actualAverageBalance?: number; // Actual current tracked average balance
  averageBalanceSource?: AverageBalanceSource; // 'manual' | 'calculated'
  lastAverageBalanceUpdate?: string; // ISO timestamp
  averageBalanceRecords?: BankAverageBalanceRecord[]; // Historical periodic logs
  averageBalanceNotes?: string;
}

export type FDInterestType =
  | 'simple'
  | 'compound_quarterly'
  | 'compound_monthly'
  | 'compound_annually'
  | 'cumulative'
  | 'payout';

export type FDStatus = 'active' | 'matured' | 'closed' | 'premature_closed';

export interface FixedDepositAccount extends FinancialAccount {
  category: 'fd';
  bankId?: string;
  bankName: string;
  linkedAccountId?: string; // Source bank account
  principal: number; // Principal deposit amount
  interestRate: number; // e.g. 7.25% p.a.
  startDate?: string;
  maturityDate: string;
  interestType?: FDInterestType;
  maturityAmount: number;
  autoRenew?: boolean;
  fdStatus?: FDStatus;
  estimatedCurrentValue?: number; // Principal + accrued interest
}

/** Internal Transfer Movement (Bank, Cash, Wallet, FD, Credit Card, Khatabook) */
export type InternalTransferType =
  | 'bank_to_bank'
  | 'bank_to_cash'
  | 'cash_to_bank'
  | 'bank_to_wallet'
  | 'wallet_to_bank'
  | 'wallet_to_wallet'
  | 'cash_to_wallet'
  | 'wallet_to_cash'
  | 'bank_to_card'
  | 'cash_to_card'
  | 'fd_withdrawal'
  | 'fd_creation'
  | 'khatabook_receipt'
  | 'khatabook_payment';

export interface InternalTransferRecord {
  id: string;
  fromEntityType: 'bank' | 'cash' | 'wallet' | 'fd' | 'credit_card' | 'receivable' | 'payable' | 'khatabook';
  fromEntityId: string;
  fromEntityName: string;
  toEntityType: 'bank' | 'cash' | 'wallet' | 'fd' | 'credit_card' | 'receivable' | 'payable' | 'khatabook';
  toEntityId: string;
  toEntityName: string;
  amount: number;
  timestamp: string;
  transferType: InternalTransferType;
  notes?: string;
  referenceNumber?: string;
}

/** Digital Wallet & Stored-Value Systems */
export type WalletType =
  | 'DIGITAL_WALLET'
  | 'CASHBACK'
  | 'STORED_VALUE'
  | 'CUSTOM'
  | 'digital_wallet'
  | 'cashback'
  | 'reward'
  | 'shopping'
  | 'prepaid'
  | 'stored_value'
  | 'custom'
  | 'gift'
  | 'other';

export type WalletOwner =
  | 'SELF'
  | 'PARENT'
  | 'OTHER'
  | 'Self'
  | 'Parent'
  | 'Other'
  | 'Family'
  | 'Spouse';

export type WalletProvider =
  | 'groww'
  | 'amazon_pay'
  | 'paytm'
  | 'phonepe'
  | 'mobikwik'
  | 'bajaj'
  | 'sbi'
  | 'custom'
  | string;

export interface DigitalWallet extends FinancialAccount {
  category: 'wallet';
  providerName?: string;
  provider: WalletProvider;
  walletType?: WalletType | string;
  customType?: string;
  owner?: WalletOwner | string;
  includeInNetWorth?: boolean; // Default: true. If false, excluded from Net Worth
  allowNegativeBalance?: boolean; // Default: false
  linkedMobile?: string;
  accentColor?: string;
  logo?: string;
  closureDate?: string;
  closureNote?: string;
  expiryDate?: string;
  archivedAt?: string;
}

export type WalletTransactionType =
  | 'OPENING_BALANCE'
  | 'BALANCE_ADJUSTMENT'
  | 'CASHBACK'
  | 'CASHBACK_EARNED'
  | 'CASHBACK_USED'
  | 'CASHBACK_ADJUSTMENT'
  | 'TRANSFER'
  | 'SPEND'
  | 'opening_balance'
  | 'balance_adjustment'
  | 'cashback'
  | 'cashback_earned'
  | 'cashback_used'
  | 'cashback_adjustment'
  | 'transfer'
  | 'spend';

export type CashbackType = 'CASHBACK_EARNED' | 'CASHBACK_USED' | 'CASHBACK_ADJUSTMENT';

export type CashbackSource = 'Credit Card' | 'Shopping' | 'Bank' | 'Wallet' | 'Other';

export interface CashbackRecord {
  id: string;
  walletId: string;
  amount: number;
  source: CashbackSource | string;
  description?: string;
  date: string;
  type: CashbackType;
  createdAt: string;
  previousBalance?: number;
  newBalance?: number;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  direction: 'in' | 'out';
  previousBalance: number;
  newBalance: number;
  reason?: string;
  source?: CashbackSource | string;
  date: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface WalletProviderPreset {
  id: string;
  name: string;
  provider: WalletProvider;
  providerName: string;
  defaultType: WalletType;
  colorTheme: string;
  accentColor: string;
  description?: string;
}

export const WALLET_PROVIDER_PRESETS: WalletProviderPreset[] = [
  {
    id: 'groww',
    name: 'Groww Balance',
    provider: 'groww',
    providerName: 'Groww',
    defaultType: 'STORED_VALUE',
    colorTheme: 'from-emerald-600 to-teal-950',
    accentColor: '#00d09c',
    description: 'Groww trading & investment wallet cash balance',
  },
  {
    id: 'amazon_pay',
    name: 'Amazon Pay',
    provider: 'amazon_pay',
    providerName: 'Amazon Pay',
    defaultType: 'DIGITAL_WALLET',
    colorTheme: 'from-amber-600 to-orange-950',
    accentColor: '#f59e0b',
    description: 'Shopping, bills & merchant payments',
  },
  {
    id: 'paytm',
    name: 'Paytm Wallet',
    provider: 'paytm',
    providerName: 'Paytm',
    defaultType: 'DIGITAL_WALLET',
    colorTheme: 'from-sky-600 to-blue-950',
    accentColor: '#0ea5e9',
    description: 'Fastag, utility & UPI merchant wallet',
  },
  {
    id: 'phonepe',
    name: 'PhonePe Wallet',
    provider: 'phonepe',
    providerName: 'PhonePe',
    defaultType: 'DIGITAL_WALLET',
    colorTheme: 'from-purple-600 to-indigo-950',
    accentColor: '#8b5cf6',
    description: 'Stored value & merchant balance',
  },
  {
    id: 'mobikwik',
    name: 'MobiKwik',
    provider: 'mobikwik',
    providerName: 'MobiKwik',
    defaultType: 'DIGITAL_WALLET',
    colorTheme: 'from-blue-600 to-cyan-950',
    accentColor: '#3b82f6',
    description: 'Zip & wallet balance',
  },
  {
    id: 'bajaj',
    name: 'Bajaj Finserv Wallet',
    provider: 'bajaj',
    providerName: 'Bajaj',
    defaultType: 'STORED_VALUE',
    colorTheme: 'from-blue-700 to-indigo-950',
    accentColor: '#2563eb',
    description: 'Bajaj Pay & merchant store balance',
  },
  {
    id: 'sbi_cashback',
    name: 'SBI Cashback',
    provider: 'sbi',
    providerName: 'SBI Cashback',
    defaultType: 'CASHBACK',
    colorTheme: 'from-cyan-600 to-blue-950',
    accentColor: '#06b6d4',
    description: 'Reward points & card cashback balance',
  },
  {
    id: 'custom',
    name: 'Custom Wallet',
    provider: 'custom',
    providerName: 'Custom',
    defaultType: 'CUSTOM',
    colorTheme: 'from-emerald-600 to-teal-950',
    accentColor: '#10b981',
    description: 'Any other stored-value or rewards balance',
  },
];

/** Credit Card Core Types (Step 6A) */
export type CardOwner =
  | 'SELF'
  | 'PARENT'
  | 'OTHER'
  | 'Self'
  | 'Parent'
  | 'Other'
  | 'Family'
  | 'Spouse'
  | string;

export type CardManagedBy =
  | 'ME'
  | 'OWNER'
  | 'OTHER'
  | 'Me'
  | 'Owner'
  | 'Other'
  | string;

export type CreditCardType =
  | 'CREDIT_CARD'
  | 'credit_card'
  | 'CHARGE_CARD'
  | 'CORPORATE'
  | 'custom'
  | string;

export type DueDateType =
  | 'FIXED_DAY'
  | 'DAYS_AFTER_STATEMENT'
  | 'fixed_day'
  | 'days_after_statement'
  | string;

export type CreditCardStatus =
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'CLOSED'
  | 'active'
  | 'archived'
  | 'closed';

export type CreditLimitGroupStatus =
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'active'
  | 'archived';

/** Card Due Status (Step 6C) */
export type CardDueStatus =
  | 'PAID'
  | 'DUE_TODAY'
  | 'DUE_SOON'
  | 'UPCOMING'
  | 'OVERDUE'
  | 'CREDIT_BALANCE';

export type CreditCardPaymentMethod = 'bank_account' | 'cash' | 'other' | string;

/** Credit Card Payment Record (Step 6C) */
export interface CreditCardPayment {
  id: string;
  cardId: string;
  cardName?: string;
  amount: number;
  paymentDate: string; // ISO string or YYYY-MM-DD
  paymentMethod: CreditCardPaymentMethod;
  sourceAccountId?: string;
  sourceAccountName?: string;
  previousOutstanding: number;
  newOutstanding: number;
  notes?: string;
  createdAt: string;
}

/** Shared Credit Limit Group for cards sharing a pool (Step 6A) */
export interface CreditLimitGroup {
  id: string;
  name: string;
  issuer: string;
  bankName?: string; // alias for issuer
  totalLimit: number;
  sharedLimit?: number; // alias for totalLimit
  status?: CreditLimitGroupStatus | string;
  cardIds?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

/** Credit Card with Shared Limits, Owner & Managed By distinction (Step 6A) */
export interface CreditCard extends BaseEntity {
  issuer: string;
  bankName?: string; // alias for issuer
  cardName: string;
  cardNickname?: string; // e.g. "Primary Spends", "Fuel & Utility Card"
  nickname?: string; // alias for cardNickname
  cardType?: CreditCardType | string;
  owner: CardOwner;
  managedBy?: CardManagedBy;
  financialResponsibility?: string; // backwards compatibility alias for managedBy/owner
  iPayThisCard?: boolean; // Derived or synchronized (e.g. managedBy === 'ME' or 'Me')
  lastFourDigits: string;
  maskedCardNumber?: string; // e.g. "•••• •••• •••• 4192"
  creditLimit: number;
  outstanding: number; // Pure numeric (can be negative if refund overpaid)
  outstandingBalance?: number; // backwards compatibility alias for outstanding
  minAmountDue?: number; // Minimum Amount Due (MAD)
  minimumDue?: number; // alias for minAmountDue
  availableLimit?: number;
  utilizationPercentage?: number;
  statementDay?: number; // Recurring day of month (1–31)
  statementDate?: string; // ISO date string or day
  billingCycleDate?: number; // alias for statementDay
  dueDate?: string; // ISO date string or formatted date
  dueDay?: number; // Recurring due day (1–31) for FIXED_DAY
  dueDateType?: DueDateType; // FIXED_DAY | DAYS_AFTER_STATEMENT
  daysAfterStatement?: number; // e.g. 18 days
  paymentDueDate?: string; // backwards compatibility alias for dueDate
  paymentBankAccountId?: string; // Linked Bank Account ID for auto-pay / settlement
  paymentBankName?: string; // Display name of linked deduction bank
  autoPay?: boolean; // Auto-Pay ON/OFF status
  isAutoPayEnabled?: boolean; // alias for autoPay
  includeInNetWorth?: boolean; // Default true. If false, excluded from Net Worth liabilities
  status: EntityStatus;
  creditLimitGroupId?: string; // If part of shared limit pool
  sharedLimitGroupId?: string; // alias for creditLimitGroupId
  sharedLimitGroupName?: string;
  notes?: string;
  cardVariant?: string; // e.g. 'sbi_cashback', 'amazon_pay_icici', 'hdfc_infinia', etc.
  visualTheme?: string;
  cardholderName?: string;
  expiryDisplay?: string; // e.g. '08/29'
  cardNetwork?: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'diners' | string;
  cardColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  customGradientFrom?: string;
  customGradientTo?: string;
  customTextColor?: string;
  archivedAt?: string;
  lastUpdated?: string;
}

/** Credit Card Auto-Pay Safety & Due Evaluation Types */
export type CreditCardSafetyStatus =
  | 'SUFFICIENT'
  | 'INSUFFICIENT'
  | 'NO_BANK_LINKED'
  | 'NO_DUE'
  | 'MANUAL_PAY';

export interface CreditCardSafetyEvaluation {
  cardId: string;
  card: CreditCard;
  cardDisplayName: string;
  cardNickname?: string;
  issuer: string;
  lastFourDigits: string;
  maskedCardNumber?: string;
  creditLimit: number;
  outstanding: number;
  minAmountDue: number;
  requiredAmount: number;
  autoPayEnabled: boolean;
  bankAccountId?: string;
  bankName: string;
  bankAccount?: BankAccount | null;
  availableBalance: number;
  shortfall: number;
  isInsufficient: boolean;
  status: CreditCardSafetyStatus;
  dueDateFormatted: string;
  daysUntilDue: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  warningMessage?: string;
}

export interface CreditCardSafetyReport {
  evaluatedAt: string;
  totalCardsWithAutoPay: number;
  totalAutoPayCommitment: number;
  hasInsufficientBalance: boolean;
  insufficientCardsCount: number;
  totalShortfall: number;
  evaluations: CreditCardSafetyEvaluation[];
}

export type PaymentRiskSource = 'NONE' | 'CREDIT_CARD' | 'SIP' | 'COMBINED';

export interface CombinedBankPaymentSafety {
  bankAccountId: string;
  bankName: string;
  accountDisplayName: string;
  accountNumberMasked: string;
  availableBalance: number;
  sipCommitment: number;
  creditCardCommitment: number;
  totalRequiredAmount: number;
  remainingBalance: number;
  shortfall: number;
  isInsufficient: boolean;
  riskSource: PaymentRiskSource;
  riskLabel: string;
  sips: SIPRecord[];
  creditCards: CreditCard[];
}

export interface CombinedPaymentSafetyReport {
  evaluatedAt: string;
  sipSafety: SIPSafetyReport;
  creditCardSafety: CreditCardSafetyReport;
  bankEvaluations: CombinedBankPaymentSafety[];
  hasRisk: boolean;
  riskBankCount: number;
  totalShortfall: number;
}

/** Card Visual Preset for realistic credit card styling (Step 6B) */
export interface CardVisualPreset {
  id: string;
  issuer: string;
  cardName: string;
  variantName: string;
  defaultNetwork: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'diners' | string;
  category: 'super_premium' | 'cashback' | 'travel' | 'rewards' | 'shopping' | 'fuel' | 'lifestyle' | 'custom' | string;
  gradient: {
    from: string;
    via?: string;
    to: string;
    angle?: string;
  };
  textColor: string;
  subtextColor: string;
  accentColor: string;
  emblemType:
    | 'sbi'
    | 'hdfc'
    | 'icici'
    | 'axis'
    | 'kotak'
    | 'amex'
    | 'onecard'
    | 'idfc'
    | 'indusind'
    | 'rbl'
    | 'federal'
    | 'yes'
    | 'bob'
    | 'au'
    | 'sc'
    | 'hsbc'
    | 'scapia'
    | 'slice'
    | 'fi'
    | 'jupiter'
    | 'bandhan'
    | 'sbm'
    | 'roar'
    | 'phonepe'
    | 'pnb'
    | 'custom';
  patternType?: 'stripes' | 'dots' | 'geometric' | 'gemstone' | 'brushed' | 'minimal' | 'wave' | 'waves' | 'amazon_arc' | 'swiggy_ribbon';
  chipColor?: 'gold' | 'silver' | 'dark_gold';
  badgeLabel?: string;
}

export type InvestmentAssetType =
  | 'STOCK'
  | 'MUTUAL_FUND'
  | 'ETF'
  | 'UNLISTED_EQUITY'
  | 'GOLD'
  | 'SGB'
  | 'OTHER'
  | 'stock'
  | 'mutual_fund'
  | 'etf'
  | 'unlisted_equity'
  | 'gold'
  | 'sgb'
  | 'other'
  | string;

export type InvestmentPriceSource =
  | 'MARKET'
  | 'MANUAL'
  | 'FALLBACK'
  | 'AMFI'
  | 'NSE'
  | 'BSE'
  | 'UNKNOWN'
  | 'market'
  | 'manual'
  | 'fallback'
  | 'unknown'
  | string;

export type InvestmentPriceStatus =
  | 'updated'
  | 'live'
  | 'recent'
  | 'stale'
  | 'manual'
  | 'unlisted'
  | 'failed'
  | 'unavailable'
  | 'updating';

export type InvestmentPriceRefreshFrequency =
  | 'twice_daily'
  | 'once_daily'
  | 'manual_only';

export interface MarketPriceResult {
  symbolOrIdentifier: string;
  price: number;
  currency: string;
  source: InvestmentPriceSource;
  timestamp: string; // ISO 8601 (when fetched)
  fetchedAt?: string; // ISO timestamp
  asOfDate?: string; // Market / NAV trade date or timestamp
  dataAsOf?: string; // Normalized alias
  marketDate?: string;
  freshness?: 'LIVE' | 'RECENT_CLOSE' | 'WEEKEND_CLOSE' | 'STALE' | 'MANUAL';
  changeAmount?: number;
  changePercentage?: number;
  isSuccess: boolean;
  isUnlisted?: boolean;
  isStale?: boolean;
  errorMessage?: string;
  providerName?: string;
  instrumentType?: 'STOCK' | 'ETF' | 'MUTUAL_FUND' | 'GOLD' | 'UNLISTED_EQUITY';
  latencyMs?: number;
}

export interface PriceRefreshFailureItem {
  id: string;
  name: string;
  symbol?: string;
  schemeCode?: string;
  assetType?: string;
  reason: string;
  lastKnownPrice?: number;
  isUnlisted?: boolean;
}

export interface PriceRefreshSuccessItem {
  id: string;
  name: string;
  symbol?: string;
  assetType?: string;
  oldPrice: number;
  newPrice: number;
  source: string;
  asOfDate?: string;
  priceChanged?: boolean;
}

export interface PortfolioPriceRefreshSummary {
  timestamp: string;
  totalAttempted: number;
  totalSuccess: number;
  totalUpdated: number;
  totalUnchanged: number;
  totalFailed: number;
  totalSkippedDueToInterval: number;
  failedHoldings: PriceRefreshFailureItem[];
  updatedHoldings: PriceRefreshSuccessItem[];
  unchangedHoldings?: PriceRefreshSuccessItem[];
  isCompleteSuccess: boolean;
  hasPartialFailures?: boolean;
  statusHeadline?: string;
}

export type InvestmentBroker =
  | 'Groww'
  | 'Zerodha'
  | 'AngelOne'
  | 'Upstox'
  | 'Direct'
  | 'Other'
  | string;

export type InvestmentUnit =
  | 'GRAM'
  | 'UNIT'
  | 'SHARES'
  | 'gram'
  | 'unit'
  | 'shares'
  | string;

export type InvestmentStatus =
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'CLOSED'
  | 'active'
  | 'archived'
  | 'closed'
  | string;

export type IPOStatus =
  | 'BLOCKED'
  | 'ALLOTTED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'applied'
  | 'allotted'
  | 'not_allotted'
  | 'listed'
  | 'refunded'
  | string;

/** Investment Portfolio Holdings */
export interface InvestmentHolding extends BaseEntity {
  // Asset classification
  assetType?: InvestmentAssetType;
  type?: InvestmentType | string; // backwards compatibility alias
  symbol?: string; // Ticker / Symbol (e.g. TATAMOTORS, INFY, PPFAS)
  isin?: string; // ISIN Code

  // Platform / Broker
  broker?: InvestmentBroker;
  platform?: 'Groww' | 'Zerodha' | 'AngelOne' | 'Upstox' | 'Direct' | 'Other' | string;

  // Quantity / Units
  quantity?: number; // Supports decimal units (e.g., 10, 125.456, 5.25)
  unitsHeld?: number; // backwards compatibility alias
  unit?: InvestmentUnit; // 'GRAM', 'UNIT', 'SHARES'

  // Pricing & Valuation
  averageBuyPrice: number;
  investedAmount: number;
  currentPrice: number;
  currentValue: number;
  previousPrice?: number;
  previousValue?: number;
  priceSource?: InvestmentPriceSource;
  priceUpdatedAt?: string;
  priceAsOfDate?: string; // Date/timestamp from market exchange or AMFI
  priceFetchedAt?: string; // Timestamp when price fetch was performed
  lastUpdated?: string; // backwards compatibility alias
  schemeCode?: string; // AMFI Scheme Code for Indian Mutual Funds
  priceStatus?: InvestmentPriceStatus;
  priceFailureReason?: string;
  lastPriceAttemptAt?: string;

  // Performance (P&L)
  unrealizedProfitLoss?: number;
  unrealizedProfitLossPercentage?: number;
  dayChange?: number;
  dayChangePercentage?: number;

  // Net Worth settings & Status
  includeInNetWorth?: boolean; // Default true: contributes to Net Worth by Current Value
}

/** Systematic Investment Plan (SIP) Models */
export type SIPStatus = 'active' | 'stopped' | 'ACTIVE' | 'STOPPED';
export type SIPFrequency = 'monthly' | 'weekly' | 'fortnightly' | 'quarterly' | 'custom' | string;

export interface SIPRecord extends BaseEntity {
  fundName: string;
  schemeCode?: string;
  symbol?: string;
  holdingId?: string; // Optional link to mutual fund InvestmentHolding
  amount: number; // Monthly / installment amount in INR
  deductionDay: number; // 1 to 31 (day of month)
  frequency: SIPFrequency; // Default 'monthly'
  bankAccountId: string; // Afinity bank account ID
  bankName?: string;
  accountName?: string;
  accountNumberMasked?: string;
  sipStatus: 'active' | 'stopped';
  startDate?: string; // ISO date string
  endDate?: string; // Optional end date
  folioNumber?: string;
  platform?: string; // e.g. Groww, Zerodha, Direct, etc.
  category?: string; // e.g. Flexi Cap, Small Cap, Large Cap, ELSS, Debt, Hybrid
  notes?: string;
  lastDeductionDate?: string;
  reminderEnabled?: boolean;
}

export type SIPSafetyStatus = 'SUFFICIENT' | 'INSUFFICIENT' | 'STOPPED' | 'NO_BANK_LINKED' | 'SAFE' | 'AT_RISK' | 'CRITICAL_INSUFFICIENT';

export interface SIPIndividualSafetyEvaluation {
  sipId: string;
  sip: SIPRecord;
  bankAccount: BankAccount | null;
  bankName: string;
  accountDisplayName: string;
  accountNumberMasked: string;
  availableBalance: number;
  requiredAmount: number;
  shortfall: number;
  isInsufficient: boolean;
  status: SIPSafetyStatus;
  safetyStatus?: 'SAFE' | 'AT_RISK' | 'CRITICAL_INSUFFICIENT' | 'NO_BANK_LINKED' | 'STOPPED';
  nextDeductionDate: string; // Formatted YYYY-MM-DD
  nextDeductionFormatted?: string;
  daysUntilDeduction: number;
  daysUntil?: number;
  relativeDateLabel: string;
  relativeDaysLabel?: string;
  isDueWithin7Days: boolean;
  isDueWithin30Days: boolean;
  warningMessage?: string;
  fundName?: string;
  amount?: number;
  isStopped?: boolean;
  bankDisplayName?: string;
  bankAccountNumberMasked?: string;
  bankCurrentBalance?: number;
}

export interface SIPBankSafetyEvaluation {
  bankAccountId: string;
  bankName: string;
  accountDisplayName: string;
  bankDisplayName?: string;
  accountNumberMasked: string;
  availableBalance: number;
  totalRequiredAmount: number;
  totalCommittedNext30Days?: number;
  shortfall: number;
  isInsufficient: boolean;
  activeSipCount: number;
  sips: SIPRecord[];
  sipsDue?: { sipId: string; fundName: string; amount: number }[];
  nextDeductionDate: string;
  sameDateGroups: {
    date: string;
    day: number;
    requiredAmount: number;
    shortfall: number;
    isInsufficient: boolean;
    sips: SIPRecord[];
  }[];
}

export interface SIPSafetyReport {
  evaluatedAt: string; // ISO timestamp
  totalActiveSIPs: number;
  totalStoppedSIPs: number;
  totalMonthlyCommitment: number;
  totalStoppedCommitment: number;
  nextUpcomingSIP: SIPRecord | null;
  nextDeductionDate: string | null;
  daysUntilNextSIP: number | null;
  totalDueNext7Days: number;
  totalDueNext30Days: number;
  requiredInNext7Days?: number;
  requiredInNext30Days?: number;
  hasInsufficientBalance: boolean;
  insufficientSipsCount: number;
  atRiskSIPsCount?: number;
  totalShortfallAmount: number;
  totalShortfall?: number;
  bankEvaluations: SIPBankSafetyEvaluation[];
  insufficientBankAccounts?: SIPBankSafetyEvaluation[];
  sipEvaluations: SIPIndividualSafetyEvaluation[];
  evaluations?: SIPIndividualSafetyEvaluation[];
}

export type SIPSafetyEvaluation = SIPIndividualSafetyEvaluation;

export interface AddSIPInput {
  fundName: string;
  schemeCode?: string;
  symbol?: string;
  holdingId?: string;
  amount: number;
  deductionDay: number;
  frequency?: SIPFrequency;
  bankAccountId?: string;
  bankName?: string;
  accountNumberMasked?: string;
  sipStatus?: 'active' | 'stopped';
  startDate?: string;
  endDate?: string;
  folioNumber?: string;
  platform?: string;
  category?: string;
  notes?: string;
}

export interface UpdateSIPInput {
  fundName?: string;
  schemeCode?: string;
  symbol?: string;
  holdingId?: string;
  amount?: number;
  deductionDay?: number;
  frequency?: SIPFrequency;
  bankAccountId?: string;
  bankName?: string;
  accountNumberMasked?: string;
  sipStatus?: 'active' | 'stopped';
  status?: EntityStatus;
  startDate?: string;
  endDate?: string;
  folioNumber?: string;
  platform?: string;
  category?: string;
  notes?: string;
}

/** IPO Application Tracking */
export interface IPOApplication extends BaseEntity {
  companyName?: string;
  symbol: string;
  bidPrice: number;
  lotsApplied: number;
  sharesPerLot: number;
  blockedAmount: number;
  applicationAmount?: number;
  refundAmount?: number;
  ipoStatus: IPOStatus;
  applicationDate: string;
  allotmentDate: string;
  listingDate?: string;
  bankUsed: string;
  includeInNetWorth?: boolean; // Default false to avoid double counting bank balance
  isDeductedFromBank?: boolean; // Indicates if bank balance was already adjusted
}

/** Khatabook Receivables and Payables */
export interface KhatabookEntry extends BaseEntity {
  personName: string;
  phone?: string;
  contactNumber?: string;
  entryType: KhatabookType; // 'RECEIVABLE' | 'PAYABLE'
  type?: KhatabookType; // alias for backwards compatibility
  amount: number; // current remaining amount
  originalAmount: number; // initial transaction total
  paidAmount: number; // amount paid/received so far
  remainingAmount: number; // originalAmount - paidAmount
  date?: string; // transaction entry date
  dueDate?: string; // optional due date
  status: KhatabookStatus; // 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'ARCHIVED' | 'active'
  notes?: string;
  reason?: string; // alias
  includeInNetWorth?: boolean; // Default true
  isSettled?: boolean; // backwards-compatible flag
  settledDate?: string;
  lastUpdated?: string;
}

/** Historical Financial Balance Change Record */
export interface BalanceHistoryRecord {
  id: string;
  entityType: AccountCategory | 'credit_card' | 'investment' | 'khatabook';
  entityId: string;
  entityName: string;
  previousBalance: number;
  newBalance: number;
  changeAmount: number;
  timestamp: string; // ISO 8601
  notes?: string;
}

/** Audit Event for full traceability */
export type AuditEventType = 
  | 'ACCOUNT_CREATED' 
  | 'ACCOUNT_UPDATED' 
  | 'ACCOUNT_ARCHIVED' 
  | 'ACCOUNT_RESTORED' 
  | 'ACCOUNT_CLOSED'
  | 'ACCOUNT_DELETED'
  | 'BALANCE_UPDATED' 
  | 'WALLET_CREATED'
  | 'WALLET_UPDATED'
  | 'WALLET_ARCHIVED'
  | 'WALLET_RESTORED'
  | 'WALLET_CLOSED'
  | 'WALLET_DELETED'
  | 'WALLET_BALANCE_UPDATED'
  | 'CASHBACK_CREDIT'
  | 'CASHBACK_EARNED'
  | 'CASHBACK_USED'
  | 'CASHBACK_ADJUSTMENT'
  | 'WALLET_REDEMPTION'
  | 'CASH_TRANSFERRED'
  | 'ATM_WITHDRAWAL'
  | 'BANK_TRANSFER'
  | 'CASH_DEPOSIT'
  | 'WALLET_TRANSFER'
  | 'FD_CREATED'
  | 'FD_MATURED'
  | 'FD_WITHDRAWN'
  | 'FD_RENEWED'
  | 'FD_CLOSED'
  | 'FD_DELETED'
  | 'CREDIT_CARD_CREATED'
  | 'CREDIT_CARD_UPDATED'
  | 'CREDIT_CARD_BALANCE_ADJUSTED'
  | 'CREDIT_CARD_ARCHIVED'
  | 'CREDIT_CARD_RESTORED'
  | 'CREDIT_CARD_DELETED'
  | 'HOLDING_DELETED'
  | 'IPO_DELETED'
  | 'CREDIT_CARD_PAYMENT'
  | 'CREDIT_LIMIT_GROUP_CREATED'
  | 'CREDIT_LIMIT_GROUP_UPDATED'
  | 'CREDIT_LIMIT_GROUP_ARCHIVED'
  | 'KHATABOOK_ENTRY_CREATED'
  | 'KHATABOOK_ENTRY_UPDATED'
  | 'KHATABOOK_RECEIVABLE_SETTLED'
  | 'KHATABOOK_PAYABLE_SETTLED'
  | 'KHATABOOK_ENTRY_ARCHIVED'
  | 'KHATABOOK_ENTRY_RESTORED'
  | 'KHATABOOK_ENTRY_DELETED'
  | 'SIP_CREATED'
  | 'SIP_UPDATED'
  | 'SIP_STOPPED'
  | 'SIP_RESUMED'
  | 'SIP_DELETED'
  | 'SNAPSHOT_RECORDED' 
  | 'DATA_IMPORTED' 
  | 'DATA_RESET';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  entityType: string;
  entityId: string;
  entityName?: string;
  timestamp: string; // ISO 8601
  metadata?: Record<string, unknown>;
}

/** Historical Financial Snapshot Breakdown */
export type SnapshotLabel = 'Daily' | 'Monthly' | 'Manual' | 'Important' | 'Milestone' | string;
export type SnapshotType = 'daily' | 'monthly' | 'manual' | 'milestone';

export interface CategoryBreakdown {
  assets: {
    cash: number;
    banks: number;
    fixedDeposits: number;
    wallets: number;
    investments: number;
    receivables: number;
    other?: number;
  };
  liabilities: {
    creditCards: number;
    overdrafts: number;
    payables: number;
    other?: number;
  };
}

/** Historical Financial Snapshot */
export interface FinancialSnapshot {
  id: string;
  timestamp: string; // ISO 8601 string
  date: string; // YYYY-MM-DD format
  dateString: string; // Human readable formatted date string
  label?: SnapshotLabel;
  snapshotType?: SnapshotType;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  // Specific category asset totals
  totalCash: number;
  totalBankBalance: number;
  totalFixedDeposits: number;
  totalWalletBalance: number;
  totalInvestments: number;
  totalReceivables: number;
  // Specific category liability totals
  totalPayables: number;
  totalCreditCardDue: number;
  totalOverdraftLiabilities: number;
  totalIPOBlocked: number;
  growwCash?: number;
  note?: string;
  createdAt?: string;
  categoryBreakdown?: CategoryBreakdown;

  // Backward compatibility aliases
  totalNetWorth?: number;
  cashTotal?: number;
  bankTotal?: number;
  investmentTotal?: number;
  receivablesTotal?: number;
  creditCardTotal?: number;
  payablesTotal?: number;
}

/** Comparison Periods */
export type ComparisonPeriod =
  | 'today'
  | 'this_month'
  | 'previous_month'
  | '3_months_ago'
  | '6_months_ago'
  | '1_year_ago'
  | 'all_time'
  | '1M'
  | '3M'
  | '6M'
  | '12M'
  | '1Y'
  | '24M'
  | '2Y'
  | 'ALL';

/** Individual Category Change & Contribution */
export interface CategoryContribution {
  category: string;
  categoryLabel?: string;
  categoryKey:
    | 'cash'
    | 'banks'
    | 'fixedDeposits'
    | 'wallets'
    | 'investments'
    | 'receivables'
    | 'creditCards'
    | 'overdrafts'
    | 'payables'
    | 'other';
  type: 'asset' | 'liability';
  isLiability?: boolean;
  previousValue: number;
  baselineValue?: number;
  currentValue: number;
  absoluteChange: number;
  changeAmount?: number;
  percentageChange: number;
  impactOnNetWorth: number; // positive = increased net worth, negative = decreased net worth
}

/** Comprehensive Net Worth Comparison Result */
export interface NetWorthComparisonResult {
  period: ComparisonPeriod;
  periodLabel: string;
  currentSnapshot?: FinancialSnapshot;
  baselineSnapshot: FinancialSnapshot | null;
  baselineDate: string;
  baselineNetWorth: number;
  currentNetWorth: number;
  netWorthChangeAmount: number;
  netWorthChangePercentage: number;
  isPositive?: boolean;
  isPositiveGrowth: boolean;
  totalAssetsCurrent: number;
  currentAssets?: number;
  totalAssetsBaseline: number;
  baselineAssets?: number;
  assetsChangeAmount: number;
  assetsChangePercentage: number;
  totalLiabilitiesCurrent: number;
  currentLiabilities?: number;
  totalLiabilitiesBaseline: number;
  baselineLiabilities?: number;
  liabilitiesChangeAmount: number;
  liabilitiesChangePercentage: number;
  categoryContributions: {
    cashChange: CategoryContribution;
    bankChange: CategoryContribution;
    fdChange: CategoryContribution;
    walletChange: CategoryContribution;
    investmentChange: CategoryContribution;
    receivableChange: CategoryContribution;
    creditCardChange: CategoryContribution;
    payableChange: CategoryContribution;
    overdraftChange: CategoryContribution;
  };
  categoryBreakdown?: CategoryBreakdown;
  contributionsList: CategoryContribution[];
}

/** Month-over-Month Comparison Summary */
export interface MonthOverMonthComparison {
  currentMonthLabel: string;
  previousMonthLabel: string;
  currentSnapshot: FinancialSnapshot;
  previousSnapshot: FinancialSnapshot | null;
  netWorthChange: number;
  netWorthPercentageChange: number;
  assetsChange: number;
  liabilitiesChange: number;
  topGrowthCategory?: CategoryContribution;
  topDeclineCategory?: CategoryContribution;
  contributionsList: CategoryContribution[];
}

/** Dashboard Card Identification & Customization */
export type DashboardCardId =
  | 'quick_financial_snapshot'
  | 'financial_health_summary'
  | 'net_worth_hero'
  | 'action_required'
  | 'safe_cash_commitments'
  | 'upcoming_30_days'
  | 'quick_actions'
  | 'asset_liability_grid'
  | 'asset_distribution'
  | 'net_worth_trend'
  | 'investments_summary'
  | 'credit_cards_summary'
  | 'bank_accounts_summary'
  | 'khatabook_widget';

export type DashboardPresetKey = 'balanced' | 'investor' | 'cashflow' | 'minimal' | 'custom';

export interface DashboardCardDefinition {
  id: DashboardCardId;
  title: string;
  subtitle: string;
  description: string;
  category: 'core' | 'breakdown' | 'analytics' | 'accounts';
  badge: string;
  defaultVisible: boolean;
}

/** User Settings */
export interface UserSettings {
  id: string; // 'user_settings'
  currency: CurrencyCode;
  theme: string;
  numberingSystem: 'indian' | 'international';
  biometricLock: boolean;
  lastBackupAt?: string;
  priceRefreshFrequency?: InvestmentPriceRefreshFrequency; // Default: 'twice_daily'
  lastMarketPriceRefreshAt?: string;
  dataVersion: number;
  // Security & PIN Passcode Lock
  passcodeEnabled?: boolean;
  passcodeHash?: string;
  passcodeSalt?: string;
  passcodeLength?: 4 | 6;
  lockOnBackground?: boolean;
  lockTimeoutSeconds?: number; // 0 = Immediately on background/switch, 30 = 30s, 60 = 1m, 300 = 5m
  biometricEnabled?: boolean;
  biometricCredentialId?: string;
  passcodeHint?: string;
  // Dashboard Customization & Card Preferences
  dashboardCardOrder?: DashboardCardId[];
  hiddenDashboardCards?: DashboardCardId[];
  dashboardPreset?: DashboardPresetKey;
  // SIP Risk Reminder Preferences
  sipReminderPreferences?: Record<string, boolean>;
}

/** Aggregated Portfolio Summary */
export interface PortfolioSummary {
  netWorth: number;
  netWorthChangeAmount: number;
  netWorthChangePercentage: number;
  totalAssets: number;
  totalLiabilities: number;
  cashTotal: number;
  bankTotal: number;
  walletTotal: number;
  investmentsTotal: number;
  receivablesTotal: number;
  creditCardDues: number;
  payablesTotal: number;
  liquidTotal: number;
  period: '1M' | '3M' | '6M' | '1Y' | 'ALL';
  lastValuationTimestamp: string;
}

/** Complete Backup JSON schema */
export interface ExportedBackupData {
  version: number;
  exportedAt: string;
  dataVersion: number;
  banks?: Bank[];
  bankAccounts: BankAccount[];
  fixedDeposits: FixedDepositAccount[];
  cashHoldings: CashHoldingAccount[];
  wallets: DigitalWallet[];
  creditCards: CreditCard[];
  creditLimitGroups: CreditLimitGroup[];
  creditCardPayments?: CreditCardPayment[];
  investmentHoldings: InvestmentHolding[];
  ipoApplications: IPOApplication[];
  khatabookEntries: KhatabookEntry[];
  sips?: SIPRecord[];
  transfers?: InternalTransferRecord[];
  walletTransactions?: WalletTransaction[];
  snapshots: FinancialSnapshot[];
  balanceHistory: BalanceHistoryRecord[];
  auditEvents: AuditEvent[];
  settings: UserSettings;
}
