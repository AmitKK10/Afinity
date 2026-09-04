import React, { useState, useEffect, useRef } from 'react';
import { Menu, Sparkles, RefreshCw, Lock, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import { AfinityLogo } from '../brand/AfinityLogo';
import { GlobalSearchBar } from './GlobalSearchBar';
import { useSecurity } from '../../context/SecurityContext';
import { useFinancialData } from '../../context/FinancialDataContext';
import { formatLastSyncedTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface TopHeaderProps {
  onOpenMenu: () => void;
  onQuickUpdateClick: () => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMenu,
  onQuickUpdateClick,
  title,
  subtitle,
  className,
}) => {
  const { isPasscodeConfigured, lockVault } = useSecurity();
  const { lastSyncedAt, isSyncing, refreshAllData, isOffline } = useFinancialData();
  const [, setTick] = useState<number>(0);
  const [justRefreshed, setJustRefreshed] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const prevLastSyncedRef = useRef<number | null>(lastSyncedAt ? new Date(lastSyncedAt).getTime() : null);

  // Re-calculate relative time every 15 seconds so "Just now" -> "15s ago" -> "1m ago" stays live
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Trigger rotating spinner animation whenever isSyncing is active or finishes
  useEffect(() => {
    if (isSyncing) {
      setIsSpinning(true);
    } else {
      const timer = setTimeout(() => {
        setIsSpinning(false);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isSyncing]);

  // Trigger rotating spinner animation whenever data is updated or fetched from local storage (lastSyncedAt changes)
  useEffect(() => {
    const currentTime = lastSyncedAt ? new Date(lastSyncedAt).getTime() : null;
    if (prevLastSyncedRef.current !== null && currentTime !== null && currentTime !== prevLastSyncedRef.current) {
      setIsSpinning(true);
      setJustRefreshed(true);
      const spinTimer = setTimeout(() => setIsSpinning(false), 900);
      const refreshTimer = setTimeout(() => setJustRefreshed(false), 2500);
      prevLastSyncedRef.current = currentTime;
      return () => {
        clearTimeout(spinTimer);
        clearTimeout(refreshTimer);
      };
    }
    prevLastSyncedRef.current = currentTime;
  }, [lastSyncedAt]);

  const handleManualSync = async () => {
    if (isSyncing || isSpinning) return;
    setIsSpinning(true);
    await refreshAllData();
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 2500);
  };

  const syncedText = formatLastSyncedTime(lastSyncedAt);
  const isSyncActive = isSyncing || isSpinning;

  return (
    <header
      id="afinity-top-header"
      className={cn(
        'sticky top-0 z-30 w-full bg-[#080c16]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3 transition-all pt-safe',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-6xl mx-auto">
        {/* Left Side: Brand Logo & Optional Page Title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <AfinityLogo size="sm" showWordmark={true} />

          {title && (
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white font-heading tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-[11px] text-slate-400 font-normal">{subtitle}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 flex justify-end md:justify-center max-w-xs md:max-w-sm lg:max-w-md mx-1 sm:mx-2">
          <GlobalSearchBar />
        </div>

        {/* Right Side: Sync Status Indicator, Quick Action & Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Last Synced Visual Status Indicator with Subtle Rotating Spinner */}
          <button
            type="button"
            id="top-header-last-synced-indicator"
            onClick={handleManualSync}
            disabled={isSyncActive}
            title={`Local Vault Storage: ${isOffline ? 'Offline IndexedDB' : 'Synchronized'}. Click to refresh from local storage.`}
            className={cn(
              'group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none active:scale-95',
              isSyncActive
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-950/50'
                : justRefreshed
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : isOffline
                ? 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 text-slate-300'
            )}
          >
            {/* Pulsing Live Status Dot / Checkmark */}
            <div className="relative flex items-center justify-center w-2.5 h-2.5 flex-shrink-0">
              {isSyncActive ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                </>
              ) : justRefreshed ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 animate-in zoom-in-50" />
              ) : isOffline ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                </>
              )}
            </div>

            {/* Status Label & Timestamp */}
            <div className="flex items-center gap-1 text-[11px] font-medium leading-none">
              <span className="hidden xs:inline text-slate-400 font-normal">
                {isSyncActive ? 'Syncing...' : justRefreshed ? 'Synced' : 'Last Synced:'}
              </span>
              <span
                className={cn(
                  'font-mono font-semibold',
                  isSyncActive
                    ? 'text-cyan-300'
                    : justRefreshed
                    ? 'text-emerald-400'
                    : isOffline
                    ? 'text-amber-300'
                    : 'text-slate-200 group-hover:text-cyan-300'
                )}
              >
                {isSyncActive ? 'Updating' : justRefreshed ? 'Just now' : syncedText}
              </span>
            </div>

            {/* Subtle Rotating Spinner Animation next to the 'Last Synced' timestamp */}
            <div
              className={cn(
                'flex items-center justify-center ml-0.5 transition-all duration-300',
                isSyncActive ? 'opacity-100 scale-105' : 'opacity-60 group-hover:opacity-100 group-hover:scale-105'
              )}
              aria-label={isSyncActive ? 'Fetching and updating local storage data' : 'Local storage sync status'}
            >
              <RefreshCw
                className={cn(
                  'w-3 h-3 transition-colors duration-300',
                  isSyncActive
                    ? 'animate-spin text-cyan-400'
                    : justRefreshed
                    ? 'text-emerald-400'
                    : 'text-slate-400 group-hover:text-cyan-300 group-hover:rotate-180 duration-500'
                )}
              />
            </div>
          </button>

          {/* Quick Lock Button if passcode is configured */}
          {isPasscodeConfigured && (
            <button
              type="button"
              id="top-header-lock-btn"
              onClick={lockVault}
              title="Lock Vault"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Quick Update Button on Mobile Header */}
          <button
            type="button"
            id="top-header-quick-update"
            onClick={onQuickUpdateClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-bold text-cyan-300 hover:text-white transition-all cursor-pointer font-heading active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Update</span>
          </button>

          {/* Menu Drawer Toggle Button */}
          <button
            type="button"
            id="top-header-menu-btn"
            onClick={onOpenMenu}
            aria-label="Open Secondary Menu"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
