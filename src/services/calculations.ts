/**
 * Centralized Financial Calculation Engine for Afinity
 * Strictly adheres to standard personal accounting rules:
 * - Positive bank balances are categorized as ASSETS (+₹X)
 * - Negative bank balances (overdrafts) are categorized as LIABILITIES (+|₹X|)
 * - Fixed Deposits are categorized as ASSETS (Principal + Accrued/Estimated Interest)
 * - Internal Transfers preserve Net Worth identically across entities
 */

import {
  BankAccount,
  FixedDepositAccount,
  CashHoldingAccount,
  DigitalWallet,
  WalletTransaction,
  CreditCard,
  CreditLimitGroup,
  CardDueStatus,
  InvestmentHolding,
  IPOApplication,
  KhatabookEntry,
  KhatabookType,
  KhatabookStatus,
  PersonKhatabookBalance,
  KhatabookSummary,
  PortfolioSummary,
  TimePeriod,
  FDInterestType,
  FinancialSnapshot,
  CategoryBreakdown,
  CategoryContribution,
  ComparisonPeriod,
  NetWorthComparisonResult,
  MonthOverMonthComparison,
  SnapshotLabel,
  SnapshotType,
  AverageBalancePeriod,
  AverageBalanceSource,
  BankAverageBalanceRecord,
  BalanceHistoryRecord,
} from '../types';

export interface CalculationInput {
  bankAccounts: BankAccount[];
  fixedDeposits: FixedDepositAccount[];
  cashHoldings: CashHoldingAccount[];
  wallets: DigitalWallet[];
  investments: InvestmentHolding[];
  creditCards: CreditCard[];
  creditLimitGroups?: CreditLimitGroup[];
  khatabookEntries: KhatabookEntry[];
}

/**
 * Calculates Total Assets
 * Assets = Cash + Positive Bank Balances + FDs (Current/Principal Value) + Positive Wallets + Investments + Receivables
 * Note: Only active (non-archived) accounts are included in real-time totals.
 */
export function calculateTotalAssets(input: CalculationInput): number {
  const activeBanks = (input.bankAccounts || []).filter((b) => b.status === 'active');
  const activeFds = (input.fixedDeposits || []).filter((f) => f.status === 'active');
  const activeCash = (input.cashHoldings || []).filter((c) => c.status === 'active');
  const activeWallets = (input.wallets || []).filter((w) => w.status === 'active');
  const activeInvestments = (input.investments || []).filter((i) => i.status === 'active');
  const activeCards = (input.creditCards || []).filter((c) => c.status === 'active');

  // Positive bank balances contribute to Assets (negative balances become liabilities/overdraft)
  const bankAssetsTotal = activeBanks.reduce((sum, item) => {
    const bal = Number(item.balance || 0);
    return sum + (bal > 0 ? bal : 0);
  }, 0);

  // FDs contribute estimatedCurrentValue (if available) or principal balance
  const fdTotal = activeFds.reduce((sum, item) => {
    const val = item.estimatedCurrentValue !== undefined
      ? Number(item.estimatedCurrentValue)
      : Number(item.principal || item.balance || 0);
    return sum + Math.max(0, val);
  }, 0);

  const cashTotal = activeCash.reduce((sum, item) => sum + Math.max(0, Number(item.balance || 0)), 0);

  // Digital Wallets contribute if includeInNetWorth !== false
  const walletAssetsTotal = activeWallets.reduce((sum, item) => {
    if (item.includeInNetWorth === false) return sum;
    const bal = Number(item.balance || 0);
    return sum + (bal > 0 ? bal : 0);
  }, 0);

  // Negative credit card outstanding represents an overpayment/refund credit balance (Asset)
  const creditCardRefundsTotal = activeCards.reduce((sum, item) => {
    if (item.includeInNetWorth === false) return sum;
    const out = Number(item.outstanding !== undefined ? item.outstanding : item.outstandingBalance || 0);
    return sum + (out < 0 ? Math.abs(out) : 0);
  }, 0);

  const investmentTotal = calculateTotalInvestmentValue(activeInvestments);

  const receivablesTotal = calculateOutstandingReceivables(input.khatabookEntries || []);

  return (
    Math.round(
      (bankAssetsTotal + fdTotal + cashTotal + walletAssetsTotal + creditCardRefundsTotal + investmentTotal + receivablesTotal) *
        100
    ) / 100
  );
}

/**
 * Calculates Total Liabilities
 * Liabilities = Credit Card Outstanding Dues + Payables + Negative Bank Balances (Overdrafts) + Negative Wallets
 */
export function calculateTotalLiabilities(input: CalculationInput): number {
  const activeCards = (input.creditCards || []).filter((c) => c.status === 'active');
  const activeBanks = (input.bankAccounts || []).filter((b) => b.status === 'active');
  const activeWallets = (input.wallets || []).filter((w) => w.status === 'active');

  const creditCardTotal = activeCards.reduce((sum, item) => {
    if (item.includeInNetWorth === false) return sum;
    const out = Number(item.outstanding !== undefined ? item.outstanding : item.outstandingBalance || 0);
    return sum + (out > 0 ? out : 0);
  }, 0);

  const payablesTotal = calculateOutstandingPayables(input.khatabookEntries || []);

  // Negative bank balances count as overdraft liabilities
  const bankOverdraftTotal = activeBanks.reduce((sum, item) => {
    const bal = Number(item.balance || 0);
    return sum + (bal < 0 ? Math.abs(bal) : 0);
  }, 0);

  // Negative wallet balances count as liabilities (if included in net worth)
  const walletOverdraftTotal = activeWallets.reduce((sum, item) => {
    if (item.includeInNetWorth === false) return sum;
    const bal = Number(item.balance || 0);
    return sum + (bal < 0 ? Math.abs(bal) : 0);
  }, 0);

  return Math.round((creditCardTotal + payablesTotal + bankOverdraftTotal + walletOverdraftTotal) * 100) / 100;
}

/**
 * Calculates Net Worth
 * Net Worth = Total Assets - Total Liabilities
 */
export function calculateNetWorth(totalAssets: number, totalLiabilities: number): number {
  return Math.round((totalAssets - totalLiabilities) * 100) / 100;
}

/**
 * Calculates Liquid Assets (Physical Cash + Net Positive Bank Savings + Net Positive Wallets)
 */
export function calculateLiquidAssets(input: CalculationInput): number {
  const activeBanks = (input.bankAccounts || []).filter((b) => b.status === 'active');
  const activeCash = (input.cashHoldings || []).filter((c) => c.status === 'active');
  const activeWallets = (input.wallets || []).filter((w) => w.status === 'active');

  const bankTotal = activeBanks.reduce((sum, item) => sum + Number(item.balance || 0), 0);
  const cashTotal = activeCash.reduce((sum, item) => sum + Number(item.balance || 0), 0);
  const walletTotal = activeWallets.reduce((sum, item) => {
    if (item.includeInNetWorth === false) return sum;
    return sum + Number(item.balance || 0);
  }, 0);

  return Math.round((bankTotal + cashTotal + walletTotal) * 100) / 100;
}

/**
 * Wallet Position Summary & Distribution Analytics
 */
export interface WalletItemDistribution {
  walletId: string;
  name: string;
  provider: string;
  balance: number;
  percentage: number;
  colorTheme?: string;
  accentColor?: string;
  includeInNetWorth: boolean;
}

export interface WalletPositionSummary {
  totalWalletBalance: number;
  includedInNetWorthBalance: number;
  excludedRewardsBalance: number;
  totalCashbackBalance: number;
  positiveWalletAssets: number;
  negativeWalletLiabilities: number;
  activeWalletCount: number;
  archivedWalletCount: number;
  distribution: WalletItemDistribution[];
}

export function calculateWalletPosition(wallets: DigitalWallet[]): WalletPositionSummary {
  const activeWallets = (wallets || []).filter((w) => w.status === 'active');
  const archivedWallets = (wallets || []).filter((w) => w.status === 'archived' || w.status === 'closed');

  let totalBal = 0;
  let includedBal = 0;
  let excludedBal = 0;
  let cashbackBal = 0;
  let positiveAssets = 0;
  let negativeLiabilities = 0;

  activeWallets.forEach((w) => {
    const bal = Number(w.balance || 0);
    totalBal += bal;

    if (w.includeInNetWorth !== false) {
      includedBal += bal;
      if (bal >= 0) {
        positiveAssets += bal;
      } else {
        negativeLiabilities += Math.abs(bal);
      }
    } else {
      excludedBal += bal;
    }

    if (w.walletType === 'cashback' || w.walletType === 'reward' || w.walletType === 'CASHBACK') {
      cashbackBal += bal;
    }
  });

  const totalPositiveForDist = activeWallets.reduce((sum, w) => sum + Math.max(0, Number(w.balance || 0)), 0);

  const distribution: WalletItemDistribution[] = activeWallets.map((w) => {
    const bal = Number(w.balance || 0);
    const percentage = totalPositiveForDist > 0 && bal > 0 ? Math.round((bal / totalPositiveForDist) * 100) : 0;
    return {
      walletId: w.id,
      name: w.displayName || w.name,
      provider: w.provider,
      balance: bal,
      percentage,
      colorTheme: w.colorTheme,
      accentColor: w.accentColor,
      includeInNetWorth: w.includeInNetWorth !== false,
    };
  });

  return {
    totalWalletBalance: Math.round(totalBal * 100) / 100,
    includedInNetWorthBalance: Math.round(includedBal * 100) / 100,
    excludedRewardsBalance: Math.round(excludedBal * 100) / 100,
    totalCashbackBalance: Math.round(cashbackBal * 100) / 100,
    positiveWalletAssets: Math.round(positiveAssets * 100) / 100,
    negativeWalletLiabilities: Math.round(negativeLiabilities * 100) / 100,
    activeWalletCount: activeWallets.length,
    archivedWalletCount: archivedWallets.length,
    distribution,
  };
}

/**
 * Calculates total positive wallet assets (only wallets with includeInNetWorth !== false)
 */
