import { DashboardCardId, DashboardCardDefinition, DashboardPresetKey, UserSettings } from '../types';

export const ALL_DASHBOARD_CARDS: DashboardCardDefinition[] = [
  {
    id: 'quick_financial_snapshot',
    title: 'Quick Financial Snapshot',
    subtitle: 'Glanceable PWA widget: Net worth, bank, investments, credit & payment safety',
    description: 'Compact, glanceable home widget showing live Net Worth, Bank Balance, Investments, Credit Dues, Next Commitment, and Payment Safety status.',
    category: 'core',
    badge: 'PWA Widget',
    defaultVisible: true,
  },
  {
    id: 'financial_health_summary',
    title: 'Financial Health Summary',
    subtitle: 'High-level assets, liabilities, net worth, liquidity & returns',
    description: 'Executive overview displaying Total Assets, Total Liabilities, Net Worth, Available Cash, Investment Value, and Overall P/L.',
    category: 'core',
    badge: 'Executive Top',
    defaultVisible: true,
  },
  {
    id: 'net_worth_hero',
    title: 'Net Worth Overview Hero',
    subtitle: 'Live portfolio valuation & period change',
    description: 'Displays current total net worth, growth trend delta over chosen period, quick update trigger, and vault sync status.',
    category: 'core',
    badge: 'Core Hero',
    defaultVisible: true,
  },
  {
    id: 'safe_cash_commitments',
    title: 'Available Cash After Commitments',
    subtitle: 'Active bank liquidity minus upcoming SIPs & credit card dues',
    description: 'Calculates bank balance minus upcoming SIP commitments and credit card dues, showing your safe unencumbered cash.',
    category: 'core',
    badge: 'Safety Reserve',
    defaultVisible: true,
  },
  {
    id: 'action_required',
    title: 'Action Required Alerts',
    subtitle: 'Immediate shortfalls, upcoming dues, and liquidity warnings',
    description: 'Compact alert hub highlighting credit card shortfalls, SIP payment deficits, MAB warnings, and critical due dates.',
    category: 'core',
    badge: 'Action Radar',
    defaultVisible: true,
  },
  {
    id: 'upcoming_30_days',
    title: 'Upcoming 30 Days Timeline',
    subtitle: 'Chronological timeline of SIPs & credit card dues',
    description: 'Unified chronological schedule showing due dates, linked bank balances, and real-time payment safety coverage.',
    category: 'accounts',
    badge: 'Due Timeline',
    defaultVisible: true,
  },
  {
    id: 'quick_actions',
    title: 'Quick Vault Actions',
    subtitle: 'Rapid balance updates & shortcuts',
    description: 'Instant action buttons to record cash, transfer between banks, log Khatabook entries, and trigger live market sync.',
    category: 'core',
    badge: 'Fast Actions',
    defaultVisible: true,
  },
  {
    id: 'asset_liability_grid',
    title: 'Assets & Liabilities Grid',
    subtitle: 'Structural breakdown by financial category',
    description: 'Detailed cards for Cash, Bank Accounts, Wallets, Mutual Funds & Stocks, Receivables, Credit Cards, and Payables.',
    category: 'breakdown',
    badge: 'Breakdown',
    defaultVisible: true,
  },
  {
    id: 'asset_distribution',
    title: 'Asset Class Distribution Donut',
    subtitle: 'Visual portfolio allocation & percentage weights',
    description: 'Interactive donut chart breaking down portfolio composition across Liquid Cash, Banks, Equities/MFs, and Gold.',
    category: 'analytics',
    badge: 'Donut Chart',
    defaultVisible: true,
  },
  {
    id: 'net_worth_trend',
    title: 'Growth Trajectory Chart',
    subtitle: 'Historical net worth progression over time',
    description: 'Area graph plotting net worth and asset growth against recorded timeline snapshots and milestones.',
    category: 'analytics',
    badge: 'Trend Graph',
    defaultVisible: true,
  },
  {
    id: 'investments_summary',
    title: 'Investment Portfolio Preview',
    subtitle: 'Market valuation, day gain & top holdings',
    description: 'Live performance summary of mutual funds, stocks, US equities, Gold, and active IPO bids with unrealized gain/loss.',
    category: 'accounts',
    badge: 'Investments',
    defaultVisible: true,
  },
  {
    id: 'credit_cards_summary',
    title: 'Credit Cards & Dues Exposure',
    subtitle: 'Live balance, limit utilization & due dates',
    description: 'Command view of credit card liabilities, statement payment deadlines, and shared bank limit pool allocations.',
    category: 'accounts',
    badge: 'Liabilities',
    defaultVisible: true,
  },
  {
    id: 'bank_accounts_summary',
    title: 'Primary Bank Accounts',
    subtitle: 'Checking, savings & institutional balances',
    description: 'Quick-access cards displaying primary operating bank account balances and linked fixed deposits.',
    category: 'accounts',
    badge: 'Liquidity',
    defaultVisible: true,
  },
  {
    id: 'khatabook_widget',
    title: 'Dues & Receivables Ledger',
    subtitle: 'Active receivables & payables balance',
    description: 'Summary widget for peer-to-peer lending, dues to collect, payable obligations, and instant settlement tools.',
    category: 'breakdown',
    badge: 'Ledger',
    defaultVisible: true,
  },
];

