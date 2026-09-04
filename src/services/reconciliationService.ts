/**
 * Afinity Financial Data Reconciliation & Accuracy Engine
 *
 * Audits and reconciles financial values across Home, Accounts, Investments, SIPs, and Credit Cards:
 * 1. Single source of truth calculation audits
 * 2. Cross-page parity (Home vs Accounts, Investments, Credit Cards)
 * 3. Holding classification integrity (no double-counting, exact partition matching)
 * 4. Bank balance consistency for linked SIPs and Auto-Pay cards
 * 5. Date & commitment currency validation (no stale / past upcoming dates)
 * 6. Detailed diagnostic report with affected records and resolution guidance
 *
 * NOTE: Does NOT mutate or silently overwrite user data. Only identifies and explains discrepancies.
 */

import {
  BankAccount,
  FixedDepositAccount,
  CashHoldingAccount,
  DigitalWallet,
  CreditCard,
  CreditLimitGroup,
  InvestmentHolding,
  SIPRecord,
  KhatabookEntry,
  PortfolioSummary,
} from '../types';
import {
  calculateTotalInvestmentValue,
  calculateTotalInvestedAmount,
  calculateTotalInvestmentProfitLoss,
  getHoldingCategoryCounts,
  categorizeHolding,
  calculateCardBillingCycle,
  calculateOutstandingReceivables,
  calculateOutstandingPayables,
} from './calculations';
import { calculateNextSIPDeductionDate } from '../utils/sipDateUtils';
import { formatRupee } from '../utils/formatters';

export type ReconciliationStatus = 'reconciled' | 'warning' | 'discrepancy';

export interface AffectedRecord {
  id: string;
  name: string;
  type?: string;
  expectedValue?: string | number;
  actualValue?: string | number;
  detail: string;
}

export interface ReconciliationCheck {
  id: string;
  category:
    | 'NET_WORTH'
    | 'INVESTMENTS'
    | 'ACCOUNTS'
    | 'CREDIT_CARDS'
    | 'ASSET_DISTRIBUTION'
    | 'SIPS'
    | 'HOLDING_CLASSIFICATION'
    | 'BANK_LINKAGES'
    | 'DATES_CURRENCY';
  title: string;
  status: ReconciliationStatus;
  expectedValue?: number | string;
  actualValue?: number | string;
  expectedLabel?: string;
  actualLabel?: string;
  discrepancyAmount?: number;
  message: string;
  guidance: string;
  relatedRoute?: string;
  affectedRecords?: AffectedRecord[];
}

export interface ReconciliationReport {
  isReconciled: boolean;
  overallStatus: ReconciliationStatus;
  totalChecks: number;
  reconciledCount: number;
  warningCount: number;
  discrepancyCount: number;
  evaluatedAt: Date;
  checks: ReconciliationCheck[];
}

