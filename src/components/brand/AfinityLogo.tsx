import React from 'react';
import { cn } from '../../utils/cn';

interface AfinityLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AfinityLogo: React.FC<AfinityLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showTagline = false,
  className,
  onClick,
}) => {
  if (size === 'xl') {
    // For XL / Splash Screen: Render the complete transparent logo asset with preserved proportions
    return (
      <div
        id="afinity-brand-logo-xl"
        onClick={onClick}
        className={cn(
          'flex flex-col items-center justify-center select-none cursor-pointer isolate',
          className
        )}
      >
        <img
          src="/logo.svg"
          alt="Afinity — Track • Analyze • Grow"
          className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const iconSizes = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-14 h-14',
    xl: 'w-48 h-48',
  };

  const titleSizes = {
    sm: 'text-lg sm:text-xl',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div
      id="afinity-brand-logo"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2.5 select-none cursor-pointer isolate',
        className
      )}
    >
      {/* Exact Afinity Icon Emblem Asset with Transparent Background */}
      <div className="flex-shrink-0 flex items-center justify-center">
        <img
          src="/icon.svg"
          alt="Afinity Brand Logo"
          className={cn('object-contain flex-shrink-0', iconSizes[size])}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Brand Text & Tagline */}
      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center">
            <span
              className={cn(
                'font-extrabold tracking-tight text-white flex items-center font-heading leading-none',
                titleSizes[size]
              )}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 mr-[1px]">
                A
              </span>
              finity
            </span>
          </div>

          {showTagline && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                TRACK
              </span>
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              <span className="text-[9px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                ANALYZE
              </span>
              <span className="w-1 h-1 rounded-full bg-amber-400" />
              <span className="text-[9px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                GROW
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