export function calculateWalletAssets(wallets: DigitalWallet[]): number {
  const active = (wallets || []).filter((w) => w.status === 'active' && w.includeInNetWorth !== false);
  const total = active.reduce((sum, w) => sum + (Number(w.balance || 0) > 0 ? Number(w.balance || 0) : 0), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates total negative wallet liabilities (only wallets with includeInNetWorth !== false)
 */
export function calculateWalletLiabilities(wallets: DigitalWallet[]): number {
  const active = (wallets || []).filter((w) => w.status === 'active' && w.includeInNetWorth !== false);
  const total = active.reduce((sum, w) => sum + (Number(w.balance || 0) < 0 ? Math.abs(Number(w.balance || 0)) : 0), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates net wallet balance across all active wallets (all balances included)
 */
export function calculateWalletNetBalance(wallets: DigitalWallet[]): number {
  const active = (wallets || []).filter((w) => w.status === 'active');
  const total = active.reduce((sum, w) => sum + Number(w.balance || 0), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Step 5D: Cashback Summary & Metrics
 */
export interface CashbackSummary {
  currentCashback: number;
  totalEarned: number;
  totalUsed: number;
  walletCount: number;
  contributesToNetWorth: boolean;
  activeCashbackWallets: DigitalWallet[];
}

export function calculateCashbackSummary(
  wallets: DigitalWallet[],
  walletTransactions: WalletTransaction[],
  selectedWalletId?: string
): CashbackSummary {
  const activeWallets = (wallets || []).filter((w) => w.status === 'active');
  const cashbackWallets = activeWallets.filter(
    (w) =>
      w.walletType === 'CASHBACK' ||
      w.walletType === 'cashback' ||
      w.walletType === 'reward' ||
      w.provider === 'sbi' ||
      w.name.toLowerCase().includes('cashback')
  );

  const targetWallets = selectedWalletId
    ? activeWallets.filter((w) => w.id === selectedWalletId)
    : cashbackWallets.length > 0
    ? cashbackWallets
    : activeWallets;

  const targetWalletIds = new Set(targetWallets.map((w) => w.id));

  // Current cashback balance from stored wallet balances
  const currentCashback = targetWallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

  // Filter transactions dynamically
  const relevantTx = (walletTransactions || []).filter((tx) => {
    if (selectedWalletId) {
      return tx.walletId === selectedWalletId;
    }
    return (
      targetWalletIds.has(tx.walletId) ||
      tx.type === 'CASHBACK_EARNED' ||
      tx.type === 'CASHBACK_USED' ||
      tx.type === 'CASHBACK' ||
      tx.type === 'cashback' ||
      tx.type === 'cashback_earned' ||
      tx.type === 'cashback_used'
    );
  });

  // Calculate total earned dynamically from transaction history
  const totalEarned = relevantTx.reduce((sum, tx) => {
    const isEarned =
      tx.type === 'CASHBACK_EARNED' ||
      tx.type === 'cashback_earned' ||
      ((tx.type === 'CASHBACK' || tx.type === 'cashback') && tx.direction === 'in');
    return sum + (isEarned ? Number(tx.amount || 0) : 0);
  }, 0);

  // Calculate total used dynamically from transaction history
  const totalUsed = relevantTx.reduce((sum, tx) => {
    const isUsed =
      tx.type === 'CASHBACK_USED' ||
      tx.type === 'cashback_used' ||
      ((tx.type === 'CASHBACK' || tx.type === 'cashback') && tx.direction === 'out');
    return sum + (isUsed ? Number(tx.amount || 0) : 0);
  }, 0);

  const contributesToNetWorth = targetWallets.some((w) => w.includeInNetWorth !== false);

  return {
    currentCashback: Math.round(currentCashback * 100) / 100,
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalUsed: Math.round(totalUsed * 100) / 100,
    walletCount: targetWallets.length,
    contributesToNetWorth,
    activeCashbackWallets: targetWallets,
  };
}

/**
 * Calculates Bank Position Analytics
 */
export interface BankPositionSummary {
  netBankBalance: number;
  totalPositiveAssets: number;
  totalOverdraftLiabilities: number;
  netBankPosition: number;
  totalFDs: number;
  totalFDBalance: number;
  combinedBankAndFD: number;
  totalBankNetPosition: number;
  activeAccountsCount: number;
  activeAccountCount: number;
  archivedAccountsCount: number;
  activeFDCount: number;
  weightedAvgFDRate: number;
}

export function calculateBankPosition(
  bankAccounts: BankAccount[],
  fixedDeposits: FixedDepositAccount[]
): BankPositionSummary {
  const activeBanks = (bankAccounts || []).filter((b) => b.status === 'active');
  const archivedBanks = (bankAccounts || []).filter((b) => b.status === 'archived' || b.status === 'closed');
  const activeFds = (fixedDeposits || []).filter((f) => f.status === 'active');

  let positive = 0;
  let overdraft = 0;

  activeBanks.forEach((b) => {
    const bal = Number(b.balance || 0);
    if (bal >= 0) {
      positive += bal;
    } else {
      overdraft += Math.abs(bal);
    }
  });

  let totalFDPrincipal = 0;
  let totalFDWeightedInterest = 0;
  const fdTotal = activeFds.reduce((sum, f) => {
    const principal = Number(f.principal || f.balance || 0);
    const rate = Number(f.interestRate || 0);
    totalFDPrincipal += principal;
    totalFDWeightedInterest += principal * rate;
    const val = f.estimatedCurrentValue !== undefined ? Number(f.estimatedCurrentValue) : principal;
    return sum + val;
  }, 0);

  const weightedAvgFDRate = totalFDPrincipal > 0
    ? Math.round((totalFDWeightedInterest / totalFDPrincipal) * 100) / 100
    : 0;

  const netBankBalance = Math.round((positive - overdraft) * 100) / 100;
  const totalBankNetPosition = Math.round((positive - overdraft + fdTotal) * 100) / 100;

  return {
    netBankBalance,
    totalPositiveAssets: Math.round(positive * 100) / 100,
    totalOverdraftLiabilities: Math.round(overdraft * 100) / 100,
    netBankPosition: netBankBalance,
    totalFDs: Math.round(fdTotal * 100) / 100,
    totalFDBalance: Math.round(fdTotal * 100) / 100,
    combinedBankAndFD: totalBankNetPosition,
    totalBankNetPosition,
    activeAccountsCount: activeBanks.length,
    activeAccountCount: activeBanks.length,
    archivedAccountsCount: archivedBanks.length,
    activeFDCount: activeFds.length,
    weightedAvgFDRate,
  };
}

/**
 * Fixed Deposit Financial Mathematics
 */

/**
 * Calculate Estimated Maturity Amount
 * @param principal Initial deposit amount
 * @param rateAnnual Annual interest rate (e.g. 7.1 for 7.1% p.a.)
 * @param tenureYears Duration in years (can be fractional, e.g. 1.5)
 * @param interestType Calculation method
 */
export function calculateFDEstimatedMaturity(
  principal: number,
  rateAnnual: number,
  tenureYears: number,
  interestType: FDInterestType = 'compound_quarterly'
): { estimatedInterest: number; maturityAmount: number } {
  const p = Math.max(0, Number(principal || 0));
  const r = Math.max(0, Number(rateAnnual || 0)) / 100;
  const t = Math.max(0, Number(tenureYears || 0));

  if (p === 0 || t === 0 || r === 0) {
    return { estimatedInterest: 0, maturityAmount: p };
  }

  let maturity = p;

  switch (interestType) {
    case 'simple':
      maturity = p + p * r * t;
      break;

    case 'compound_monthly': {
      const n = 12;
      maturity = p * Math.pow(1 + r / n, n * t);
      break;
    }

    case 'compound_annually': {
      const n = 1;
      maturity = p * Math.pow(1 + r / n, n * t);
      break;
    }

    case 'compound_quarterly':
    case 'cumulative':
    case 'payout':
    default: {
      // Standard Indian Banking Practice: Compounded Quarterly
      const n = 4;
      maturity = p * Math.pow(1 + r / n, n * t);
      break;
    }
  }

  const roundedMaturity = Math.round(maturity);
  const roundedInterest = Math.max(0, roundedMaturity - p);

  return {
    estimatedInterest: roundedInterest,
    maturityAmount: roundedMaturity,
  };
}

/**
 * Calculate Accrued FD Value to Today's Date
 */
export function calculateAccruedFDValue(
  principal: number,
  rateAnnual: number,
  startDateStr?: string,
  maturityDateStr?: string,
  interestType: FDInterestType = 'compound_quarterly'
): number {
  const p = Number(principal || 0);
  if (!startDateStr || !maturityDateStr || p <= 0) return p;

  const start = new Date(startDateStr).getTime();
  const maturity = new Date(maturityDateStr).getTime();
  const now = new Date().getTime();

  if (isNaN(start) || isNaN(maturity) || start >= maturity) return p;

  // If already matured, return full maturity amount
  if (now >= maturity) {
    const totalTenureYears = (maturity - start) / (365.25 * 24 * 3600 * 1000);
    return calculateFDEstimatedMaturity(p, rateAnnual, totalTenureYears, interestType).maturityAmount;
  }

  // Elapsed tenure in years
  const elapsedTenureYears = Math.max(0, (now - start) / (365.25 * 24 * 3600 * 1000));
  const accrued = calculateFDEstimatedMaturity(p, rateAnnual, elapsedTenureYears, interestType).maturityAmount;
  return Math.max(p, accrued);
}

/**
 * Calculate Days Remaining to Maturity
 */
export function getDaysToMaturity(maturityDateStr: string): { daysRemaining: number; isMatured: boolean; label: string } {
  if (!maturityDateStr) return { daysRemaining: 0, isMatured: false, label: 'Unknown' };

  const target = new Date(maturityDateStr);
  const now = new Date();

  // Reset time portions for pure day difference
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffMs = targetDay - nowDay;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { daysRemaining: 0, isMatured: true, label: 'Matured' };
  } else if (diffDays === 0) {
    return { daysRemaining: 0, isMatured: true, label: 'Matures Today' };
  } else if (diffDays === 1) {
    return { daysRemaining: 1, isMatured: false, label: 'Matures Tomorrow' };
  } else if (diffDays < 30) {
    return { daysRemaining: diffDays, isMatured: false, label: `Matures in ${diffDays} days` };
  } else {
    const months = Math.round(diffDays / 30.4);
    return {
      daysRemaining: diffDays,
      isMatured: false,
      label: `Matures in ${diffDays} days (${months} mos)`,
    };
  }
}

/**
 * Generates full aggregated Portfolio Summary
 */
export function generatePortfolioSummary(
  input: CalculationInput,
  period: TimePeriod = '1M',
  baselineNetWorth?: number
): PortfolioSummary {
  const totalAssets = calculateTotalAssets(input);
  const totalLiabilities = calculateTotalLiabilities(input);
  const netWorth = calculateNetWorth(totalAssets, totalLiabilities);

  const activeCash = (input.cashHoldings || []).filter((c) => c.status === 'active');
  const activeBanks = (input.bankAccounts || []).filter((b) => b.status === 'active');
  const activeFds = (input.fixedDeposits || []).filter((f) => f.status === 'active');
  const activeWallets = (input.wallets || []).filter((w) => w.status === 'active');
  const activeInvestments = (input.investments || []).filter((i) => i.status === 'active');
  const activeCards = (input.creditCards || []).filter((c) => c.status === 'active');

  const cashTotal = activeCash.reduce((s, c) => s + Math.max(0, Number(c.balance || 0)), 0);
  const bankTotal = activeBanks.reduce((s, b) => s + Number(b.balance || 0), 0);
  const fdTotal = activeFds.reduce((s, f) => s + Number(f.principal || f.balance || 0), 0);
  const walletTotal = activeWallets.reduce((s, w) => s + Number(w.balance || 0), 0);
  const investmentsTotal = calculateTotalInvestmentValue(activeInvestments);
  const receivablesTotal = calculateOutstandingReceivables(input.khatabookEntries || []);
  const creditCardDues = activeCards.reduce((sum, item) => {
    if (item.includeInNetWorth === false) return sum;
    const out = Number(item.outstanding !== undefined ? item.outstanding : item.outstandingBalance || 0);
    return sum + (out > 0 ? out : 0);
  }, 0);
  const payablesTotal = calculateOutstandingPayables(input.khatabookEntries || []);

  // Baseline comparison
  const baseValue = baselineNetWorth !== undefined ? baselineNetWorth : netWorth - 18420;
  const changeAmount = netWorth - baseValue;
  const changePercentage = baseValue !== 0 ? (changeAmount / Math.abs(baseValue)) * 100 : 0;

  return {
    netWorth,
    netWorthChangeAmount: Math.round(changeAmount * 100) / 100,
    netWorthChangePercentage: Math.round(changePercentage * 100) / 100,
    totalAssets,
    totalLiabilities,
    cashTotal,
    bankTotal: bankTotal + fdTotal,
    walletTotal,
    investmentsTotal,
    receivablesTotal,
    creditCardDues,
    payablesTotal,
    liquidTotal: calculateLiquidAssets(input),
    period,
    lastValuationTimestamp: new Date().toISOString(),
  };
}

// ============================================================================
// STEP 6A: CREDIT CARD CALCULATION FOUNDATION & SHARED LIMIT ENGINE
// ============================================================================

/**
 * Calculates Available Credit for a single credit card.
 * If outstanding is positive: Available = Limit - Outstanding.
 * If outstanding is negative (refund/overpayment credit): Available = Limit + |Outstanding| = Limit - (-|Outstanding|).
 */
export function calculateCardAvailableCredit(card: CreditCard): number {
  const limit = Number(card.creditLimit || 0);
  const outstanding = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
  const available = limit - outstanding;
  return Math.round(Math.max(0, available) * 100) / 100;
}

/**
 * Calculates Credit Utilization Percentage for a single card.
 * Formula: (Outstanding / Credit Limit) * 100
 * Clamped to 0 if outstanding is zero or negative (credit balance).
 */
export function calculateCardUtilization(card: CreditCard): number {
  const limit = Number(card.creditLimit || 0);
  const outstanding = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
  if (limit <= 0 || outstanding <= 0) return 0;
  const utilization = (outstanding / limit) * 100;
  return Math.round(utilization * 100) / 100;
}

/**
 * Calculates Combined Outstanding for a Shared Credit Limit Group.
 */
export function calculateCreditLimitGroupOutstanding(group: CreditLimitGroup, cards: CreditCard[]): number {
  const groupCards = (cards || []).filter(
    (c) =>
      c.status === 'active' &&
      (c.creditLimitGroupId === group.id || c.sharedLimitGroupId === group.id)
  );
  const totalOutstanding = groupCards.reduce((sum, c) => {
    const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
    return sum + out;
  }, 0);
  return Math.round(totalOutstanding * 100) / 100;
}

/**
 * Calculates Shared Available Credit for a Credit Limit Group.
 * Formula: Group Limit - Combined Group Outstanding
 */
export function calculateCreditLimitGroupAvailableCredit(group: CreditLimitGroup, cards: CreditCard[]): number {
  const totalLimit = Number(group.totalLimit !== undefined ? group.totalLimit : group.sharedLimit || 0);
  const combinedOutstanding = calculateCreditLimitGroupOutstanding(group, cards);
  const available = totalLimit - combinedOutstanding;
  return Math.round(Math.max(0, available) * 100) / 100;
}

/**
 * Calculates Utilization Percentage for a Shared Credit Limit Group.
 * Formula: (Combined Group Outstanding / Group Limit) * 100
 */
export function calculateCreditLimitGroupUtilization(group: CreditLimitGroup, cards: CreditCard[]): number {
  const totalLimit = Number(group.totalLimit !== undefined ? group.totalLimit : group.sharedLimit || 0);
  if (totalLimit <= 0) return 0;
  const combinedOutstanding = calculateCreditLimitGroupOutstanding(group, cards);
  if (combinedOutstanding <= 0) return 0;
  const utilization = (combinedOutstanding / totalLimit) * 100;
  return Math.round(utilization * 100) / 100;
}

/**
 * Calculates Total Overall Credit Limit across all active cards and shared groups.
 * Crucial Rule: Avoids double counting cards that share a group pool.
 */
export function calculateTotalCreditLimit(cards: CreditCard[], groups: CreditLimitGroup[] = []): number {
  const activeCards = (cards || []).filter((c) => c.status === 'active');
  const activeGroups = (groups || []).filter((g) => g.status === 'active');

  const groupedCardIds = new Set<string>();
  let groupLimitTotal = 0;

  for (const group of activeGroups) {
    const groupLimit = Number(group.totalLimit !== undefined ? group.totalLimit : group.sharedLimit || 0);
    groupLimitTotal += groupLimit;

    activeCards.forEach((c) => {
      if (c.creditLimitGroupId === group.id || c.sharedLimitGroupId === group.id) {
        groupedCardIds.add(c.id);
      }
    });
  }

  // Add individual limits for standalone cards (not belonging to any active group)
  const standaloneLimitTotal = activeCards
    .filter((c) => !groupedCardIds.has(c.id))
    .reduce((sum, c) => sum + Number(c.creditLimit || 0), 0);

  return Math.round((groupLimitTotal + standaloneLimitTotal) * 100) / 100;
}

/**
 * Calculates Total Credit Outstanding across all active cards.
 */
export function calculateTotalCreditOutstanding(cards: CreditCard[]): number {
  const activeCards = (cards || []).filter((c) => c.status === 'active');
  const total = activeCards.reduce((sum, c) => {
    const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
    return sum + out;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates Total Available Credit across all active cards and groups.
 * Sums available credit from each shared group + available credit from each standalone card.
 */
export function calculateTotalAvailableCredit(cards: CreditCard[], groups: CreditLimitGroup[] = []): number {
  const activeCards = (cards || []).filter((c) => c.status === 'active');
  const activeGroups = (groups || []).filter((g) => g.status === 'active');

  const groupedCardIds = new Set<string>();
  let totalAvailable = 0;

  for (const group of activeGroups) {
    const available = calculateCreditLimitGroupAvailableCredit(group, activeCards);
    totalAvailable += available;

    activeCards.forEach((c) => {
      if (c.creditLimitGroupId === group.id || c.sharedLimitGroupId === group.id) {
        groupedCardIds.add(c.id);
      }
    });
  }

  const standaloneCards = activeCards.filter((c) => !groupedCardIds.has(c.id));
  for (const card of standaloneCards) {
    totalAvailable += calculateCardAvailableCredit(card);
  }

  return Math.round(totalAvailable * 100) / 100;
}

/**
 * Calculates Total Overall Credit Utilization Percentage.
 */
export function calculateTotalCreditUtilization(cards: CreditCard[], groups: CreditLimitGroup[] = []): number {
  const totalLimit = calculateTotalCreditLimit(cards, groups);
  const totalOutstanding = calculateTotalCreditOutstanding(cards);
  if (totalLimit <= 0 || totalOutstanding <= 0) return 0;
  return Math.round(((totalOutstanding / totalLimit) * 100) * 100) / 100;
}

/**
 * Calculates Credit Liabilities (positive outstanding on cards included in Net Worth).
 */
export function calculateCreditLiabilities(cards: CreditCard[]): number {
  const activeCards = (cards || []).filter((c) => c.status === 'active');
  const liabilities = activeCards.reduce((sum, c) => {
    if (c.includeInNetWorth === false) return sum;
    const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
    return sum + (out > 0 ? out : 0);
  }, 0);
  return Math.round(liabilities * 100) / 100;
}

/**
 * Owner Breakdown for Credit Cards (Self, Parent, Other).
 */
export interface OwnerCreditBreakdownItem {
  ownerCategory: 'SELF' | 'PARENT' | 'OTHER';
  label: string;
  totalOutstanding: number;
  positiveLiability: number;
  creditBalance: number;
  totalLimit: number;
  availableCredit: number;
  utilization: number;
  cardCount: number;
  cards: CreditCard[];
}

export interface OwnerCreditSummary {
  self: OwnerCreditBreakdownItem;
  parent: OwnerCreditBreakdownItem;
  other: OwnerCreditBreakdownItem;
  totalOutstanding: number;
  totalCards: number;
}

export function calculateOwnerCreditSummary(cards: CreditCard[], groups: CreditLimitGroup[] = []): OwnerCreditSummary {
  const activeCards = (cards || []).filter((c) => c.status === 'active');

  const normalizeOwner = (owner?: string): 'SELF' | 'PARENT' | 'OTHER' => {
    if (!owner) return 'SELF';
    const o = owner.toUpperCase();
    if (o === 'SELF') return 'SELF';
    if (o === 'PARENT') return 'PARENT';
    return 'OTHER';
  };

  const selfCards: CreditCard[] = [];
  const parentCards: CreditCard[] = [];
  const otherCards: CreditCard[] = [];

  activeCards.forEach((c) => {
    const norm = normalizeOwner(c.owner);
    if (norm === 'SELF') selfCards.push(c);
    else if (norm === 'PARENT') parentCards.push(c);
    else otherCards.push(c);
  });

  const buildItem = (
    ownerCategory: 'SELF' | 'PARENT' | 'OTHER',
    label: string,
    bucketCards: CreditCard[]
  ): OwnerCreditBreakdownItem => {
    const totalOutstanding = bucketCards.reduce((sum, c) => {
      const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
      return sum + out;
    }, 0);

    const positiveLiability = bucketCards.reduce((sum, c) => {
      const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
      return sum + (out > 0 ? out : 0);
    }, 0);

    const creditBalance = bucketCards.reduce((sum, c) => {
      const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
      return sum + (out < 0 ? Math.abs(out) : 0);
    }, 0);

    const totalLimit = calculateTotalCreditLimit(bucketCards, groups);
    const availableCredit = calculateTotalAvailableCredit(bucketCards, groups);
    const utilization = totalLimit > 0 && totalOutstanding > 0
      ? Math.round(((totalOutstanding / totalLimit) * 100) * 100) / 100
      : 0;

    return {
      ownerCategory,
      label,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      positiveLiability: Math.round(positiveLiability * 100) / 100,
      creditBalance: Math.round(creditBalance * 100) / 100,
      totalLimit: Math.round(totalLimit * 100) / 100,
      availableCredit: Math.round(availableCredit * 100) / 100,
      utilization,
      cardCount: bucketCards.length,
      cards: bucketCards,
    };
  };

  const self = buildItem('SELF', 'Self (My Cards)', selfCards);
  const parent = buildItem('PARENT', "Parent's Cards", parentCards);
  const other = buildItem('OTHER', 'Other Cards', otherCards);

  const totalOutstanding = Math.round(
    (self.totalOutstanding + parent.totalOutstanding + other.totalOutstanding) * 100
  ) / 100;

  return {
    self,
    parent,
    other,
    totalOutstanding,
    totalCards: activeCards.length,
  };
}

/**
 * Managed Card Breakdown (I Manage vs Don't Manage, I Pay vs Don't Pay).
 */
export interface ManagedCreditSummaryItem {
  totalOutstanding: number;
  positiveLiability: number;
  creditBalance: number;
  cardCount: number;
  cards: CreditCard[];
}

export interface ManagedCreditSummary {
  iManage: ManagedCreditSummaryItem;
  iDontManage: ManagedCreditSummaryItem;
  iPay: ManagedCreditSummaryItem;
  iDontPay: ManagedCreditSummaryItem;
}

export function calculateManagedCreditSummary(cards: CreditCard[]): ManagedCreditSummary {
  const activeCards = (cards || []).filter((c) => c.status === 'active');

  const doesUserManage = (card: CreditCard): boolean => {
    if (card.managedBy) {
      const m = card.managedBy.toUpperCase();
      return m === 'ME' || m === 'SELF';
    }
    const o = String(card.owner || '').toUpperCase();
    return o === 'SELF';
  };

  const doesUserPay = (card: CreditCard): boolean => {
    if (card.iPayThisCard !== undefined) return Boolean(card.iPayThisCard);
    return doesUserManage(card);
  };

  const buildBucket = (bucketCards: CreditCard[]): ManagedCreditSummaryItem => {
    const totalOutstanding = bucketCards.reduce((sum, c) => {
      const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
      return sum + out;
    }, 0);

    const positiveLiability = bucketCards.reduce((sum, c) => {
      const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
      return sum + (out > 0 ? out : 0);
    }, 0);

    const creditBalance = bucketCards.reduce((sum, c) => {
      const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
      return sum + (out < 0 ? Math.abs(out) : 0);
    }, 0);

    return {
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      positiveLiability: Math.round(positiveLiability * 100) / 100,
      creditBalance: Math.round(creditBalance * 100) / 100,
      cardCount: bucketCards.length,
      cards: bucketCards,
    };
  };

  const iManageCards = activeCards.filter(doesUserManage);
  const iDontManageCards = activeCards.filter((c) => !doesUserManage(c));
  const iPayCards = activeCards.filter(doesUserPay);
  const iDontPayCards = activeCards.filter((c) => !doesUserPay(c));

  return {
    iManage: buildBucket(iManageCards),
    iDontManage: buildBucket(iDontManageCards),
    iPay: buildBucket(iPayCards),
    iDontPay: buildBucket(iDontPayCards),
  };
}

/**
 * Determines current statement date, due date, and days remaining for a card's cycle.
 */
export interface CardBillingCycleInfo {
  statementDay?: number;
  previousStatementDate?: string; // YYYY-MM-DD
  currentStatementDate?: string; // YYYY-MM-DD
  nextStatementDate?: string; // YYYY-MM-DD
  currentCycleStart?: string; // YYYY-MM-DD
  currentCycleEnd?: string; // YYYY-MM-DD
  currentDueDate?: string; // YYYY-MM-DD
  daysUntilStatement: number;
  daysUntilDue: number;
  isOverdue: boolean;
  dueStatus: CardDueStatus;
  cycleStatus: 'current' | 'statement_generated' | 'due_soon' | 'overdue' | 'not_set';
}

function clampDayToMonth(year: number, month: number, day: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.min(day, daysInMonth);
}

function formatDateISO(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateCardDueStatus(card: CreditCard, referenceDate: Date = new Date()): CardDueStatus {
  const outstanding = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);

  if (outstanding < 0) {
    return 'CREDIT_BALANCE';
  }
  if (outstanding === 0) {
    return 'PAID';
  }

  const cycle = calculateCardBillingCycle(card, referenceDate);
  if (!cycle.statementDay) {
    return 'UPCOMING';
  }

  if (cycle.daysUntilDue < 0) {
    return 'OVERDUE';
  }
  if (cycle.daysUntilDue === 0) {
    return 'DUE_TODAY';
  }
  if (cycle.daysUntilDue > 0 && cycle.daysUntilDue <= 3) {
    return 'DUE_SOON';
  }
  return 'UPCOMING';
}

export function calculateCardBillingCycle(card: CreditCard, referenceDate: Date = new Date()): CardBillingCycleInfo {
  const statementDay = card.statementDay || card.billingCycleDate;
  const outstanding = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);

  if (!statementDay || statementDay < 1 || statementDay > 31) {
    const dueStatus: CardDueStatus = outstanding < 0 ? 'CREDIT_BALANCE' : outstanding === 0 ? 'PAID' : 'UPCOMING';
    return {
      daysUntilStatement: 0,
      daysUntilDue: 0,
      isOverdue: false,
      dueStatus,
      cycleStatus: 'not_set',
    };
  }

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  const refMidnight = new Date(refYear, refMonth, refDay).getTime();

  // Determine current/most recent statement date and next statement date
  let stmtYear = refYear;
  let stmtMonth = refMonth;
  let nextStmtYear = refYear;
  let nextStmtMonth = refMonth + 1;

  if (refDay < statementDay) {
    // Current cycle's statement is upcoming this month
    // Most recent generated statement was last month
    stmtMonth = refMonth - 1;
    if (stmtMonth < 0) {
      stmtMonth = 11;
      stmtYear -= 1;
    }
    nextStmtMonth = refMonth;
  }

  const stmtActualDay = clampDayToMonth(stmtYear, stmtMonth, statementDay);
  const nextStmtActualDay = clampDayToMonth(nextStmtYear, nextStmtMonth, statementDay);

  const currentStatementDate = formatDateISO(stmtYear, stmtMonth, stmtActualDay);
  const nextStatementDate = formatDateISO(nextStmtYear, nextStmtMonth, nextStmtActualDay);

  // Compute previous statement date (1 month before current statement)
  let prevStmtYear = stmtYear;
  let prevStmtMonth = stmtMonth - 1;
  if (prevStmtMonth < 0) {
    prevStmtMonth = 11;
    prevStmtYear -= 1;
  }
  const prevStmtActualDay = clampDayToMonth(prevStmtYear, prevStmtMonth, statementDay);
  const previousStatementDate = formatDateISO(prevStmtYear, prevStmtMonth, prevStmtActualDay);

  // Current billing cycle start (day after previous statement)
  const prevStmtObj = new Date(prevStmtYear, prevStmtMonth, prevStmtActualDay);
  const cycleStartObj = new Date(prevStmtObj.getTime() + 24 * 60 * 60 * 1000);
  const currentCycleStart = formatDateISO(
    cycleStartObj.getFullYear(),
    cycleStartObj.getMonth(),
    cycleStartObj.getDate()
  );
  const currentCycleEnd = currentStatementDate;

  // Compute due date from currentStatementDate
  let dueYear = stmtYear;
  let dueMonth = stmtMonth;
  let dueActualDay = stmtActualDay;

  const dueDateType = (card.dueDateType || '').toUpperCase();
  if (dueDateType === 'FIXED_DAY' && card.dueDay) {
    const dueDayConfig = Number(card.dueDay);
    if (dueDayConfig > statementDay) {
      // Due in same month as statement
      dueActualDay = clampDayToMonth(stmtYear, stmtMonth, dueDayConfig);
    } else {
      // Due in month after statement
      dueMonth = stmtMonth + 1;
      if (dueMonth > 11) {
        dueMonth = 0;
        dueYear += 1;
      }
      dueActualDay = clampDayToMonth(dueYear, dueMonth, dueDayConfig);
    }
  } else {
    // Default or DAYS_AFTER_STATEMENT (typically 18–20 days)
    const daysOffset = card.daysAfterStatement && card.daysAfterStatement > 0 ? card.daysAfterStatement : 20;
    const stmtDateObj = new Date(stmtYear, stmtMonth, stmtActualDay);
    const dueDateObj = new Date(stmtDateObj.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    dueYear = dueDateObj.getFullYear();
    dueMonth = dueDateObj.getMonth();
    dueActualDay = dueDateObj.getDate();
  }

  const currentDueDate = formatDateISO(dueYear, dueMonth, dueActualDay);

  // Calculate day diffs
  const nextStmtDateMidnight = new Date(nextStmtYear, nextStmtMonth, nextStmtActualDay).getTime();
  const dueDateMidnight = new Date(dueYear, dueMonth, dueActualDay).getTime();

  const daysUntilStatement = Math.round((nextStmtDateMidnight - refMidnight) / (1000 * 60 * 60 * 24));
  const daysUntilDue = Math.round((dueDateMidnight - refMidnight) / (1000 * 60 * 60 * 24));

  const isOverdue = daysUntilDue < 0 && outstanding > 0;

  let dueStatus: CardDueStatus;
  if (outstanding < 0) {
    dueStatus = 'CREDIT_BALANCE';
  } else if (outstanding === 0) {
    dueStatus = 'PAID';
  } else if (daysUntilDue < 0) {
    dueStatus = 'OVERDUE';
  } else if (daysUntilDue === 0) {
    dueStatus = 'DUE_TODAY';
  } else if (daysUntilDue > 0 && daysUntilDue <= 3) {
    dueStatus = 'DUE_SOON';
  } else {
    dueStatus = 'UPCOMING';
  }

  let cycleStatus: 'current' | 'statement_generated' | 'due_soon' | 'overdue' = 'current';
  if (isOverdue) {
    cycleStatus = 'overdue';
  } else if (daysUntilDue >= 0 && daysUntilDue <= 3) {
    cycleStatus = 'due_soon';
  } else if (refDay >= statementDay) {
    cycleStatus = 'statement_generated';
  }

  return {
    statementDay,
    previousStatementDate,
    currentStatementDate,
    nextStatementDate,
    currentCycleStart,
    currentCycleEnd,
    currentDueDate,
    daysUntilStatement,
    daysUntilDue,
    isOverdue,
    dueStatus,
    cycleStatus,
  };
}

/**
 * Aggregated Credit Position Summary
 */
export interface CreditPositionSummary {
  totalCreditLimit: number;
  totalOutstanding: number;
  totalAvailableCredit: number;
  totalUtilization: number;
  totalCreditLiability: number;
  totalCreditBalanceRefund: number;
  activeCardsCount: number;
  sharedGroupsCount: number;
  ownerSummary: OwnerCreditSummary;
  managedSummary: ManagedCreditSummary;
}

export function calculateCreditPositionSummary(
  cards: CreditCard[],
  groups: CreditLimitGroup[] = []
): CreditPositionSummary {
  const activeCards = (cards || []).filter((c) => c.status === 'active');
  const activeGroups = (groups || []).filter((g) => g.status === 'active');

  const totalCreditLimit = calculateTotalCreditLimit(activeCards, activeGroups);
  const totalOutstanding = calculateTotalCreditOutstanding(activeCards);
  const totalAvailableCredit = calculateTotalAvailableCredit(activeCards, activeGroups);
  const totalUtilization = calculateTotalCreditUtilization(activeCards, activeGroups);
  const totalCreditLiability = calculateCreditLiabilities(activeCards);

  const totalCreditBalanceRefund = activeCards.reduce((sum, c) => {
    const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
    return sum + (out < 0 ? Math.abs(out) : 0);
  }, 0);

  const ownerSummary = calculateOwnerCreditSummary(activeCards, activeGroups);
  const managedSummary = calculateManagedCreditSummary(activeCards);

  return {
    totalCreditLimit,
    totalOutstanding,
    totalAvailableCredit,
    totalUtilization,
    totalCreditLiability,
    totalCreditBalanceRefund: Math.round(totalCreditBalanceRefund * 100) / 100,
    activeCardsCount: activeCards.length,
    sharedGroupsCount: activeGroups.length,
    ownerSummary,
    managedSummary,
  };
}

/**
 * Step 6D: Credit Utilization Health Indicator (<30% Healthy, 30–50% Moderate, 50–75% High, >75% Critical)
 * Purely visual indicator for personal finance awareness.
 */
export type CreditUtilizationLevel = 'healthy' | 'moderate' | 'high' | 'critical';

export interface CreditUtilizationInfo {
  level: CreditUtilizationLevel;
  label: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
}

export function getCreditUtilizationInfo(utilization: number): CreditUtilizationInfo {
  const util = Math.max(0, Number(utilization || 0));
  if (util < 30) {
    return {
      level: 'healthy',
      label: 'Healthy (<30%)',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/40',
    };
  }
  if (util <= 50) {
    return {
      level: 'moderate',
      label: 'Moderate (30–50%)',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/40',
    };
  }
  if (util <= 75) {
    return {
      level: 'high',
      label: 'High (50–75%)',
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      textClass: 'text-orange-400',
      borderClass: 'border-orange-500/40',
    };
  }
  return {
    level: 'critical',
    label: 'Critical (>75%)',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/40',
  };
}

// ==================== STEP 7A: INVESTMENT CALCULATIONS ====================

/**
 * Calculates current market value from quantity and current price
 * Supports decimal quantities (e.g. 10 shares, 125.456 MF units, 5.25 gold grams)
 */
export function calculateInvestmentValue(quantity: number, currentPrice: number): number {
  const qty = Math.max(0, Number(quantity || 0));
  const price = Math.max(0, Number(currentPrice || 0));
  return Math.round(qty * price * 100) / 100;
}

/**
 * Calculates invested amount from quantity and average buy price
 */
export function calculateInvestedAmount(quantity: number, averageBuyPrice: number): number {
  const qty = Math.max(0, Number(quantity || 0));
  const price = Math.max(0, Number(averageBuyPrice || 0));
  return Math.round(qty * price * 100) / 100;
}

/**
 * Calculates unrealized profit/loss for a single holding
 * Supports passing either an object or numeric arguments
 */
export function calculateInvestmentProfitLoss(
  holdingOrInvested:
    | {
        investedAmount?: number;
        currentValue?: number;
        quantity?: number;
        unitsHeld?: number;
        averageBuyPrice?: number;
        currentPrice?: number;
      }
    | number,
  currentValueParam?: number
): number {
  if (typeof holdingOrInvested === 'number') {
    const invested = Number(holdingOrInvested || 0);
    const curr = Number(currentValueParam || 0);
    return Math.round((curr - invested) * 100) / 100;
  }

  const holding = holdingOrInvested || {};
  const qty = Number(holding.quantity !== undefined ? holding.quantity : holding.unitsHeld || 0);
  const avgBuy = Number(holding.averageBuyPrice || 0);
  const currPrice = Number(holding.currentPrice || 0);

  const invested =
    holding.investedAmount !== undefined && holding.investedAmount > 0
      ? Number(holding.investedAmount)
      : Math.round(qty * avgBuy * 100) / 100;

  const current =
    holding.currentValue !== undefined && holding.currentValue > 0
      ? Number(holding.currentValue)
      : Math.round(qty * currPrice * 100) / 100;

  return Math.round((current - invested) * 100) / 100;
}

/**
 * Calculates return percentage on investment
 */
export function calculateInvestmentReturnPercentage(investedAmount: number, currentValue: number): number {
  const invested = Number(investedAmount || 0);
  const current = Number(currentValue || 0);
  if (invested <= 0) return 0;
  const pnl = current - invested;
  return Math.round((pnl / invested) * 10000) / 100;
}

/**
 * Calculates total portfolio current value across active investment holdings
 */
export function calculateTotalInvestmentValue(holdings: InvestmentHolding[]): number {
  const active = (holdings || []).filter((h) => h.status === 'active' || h.status === 'ACTIVE');
  const total = active.reduce((sum, h) => {
    if (h.includeInNetWorth === false) return sum;
    const qty = Number(h.quantity !== undefined ? h.quantity : h.unitsHeld || 0);
    const currPrice = Number(h.currentPrice || 0);
    const val = h.currentValue !== undefined && h.currentValue > 0 ? Number(h.currentValue) : qty * currPrice;
    return sum + Math.max(0, val);
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates total portfolio invested amount across active investment holdings
 */
export function calculateTotalInvestedAmount(holdings: InvestmentHolding[]): number {
  const active = (holdings || []).filter((h) => h.status === 'active' || h.status === 'ACTIVE');
  const total = active.reduce((sum, h) => {
    if (h.includeInNetWorth === false) return sum;
    const qty = Number(h.quantity !== undefined ? h.quantity : h.unitsHeld || 0);
    const avgBuy = Number(h.averageBuyPrice || 0);
    const inv = h.investedAmount !== undefined && h.investedAmount > 0 ? Number(h.investedAmount) : qty * avgBuy;
    return sum + Math.max(0, inv);
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates aggregated profit/loss and return percentages for a set of holdings
 */
export function calculateTotalInvestmentProfitLoss(holdings: InvestmentHolding[]): {
  totalInvested: number;
  totalCurrent: number;
  profitLoss: number;
  returnPercentage: number;
  holdingsCount: number;
} {
  const active = (holdings || []).filter((h) => h.status === 'active' || h.status === 'ACTIVE');
  const totalInvested = calculateTotalInvestedAmount(active);
  const totalCurrent = calculateTotalInvestmentValue(active);
  const profitLoss = Math.round((totalCurrent - totalInvested) * 100) / 100;
  const returnPercentage = calculateInvestmentReturnPercentage(totalInvested, totalCurrent);

  return {
    totalInvested,
    totalCurrent,
    profitLoss,
    returnPercentage,
    holdingsCount: active.length,
  };
}

/**
 * Normalizes asset type name to standard uppercase key ('STOCK' | 'MUTUAL_FUND' | 'ETF' | 'UNLISTED_EQUITY' | 'GOLD' | 'SGB' | 'OTHER')
 */
export function normalizeAssetType(
  typeStr?: string
): 'STOCK' | 'MUTUAL_FUND' | 'ETF' | 'UNLISTED_EQUITY' | 'GOLD' | 'SGB' | 'OTHER' {
  if (!typeStr) return 'OTHER';
  const raw = String(typeStr).trim();
  if (!raw) return 'OTHER';
  const upper = raw.toUpperCase().replace(/[\s\-_]+/g, '_');

  // ETF matching
  if (
    upper === 'ETF' ||
    upper === 'ETFS' ||
    upper === 'GOLD_ETF' ||
    upper === 'SILVER_ETF' ||
    upper === 'INDEX_ETF' ||
    upper.includes('EXCHANGE_TRADED') ||
    upper.endsWith('_ETF') ||
    upper.startsWith('ETF_')
  ) {
    return 'ETF';
  }

  // Unlisted equity matching
  if (
    upper === 'UNLISTED_EQUITY' ||
    upper === 'UNLISTED' ||
    upper === 'PRE_IPO' ||
    upper === 'PREIPO' ||
    upper === 'UNLISTED_STOCK' ||
    upper === 'UNLISTED_STOCKS' ||
    upper === 'UNLISTED_SHARE' ||
    upper === 'UNLISTED_SHARES'
  ) {
    return 'UNLISTED_EQUITY';
  }

  // Mutual Fund matching
  if (
    upper === 'MUTUAL_FUND' ||
    upper === 'MUTUAL_FUNDS' ||
    upper === 'MF' ||
    upper === 'MFS' ||
    upper === 'FUNDS' ||
    upper === 'FUND' ||
    upper.includes('MUTUAL_FUND') ||
    upper.endsWith('_MF') ||
    upper.includes('EQUITY_MF') ||
    upper.includes('DEBT_MF') ||
    upper.includes('HYBRID_MF')
  ) {
    return 'MUTUAL_FUND';
  }

  // SGB matching
  if (
    upper === 'SGB' ||
    upper === 'SOVEREIGN_GOLD_BOND' ||
    upper === 'SOVEREIGN_GOLD_BONDS' ||
    upper === 'GOLD_BOND' ||
    upper === 'GOLD_BONDS'
  ) {
    return 'SGB';
  }

  // Gold matching
  if (
    upper === 'GOLD' ||
    upper === 'DIGITAL_GOLD' ||
    upper === 'BULLION' ||
    upper === 'PHYSICAL_GOLD' ||
    upper === 'GOLD_BULLION'
  ) {
    return 'GOLD';
  }

  // Stock / Equity matching
  if (
    upper === 'STOCK' ||
    upper === 'STOCKS' ||
    upper === 'EQUITY' ||
    upper === 'EQUITIES' ||
    upper === 'DIRECT_STOCK' ||
    upper === 'DIRECT_STOCKS' ||
    upper === 'SHARE' ||
    upper === 'SHARES' ||
    upper === 'INDIAN_EQUITY' ||
    upper === 'US_EQUITY'
  ) {
    return 'STOCK';
  }

  return 'OTHER';
}

/**
 * Accurately categorizes any investment holding using assetType, type, scheme codes, and name patterns
 * to guarantee that valid holdings are never misclassified or dropped into empty tabs.
 */
export function categorizeHolding(
  holding: InvestmentHolding
): 'STOCK' | 'ETF' | 'MUTUAL_FUND' | 'GOLD' | 'SGB' | 'UNLISTED_EQUITY' | 'OTHER' {
  if (!holding) return 'OTHER';
  const raw =
    holding.assetType ||
    holding.type ||
    (holding as any).category ||
    (holding as any).instrumentType ||
    (holding as any).asset_type ||
    '';
  const norm = normalizeAssetType(raw);
  if (norm !== 'OTHER') {
    return norm;
  }

  // If raw explicitly indicates other/bond/reit/crypto, retain OTHER
  if (raw) {
    const upper = String(raw).trim().toUpperCase();
    if (
      upper === 'OTHER' ||
      upper === 'BOND' ||
      upper === 'BONDS' ||
      upper === 'REIT' ||
      upper === 'REITS' ||
      upper === 'COMMODITY' ||
      upper === 'CRYPTO'
    ) {
      return 'OTHER';
    }
  }

  // Fallbacks for holdings missing an explicit assetType string
  const name = String(holding.name || '').toLowerCase();
  const symbol = String(holding.symbol || (holding as any).ticker || '').toLowerCase();
  const schemeCode = holding.schemeCode || (holding as any).amfiSchemeCode;

  if (schemeCode || /fund|growth|direct|regular|plan|amc|dividend|elss|index\s+fund/i.test(name)) {
    return 'MUTUAL_FUND';
  }
  if (/etf|bees/i.test(name) || /etf|bees/i.test(symbol)) {
    return 'ETF';
  }
  if (/sgb|sovereign.*gold/i.test(name) || /sgb/i.test(symbol)) {
    return 'SGB';
  }
  if (/gold|bullion|digital.*gold/i.test(name) || /gold/i.test(symbol)) {
    return 'GOLD';
  }
  if (/unlisted|pre-ipo|preipo/i.test(name)) {
    return 'UNLISTED_EQUITY';
  }

  // Active holding with ticker or units is considered equity/stock
  if (symbol || holding.quantity || holding.unitsHeld) {
    return 'STOCK';
  }

  return 'OTHER';
}

/**
 * Returns holding counts partitioned cleanly by category, preventing 0-count mismatches
 * and guaranteeing that no holding is ever counted twice.
 */
export function getHoldingCategoryCounts(holdings: InvestmentHolding[]): {
  stocksCount: number;
  etfCount: number;
  mfCount: number;
  goldCount: number;
  unlistedCount: number;
  otherCount: number;
  totalActive: number;
} {
  const active = (holdings || []).filter((h) => h.status === 'active' || h.status === 'ACTIVE');
  let stocksCount = 0;
  let etfCount = 0;
  let mfCount = 0;
  let goldCount = 0;
  let unlistedCount = 0;
  let otherCount = 0;

  for (const h of active) {
    const cat = categorizeHolding(h);
    if (cat === 'MUTUAL_FUND') {
      mfCount++;
    } else if (cat === 'ETF') {
      etfCount++;
    } else if (cat === 'GOLD' || cat === 'SGB') {
      goldCount++;
    } else if (cat === 'UNLISTED_EQUITY') {
      unlistedCount++;
    } else if (cat === 'STOCK') {
      stocksCount++;
    } else {
      otherCount++;
    }
  }

  return {
    stocksCount,
    etfCount,
    mfCount,
    goldCount,
    unlistedCount,
    otherCount,
    totalActive: active.length,
  };
}

/**
 * Calculates allocation distribution by Asset Type and Broker
 */
export interface AssetTypeAllocation {
  key: string;
  label: string;
  count: number;
  investedAmount: number;
  currentValue: number;
  profitLoss: number;
  returnPercentage: number;
  percentage: number;
}

export interface BrokerAllocation {
  key: string;
  brokerName: string;
  count: number;
  currentValue: number;
  percentage: number;
}

export interface InvestmentAllocationSummary {
  byAssetType: Record<string, AssetTypeAllocation>;
  assetTypeList: AssetTypeAllocation[];
  byBroker: Record<string, BrokerAllocation>;
  brokerList: BrokerAllocation[];
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
}

export function calculateInvestmentAllocation(holdings: InvestmentHolding[]): InvestmentAllocationSummary {
  const active = (holdings || []).filter((h) => h.status === 'active' || h.status === 'ACTIVE');
  const totalValue = calculateTotalInvestmentValue(active);
  const totalInvested = calculateTotalInvestedAmount(active);
  const totalProfitLoss = Math.round((totalValue - totalInvested) * 100) / 100;

  const typeMap: Record<string, { count: number; invested: number; current: number }> = {
    STOCK: { count: 0, invested: 0, current: 0 },
    MUTUAL_FUND: { count: 0, invested: 0, current: 0 },
    ETF: { count: 0, invested: 0, current: 0 },
    UNLISTED_EQUITY: { count: 0, invested: 0, current: 0 },
    GOLD: { count: 0, invested: 0, current: 0 },
    SGB: { count: 0, invested: 0, current: 0 },
    OTHER: { count: 0, invested: 0, current: 0 },
  };

  const brokerMap: Record<string, { count: number; current: number }> = {};

  active.forEach((h) => {
    const rawType = h.assetType || h.type || 'other';
    const normType = normalizeAssetType(rawType);
    const qty = Number(h.quantity !== undefined ? h.quantity : h.unitsHeld || 0);
    const avgBuy = Number(h.averageBuyPrice || 0);
    const currPrice = Number(h.currentPrice || 0);
    const inv = h.investedAmount !== undefined && h.investedAmount > 0 ? Number(h.investedAmount) : qty * avgBuy;
    const val = h.currentValue !== undefined && h.currentValue > 0 ? Number(h.currentValue) : qty * currPrice;

    if (!typeMap[normType]) {
      typeMap[normType] = { count: 0, invested: 0, current: 0 };
    }
    typeMap[normType].count += 1;
    typeMap[normType].invested += inv;
    typeMap[normType].current += val;

    const rawBroker = h.broker || h.platform || 'Other';
    const brokerKey = rawBroker.trim() || 'Other';
    if (!brokerMap[brokerKey]) {
      brokerMap[brokerKey] = { count: 0, current: 0 };
    }
    brokerMap[brokerKey].count += 1;
    brokerMap[brokerKey].current += val;
  });

  const typeLabels: Record<string, string> = {
    STOCK: 'Direct Stocks',
    MUTUAL_FUND: 'Mutual Funds',
    ETF: 'Exchange Traded Funds (ETFs)',
    UNLISTED_EQUITY: 'Unlisted Equities',
    GOLD: 'Physical & Digital Gold',
    SGB: 'Sovereign Gold Bonds (SGB)',
    OTHER: 'Other Assets',
  };

  const byAssetType: Record<string, AssetTypeAllocation> = {};
  const assetTypeList: AssetTypeAllocation[] = [];

  Object.entries(typeMap).forEach(([key, data]) => {
    const pnl = Math.round((data.current - data.invested) * 100) / 100;
    const retPct = data.invested > 0 ? Math.round((pnl / data.invested) * 10000) / 100 : 0;
    const pct = totalValue > 0 ? Math.round((data.current / totalValue) * 10000) / 100 : 0;

    const item: AssetTypeAllocation = {
      key,
      label: typeLabels[key] || key,
      count: data.count,
      investedAmount: Math.round(data.invested * 100) / 100,
      currentValue: Math.round(data.current * 100) / 100,
      profitLoss: pnl,
      returnPercentage: retPct,
      percentage: pct,
    };
    byAssetType[key] = item;
    if (data.count > 0 || data.current > 0) {
      assetTypeList.push(item);
    }
  });

  // Sort assetTypeList by current value descending
  assetTypeList.sort((a, b) => b.currentValue - a.currentValue);

  const byBroker: Record<string, BrokerAllocation> = {};
  const brokerList: BrokerAllocation[] = [];

  Object.entries(brokerMap).forEach(([key, data]) => {
    const pct = totalValue > 0 ? Math.round((data.current / totalValue) * 10000) / 100 : 0;
    const item: BrokerAllocation = {
      key,
      brokerName: key,
      count: data.count,
      currentValue: Math.round(data.current * 100) / 100,
      percentage: pct,
    };
    byBroker[key] = item;
    brokerList.push(item);
  });

  brokerList.sort((a, b) => b.currentValue - a.currentValue);

  return {
    byAssetType,
    assetTypeList,
    byBroker,
    brokerList,
    totalValue,
    totalInvested,
    totalProfitLoss,
  };
}

/**
 * Calculates total ASBA blocked funds across active applied IPO applications
 */
export function calculateTotalIPOBlockedFunds(ipos: IPOApplication[]): number {
  const active = (ipos || []).filter((i) => i.status === 'active' || !i.status);
  const total = active.reduce((sum, ipo) => {
    const status = (ipo.ipoStatus || 'applied').toLowerCase();
    // Only 'applied' or 'blocked' count as blocked funds in bank
    if (status === 'applied' || status === 'blocked') {
      const lots = Number(ipo.lotsApplied || 1);
      const perLot = Number(ipo.sharesPerLot || 1);
      const price = Number(ipo.bidPrice || 0);
      const amt =
        ipo.blockedAmount !== undefined && ipo.blockedAmount > 0
          ? Number(ipo.blockedAmount)
          : ipo.applicationAmount !== undefined && ipo.applicationAmount > 0
          ? Number(ipo.applicationAmount)
          : lots * perLot * price;
      return sum + amt;
    }
    return sum;
  }, 0);
  return Math.round(total * 100) / 100;
}

// ============================================================================
// STEP 8A: KHATABOOK (RECEIVABLES & PAYABLES) FINANCIAL CALCULATION ENGINE
// ============================================================================

/**
 * Normalizes Khatabook entry type to standard uppercase ('RECEIVABLE' | 'PAYABLE')
 */
export function normalizeKhatabookType(type?: string): 'RECEIVABLE' | 'PAYABLE' {
  const normalized = (type || 'RECEIVABLE').toString().trim().toUpperCase();
  return normalized === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE';
}

/**
 * Returns original transaction amount for a Khatabook entry
 */
export function getKhatabookOriginalAmount(entry: Partial<KhatabookEntry>): number {
  if (entry.originalAmount !== undefined && entry.originalAmount !== null) {
    return Math.max(0, Number(entry.originalAmount));
  }
  if (entry.amount !== undefined && entry.amount !== null) {
    return Math.max(0, Number(entry.amount));
  }
  return 0;
}

/**
 * Returns total paid/settled amount for a Khatabook entry
 */
export function getKhatabookPaidAmount(entry: Partial<KhatabookEntry>): number {
  if (entry.paidAmount !== undefined && entry.paidAmount !== null) {
    return Math.max(0, Number(entry.paidAmount));
  }
  if (entry.isSettled || (entry.status && entry.status.toString().toUpperCase() === 'PAID')) {
    return getKhatabookOriginalAmount(entry);
  }
  return 0;
}

/**
 * Returns remaining outstanding balance for a Khatabook entry (never negative)
 */
export function getKhatabookRemainingAmount(entry: Partial<KhatabookEntry>): number {
  if (entry.isSettled || (entry.status && entry.status.toString().toUpperCase() === 'PAID')) {
    return 0;
  }
  if (entry.remainingAmount !== undefined && entry.remainingAmount !== null) {
    return Math.max(0, Math.round(Number(entry.remainingAmount) * 100) / 100);
  }
  const original = getKhatabookOriginalAmount(entry);
  const paid = getKhatabookPaidAmount(entry);
  return Math.max(0, Math.round((original - paid) * 100) / 100);
}

/**
 * Computes the lifecycle status of a Khatabook entry
 */
export function getKhatabookStatus(entry: Partial<KhatabookEntry>): KhatabookStatus {
  const rawStatus = (entry.status || '').toString().toUpperCase();
  if (rawStatus === 'ARCHIVED' || entry.archivedAt) return 'ARCHIVED';
  if (rawStatus === 'CANCELLED') return 'CANCELLED';

  const remaining = getKhatabookRemainingAmount(entry);
  if (remaining === 0 || entry.isSettled || rawStatus === 'PAID') {
    return 'PAID';
  }

  // Check if overdue based on optional dueDate
  if (entry.dueDate) {
    const dueTime = new Date(entry.dueDate).setHours(23, 59, 59, 999);
    const nowTime = new Date().getTime();
    if (!isNaN(dueTime) && dueTime < nowTime) {
      return 'OVERDUE';
    }
  }

  const paid = getKhatabookPaidAmount(entry);
  if (paid > 0) {
    return 'PARTIALLY_PAID';
  }

  return 'OPEN';
}

/**
 * Calculates Total Original Receivables across active entries
 */
export function calculateReceivables(entries: KhatabookEntry[]): number {
  const total = (entries || []).reduce((sum, entry) => {
    const status = (entry.status || '').toString().toUpperCase();
    if (status === 'ARCHIVED' || status === 'CANCELLED') return sum;
    if (normalizeKhatabookType(entry.entryType || entry.type) === 'RECEIVABLE') {
      return sum + getKhatabookOriginalAmount(entry);
    }
    return sum;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates Outstanding Receivables (Asset contribution) across active entries
 */
export function calculateOutstandingReceivables(entries: KhatabookEntry[]): number {
  const total = (entries || []).reduce((sum, entry) => {
    const status = (entry.status || '').toString().toUpperCase();
    if (status === 'ARCHIVED' || status === 'CANCELLED') return sum;
    if (entry.includeInNetWorth === false) return sum;
    if (normalizeKhatabookType(entry.entryType || entry.type) === 'RECEIVABLE') {
      return sum + getKhatabookRemainingAmount(entry);
    }
    return sum;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates Total Original Payables across active entries
 */
export function calculatePayables(entries: KhatabookEntry[]): number {
  const total = (entries || []).reduce((sum, entry) => {
    const status = (entry.status || '').toString().toUpperCase();
    if (status === 'ARCHIVED' || status === 'CANCELLED') return sum;
    if (normalizeKhatabookType(entry.entryType || entry.type) === 'PAYABLE') {
      return sum + getKhatabookOriginalAmount(entry);
    }
    return sum;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates Outstanding Payables (Liability contribution) across active entries
 */
export function calculateOutstandingPayables(entries: KhatabookEntry[]): number {
  const total = (entries || []).reduce((sum, entry) => {
    const status = (entry.status || '').toString().toUpperCase();
    if (status === 'ARCHIVED' || status === 'CANCELLED') return sum;
    if (entry.includeInNetWorth === false) return sum;
    if (normalizeKhatabookType(entry.entryType || entry.type) === 'PAYABLE') {
      return sum + getKhatabookRemainingAmount(entry);
    }
    return sum;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates Khatabook Net Position = Outstanding Receivables - Outstanding Payables
 * Positive => Net money owed to the user (Asset surplus)
 * Negative => Net money the user owes to others (Liability surplus)
 */
export function calculateKhatabookNetPosition(entries: KhatabookEntry[]): number {
  const rec = calculateOutstandingReceivables(entries);
  const pay = calculateOutstandingPayables(entries);
  return Math.round((rec - pay) * 100) / 100;
}

/**
 * Calculates a specific person's consolidated Khatabook balance & entry list
 */
export function calculatePersonBalance(personName: string, entries: KhatabookEntry[]): PersonKhatabookBalance {
  const normalizedTarget = (personName || '').trim().toLowerCase();
  const personEntries = (entries || []).filter(
    (e) => (e.personName || '').trim().toLowerCase() === normalizedTarget
  );

  let phone: string | undefined = undefined;
  let totalReceivable = 0;
  let totalPayable = 0;
  let totalOriginalReceivable = 0;
  let totalOriginalPayable = 0;
  let totalSettledReceivable = 0;
  let totalSettledPayable = 0;
  let activeEntriesCount = 0;
  let settledEntriesCount = 0;
  let hasOverdue = false;

  personEntries.forEach((entry) => {
    if (!phone && (entry.phone || entry.contactNumber)) {
      phone = entry.phone || entry.contactNumber;
    }

    const isArchived = (entry.status || '').toString().toUpperCase() === 'ARCHIVED';
    if (isArchived) return;

    const type = normalizeKhatabookType(entry.entryType || entry.type);
    const orig = getKhatabookOriginalAmount(entry);
    const paid = getKhatabookPaidAmount(entry);
    const remaining = getKhatabookRemainingAmount(entry);
    const status = getKhatabookStatus(entry);

    if (status === 'OVERDUE') {
      hasOverdue = true;
    }

    if (type === 'RECEIVABLE') {
      totalOriginalReceivable += orig;
      totalSettledReceivable += paid;
      totalReceivable += remaining;
    } else {
      totalOriginalPayable += orig;
      totalSettledPayable += paid;
      totalPayable += remaining;
    }

    if (status === 'PAID') {
      settledEntriesCount += 1;
    } else {
      activeEntriesCount += 1;
    }
  });

  totalReceivable = Math.round(totalReceivable * 100) / 100;
  totalPayable = Math.round(totalPayable * 100) / 100;
  const netBalance = Math.round((totalReceivable - totalPayable) * 100) / 100;

  return {
    personName: personEntries[0]?.personName || personName,
    phone,
    totalReceivable,
    totalPayable,
    netBalance,
    totalOriginalReceivable: Math.round(totalOriginalReceivable * 100) / 100,
    totalOriginalPayable: Math.round(totalOriginalPayable * 100) / 100,
    totalSettledReceivable: Math.round(totalSettledReceivable * 100) / 100,
    totalSettledPayable: Math.round(totalSettledPayable * 100) / 100,
    activeEntriesCount,
    settledEntriesCount,
    entries: personEntries,
    hasOverdue,
  };
}

/**
 * Calculates aggregated Khatabook balances grouped for all unique persons
 */
export function calculateAllPersonBalances(entries: KhatabookEntry[]): PersonKhatabookBalance[] {
  const personsMap = new Map<string, string>(); // normalizedKey -> originalName

  (entries || []).forEach((e) => {
    const rawName = (e.personName || '').trim();
    if (!rawName) return;
    const key = rawName.toLowerCase();
    if (!personsMap.has(key)) {
      personsMap.set(key, rawName);
    }
  });

  const balances: PersonKhatabookBalance[] = [];
  personsMap.forEach((origName) => {
    balances.push(calculatePersonBalance(origName, entries));
  });

  // Sort by highest absolute net balance first
  balances.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));
  return balances;
}

/**
 * Information regarding due date status for a Khatabook entry
 */
export interface KhatabookDueInfo {
  isOverdue: boolean;
  isDueSoon: boolean;
  isDueToday: boolean;
  daysDifference: number; // positive = days overdue, negative = days until due, 0 = today
  displayText: string;
  badgeVariant: 'rose' | 'amber' | 'cyan' | 'slate' | 'emerald';
}

/**
 * Computes human-friendly due information and timing relative to current date
 */
export function getKhatabookDueInfo(entry: Partial<KhatabookEntry>): KhatabookDueInfo {
  const status = getKhatabookStatus(entry);
  if (status === 'PAID') {
    return {
      isOverdue: false,
      isDueSoon: false,
      isDueToday: false,
      daysDifference: 0,
      displayText: 'Settled',
      badgeVariant: 'emerald',
    };
  }

  if (!entry.dueDate) {
    return {
      isOverdue: false,
      isDueSoon: false,
      isDueToday: false,
      daysDifference: 0,
      displayText: 'No deadline',
      badgeVariant: 'slate',
    };
  }

  const due = new Date(entry.dueDate);
  if (isNaN(due.getTime())) {
    return {
      isOverdue: false,
      isDueSoon: false,
      isDueToday: false,
      daysDifference: 0,
      displayText: entry.dueDate,
      badgeVariant: 'slate',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(entry.dueDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      isOverdue: true,
      isDueSoon: false,
      isDueToday: false,
      daysDifference: overdueDays,
      displayText: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
      badgeVariant: 'rose',
    };
  }

  if (diffDays === 0) {
    return {
      isOverdue: false,
      isDueSoon: true,
      isDueToday: true,
      daysDifference: 0,
      displayText: 'Due today',
      badgeVariant: 'amber',
    };
  }

  if (diffDays <= 7) {
    return {
      isOverdue: false,
      isDueSoon: true,
      isDueToday: false,
      daysDifference: -diffDays,
      displayText: diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days`,
      badgeVariant: 'amber',
    };
  }

  return {
    isOverdue: false,
    isDueSoon: false,
    isDueToday: false,
    daysDifference: -diffDays,
    displayText: `Due in ${diffDays} days`,
    badgeVariant: 'cyan',
  };
}

/**
 * Calculates a complete Khatabook Summary for dashboards, analytics, and net worth
 */
export function calculateKhatabookSummary(entries: KhatabookEntry[]): KhatabookSummary {
  const activeEntries = (entries || []).filter((e) => (e.status || '').toString().toUpperCase() !== 'ARCHIVED');

  let totalOriginalReceivables = 0;
  let totalOriginalPayables = 0;
  let totalSettledReceivables = 0;
  let totalSettledPayables = 0;
  let totalReceivables = 0;
  let totalPayables = 0;
  let activeReceivablesCount = 0;
  let activePayablesCount = 0;
  let settledCount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let overdueReceivablesAmount = 0;
  let overduePayablesAmount = 0;
  let dueSoonCount = 0;
  let dueSoonAmount = 0;

  activeEntries.forEach((entry) => {
    const type = normalizeKhatabookType(entry.entryType || entry.type);
    const orig = getKhatabookOriginalAmount(entry);
    const paid = getKhatabookPaidAmount(entry);
    const remaining = getKhatabookRemainingAmount(entry);
    const status = getKhatabookStatus(entry);
    const dueInfo = getKhatabookDueInfo(entry);

    if (type === 'RECEIVABLE') {
      totalOriginalReceivables += orig;
      totalSettledReceivables += paid;
      if (entry.includeInNetWorth !== false) {
        totalReceivables += remaining;
      }
      if (status === 'PAID') {
        settledCount += 1;
      } else {
        activeReceivablesCount += 1;
      }

      if (status === 'OVERDUE') {
        overdueReceivablesAmount += remaining;
      }
    } else {
      totalOriginalPayables += orig;
      totalSettledPayables += paid;
      if (entry.includeInNetWorth !== false) {
        totalPayables += remaining;
      }
      if (status === 'PAID') {
        settledCount += 1;
      } else {
        activePayablesCount += 1;
      }

      if (status === 'OVERDUE') {
        overduePayablesAmount += remaining;
      }
    }

    if (status === 'OVERDUE') {
      overdueCount += 1;
      overdueAmount += remaining;
    } else if (dueInfo.isDueSoon && remaining > 0) {
      dueSoonCount += 1;
      dueSoonAmount += remaining;
    }
  });

  totalReceivables = Math.round(totalReceivables * 100) / 100;
  totalPayables = Math.round(totalPayables * 100) / 100;
  const netPosition = Math.round((totalReceivables - totalPayables) * 100) / 100;
  const personBalances = calculateAllPersonBalances(entries);

  return {
    totalReceivables,
    totalPayables,
    netPosition,
    totalOriginalReceivables: Math.round(totalOriginalReceivables * 100) / 100,
    totalOriginalPayables: Math.round(totalOriginalPayables * 100) / 100,
    totalSettledReceivables: Math.round(totalSettledReceivables * 100) / 100,
    totalSettledPayables: Math.round(totalSettledPayables * 100) / 100,
    activeReceivablesCount,
    activePayablesCount,
    settledCount,
    overdueCount,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    overdueReceivablesAmount: Math.round(overdueReceivablesAmount * 100) / 100,
    overduePayablesAmount: Math.round(overduePayablesAmount * 100) / 100,
    dueSoonCount,
    dueSoonAmount: Math.round(dueSoonAmount * 100) / 100,
    personCount: personBalances.length,
    personBalances,
  };
}

// ============================================================================
// STEP 9A: HISTORICAL NET WORTH SNAPSHOT & COMPARISON DATA ENGINE
// ============================================================================

/**
 * Computes exact category breakdown for financial snapshots
 */
export function calculateSnapshotCategoryBreakdown(input: CalculationInput): CategoryBreakdown {
  const activeCash = (input.cashHoldings || []).filter((c) => c.status === 'active');
  const activeBanks = (input.bankAccounts || []).filter((b) => b.status === 'active');
  const activeFds = (input.fixedDeposits || []).filter((f) => f.status === 'active');
  const activeWallets = (input.wallets || []).filter((w) => w.status === 'active');
  const activeInvestments = (input.investments || []).filter((i) => i.status === 'active');
  const activeCards = (input.creditCards || []).filter((c) => c.status === 'active');

  let cash = activeCash.reduce((s, c) => s + Math.max(0, Number(c.balance || 0)), 0);
  
  let banks = 0;
  let overdrafts = 0;
  activeBanks.forEach((b) => {
    const bal = Number(b.balance || 0);
    if (bal >= 0) {
      banks += bal;
    } else {
      overdrafts += Math.abs(bal);
    }
  });

  const fixedDeposits = activeFds.reduce((s, f) => {
    const val = f.estimatedCurrentValue !== undefined ? Number(f.estimatedCurrentValue) : Number(f.principal || f.balance || 0);
    return s + (val > 0 ? val : 0);
  }, 0);

  const wallets = activeWallets.reduce((s, w) => {
    if (w.includeInNetWorth === false) return s;
    const bal = Number(w.balance || 0);
    return s + (bal > 0 ? bal : 0);
  }, 0);

  const investments = activeInvestments.reduce((s, i) => {
    if (i.includeInNetWorth === false) return s;
    const val = Number(i.currentValue !== undefined ? i.currentValue : (Number(i.quantity || 0) * Number(i.currentPrice || i.averageBuyPrice || 0)));
    return s + (val > 0 ? val : 0);
  }, 0);

  const receivables = calculateOutstandingReceivables(input.khatabookEntries || []);

  let creditCards = 0;
  activeCards.forEach((c) => {
    if (c.includeInNetWorth === false) return;
    const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
    if (out > 0) {
      creditCards += out;
    } else if (out < 0) {
      // Refund credit balance on credit card is treated as asset cash-equivalent
      cash += Math.abs(out);
    }
  });

  const payables = calculateOutstandingPayables(input.khatabookEntries || []);

  return {
    assets: {
      cash: Math.round(cash * 100) / 100,
      banks: Math.round(banks * 100) / 100,
      fixedDeposits: Math.round(fixedDeposits * 100) / 100,
      wallets: Math.round(wallets * 100) / 100,
      investments: Math.round(investments * 100) / 100,
      receivables: Math.round(receivables * 100) / 100,
      other: 0,
    },
    liabilities: {
      creditCards: Math.round(creditCards * 100) / 100,
      overdrafts: Math.round(overdrafts * 100) / 100,
      payables: Math.round(payables * 100) / 100,
      other: 0,
    },
  };
}

/**
 * Creates a complete normalized FinancialSnapshot payload from current calculation state
 */
export function createSnapshotDataFromInput(
  input: CalculationInput,
  options?: {
    label?: SnapshotLabel;
    snapshotType?: SnapshotType;
    note?: string;
    timestamp?: string;
  }
): Omit<FinancialSnapshot, 'id'> {
  const totalAssets = calculateTotalAssets(input);
  const totalLiabilities = calculateTotalLiabilities(input);
  const netWorth = calculateNetWorth(totalAssets, totalLiabilities);
  const breakdown = calculateSnapshotCategoryBreakdown(input);

  const now = options?.timestamp ? new Date(options.timestamp) : new Date();
  const dateIso = now.toISOString();
  const date = dateIso.slice(0, 10);
  const dateString = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const totalIPOBlocked = 0;

  const label = options?.label || (options?.snapshotType === 'monthly' ? 'Monthly' : 'Daily');
  const snapshotType = options?.snapshotType || 'daily';

  return {
    timestamp: dateIso,
    date,
    dateString,
    label,
    snapshotType,
    totalAssets,
    totalLiabilities,
    netWorth,
    totalCash: breakdown.assets.cash,
    totalBankBalance: breakdown.assets.banks,
    totalFixedDeposits: breakdown.assets.fixedDeposits,
    totalWalletBalance: breakdown.assets.wallets,
    totalInvestments: breakdown.assets.investments,
    totalReceivables: breakdown.assets.receivables,
    totalCreditCardDue: breakdown.liabilities.creditCards,
    totalOverdraftLiabilities: breakdown.liabilities.overdrafts,
    totalPayables: breakdown.liabilities.payables,
    totalIPOBlocked,
    categoryBreakdown: breakdown,
    note: options?.note,
    createdAt: dateIso,
    // Backward compatibility aliases
    totalNetWorth: netWorth,
    cashTotal: breakdown.assets.cash,
    bankTotal: breakdown.assets.banks,
    investmentTotal: breakdown.assets.investments,
    receivablesTotal: breakdown.assets.receivables,
    creditCardTotal: breakdown.liabilities.creditCards,
    payablesTotal: breakdown.liabilities.payables,
  };
}

/**
 * Calculates absolute and percentage change between two net worth numbers
 */
export function calculateNetWorthChange(
  currentNetWorth: number,
  previousNetWorth: number
): { changeAmount: number; changePercentage: number; isPositive: boolean } {
  const current = Number(currentNetWorth || 0);
  const prev = Number(previousNetWorth || 0);
  const changeAmount = Math.round((current - prev) * 100) / 100;

  let changePercentage = 0;
  if (prev === 0) {
    changePercentage = current !== 0 ? (current > 0 ? 100 : -100) : 0;
  } else {
    changePercentage = Math.round(((current - prev) / Math.abs(prev)) * 10000) / 100;
  }

  return {
    changeAmount,
    changePercentage,
    isPositive: changeAmount >= 0,
  };
}

/**
 * Calculates absolute and percentage change between two asset totals
 */
export function calculateAssetChange(
  currentAssets: number,
  previousAssets: number
): { changeAmount: number; changePercentage: number; isPositive: boolean } {
  const current = Number(currentAssets || 0);
  const prev = Number(previousAssets || 0);
  const changeAmount = Math.round((current - prev) * 100) / 100;

  let changePercentage = 0;
  if (prev === 0) {
    changePercentage = current !== 0 ? 100 : 0;
  } else {
    changePercentage = Math.round(((current - prev) / Math.abs(prev)) * 10000) / 100;
  }

  return {
    changeAmount,
    changePercentage,
    isPositive: changeAmount >= 0,
  };
}

/**
 * Calculates absolute and percentage change between two liability totals
 */
export function calculateLiabilityChange(
  currentLiabilities: number,
  previousLiabilities: number
): { changeAmount: number; changePercentage: number; isPositive: boolean } {
  const current = Number(currentLiabilities || 0);
  const prev = Number(previousLiabilities || 0);
  const changeAmount = Math.round((current - prev) * 100) / 100;

  let changePercentage = 0;
  if (prev === 0) {
    changePercentage = current !== 0 ? 100 : 0;
  } else {
    changePercentage = Math.round(((current - prev) / Math.abs(prev)) * 10000) / 100;
  }

  return {
    changeAmount,
    changePercentage,
    isPositive: changeAmount <= 0, // Lower liabilities is positive for user
  };
}

/**
 * Calculates category-specific change and its directional contribution to Net Worth
 */
export function calculateCategoryChange(
  categoryName: string,
  categoryKey: CategoryContribution['categoryKey'],
  type: 'asset' | 'liability',
  currentValue: number,
  previousValue: number
): CategoryContribution {
  const current = Math.round(Number(currentValue || 0) * 100) / 100;
  const prev = Math.round(Number(previousValue || 0) * 100) / 100;
  const absoluteChange = Math.round((current - prev) * 100) / 100;

  let percentageChange = 0;
  if (prev === 0) {
    percentageChange = current !== 0 ? (current > 0 ? 100 : -100) : 0;
  } else {
    percentageChange = Math.round(((current - prev) / Math.abs(prev)) * 10000) / 100;
  }

  // An asset gain increases net worth; a liability gain decreases net worth
  const impactOnNetWorth = type === 'asset' ? absoluteChange : -absoluteChange;

  return {
    category: categoryName,
    categoryLabel: categoryName,
    categoryKey,
    type,
    isLiability: type === 'liability',
    previousValue: prev,
    baselineValue: prev,
    currentValue: current,
    absoluteChange,
    changeAmount: absoluteChange,
    percentageChange,
    impactOnNetWorth: Math.round(impactOnNetWorth * 100) / 100,
  };
}

/**
 * Extracts category totals from any snapshot (supporting both new and legacy formats)
 */
function extractSnapshotCategoryTotals(snap: FinancialSnapshot | null) {
  if (!snap) {
    return {
      cash: 0,
      banks: 0,
      fixedDeposits: 0,
      wallets: 0,
      investments: 0,
      receivables: 0,
      creditCards: 0,
      overdrafts: 0,
      payables: 0,
    };
  }

  return {
    cash: snap.totalCash !== undefined ? snap.totalCash : Number(snap.cashTotal || 0),
    banks: snap.totalBankBalance !== undefined ? snap.totalBankBalance : Number(snap.bankTotal || 0),
    fixedDeposits: snap.totalFixedDeposits !== undefined ? snap.totalFixedDeposits : 0,
    wallets: snap.totalWalletBalance !== undefined ? snap.totalWalletBalance : 0,
    investments: snap.totalInvestments !== undefined ? snap.totalInvestments : Number(snap.investmentTotal || 0),
    receivables: snap.totalReceivables !== undefined ? snap.totalReceivables : Number(snap.receivablesTotal || 0),
    creditCards: snap.totalCreditCardDue !== undefined ? snap.totalCreditCardDue : Number(snap.creditCardTotal || 0),
    overdrafts: snap.totalOverdraftLiabilities !== undefined ? snap.totalOverdraftLiabilities : 0,
    payables: snap.totalPayables !== undefined ? snap.totalPayables : Number(snap.payablesTotal || 0),
  };
}

/**
 * Calculates granular snapshot comparison between a current snapshot and a baseline snapshot
 */
export function calculateSnapshotChange(
  currentSnapshot: FinancialSnapshot,
  previousSnapshot: FinancialSnapshot | null,
  period: ComparisonPeriod = '1M'
): NetWorthComparisonResult {
  const currentNetWorth = currentSnapshot.netWorth !== undefined ? currentSnapshot.netWorth : Number(currentSnapshot.totalNetWorth || 0);
  const baselineNetWorth = previousSnapshot ? (previousSnapshot.netWorth !== undefined ? previousSnapshot.netWorth : Number(previousSnapshot.totalNetWorth || 0)) : 0;

  const nwChange = calculateNetWorthChange(currentNetWorth, baselineNetWorth);
  const currentAssets = Number(currentSnapshot.totalAssets || 0);
  const baselineAssets = previousSnapshot ? Number(previousSnapshot.totalAssets || 0) : 0;
  const assetChange = calculateAssetChange(currentAssets, baselineAssets);

  const currentLiabilities = Number(currentSnapshot.totalLiabilities || 0);
  const baselineLiabilities = previousSnapshot ? Number(previousSnapshot.totalLiabilities || 0) : 0;
  const liabilityChange = calculateLiabilityChange(currentLiabilities, baselineLiabilities);

  const currTotals = extractSnapshotCategoryTotals(currentSnapshot);
  const prevTotals = extractSnapshotCategoryTotals(previousSnapshot);

  const cashChange = calculateCategoryChange('Cash in Hand', 'cash', 'asset', currTotals.cash, prevTotals.cash);
  const bankChange = calculateCategoryChange('Bank Accounts', 'banks', 'asset', currTotals.banks, prevTotals.banks);
  const fdChange = calculateCategoryChange('Fixed Deposits', 'fixedDeposits', 'asset', currTotals.fixedDeposits, prevTotals.fixedDeposits);
  const walletChange = calculateCategoryChange('Digital Wallets', 'wallets', 'asset', currTotals.wallets, prevTotals.wallets);
  const investmentChange = calculateCategoryChange('Investments', 'investments', 'asset', currTotals.investments, prevTotals.investments);
  const receivableChange = calculateCategoryChange('Receivables (Dues & Receivables)', 'receivables', 'asset', currTotals.receivables, prevTotals.receivables);

  const creditCardChange = calculateCategoryChange('Credit Cards', 'creditCards', 'liability', currTotals.creditCards, prevTotals.creditCards);
  const payableChange = calculateCategoryChange('Payables (Dues & Receivables)', 'payables', 'liability', currTotals.payables, prevTotals.payables);
  const overdraftChange = calculateCategoryChange('Bank Overdrafts', 'overdrafts', 'liability', currTotals.overdrafts, prevTotals.overdrafts);

  const contributionsList: CategoryContribution[] = [
    investmentChange,
    bankChange,
    fdChange,
    cashChange,
    walletChange,
    receivableChange,
    creditCardChange,
    payableChange,
    overdraftChange,
  ];

  // Sort by highest absolute impact on net worth
  contributionsList.sort((a, b) => Math.abs(b.impactOnNetWorth) - Math.abs(a.impactOnNetWorth));

  const periodLabels: Record<ComparisonPeriod, string> = {
    today: 'Today',
    this_month: 'This Month',
    previous_month: 'Previous Month',
    '3_months_ago': '3 Months Ago',
    '6_months_ago': '6 Months Ago',
    '1_year_ago': '1 Year Ago',
    all_time: 'All Time',
    '1M': '1 Month',
    '3M': '3 Months',
    '6M': '6 Months',
    '12M': '12 Months',
    '1Y': '1 Year',
    '24M': '24 Months',
    '2Y': '2 Years',
    ALL: 'All Time',
  };

  return {
    period,
    periodLabel: periodLabels[period] || period,
    currentSnapshot,
    baselineSnapshot: previousSnapshot,
    baselineDate: previousSnapshot ? (previousSnapshot.dateString || previousSnapshot.date || previousSnapshot.timestamp.slice(0, 10)) : 'No prior data',
    baselineNetWorth,
    currentNetWorth,
    netWorthChangeAmount: nwChange.changeAmount,
    netWorthChangePercentage: nwChange.changePercentage,
    isPositive: nwChange.isPositive,
    isPositiveGrowth: nwChange.isPositive,
    totalAssetsCurrent: currentAssets,
    currentAssets,
    totalAssetsBaseline: baselineAssets,
    baselineAssets,
    assetsChangeAmount: assetChange.changeAmount,
    assetsChangePercentage: assetChange.changePercentage,
    totalLiabilitiesCurrent: currentLiabilities,
    currentLiabilities,
    totalLiabilitiesBaseline: baselineLiabilities,
    baselineLiabilities,
    liabilitiesChangeAmount: liabilityChange.changeAmount,
    liabilitiesChangePercentage: liabilityChange.changePercentage,
    categoryContributions: {
      cashChange,
      bankChange,
      fdChange,
      walletChange,
      investmentChange,
      receivableChange,
      creditCardChange,
      payableChange,
      overdraftChange,
    },
    categoryBreakdown: {
      assets: {
        cash: currTotals.cash,
        banks: currTotals.banks,
        fixedDeposits: currTotals.fixedDeposits,
        wallets: currTotals.wallets,
        investments: currTotals.investments,
        receivables: currTotals.receivables,
      },
      liabilities: {
        creditCards: currTotals.creditCards,
        overdrafts: currTotals.overdrafts,
        payables: currTotals.payables,
      },
    },
    contributionsList,
  };
}

/**
 * Finds the most relevant historical snapshot for a given comparison period
 */
export function findSnapshotForPeriod(
  snapshots: FinancialSnapshot[],
  period: ComparisonPeriod,
  referenceDate: Date = new Date()
): FinancialSnapshot | null {
  if (!snapshots || snapshots.length === 0) return null;

  // Sort snapshots chronologically ascending
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const refTime = referenceDate.getTime();
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDate = referenceDate.getDate();

  switch (period) {
    case 'today': {
      // Find snapshot created at the beginning of today or earliest today
      const startOfToday = new Date(refYear, refMonth, refDate).getTime();
      const todaySnapshots = sorted.filter((s) => new Date(s.timestamp).getTime() >= startOfToday && new Date(s.timestamp).getTime() <= refTime);
      if (todaySnapshots.length > 0) return todaySnapshots[0];
      // Fallback: previous closest
      return sorted[sorted.length - 1] || null;
    }

    case 'this_month': {
      // Find snapshot at the start of current month (1st of month 00:00:00)
      const startOfMonth = new Date(refYear, refMonth, 1).getTime();
      const earlier = sorted.filter((s) => new Date(s.timestamp).getTime() <= startOfMonth);
      if (earlier.length > 0) return earlier[earlier.length - 1];
      return sorted[0];
    }

    case 'previous_month':
    case '1M': {
      // 1 month prior: End of previous month or ~30 days ago
      const targetDate = new Date(refYear, refMonth - 1, refDate);
      const targetTime = targetDate.getTime();
      return findClosestSnapshotBefore(sorted, targetTime, refTime);
    }

    case '3_months_ago':
    case '3M': {
      const targetDate = new Date(refYear, refMonth - 3, refDate);
      const targetTime = targetDate.getTime();
      return findClosestSnapshotBefore(sorted, targetTime, refTime);
    }

    case '6_months_ago':
    case '6M': {
      const targetDate = new Date(refYear, refMonth - 6, refDate);
      const targetTime = targetDate.getTime();
      return findClosestSnapshotBefore(sorted, targetTime, refTime);
    }

    case '1_year_ago':
    case '12M':
    case '1Y': {
      const targetDate = new Date(refYear - 1, refMonth, refDate);
      const targetTime = targetDate.getTime();
      return findClosestSnapshotBefore(sorted, targetTime, refTime);
    }

    case '24M':
    case '2Y': {
      const targetDate = new Date(refYear - 2, refMonth, refDate);
      const targetTime = targetDate.getTime();
      return findClosestSnapshotBefore(sorted, targetTime, refTime);
    }

    case 'all_time':
    case 'ALL':
    default: {
      return sorted[0] || null;
    }
  }
}

/**
 * Helper to find the closest snapshot immediately preceding or near targetTime
 */
function findClosestSnapshotBefore(sorted: FinancialSnapshot[], targetTime: number, maxTime: number): FinancialSnapshot | null {
  const candidates = sorted.filter((s) => new Date(s.timestamp).getTime() <= maxTime);
  if (candidates.length === 0) return null;

  // Filter candidates before or at target time
  const beforeTarget = candidates.filter((s) => new Date(s.timestamp).getTime() <= targetTime);
  if (beforeTarget.length > 0) {
    // Take the one closest to targetTime
    return beforeTarget[beforeTarget.length - 1];
  }

  // If no snapshot exists prior to targetTime, return oldest candidate
  return candidates[0];
}

/**
 * High-level comparison utility comparing current position against a specific period
 */
export function compareNetWorthWithPeriod(
  currentSnapshotOrInput: FinancialSnapshot | CalculationInput,
  snapshots: FinancialSnapshot[],
  period: ComparisonPeriod,
  referenceDate: Date = new Date()
): NetWorthComparisonResult {
  let currentSnapshot: FinancialSnapshot;

  if ('timestamp' in currentSnapshotOrInput) {
    currentSnapshot = currentSnapshotOrInput as FinancialSnapshot;
  } else {
    const rawData = createSnapshotDataFromInput(currentSnapshotOrInput as CalculationInput, {
      timestamp: referenceDate.toISOString(),
      label: 'Now',
    });
    currentSnapshot = {
      ...rawData,
      id: 'current_realtime',
    };
  }

  const baselineSnapshot = findSnapshotForPeriod(snapshots, period, referenceDate);
  return calculateSnapshotChange(currentSnapshot, baselineSnapshot, period);
}

/**
 * Month-over-Month (MoM) Financial Comparison Engine
 */
export function compareMonthOverMonth(
  snapshots: FinancialSnapshot[],
  currentSnapshotOrInput?: FinancialSnapshot | CalculationInput,
  referenceDate: Date = new Date()
): MonthOverMonthComparison {
  let currentSnapshot: FinancialSnapshot;

  if (currentSnapshotOrInput && 'timestamp' in currentSnapshotOrInput) {
    currentSnapshot = currentSnapshotOrInput as FinancialSnapshot;
  } else if (currentSnapshotOrInput) {
    const raw = createSnapshotDataFromInput(currentSnapshotOrInput as CalculationInput, {
      timestamp: referenceDate.toISOString(),
      label: 'Now',
    });
    currentSnapshot = { ...raw, id: 'current_mom' };
  } else {
    const sorted = [...(snapshots || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    currentSnapshot = sorted[0] || {
      id: 'fallback',
      timestamp: referenceDate.toISOString(),
      date: referenceDate.toISOString().slice(0, 10),
      dateString: 'Today',
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      totalCash: 0,
      totalBankBalance: 0,
      totalFixedDeposits: 0,
      totalWalletBalance: 0,
      totalInvestments: 0,
      totalReceivables: 0,
      totalCreditCardDue: 0,
      totalOverdraftLiabilities: 0,
      totalPayables: 0,
      totalIPOBlocked: 0,
    };
  }

  const prevMonthSnapshot = findSnapshotForPeriod(snapshots, 'previous_month', referenceDate);
  const comparison = calculateSnapshotChange(currentSnapshot, prevMonthSnapshot, 'previous_month');

  const currentMonthLabel = referenceDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const prevMonthDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
  const previousMonthLabel = prevMonthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  // Identify top positive driver and top negative driver
  const sortedByGrowth = [...comparison.contributionsList].sort((a, b) => b.impactOnNetWorth - a.impactOnNetWorth);
  const topGrowthCategory = sortedByGrowth.length > 0 && sortedByGrowth[0].impactOnNetWorth > 0 ? sortedByGrowth[0] : undefined;
  const topDeclineCategory = sortedByGrowth.length > 0 && sortedByGrowth[sortedByGrowth.length - 1].impactOnNetWorth < 0 ? sortedByGrowth[sortedByGrowth.length - 1] : undefined;

  return {
    currentMonthLabel,
    previousMonthLabel,
    currentSnapshot,
    previousSnapshot: prevMonthSnapshot,
    netWorthChange: comparison.netWorthChangeAmount,
    netWorthPercentageChange: comparison.netWorthChangePercentage,
    assetsChange: comparison.assetsChangeAmount,
    liabilitiesChange: comparison.liabilitiesChangeAmount,
    topGrowthCategory,
    topDeclineCategory,
    contributionsList: comparison.contributionsList,
  };
}

export interface HistoricalExtremes {
  highestNetWorth: { value: number; date: string; label?: string } | null;
  lowestNetWorth: { value: number; date: string; label?: string } | null;
  highestAssets: { value: number; date: string; label?: string } | null;
  highestLiabilities: { value: number; date: string; label?: string } | null;
  totalSnapshotsCount: number;
}

/**
 * Computes all-time peak, valley, highest asset and liability metrics from snapshot history
 */
export function calculateHistoricalExtremes(snapshots: FinancialSnapshot[]): HistoricalExtremes {
  if (!snapshots || snapshots.length === 0) {
    return {
      highestNetWorth: null,
      lowestNetWorth: null,
      highestAssets: null,
      highestLiabilities: null,
      totalSnapshotsCount: 0,
    };
  }

  let highestNw = -Infinity;
  let highestNwSnap: FinancialSnapshot | null = null;

  let lowestNw = Infinity;
  let lowestNwSnap: FinancialSnapshot | null = null;

  let highestAst = -Infinity;
  let highestAstSnap: FinancialSnapshot | null = null;

  let highestLiab = -Infinity;
  let highestLiabSnap: FinancialSnapshot | null = null;

  for (const snap of snapshots) {
    const nw = snap.netWorth !== undefined ? snap.netWorth : Number(snap.totalNetWorth || 0);
    const ast = Number(snap.totalAssets || 0);
    const liab = Number(snap.totalLiabilities || 0);

    if (nw > highestNw) {
      highestNw = nw;
      highestNwSnap = snap;
    }
    if (nw < lowestNw) {
      lowestNw = nw;
      lowestNwSnap = snap;
    }
    if (ast > highestAst) {
      highestAst = ast;
      highestAstSnap = snap;
    }
    if (liab > highestLiab) {
      highestLiab = liab;
      highestLiabSnap = snap;
    }
  }

  const formatDate = (s: FinancialSnapshot) => s.dateString || s.date || s.timestamp.slice(0, 10);

  return {
    highestNetWorth: highestNwSnap ? { value: highestNw, date: formatDate(highestNwSnap), label: highestNwSnap.label } : null,
    lowestNetWorth: lowestNwSnap ? { value: lowestNw, date: formatDate(lowestNwSnap), label: lowestNwSnap.label } : null,
    highestAssets: highestAstSnap ? { value: highestAst, date: formatDate(highestAstSnap), label: highestAstSnap.label } : null,
    highestLiabilities: highestLiabSnap ? { value: highestLiab, date: formatDate(highestLiabSnap), label: highestLiabSnap.label } : null,
    totalSnapshotsCount: snapshots.length,
  };
}

export interface PeriodGrowthStat {
  period: ComparisonPeriod;
  label: string;
  baselineValue: number | null;
  baselineDate: string | null;
  changeAmount: number | null;
  changePercentage: number | null;
  isPositive: boolean;
  hasData: boolean;
}

/**
 * Computes multi-period growth statistics (1M, 3M, 6M, 1Y, ALL)
 */
export function calculateMultiPeriodGrowth(
  currentNetWorth: number,
  snapshots: FinancialSnapshot[],
  referenceDate: Date = new Date()
): PeriodGrowthStat[] {
  const periods: { period: ComparisonPeriod; label: string }[] = [
    { period: '1M', label: '1 Month' },
    { period: '3M', label: '3 Months' },
    { period: '6M', label: '6 Months' },
    { period: '1Y', label: '1 Year' },
    { period: '24M', label: '24 Months' },
    { period: 'ALL', label: 'All Time' },
  ];

  return periods.map(({ period, label }) => {
    const baseline = findSnapshotForPeriod(snapshots, period, referenceDate);
    if (!baseline) {
      return {
        period,
        label,
        baselineValue: null,
        baselineDate: null,
        changeAmount: null,
        changePercentage: null,
        isPositive: true,
        hasData: false,
      };
    }

    const baselineVal = baseline.netWorth !== undefined ? baseline.netWorth : Number(baseline.totalNetWorth || 0);
    const { changeAmount, changePercentage, isPositive } = calculateNetWorthChange(currentNetWorth, baselineVal);
    const baselineDate = baseline.dateString || baseline.date || baseline.timestamp.slice(0, 10);

    return {
      period,
      label,
      baselineValue: baselineVal,
      baselineDate,
      changeAmount,
      changePercentage,
      isPositive,
      hasData: true,
    };
  });
}

export interface FinancialHealthMetrics {
  solvencyRatio: number; // Assets / (Assets + Liabilities) * 100
  debtToAssetRatio: number; // Liabilities / Assets * 100
  liquidCoveragePercentage: number; // (Cash + Bank + Wallet) / Liabilities * 100
  creditUtilizationRatio: number; // Credit card outstanding / total limit * 100
}

/**
 * Computes strictly factual financial ratios without subjective judgments
 */
export function calculateFinancialHealthMetrics(
  totalAssets: number,
  totalLiabilities: number,
  liquidFunds: number,
  totalCreditLimit: number,
  totalCreditOutstanding: number
): FinancialHealthMetrics {
  const totalBase = totalAssets + totalLiabilities;
  const solvencyRatio = totalBase > 0 ? Math.round((totalAssets / totalBase) * 1000) / 10 : 100;
  const debtToAssetRatio = totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 1000) / 10 : 0;
  const liquidCoveragePercentage = totalLiabilities > 0 ? Math.round((liquidFunds / totalLiabilities) * 1000) / 10 : 100;
  const creditUtilizationRatio = totalCreditLimit > 0 ? Math.round((totalCreditOutstanding / totalCreditLimit) * 1000) / 10 : 0;

  return {
    solvencyRatio,
    debtToAssetRatio,
    liquidCoveragePercentage,
    creditUtilizationRatio,
  };
}

// ============================================================================
// BANK AVERAGE BALANCE REQUIREMENT & COMPLIANCE ENGINE
// ============================================================================

export interface BankAverageBalanceStatus {
  monitoringEnabled: boolean;
  status: 'maintained' | 'deficit' | 'disabled' | 'no_requirement';
  requiredAmount: number;
  actualAmount: number;
  deficit: number;
  surplus: number;
  period: AverageBalancePeriod;
  periodLabel: string;
  source: AverageBalanceSource;
  hasAlert: boolean;
  alertMessage?: string;
  compliancePercentage: number;
  lastUpdated?: string;
}

/**
 * Strictly evaluates the Average Balance Requirement compliance for a given Bank Account.
 * Returns factual calculations, deficit amounts, and informational alert messages.
 */
export function getBankAccountAverageBalanceStatus(account: BankAccount): BankAverageBalanceStatus {
  const monitoringEnabled = Boolean(account.averageBalanceMonitoringEnabled);
  const requiredAmount = Number(
    account.averageBalanceRequirement ??
      account.requiredAverageBalance ??
      account.minimumBalanceRequirement ??
      0
  );
  const period: AverageBalancePeriod = account.averageBalancePeriod === 'quarterly' ? 'quarterly' : 'monthly';
  const periodLabel = period === 'quarterly' ? 'QAB (Quarterly Average Balance)' : 'MAB (Monthly Average Balance)';

  // If monitoring is disabled or no requirement configured
  if (!monitoringEnabled || requiredAmount <= 0) {
    const actualAmount = account.actualAverageBalance !== undefined ? Number(account.actualAverageBalance) : Number(account.balance || 0);
    return {
      monitoringEnabled,
      status: requiredAmount <= 0 ? 'no_requirement' : 'disabled',
      requiredAmount,
      actualAmount,
      deficit: 0,
      surplus: Math.max(0, actualAmount - requiredAmount),
      period,
      periodLabel,
      source: account.averageBalanceSource || 'manual',
      hasAlert: false,
      compliancePercentage: 100,
      lastUpdated: account.lastAverageBalanceUpdate || account.lastUpdated,
    };
  }

  // Active monitoring with configured requirement
  const actualAmount = account.actualAverageBalance !== undefined
    ? Number(account.actualAverageBalance)
    : Number(account.balance || 0);

  const source: AverageBalanceSource = account.averageBalanceSource || (account.actualAverageBalance !== undefined ? 'manual' : 'calculated');
  const deficit = Math.max(0, requiredAmount - actualAmount);
  const surplus = Math.max(0, actualAmount - requiredAmount);
  const isMaintained = actualAmount >= requiredAmount;
  const compliancePercentage = requiredAmount > 0
    ? Math.max(0, Math.min(100, Math.round((actualAmount / requiredAmount) * 100)))
    : 100;

  return {
    monitoringEnabled: true,
    status: isMaintained ? 'maintained' : 'deficit',
    requiredAmount,
    actualAmount,
    deficit,
    surplus,
    period,
    periodLabel,
    source,
    hasAlert: !isMaintained,
    alertMessage: !isMaintained
      ? 'Average balance appears below your configured requirement'
      : undefined,
    compliancePercentage,
    lastUpdated: account.lastAverageBalanceUpdate || account.lastUpdated,
  };
}

/**
 * Calculates time-weighted estimated average balance from recorded balance change history.
 * Fallback to current balance if insufficient historical samples exist.
 */
export function calculateEstimatedAverageBalanceFromHistory(
  account: BankAccount,
  balanceHistory: BalanceHistoryRecord[],
  period: AverageBalancePeriod = 'monthly',
  asOfDate: Date = new Date()
): {
  averageBalance: number;
  sampleCount: number;
  periodDays: number;
  startDate: string;
  endDate: string;
  method: 'daily_time_weighted' | 'single_balance_fallback';
} {
  const daysInPeriod = period === 'quarterly' ? 90 : 30;
  const endTime = asOfDate.getTime();
  const startTime = endTime - daysInPeriod * 24 * 60 * 60 * 1000;
  const startDateStr = new Date(startTime).toISOString().slice(0, 10);
  const endDateStr = asOfDate.toISOString().slice(0, 10);

  // Filter history for this specific account
  const accountHistory = (balanceHistory || [])
    .filter((h) => h.entityId === account.id && h.timestamp)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (accountHistory.length === 0) {
    return {
      averageBalance: Math.round(Number(account.balance || 0) * 100) / 100,
      sampleCount: 0,
      periodDays: daysInPeriod,
      startDate: startDateStr,
      endDate: endDateStr,
      method: 'single_balance_fallback',
    };
  }

  // Build timeline intervals within window
  let runningBalance = Number(account.balance || 0);
  // Find balance right before window starts if possible
  const priorRecords = accountHistory.filter((h) => new Date(h.timestamp).getTime() < startTime);
  if (priorRecords.length > 0) {
    runningBalance = Number(priorRecords[priorRecords.length - 1].newBalance);
  } else if (accountHistory.length > 0) {
    runningBalance = Number(accountHistory[0].previousBalance);
  }

  const windowRecords = accountHistory.filter((h) => {
    const t = new Date(h.timestamp).getTime();
    return t >= startTime && t <= endTime;
  });

  let totalWeightedBalance = 0;
  let lastTimestamp = startTime;

  for (const rec of windowRecords) {
    const recTime = new Date(rec.timestamp).getTime();
    const intervalDuration = Math.max(0, recTime - lastTimestamp);
    totalWeightedBalance += runningBalance * intervalDuration;
    runningBalance = Number(rec.newBalance);
    lastTimestamp = recTime;
  }

  // Add tail interval to end of window
  const finalDuration = Math.max(0, endTime - lastTimestamp);
  totalWeightedBalance += Number(account.balance || runningBalance) * finalDuration;

  const totalPeriodDuration = endTime - startTime;
  const calculatedAvg = totalPeriodDuration > 0
    ? totalWeightedBalance / totalPeriodDuration
    : Number(account.balance || 0);

  return {
    averageBalance: Math.round(calculatedAvg * 100) / 100,
    sampleCount: windowRecords.length,
    periodDays: daysInPeriod,
    startDate: startDateStr,
    endDate: endDateStr,
    method: 'daily_time_weighted',
  };
}