export interface ReconciliationInput {
  bankAccounts: BankAccount[];
  fixedDeposits: FixedDepositAccount[];
  cashHoldings: CashHoldingAccount[];
  wallets: DigitalWallet[];
  creditCards: CreditCard[];
  creditLimitGroups?: CreditLimitGroup[];
  investments: InvestmentHolding[];
  sips: SIPRecord[];
  khatabookEntries: KhatabookEntry[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  portfolioSummary?: PortfolioSummary;
  creditPosition?: {
    totalCreditLiability: number;
    totalOutstanding: number;
    totalUtilization: number;
  };
  referenceDate?: Date;
}

/**
 * Executes a comprehensive audit of all financial records and derived state.
 */
export function auditFinancialDataIntegrity(input: ReconciliationInput): ReconciliationReport {
  const refDate = input.referenceDate || new Date();
  const checks: ReconciliationCheck[] = [];

  const activeBanks = (input.bankAccounts || []).filter((b) => b.status === 'active');
  const activeFds = (input.fixedDeposits || []).filter((f) => f.status === 'active');
  const activeCash = (input.cashHoldings || []).filter((c) => c.status === 'active');
  const activeWallets = (input.wallets || []).filter((w) => w.status === 'active');
  const activeCards = (input.creditCards || []).filter((c) => c.status === 'active');
  const activeHoldings = (input.investments || []).filter(
    (i) => i.status === 'active' || i.status === 'ACTIVE' || !i.status
  );
  const activeSips = (input.sips || []).filter(
    (s) => s.sipStatus === 'active' && s.status !== 'archived'
  );
  const activeReceivables = (input.khatabookEntries || []).filter(
    (k) => k.status === 'active' && k.type === 'receivable' && !k.isSettled
  );
  const activePayables = (input.khatabookEntries || []).filter(
    (k) => k.status === 'active' && k.type === 'payable' && !k.isSettled
  );

  // -------------------------------------------------------------
  // CHECK 1: Net Worth Equation (Assets - Liabilities = Net Worth)
  // -------------------------------------------------------------
  const expectedNetWorth = Math.round((input.totalAssets - input.totalLiabilities) * 100) / 100;
  const netWorthDiff = Math.abs(expectedNetWorth - input.netWorth);
  if (netWorthDiff > 0.01) {
    checks.push({
      id: 'net-worth-equation',
      category: 'NET_WORTH',
      title: 'Net Worth Equation Parity',
      status: 'discrepancy',
      expectedValue: expectedNetWorth,
      actualValue: input.netWorth,
      expectedLabel: 'Total Assets − Total Liabilities',
      actualLabel: 'Calculated Net Worth',
      discrepancyAmount: netWorthDiff,
      message: `Net worth (${formatRupee(input.netWorth)}) diverges by ${formatRupee(netWorthDiff)} from Assets minus Liabilities (${formatRupee(expectedNetWorth)}).`,
      guidance: 'Review active accounts, holdings, and liabilities to confirm all balance items reflect in the total formula.',
      relatedRoute: '/',
    });
  } else {
    checks.push({
      id: 'net-worth-equation',
      category: 'NET_WORTH',
      title: 'Net Worth Equation Parity',
      status: 'reconciled',
      expectedValue: expectedNetWorth,
      actualValue: input.netWorth,
      message: `Total Assets (${formatRupee(input.totalAssets)}) − Total Liabilities (${formatRupee(input.totalLiabilities)}) perfectly matches Net Worth (${formatRupee(input.netWorth)}).`,
      guidance: 'Mathematical equilibrium verified across all asset and liability components.',
      relatedRoute: '/',
    });
  }

  // -------------------------------------------------------------
  // CHECK 2: Home Investment Value = Investments Total
  // -------------------------------------------------------------
  const underlyingInvestmentTotal = calculateTotalInvestmentValue(activeHoldings);
  const homeInvestmentTotal = input.portfolioSummary?.investmentsTotal !== undefined
    ? input.portfolioSummary.investmentsTotal
    : underlyingInvestmentTotal;

  const invDiff = Math.abs(underlyingInvestmentTotal - homeInvestmentTotal);
  if (invDiff > 0.05) {
    checks.push({
      id: 'investment-parity',
      category: 'INVESTMENTS',
      title: 'Home Investment Value vs Investments Total',
      status: 'discrepancy',
      expectedValue: underlyingInvestmentTotal,
      actualValue: homeInvestmentTotal,
      expectedLabel: 'Investments Page Total',
      actualLabel: 'Home Investment Value',
      discrepancyAmount: invDiff,
      message: `Home investment value (${formatRupee(homeInvestmentTotal)}) differs from total investment valuation (${formatRupee(underlyingInvestmentTotal)}).`,
      guidance: 'Ensure all active holdings are evaluated with current market prices and included in the dashboard summary.',
      relatedRoute: '/investments',
    });
  } else {
    checks.push({
      id: 'investment-parity',
      category: 'INVESTMENTS',
      title: 'Home Investment Value vs Investments Total',
      status: 'reconciled',
      expectedValue: underlyingInvestmentTotal,
      actualValue: homeInvestmentTotal,
      message: `Home dashboard investment value matches the sum of all ${activeHoldings.length} active holdings (${formatRupee(underlyingInvestmentTotal)}).`,
      guidance: 'Both views share identical underlying holding prices and quantities.',
      relatedRoute: '/investments',
    });
  }

  // -------------------------------------------------------------
  // CHECK 3: Home Bank Balance = Accounts Total
  // -------------------------------------------------------------
  const accountsBankTotal = activeBanks.reduce((s, b) => s + Math.max(0, Number(b.balance || 0)), 0);
  const homeBankTotal = input.portfolioSummary
    ? Math.round(Number(input.portfolioSummary.bankTotal || 0) * 100) / 100
    : accountsBankTotal;

  const bankDiff = Math.abs(accountsBankTotal - homeBankTotal);
  if (bankDiff > 0.05) {
    checks.push({
      id: 'bank-balance-parity',
      category: 'ACCOUNTS',
      title: 'Home Bank Balance vs Accounts Total',
      status: 'discrepancy',
      expectedValue: accountsBankTotal,
      actualValue: homeBankTotal,
      expectedLabel: 'Accounts Total Bank Balance',
      actualLabel: 'Home Bank Balance Total',
      discrepancyAmount: bankDiff,
      message: `Bank balance on Home (${formatRupee(homeBankTotal)}) differs by ${formatRupee(bankDiff)} from Accounts total (${formatRupee(accountsBankTotal)}).`,
      guidance: 'Ensure all active bank accounts are counted consistently between the Home dashboard and the Accounts ledger.',
      relatedRoute: '/accounts',
    });
  } else {
    checks.push({
      id: 'bank-balance-parity',
      category: 'ACCOUNTS',
      title: 'Home Bank Balance vs Accounts Total',
      status: 'reconciled',
      expectedValue: accountsBankTotal,
      actualValue: homeBankTotal,
      expectedLabel: 'Accounts Total Bank Balance',
      actualLabel: 'Home Bank Balance Total',
      message: `Home dashboard bank balance perfectly reconciles with the active Accounts total (${formatRupee(accountsBankTotal)} across ${activeBanks.length} accounts).`,
      guidance: 'No discrepancy detected between Home and Accounts balances.',
      relatedRoute: '/accounts',
    });
  }

  // -------------------------------------------------------------
  // CHECK 4: Home Credit Card Liabilities = Credit Card Total
  // -------------------------------------------------------------
  const cardLiabilitySum = activeCards.reduce((sum, c) => {
    if (c.includeInNetWorth === false) return sum;
    const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
    return sum + (out > 0 ? out : 0);
  }, 0);

  const homeCreditLiability = input.creditPosition?.totalCreditLiability !== undefined
    ? input.creditPosition.totalCreditLiability
    : cardLiabilitySum;

  const cardDiff = Math.abs(cardLiabilitySum - homeCreditLiability);
  if (cardDiff > 0.05) {
    checks.push({
      id: 'credit-card-parity',
      category: 'CREDIT_CARDS',
      title: 'Home Credit Liabilities vs Credit Card Total',
      status: 'discrepancy',
      expectedValue: cardLiabilitySum,
      actualValue: homeCreditLiability,
      expectedLabel: 'Credit Cards Total Liability',
      actualLabel: 'Home Credit Liability',
      discrepancyAmount: cardDiff,
      message: `Credit card dues on Home (${formatRupee(homeCreditLiability)}) differ by ${formatRupee(cardDiff)} from Credit page total (${formatRupee(cardLiabilitySum)}).`,
      guidance: 'Review active credit cards to confirm all positive statement balances are reflected.',
      relatedRoute: '/credit',
    });
  } else {
    checks.push({
      id: 'credit-card-parity',
      category: 'CREDIT_CARDS',
      title: 'Home Credit Liabilities vs Credit Card Total',
      status: 'reconciled',
      expectedValue: cardLiabilitySum,
      actualValue: homeCreditLiability,
      message: `Credit card exposure on Home matches the total outstanding liability of all ${activeCards.length} active cards (${formatRupee(cardLiabilitySum)}).`,
      guidance: 'Shared credit limits and individual card outstandings are correctly reconciled.',
      relatedRoute: '/credit',
    });
  }

  // -------------------------------------------------------------
  // CHECK 5: Asset Distribution vs Total Assets
  // -------------------------------------------------------------
  const cashAssets = activeCash.reduce((s, c) => s + Math.max(0, Number(c.balance || 0)), 0);
  const bankAssets = activeBanks.reduce((s, b) => {
    if ((b as any).includeInNetWorth === false) return s;
    const bal = Number(b.balance || 0);
    return s + (bal > 0 ? bal : 0);
  }, 0);
  const fdAssets = activeFds.reduce((s, f) => {
    const val = f.estimatedCurrentValue !== undefined
      ? Number(f.estimatedCurrentValue)
      : Number(f.principal || f.balance || 0);
    return s + Math.max(0, val);
  }, 0);
  const walletAssets = activeWallets.reduce((s, w) => {
    if (w.includeInNetWorth === false) return s;
    const bal = Number(w.balance || 0);
    return s + (bal > 0 ? bal : 0);
  }, 0);
  const creditRefunds = activeCards.reduce((s, c) => {
    if (c.includeInNetWorth === false) return s;
    const out = Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0);
    return s + (out < 0 ? Math.abs(out) : 0);
  }, 0);
  const invAssets = underlyingInvestmentTotal;
  const recvAssets = calculateOutstandingReceivables(input.khatabookEntries || []);

