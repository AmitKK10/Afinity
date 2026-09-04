import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actionText?: string;
  onActionClick?: () => void;
  className?: string;
  id?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actionText,
  onActionClick,
  className,
  id,
}) => {
  return (
    <div id={id} className={cn('flex items-center justify-between gap-4 mb-3 sm:mb-4', className)}>
      <div className="flex items-center gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white font-heading tracking-tight">
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 font-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actionText && (
        <button
          type="button"
          onClick={onActionClick}
          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors py-1 px-2 rounded-lg hover:bg-cyan-500/10 active:scale-95 cursor-pointer"
        >
          <span>{actionText}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
