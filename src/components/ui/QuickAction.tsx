import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface QuickActionProps {
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  iconColor?: 'blue' | 'emerald' | 'gold' | 'coral' | 'purple' | 'cyan';
  onClick: () => void;
  variant?: 'card' | 'pill' | 'compact';
  badge?: string;
  className?: string;
  id?: string;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  label,
  sublabel,
  icon: Icon,
  iconColor = 'blue',
  onClick,
  variant = 'card',
  badge,
  className,
  id,
}) => {
  const iconColorStyles = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30 group-hover:bg-blue-500/25',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500/25',
    gold: 'bg-amber-500/15 text-amber-300 border-amber-500/30 group-hover:bg-amber-500/25',
    coral: 'bg-rose-500/15 text-rose-400 border-rose-500/30 group-hover:bg-rose-500/25',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30 group-hover:bg-purple-500/25',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 group-hover:bg-cyan-500/25',
  };

  if (variant === 'pill') {
    return (
      <button
        id={id}
        type="button"
        onClick={onClick}
        className={cn(
          'group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 active:scale-95 cursor-pointer shadow-xs',
          className
        )}
      >
        <div className={cn('p-1 rounded-lg border transition-colors', iconColorStyles[iconColor])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#121c31] dark:to-[#0c1322] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 hover:bg-slate-50 dark:hover:from-[#172440] dark:hover:to-[#0f182b] transition-all duration-200 text-center active:scale-95 shadow-sm dark:shadow-md dark:shadow-black/20 cursor-pointer w-full',
        className
      )}
    >
      {badge && (
        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
          {badge}
        </span>
      )}
      <div className={cn('p-2.5 rounded-xl border mb-2 transition-transform duration-200 group-hover:scale-110', iconColorStyles[iconColor])}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white transition-colors font-heading">
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
          {sublabel}
        </span>
      )}
    </button>
  );
};