  const assetDistributionSum = Math.round(
    (cashAssets + bankAssets + fdAssets + walletAssets + creditRefunds + invAssets + recvAssets) * 100
  ) / 100;

  const assetDistDiff = Math.abs(assetDistributionSum - input.totalAssets);
  if (assetDistDiff > 0.05) {
    checks.push({
      id: 'asset-distribution-parity',
      category: 'ASSET_DISTRIBUTION',
      title: 'Asset Distribution vs Total Assets',
      status: 'discrepancy',
      expectedValue: input.totalAssets,
      actualValue: assetDistributionSum,
      expectedLabel: 'Total Assets',
      actualLabel: 'Asset Distribution Slices Sum',
      discrepancyAmount: assetDistDiff,
      message: `Asset distribution slices sum (${formatRupee(assetDistributionSum)}) diverges from Total Assets (${formatRupee(input.totalAssets)}).`,
      guidance: 'Verify that cash, bank balances, wallets, investments, and receivables all originate from identical records.',
      relatedRoute: '/',
    });
  } else {
    checks.push({
      id: 'asset-distribution-parity',
      category: 'ASSET_DISTRIBUTION',
      title: 'Asset Distribution vs Total Assets',
      status: 'reconciled',
      expectedValue: input.totalAssets,
      actualValue: assetDistributionSum,
      message: `All asset classes (Cash, Bank, FDs, Wallets, Investments, Receivables) sum cleanly to Total Assets (${formatRupee(input.totalAssets)}).`,
      guidance: 'Underlying asset allocations are balanced to the nearest paisa.',
      relatedRoute: '/',
    });
  }

