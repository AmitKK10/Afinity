import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
}) => {
  const variantStyles = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    card: 'rounded-2xl p-5 border border-slate-800/80',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-800/60',
        variantStyles[variant],
        className
      )}
    />
  );
};
