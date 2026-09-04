/**
 * Afinity Android Home Screen Widget Data Service
 * Builds sanitized, real-time widget snapshots reusing the core financial calculation engine.
 * Never stores or exposes raw card numbers, CVVs, or account numbers.
 */

import {
  AfinityWidgetSnapshot,
  UpcomingCommitment,
  WidgetPaymentSafety,
  WidgetSyncSettings,
} from '../types/widget';
import {
  BankAccount,
  CreditCard,
  SIPRecord,
  PortfolioSummary,
  SIPSafetyReport,
} from '../types';
import {
  CreditPositionSummary,
  BankPositionSummary,
  calculateCardBillingCycle,
} from './calculations';
import { formatRupee } from '../utils/formatters';

export const WIDGET_STORAGE_KEY = 'afinity_widget_snapshot';
export const WIDGET_SETTINGS_KEY = 'afinity_widget_settings';

export const DEFAULT_WIDGET_SETTINGS: WidgetSyncSettings = {
  autoSyncEnabled: true,
  syncIntervalMinutes: 30,
  maskSensitiveValues: false,
  preferredCommitmentType: 'auto',
  lastSyncedAt: undefined,
};

/**
 * Strips any sensitive numbers (like card 16-digit or 4-digit numbers, account numbers)
 * from titles to guarantee widget privacy on Android home screens.
 */
function sanitizeTitle(raw: string, fallback: string): string {
  if (!raw || !raw.trim()) return fallback;
  // Remove 4-digit or longer sequences, card suffixes like "x1234", "...5678"
  return raw
    .replace(/[•\*\.xX-]*\d{4,}/g, '')
    .replace(/\s+/g, ' ')
    .trim() || fallback;
}

/**
 * Computes the soonest upcoming payment (SIP deduction or Credit Card due).
 */
export function findNextUpcomingCommitment(
  sips: SIPRecord[],
  creditCards: CreditCard[],
  preferredType: 'auto' | 'sip_only' | 'credit_only' = 'auto',
  refDate: Date = new Date()
): UpcomingCommitment | null {
  const commitments: UpcomingCommitment[] = [];
  const refTime = refDate.getTime();

  // 1. Process active SIPs
  if (preferredType === 'auto' || preferredType === 'sip_only') {
    const activeSIPs = (sips || []).filter((s) => s.status === 'active' || s.sipStatus === 'active');
    activeSIPs.forEach((sip) => {
      const amount = Number(sip.amount || 0);
      if (amount <= 0) return;

      // Determine next execution date
      const dayOfMonth = Math.min(31, Math.max(1, Number(sip.deductionDay || 1)));
      let nextDate = new Date(refDate.getFullYear(), refDate.getMonth(), dayOfMonth);
      if (nextDate.getTime() < refTime) {
        nextDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, dayOfMonth);
      }

      const diffDays = Math.ceil((nextDate.getTime() - refTime) / (1000 * 60 * 60 * 24));
      const badgeText =
        diffDays <= 0
          ? 'Due Today'
          : diffDays === 1
          ? 'Tomorrow'
          : `In ${diffDays} days`;

      commitments.push({
        type: 'sip',
        title: sanitizeTitle(sip.fundName || sip.name, 'Mutual Fund SIP'),
        amount,
        formattedAmount: formatRupee(amount),
        dueDate: nextDate.toISOString().split('T')[0],
        daysRemaining: Math.max(0, diffDays),
        badgeText,
        isDueSoon: diffDays <= 5,
        deepLinkRoute: '/investments',
        categoryLabel: 'NEXT UPCOMING SIP',
      });
    });
  }

  // 2. Process active Credit Cards with outstanding dues
  if (preferredType === 'auto' || preferredType === 'credit_only') {
    const activeCards = (creditCards || []).filter(
      (c) => c.status !== 'archived' && c.status !== 'closed'
    );

    activeCards.forEach((card) => {
      const outstanding = Number(card.outstandingBalance ?? card.outstanding ?? 0);
      if (outstanding <= 0) return;

      let dueDateObj: Date | null = null;
      if (card.dueDate) {
        dueDateObj = new Date(card.dueDate);
      } else if (card.billingCycleDate || card.statementDay) {
        const cycle = calculateCardBillingCycle(card, refDate);
        if (cycle.currentDueDate) {
          dueDateObj = new Date(cycle.currentDueDate);
        }
      }

      if (!dueDateObj || isNaN(dueDateObj.getTime())) {
        dueDateObj = new Date(refDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      }

      const diffDays = Math.ceil((dueDateObj.getTime() - refTime) / (1000 * 60 * 60 * 24));
      const badgeText =
        diffDays <= 0
          ? 'Due Today'
          : diffDays === 1
          ? 'Tomorrow'
          : `In ${diffDays} days`;

      const cardName = sanitizeTitle(
        `${card.issuer || card.bankName || ''} ${card.cardName || 'Credit Card'}`.trim(),
        'Credit Card Due'
      );

      commitments.push({
        type: 'credit_card',
        title: cardName,
        amount: outstanding,
        formattedAmount: formatRupee(outstanding),
        dueDate: dueDateObj.toISOString().split('T')[0],
        daysRemaining: Math.max(0, diffDays),
        badgeText,
        isDueSoon: diffDays <= 7,
        deepLinkRoute: '/credit',
        categoryLabel: 'CREDIT BILL DUE',
      });
    });
  }

  if (commitments.length === 0) return null;

  // Sort by earliest days remaining
  commitments.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return commitments[0];
}