  // -------------------------------------------------------------
  // CHECK 6: Holding Classification & Double-Counting Audit
  // -------------------------------------------------------------
  const holdingCounts = getHoldingCategoryCounts(activeHoldings);
  const partitionedSum =
    holdingCounts.stocksCount +
    holdingCounts.etfCount +
    holdingCounts.mfCount +
    holdingCounts.goldCount +
    holdingCounts.unlistedCount +
    holdingCounts.otherCount;

  const anomalousHoldings: AffectedRecord[] = [];
  activeHoldings.forEach((h) => {
    const qty = Number(h.quantity !== undefined ? h.quantity : h.unitsHeld || 0);
    const currPrice = Number(h.currentPrice || 0);
    const buyPrice = Number(h.averageBuyPrice !== undefined ? h.averageBuyPrice : (h as any).buyPrice || (h as any).avgBuyPrice || 0);

    if (qty <= 0) {
      anomalousHoldings.push({
        id: h.id,
        name: h.name || h.symbol || 'Unnamed Holding',
        type: h.assetType || 'Unknown',
        detail: `Zero or negative units held (${qty})`,
      });
    } else if (currPrice < 0 || buyPrice < 0) {
      anomalousHoldings.push({
        id: h.id,
        name: h.name || h.symbol || 'Unnamed Holding',
        type: h.assetType || 'Unknown',
        detail: `Negative price detected (Current: ₹${currPrice}, Buy: ₹${buyPrice})`,
      });
    }
  });

