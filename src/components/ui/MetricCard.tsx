import React from 'react';
import { LucideIcon } from 'lucide-react';
import { FinancialCard } from './FinancialCard';
import { MoneyDisplay } from './MoneyDisplay';
import { ChangeIndicator } from './ChangeIndicator';
import { cn } from '../../utils/cn';

interface MetricCardProps {
  title: string;
  amount: number;
  icon?: LucideIcon;
  iconColor?: 'blue' | 'emerald' | 'gold' | 'coral' | 'purple' | 'slate';
  changeAmount?: number;
  changePercentage?: number;
  changeLabel?: string;
  subtext?: string;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
  id?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  amount,
  icon: Icon,
  iconColor = 'blue',
  changeAmount,
  changePercentage,
  changeLabel,
  subtext,
  onClick,
  compact = false,
  className,
  id,
}) => {
  const iconColorClasses = {
    blue: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    gold: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    coral: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    slate: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
  };

  return (
    <FinancialCard
      id={id}
      hoverEffect={!!onClick}
      onClick={onClick}
      className={cn('flex flex-col justify-between overflow-hidden', className)}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-heading">
          {title}
        </span>
        {Icon && (
          <div className={cn('p-2 rounded-xl border flex-shrink-0', iconColorClasses[iconColor])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <MoneyDisplay amount={amount} size={compact ? 'lg' : 'xl'} />

        {(changeAmount !== undefined || changePercentage !== undefined) && (
          <div className="mt-1">
            <ChangeIndicator
              amount={changeAmount}
              percentage={changePercentage}
              label={changeLabel}
              size="sm"
            />
          </div>
        )}

        {subtext && (
          <span className="text-xs text-slate-400 mt-1 font-normal">
            {subtext}
          </span>
        )}
      </div>
    </FinancialCard>
  );
};