/**
 * Computes deterministic payment safety based on current bank balance and upcoming obligations.
 */
export function calculateWidgetPaymentSafety(
  availableBankBalance: number,
  nextCommitment: UpcomingCommitment | null,
  creditPosition?: CreditPositionSummary,
  sipReport?: SIPSafetyReport
): WidgetPaymentSafety {
  if (!nextCommitment) {
    return {
      status: 'SAFE',
      label: 'ALL DUES CLEAR',
      description: 'No pending SIP deductions or credit card bills due.',
      colorHex: '#10B981',
    };
  }

  const immediateRequired = nextCommitment.amount;

  if (availableBankBalance <= 0 && immediateRequired > 0) {
    return {
      status: 'CRITICAL',
      label: 'ZERO BANK BALANCE',
      description: `Immediate shortfall of ${formatRupee(immediateRequired)} for upcoming payment.`,
      colorHex: '#F43F5E',
    };
  }

  if (availableBankBalance < immediateRequired) {
    const shortfall = immediateRequired - availableBankBalance;
    return {
      status: 'CRITICAL',
      label: 'SHORTFALL ALERT',
      description: `Need ${formatRupee(shortfall)} more to safely cover next due.`,
      colorHex: '#F43F5E',
    };
  }

  // If buffer is tight (less than 1.2x of upcoming payment)
  if (availableBankBalance < immediateRequired * 1.2) {
    return {
      status: 'WARNING',
      label: 'TIGHT LIQUIDITY',
      description: 'Bank balance covers next payment with very low remaining buffer.',
      colorHex: '#F59E0B',
    };
  }

  // Check if credit position utilization exceeds safe threshold (>75%)
  if (creditPosition && creditPosition.totalUtilization > 75) {
    return {
      status: 'CRITICAL',
      label: 'HIGH CREDIT RISK',
      description: `Credit card utilization is ${Math.round(creditPosition.totalUtilization)}%, exceeding safe thresholds.`,
      colorHex: '#F43F5E',
    };
  }

  // Check if SIP safety report indicates shortfall
  if (sipReport && sipReport.hasInsufficientBalance) {
    return {
      status: 'CRITICAL',
      label: 'SIP SHORTFALL',
      description: `One or more upcoming SIPs have insufficient linked bank balance.`,
      colorHex: '#F43F5E',
    };
  }

  return {
    status: 'SAFE',
    label: 'SAFE TO PAY',
    description: `Available bank balance (${formatRupee(availableBankBalance)}) safely covers upcoming dues.`,
    colorHex: '#10B981',
  };
}

/**
 * Builds the complete AfinityWidgetSnapshot from the active application state.
 */
