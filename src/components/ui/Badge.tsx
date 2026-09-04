import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'blue' | 'cyan' | 'gold' | 'coral' | 'slate' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className,
  id,
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    gold: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    coral: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    outline: 'bg-transparent text-slate-300 border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-normal',
  };

  return (
    <span
      id={id}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border whitespace-nowrap select-none font-heading',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};
