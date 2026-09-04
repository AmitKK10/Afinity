import React from 'react';
import { cn } from '../../utils/cn';

interface FinancialCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'surface' | 'elevated' | 'glass' | 'highlight' | 'gradient';
  onClick?: () => void;
  hoverEffect?: boolean;
  glow?: 'blue' | 'emerald' | 'gold' | 'none';
  id?: string;
}

export const FinancialCard: React.FC<FinancialCardProps> = ({
  children,
  className,
  variant = 'surface',
  onClick,
  hoverEffect = false,
  glow = 'none',
  id,
}) => {
  const variantStyles = {
    surface: 'bg-white dark:bg-[#0f172a]/85 border-slate-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-none',
    elevated: 'bg-white dark:bg-[#141f36]/90 border-slate-200/90 dark:border-slate-700/60 shadow-md shadow-slate-200/50 dark:shadow-xl dark:shadow-black/30',
    glass: 'bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-slate-800/60 shadow-sm',
    highlight: 'bg-gradient-to-b from-cyan-50/70 to-white dark:from-slate-900/90 dark:to-[#0d1627] border-cyan-300/60 dark:border-cyan-500/30 shadow-md shadow-cyan-900/5 dark:shadow-lg dark:shadow-cyan-950/20',
    gradient: 'bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-[#121c33] dark:via-[#0f172a] dark:to-[#090e1a] border-slate-200 dark:border-slate-700/50 shadow-sm',
  };

  const glowStyles = {
    none: '',
    blue: 'hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.2)]',
    emerald: 'hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.2)]',
    gold: 'hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.2)]',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border p-4 sm:p-5 transition-all duration-300',
        variantStyles[variant],
        glowStyles[glow],
        hoverEffect && 'cursor-pointer hover:border-slate-600/80 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};