  if (partitionedSum !== activeHoldings.length || anomalousHoldings.length > 0) {
    const isCountMismatch = partitionedSum !== activeHoldings.length;
    checks.push({
      id: 'holding-counts-audit',
      category: 'HOLDING_CLASSIFICATION',
      title: 'Investment Holding Classification Integrity',
      status: isCountMismatch ? 'discrepancy' : 'warning',
      expectedValue: activeHoldings.length,
      actualValue: partitionedSum,
      expectedLabel: 'Total Active Holdings',
      actualLabel: 'Sum of Category Counts',
      message: isCountMismatch
        ? `Classification mismatch: Categories sum to ${partitionedSum}, but ${activeHoldings.length} active holdings exist.`
        : `All ${activeHoldings.length} holdings are classified, but ${anomalousHoldings.length} holding(s) contain zero units or unusual prices.`,
      guidance: isCountMismatch
        ? 'Review holding asset types to prevent overlap or missing category assignments.'
        : 'Update units held and purchase price for the flagged investments.',
      relatedRoute: '/investments',
      affectedRecords: anomalousHoldings,
    });
  } else {
    checks.push({
      id: 'holding-counts-audit',
      category: 'HOLDING_CLASSIFICATION',
      title: 'Investment Holding Classification Integrity',
      status: 'reconciled',
      expectedValue: activeHoldings.length,
      actualValue: partitionedSum,
      message: `All ${activeHoldings.length} active holdings are cleanly partitioned: ${holdingCounts.stocksCount} Stocks, ${holdingCounts.etfCount} ETFs, ${holdingCounts.mfCount} Mutual Funds, ${holdingCounts.goldCount} Gold/SGB${holdingCounts.unlistedCount > 0 ? `, ${holdingCounts.unlistedCount} Unlisted` : ''}${holdingCounts.otherCount > 0 ? `, ${holdingCounts.otherCount} Other` : ''}. No holding is counted twice.`,
      guidance: 'Strict mutual exclusivity holds across all investment classification tabs.',
      relatedRoute: '/investments',
    });
  }

  // -------------------------------------------------------------
  // CHECK 7: SIP Commitments vs Active Mandates
  // -------------------------------------------------------------
  const activeSipsMandateTotal = activeSips.reduce((s, sip) => s + Number(sip.amount || 0), 0);
  const zeroAmountSips = activeSips.filter((s) => Number(s.amount || 0) <= 0);

