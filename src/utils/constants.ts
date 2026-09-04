import { NavItemConfig, TimePeriod } from '../types/navigation';

export const APP_NAME = 'Afinity';
export const APP_TAGLINE = 'Track • Analyze • Grow';

export const TIME_PERIODS: { key: TimePeriod; label: string }[] = [
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: 'ALL', label: 'ALL' },
];

export const PRIMARY_NAV_ITEMS: NavItemConfig[] = [
  { key: 'home', label: 'Home', path: '/', iconName: 'LayoutDashboard' },
  { key: 'accounts', label: 'Accounts', path: '/accounts', iconName: 'WalletCards' },
  { key: 'investments', label: 'Investments', path: '/investments', iconName: 'TrendingUp' },
  { key: 'credit', label: 'Credit', path: '/credit', iconName: 'CreditCard' },
  { key: 'analysis', label: 'Analysis', path: '/analysis', iconName: 'PieChart' },
];

export const SECONDARY_NAV_ITEMS = [
  { key: 'sips', label: 'SIPs & Payment Safety', iconName: 'Calendar', desc: 'Monthly SIP mandates & bank balance safety' },
  { key: 'pdf_export', label: 'PDF Export Statement', iconName: 'FileText', desc: 'Print-ready statements with P&L, tables & totals' },
  { key: 'cash', label: 'Cash & Denominations', iconName: 'Banknote', desc: 'Physical cash & notes in locker' },
  { key: 'banks', label: 'Banks & Fixed Deposits', iconName: 'Building2', desc: 'Savings accounts & FD deposits' },
  { key: 'wallets', label: 'Digital Wallets', iconName: 'Smartphone', desc: 'Paytm, Amazon Pay, PhonePe' },
  { key: 'khatabook', label: 'Dues & Receivables', iconName: 'BookOpen', desc: 'Receivables & payables ledger' },
  { key: 'ipo', label: 'IPO Tracker', iconName: 'Sparkles', desc: 'Blocked amounts & allotment status' },
  { key: 'widgets', label: 'Android Home Widgets', iconName: 'Smartphone', desc: 'Live net worth & dues on your phone home screen' },
  { key: 'snapshots', label: 'Historical Snapshots', iconName: 'History', desc: 'Time-travel net worth logs' },
  { key: 'import_data', label: 'Import Financial Data', iconName: 'UploadCloud', desc: 'Import JSON backups & CSV ledgers' },
  { key: 'backup', label: 'Data & Backup', iconName: 'Database', desc: 'Export JSON, master CSV backups' },
  { key: 'settings', label: 'Preferences & Security', iconName: 'Settings', desc: 'Currency, PIN lock, Theme' },
];