export const DEFAULT_DASHBOARD_ORDER: DashboardCardId[] = [
  'quick_financial_snapshot',
  'financial_health_summary',
  'action_required',
  'safe_cash_commitments',
  'net_worth_hero',
  'upcoming_30_days',
  'quick_actions',
  'asset_liability_grid',
  'asset_distribution',
  'net_worth_trend',
  'investments_summary',
  'credit_cards_summary',
  'bank_accounts_summary',
  'khatabook_widget',
];

export interface DashboardPreset {
  key: DashboardPresetKey;
  label: string;
  description: string;
  cardOrder: DashboardCardId[];
  hiddenCards: DashboardCardId[];
}

export const DASHBOARD_PRESETS: DashboardPreset[] = [
  {
    key: 'balanced',
    label: 'Command Center (Default)',
    description: 'Comprehensive financial command center with health summary, payment safety, action alerts, and timeline.',
    cardOrder: [
      'quick_financial_snapshot',
      'financial_health_summary',
      'action_required',
      'safe_cash_commitments',
      'net_worth_hero',
      'upcoming_30_days',
      'quick_actions',
      'asset_liability_grid',
      'asset_distribution',
      'net_worth_trend',
      'investments_summary',
      'credit_cards_summary',
      'bank_accounts_summary',
      'khatabook_widget',
    ],
    hiddenCards: [],
  },
  {
    key: 'investor',
    label: 'Investor Focus',
    description: 'Prioritizes portfolio market valuation, asset class allocation donuts, trajectory graphs, and equity returns.',
    cardOrder: [
      'quick_financial_snapshot',
      'financial_health_summary',
      'net_worth_hero',
      'investments_summary',
      'asset_distribution',
      'net_worth_trend',
      'safe_cash_commitments',
      'action_required',
      'upcoming_30_days',
      'asset_liability_grid',
      'bank_accounts_summary',
      'credit_cards_summary',
      'khatabook_widget',
      'quick_actions',
    ],
    hiddenCards: [],
  },
  {
    key: 'cashflow',
    label: 'Cashflow & Dues Focus',
    description: 'Brings credit card payment deadlines, bank account balances, and Khatabook receivables to the forefront.',
    cardOrder: [
      'quick_financial_snapshot',
      'financial_health_summary',
      'action_required',
      'safe_cash_commitments',
      'upcoming_30_days',
      'credit_cards_summary',
      'bank_accounts_summary',
      'net_worth_hero',
      'khatabook_widget',
      'quick_actions',
      'asset_liability_grid',
      'asset_distribution',
      'net_worth_trend',
      'investments_summary',
    ],
    hiddenCards: [],
  },
  {
    key: 'minimal',
    label: 'Minimalist Essentials',
    description: 'Clean, distraction-free view containing only the Financial Health Summary, Net Worth Hero, and safe cash.',
    cardOrder: [
      'quick_financial_snapshot',
      'financial_health_summary',
      'action_required',
      'safe_cash_commitments',
      'net_worth_hero',
      'upcoming_30_days',
      'quick_actions',
      'asset_liability_grid',
      'asset_distribution',
      'net_worth_trend',
      'investments_summary',
      'credit_cards_summary',
      'bank_accounts_summary',
      'khatabook_widget',
    ],
    hiddenCards: [
      'asset_distribution',
      'net_worth_trend',
      'investments_summary',
      'credit_cards_summary',
      'bank_accounts_summary',
      'khatabook_widget',
      'upcoming_30_days',
    ],
  },
];

/**
 * Resolves the active card order and hidden set from user settings,
 * ensuring backwards compatibility and handling newly added card IDs cleanly.
 */
export function getResolvedDashboardLayout(settings?: UserSettings): {
  cardOrder: DashboardCardId[];
  hiddenCards: Set<DashboardCardId>;
  visibleCards: DashboardCardId[];
  preset: DashboardPresetKey;
} {
  const customOrder = settings?.dashboardCardOrder;
  const customHidden = settings?.hiddenDashboardCards || [];
  const preset = settings?.dashboardPreset || 'balanced';

  let order: DashboardCardId[] = [];

  if (Array.isArray(customOrder) && customOrder.length > 0) {
    // Preserve saved order and append any missing card IDs from defaults
    const validSaved = customOrder.filter((id) =>
      DEFAULT_DASHBOARD_ORDER.includes(id)
    );
    const missing = DEFAULT_DASHBOARD_ORDER.filter(
      (id) => !validSaved.includes(id)
    );
    // If quick_financial_snapshot is new/missing, prepend it for prominent home widget glance
    if (missing.includes('quick_financial_snapshot')) {
      order = ['quick_financial_snapshot', ...validSaved, ...missing.filter((id) => id !== 'quick_financial_snapshot')];
    } else {
      order = [...validSaved, ...missing];
    }
  } else {
    order = [...DEFAULT_DASHBOARD_ORDER];
  }

  const hiddenSet = new Set<DashboardCardId>(
    customHidden.filter((id) => DEFAULT_DASHBOARD_ORDER.includes(id))
  );

  const visibleCards = order.filter((id) => !hiddenSet.has(id));

  return {
    cardOrder: order,
    hiddenCards: hiddenSet,
    visibleCards,
    preset,
  };
}

export function getCardDefinition(id: DashboardCardId): DashboardCardDefinition {
  const found = ALL_DASHBOARD_CARDS.find((c) => c.id === id);
  if (found) return found;
  return {
    id,
    title: id.replace(/_/g, ' '),
    subtitle: '',
    description: '',
    category: 'core',
    badge: 'Card',
    defaultVisible: true,
  };
}
