import React from 'react';
import {
  Building2,
  Banknote,
  Smartphone,
  BookOpen,
  Landmark,
  ChevronRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { FinancialAccount } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface AccountCardProps {
  account: FinancialAccount | any;
  onClick?: () => void;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'emerald' | 'blue' | 'cyan' | 'gold' | 'coral' | 'slate';
  className?: string;
  id?: string;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onClick,
  subtitle,
  badge,
  badgeVariant = 'slate',
  className,
  id,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bank':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'fd':
        return <Landmark className="w-4 h-4 text-emerald-400" />;
      case 'cash':
        return <Banknote className="w-4 h-4 text-amber-400" />;
      case 'wallet':
        return <Smartphone className="w-4 h-4 text-cyan-400" />;
      case 'receivable':
      case 'payable':
      case 'khatabook':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-400" />;
    }
  };

  const getIconContainerColor = (category: string) => {
    switch (category) {
      case 'bank': return 'bg-blue-500/15 border-blue-500/30';
      case 'fd': return 'bg-emerald-500/15 border-emerald-500/30';
      case 'cash': return 'bg-amber-500/15 border-amber-500/30';
      case 'wallet': return 'bg-cyan-500/15 border-cyan-500/30';
      case 'receivable':
      case 'payable':
      case 'khatabook': return 'bg-purple-500/15 border-purple-500/30';
      default: return 'bg-slate-800 border-slate-700';
    }
  };

  return (
    <div
      id={id || `account-card-${account.id}`}
      onClick={onClick}
      className={cn(
        'group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0f182d]/85 hover:bg-slate-50 dark:hover:bg-[#14203b] border border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 shadow-xs dark:shadow-md dark:shadow-black/20',
        onClick && 'cursor-pointer active:scale-[0.99]',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('p-2.5 rounded-xl border flex-shrink-0 transition-transform group-hover:scale-105', getIconContainerColor(account.category))}>
          {getCategoryIcon(account.category)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white truncate font-heading">
              {account.name || account.personName}
            </h4>
            {badge && (
              <Badge variant={badgeVariant} size="sm">
                {badge}
              </Badge>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal">
            {subtitle ||
              account.accountNumberMasked ||
              account.location ||
              account.institutionName ||
              account.reason ||
              'Account'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-3 text-right flex-shrink-0">
        <div>
          <MoneyDisplay
            amount={account.balance ?? account.amount ?? account.currentValue}
            size="md"
            colorOverride={account.category === 'payable' ? 'coral' : undefined}
          />
          {account.interestRate && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              {account.interestRate}% p.a.
            </p>
          )}
        </div>

        {onClick && (
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
    </div>
  );
};
