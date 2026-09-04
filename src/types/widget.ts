/**
 * Afinity Android Home Screen Widget Type Definitions
 */

export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetPaymentSafety {
  status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'NEUTRAL';
  label: string; // e.g. "SAFE TO PAY", "LOW BALANCE ALERT", "ALL CLEAR"
  description: string;
  colorHex: string; // e.g. "#10B981", "#F59E0B", "#F43F5E"
}

export interface UpcomingCommitment {
  type: 'sip' | 'credit_card';
  title: string; // Sanitized, e.g. "Nifty 50 Index Fund" or "HDFC Regalia Bill"
  amount: number;
  formattedAmount: string;
  dueDate: string; // YYYY-MM-DD
  daysRemaining: number;
  badgeText: string; // "In 3 days", "Due Today", "Tomorrow"
  isDueSoon: boolean;
  deepLinkRoute: string; // e.g. "/investments" or "/credit"
  categoryLabel: string; // "NEXT UPCOMING SIP" or "CREDIT BILL DUE"
}

export interface AfinityWidgetSnapshot {
  version: number;
  generatedAt: string;
  lastSyncedTimestamp: number;
  isDemoData: boolean;
  currencySymbol: string;

  // 1. Net Worth & Balance Totals
  netWorth: number;
  formattedNetWorth: string;
  formattedNetWorthCompact: string;

  totalAssets: number;
  formattedTotalAssets: string;

  totalLiabilities: number;
  formattedTotalLiabilities: string;

  // 2. Core Portfolios
  availableBankBalance: number;
  formattedBankBalance: string;
  activeBankAccountsCount: number;

  investmentValue: number;
  formattedInvestmentValue: string;
  investmentGainPercentage?: number;

  creditCardOutstanding: number;
  formattedCreditOutstanding: string;
  activeCardsCount: number;

  // 3. Upcoming Commitment
  nextCommitment: UpcomingCommitment | null;

  // 4. Payment Safety Status
  paymentSafety: WidgetPaymentSafety;

  // 5. Deep Link Navigation Mappings
  deepLinks: {
    home: string;
    accounts: string;
    investments: string;
    credit: string;
    widgets: string;
  };
}

export interface WidgetSyncSettings {
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number; // 15, 30, 60, 120
  maskSensitiveValues: boolean; // Hide figures with '••••••' for privacy
  preferredCommitmentType: 'auto' | 'sip_only' | 'credit_only';
  lastSyncedAt?: string;
}
