export type NavigationTab = 'home' | 'accounts' | 'investments' | 'credit' | 'analysis';

export interface NavItemConfig {
  key: NavigationTab;
  label: string;
  path: string;
  iconName: string;
  badge?: string | number;
}

export type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export type QuickUpdateCategory = 
  | 'cash' 
  | 'bank' 
  | 'wallet' 
  | 'credit_card' 
  | 'investment' 
  | 'khatabook';