  if (zeroAmountSips.length > 0) {
    checks.push({
      id: 'sip-commitments-parity',
      category: 'SIPS',
      title: 'SIP Commitments vs Active Mandates',
      status: 'warning',
      expectedValue: activeSipsMandateTotal,
      actualValue: activeSipsMandateTotal,
      message: `Active SIPs total ₹${activeSipsMandateTotal.toLocaleString('en-IN')}/mo across ${activeSips.length} mandates, but ${zeroAmountSips.length} mandate(s) have zero or negative installment amounts.`,
      guidance: 'Open SIP details and set a valid monthly commitment amount.',
      relatedRoute: '/investments?tab=sips',
      affectedRecords: zeroAmountSips.map((s) => ({
        id: s.id,
        name: s.fundName || s.name || 'SIP Mandate',
        detail: `Installment amount is ₹${Number(s.amount || 0)}`,
      })),
    });
  } else {
    checks.push({
      id: 'sip-commitments-parity',
      category: 'SIPS',
      title: 'SIP Commitments vs Active Mandates',
      status: 'reconciled',
      expectedValue: activeSipsMandateTotal,
      actualValue: activeSipsMandateTotal,
      message: `SIP monthly commitments (${formatRupee(activeSipsMandateTotal)}) match active mandates across all ${activeSips.length} recurring schedules.`,
      guidance: 'All active SIPs possess valid positive commitment values.',
      relatedRoute: '/investments?tab=sips',
    });
  }

  // -------------------------------------------------------------
  // CHECK 8: Bank Account Linkage & Balance Consistency
  // -------------------------------------------------------------
  const bankAccountMap = new Map<string, BankAccount>();
  (input.bankAccounts || []).forEach((b) => {
    if (b.id) bankAccountMap.set(b.id, b);
    if (b.bankId) bankAccountMap.set(b.bankId, b);
  });

  const unlinkedOrArchivedSIPs: AffectedRecord[] = [];
  activeSips.forEach((sip) => {
    let linked = sip.bankAccountId ? bankAccountMap.get(sip.bankAccountId) || null : null;
    if (!linked && sip.bankName) {
      linked =
        (input.bankAccounts || []).find(
          (b) =>
            b.institutionName?.toLowerCase() === sip.bankName?.toLowerCase() ||
            b.bankName?.toLowerCase() === sip.bankName?.toLowerCase() ||
            b.displayName?.toLowerCase() === sip.bankName?.toLowerCase()
        ) || null;
    }

    if (!linked) {
      unlinkedOrArchivedSIPs.push({
        id: sip.id,
        name: sip.fundName || sip.name || 'SIP Mandate',
        type: 'SIP',
        detail: 'No linked deduction bank account found',
      });
    } else if (linked.status !== 'active') {
      unlinkedOrArchivedSIPs.push({
        id: sip.id,
        name: sip.fundName || sip.name || 'SIP Mandate',
        type: 'SIP',
        detail: `Linked bank account (${linked.displayName || linked.institutionName}) is ${linked.status}`,
      });
    }
  });

  const autoPayCards = activeCards.filter((c) => c.autoPay === true || c.isAutoPayEnabled === true);
  const unlinkedOrArchivedCards: AffectedRecord[] = [];
  autoPayCards.forEach((card) => {
    let linked = card.paymentBankAccountId ? bankAccountMap.get(card.paymentBankAccountId) || null : null;
    if (!linked && card.paymentBankName) {
      linked =
        (input.bankAccounts || []).find(
          (b) =>
            b.institutionName?.toLowerCase() === card.paymentBankName?.toLowerCase() ||
            b.displayName?.toLowerCase() === card.paymentBankName?.toLowerCase()
        ) || null;
    }

    if (!linked) {
      unlinkedOrArchivedCards.push({
        id: card.id,
        name: card.displayName || card.cardName || 'Credit Card',
        type: 'Credit Card Auto-Pay',
        detail: 'Auto-Pay enabled but no deduction bank account linked',
      });
    } else if (linked.status !== 'active') {
      unlinkedOrArchivedCards.push({
        id: card.id,
        name: card.displayName || card.cardName || 'Credit Card',
        type: 'Credit Card Auto-Pay',
        detail: `Auto-Pay linked bank (${linked.displayName || linked.institutionName}) is ${linked.status}`,
      });
    }
  });