export function generateLiveWidgetSnapshot(params: {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  sips: SIPRecord[];
  portfolioSummary: PortfolioSummary;
  creditPosition: CreditPositionSummary;
  bankPosition: BankPositionSummary;
  sipSafetyReport?: SIPSafetyReport;
  isDemoData: boolean;
  settings?: WidgetSyncSettings;
}): AfinityWidgetSnapshot {
  const {
    netWorth,
    totalAssets,
    totalLiabilities,
    bankAccounts = [],
    creditCards = [],
    sips = [],
    portfolioSummary,
    creditPosition,
    bankPosition,
    sipSafetyReport,
    isDemoData,
    settings = DEFAULT_WIDGET_SETTINGS,
  } = params;

  const availableBank = Math.max(0, Number(bankPosition?.totalPositiveAssets ?? bankPosition?.netBankBalance ?? 0));
  const investments = Math.max(0, Number(portfolioSummary?.investmentsTotal ?? 0));
  const creditDues = Math.max(0, Number(creditPosition?.totalOutstanding ?? creditPosition?.totalCreditLiability ?? 0));

  const nextCommitment = findNextUpcomingCommitment(
    sips,
    creditCards,
    settings.preferredCommitmentType
  );

  const paymentSafety = calculateWidgetPaymentSafety(
    availableBank,
    nextCommitment,
    creditPosition,
    sipSafetyReport
  );

  const now = new Date();

  return {
    version: 1,
    generatedAt: now.toISOString(),
    lastSyncedTimestamp: now.getTime(),
    isDemoData,
    currencySymbol: '₹',

    netWorth,
    formattedNetWorth: formatRupee(netWorth),
    formattedNetWorthCompact: formatRupee(netWorth, { compact: true }),

    totalAssets,
    formattedTotalAssets: formatRupee(totalAssets, { compact: true }),

    totalLiabilities,
    formattedTotalLiabilities: formatRupee(totalLiabilities, { compact: true }),

    availableBankBalance: availableBank,
    formattedBankBalance: formatRupee(availableBank),
    activeBankAccountsCount: bankAccounts.filter((b) => b.status === 'active').length,

    investmentValue: investments,
    formattedInvestmentValue: formatRupee(investments, { compact: true }),
    investmentGainPercentage: undefined,

    creditCardOutstanding: creditDues,
    formattedCreditOutstanding: formatRupee(creditDues),
    activeCardsCount: creditCards.filter((c) => c.status === 'active').length,

    nextCommitment,
    paymentSafety,

    deepLinks: {
      home: 'afinity://home',
      accounts: 'afinity://accounts',
      investments: 'afinity://investments',
      credit: 'afinity://credit',
      widgets: 'afinity://widgets',
    },
  };
}

/**
 * Returns a high-quality demonstration snapshot clearly marked as Demo Data.
 * Used for testing in the preview hub and initial Android widget display.
 */
export function generateSampleDemoSnapshot(): AfinityWidgetSnapshot {
  const now = new Date();
  return {
    version: 1,
    generatedAt: now.toISOString(),
    lastSyncedTimestamp: now.getTime(),
    isDemoData: true,
    currencySymbol: '₹',

    netWorth: 14850000,
    formattedNetWorth: '₹1,48,50,000',
    formattedNetWorthCompact: '₹1.48 Cr',

    totalAssets: 15280000,
    formattedTotalAssets: '₹1.53 Cr',

    totalLiabilities: 430000,
    formattedTotalLiabilities: '₹4.30 L',

    availableBankBalance: 385420,
    formattedBankBalance: '₹3,85,420',
    activeBankAccountsCount: 3,

    investmentValue: 14450000,
    formattedInvestmentValue: '₹1.44 Cr',
    investmentGainPercentage: 18.4,

    creditCardOutstanding: 42500,
    formattedCreditOutstanding: '₹42,500',
    activeCardsCount: 4,

    nextCommitment: {
      type: 'sip',
      title: 'Nifty 50 Index Fund',
      amount: 5000,
      formattedAmount: '₹5,000',
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      daysRemaining: 3,
      badgeText: 'In 3 days',
      isDueSoon: true,
      deepLinkRoute: '/investments',
      categoryLabel: 'NEXT UPCOMING SIP',
    },

    paymentSafety: {
      status: 'SAFE',
      label: 'SAFE TO PAY',
      description: 'Available bank balance safely covers upcoming SIPs and card dues.',
      colorHex: '#10B981',
    },

    deepLinks: {
      home: 'afinity://home',
      accounts: 'afinity://accounts',
      investments: 'afinity://investments',
      credit: 'afinity://credit',
      widgets: 'afinity://widgets',
    },
  };
}