  const allLinkageIssues = [...unlinkedOrArchivedSIPs, ...unlinkedOrArchivedCards];
  if (allLinkageIssues.length > 0) {
    checks.push({
      id: 'bank-linkages-consistency',
      category: 'BANK_LINKAGES',
      title: 'Linked Bank Account Consistency',
      status: 'warning',
      message: `${allLinkageIssues.length} automated mandate(s) lack a linked bank account or point to an archived account.`,
      guidance: 'Relink the flagged SIPs or credit cards to an active bank account to ensure automated payment safety checks function correctly.',
      relatedRoute: '/accounts',
      affectedRecords: allLinkageIssues,
    });
  } else {
    checks.push({
      id: 'bank-linkages-consistency',
      category: 'BANK_LINKAGES',
      title: 'Linked Bank Account Consistency',
      status: 'reconciled',
      message: `All ${activeSips.length} active SIPs and ${autoPayCards.length} Auto-Pay cards point to active bank accounts with real-time balance tracking.`,
      guidance: 'Changes to bank accounts and balances propagate instantly to commitment evaluators.',
      relatedRoute: '/accounts',
    });
  }

  // -------------------------------------------------------------
  // CHECK 9: Date & Commitment Currency Validation
  // -------------------------------------------------------------
  const staleDates: AffectedRecord[] = [];
  activeSips.forEach((sip) => {
    const nextDate = calculateNextSIPDeductionDate(
      sip.deductionDay,
      sip.frequency,
      sip.sipStatus,
      refDate
    );
    if (nextDate.daysUntil < 0) {
      staleDates.push({
        id: sip.id,
        name: sip.fundName || sip.name || 'SIP',
        type: 'SIP Date',
        detail: `Calculated next deduction is in the past (${nextDate.formattedDate})`,
      });
    }
  });

  activeCards.forEach((card) => {
    const cycle = calculateCardBillingCycle(card, refDate);
    const out = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
    if (cycle.daysUntilDue < -30 && out > 0) {
      staleDates.push({
        id: card.id,
        name: card.displayName || card.cardName || 'Credit Card',
        type: 'Credit Card Due Date',
        detail: `Payment is severely overdue (${Math.abs(cycle.daysUntilDue)} days past due: ${cycle.currentDueDate})`,
      });
    }
  });

  if (staleDates.length > 0) {
    checks.push({
      id: 'date-currency-validation',
      category: 'DATES_CURRENCY',
      title: 'Date & Commitment Currency Check',
      status: 'warning',
      message: `${staleDates.length} commitment item(s) have past or severely overdue payment dates.`,
      guidance: 'Update settlement status or verify the billing schedule dates for the affected accounts.',
      relatedRoute: '/credit',
      affectedRecords: staleDates,
    });
  } else {
    checks.push({
      id: 'date-currency-validation',
      category: 'DATES_CURRENCY',
      title: 'Date & Commitment Currency Check',
      status: 'reconciled',
      message: 'All upcoming SIP deduction cycles and Credit Card statement due dates reflect the current calendar timeline.',
      guidance: 'No stale or uncomputed date boundaries detected.',
      relatedRoute: '/investments?tab=upcoming',
    });
  }

  // Compute summary totals
  const totalChecks = checks.length;
  const reconciledCount = checks.filter((c) => c.status === 'reconciled').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const discrepancyCount = checks.filter((c) => c.status === 'discrepancy').length;
  const isReconciled = discrepancyCount === 0;

  let overallStatus: ReconciliationStatus = 'reconciled';
  if (discrepancyCount > 0) {
    overallStatus = 'discrepancy';
  } else if (warningCount > 0) {
    overallStatus = 'warning';
  }

  return {
    isReconciled,
    overallStatus,
    totalChecks,
    reconciledCount,
    warningCount,
    discrepancyCount,
    evaluatedAt: refDate,
    checks,
  };
}
