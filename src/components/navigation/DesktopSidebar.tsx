import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  WalletCards,
  TrendingUp,
  CreditCard,
  PieChart,
  Plus,
  Banknote,
  Building2,
  Smartphone,
  BookOpen,
  Sparkles,
  Settings,
  Database,
  History,
  ShieldCheck,
  Lock,
  RefreshCw,
  UploadCloud,
  FileText,
  Calendar,
} from 'lucide-react';
import { AfinityLogo } from '../brand/AfinityLogo';
import { useSecurity } from '../../context/SecurityContext';
import { useFinancialData } from '../../context/FinancialDataContext';
import { formatLastSyncedTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface DesktopSidebarProps {
  onQuickUpdateClick: () => void;
  onOpenSecondaryModal?: (key: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  onQuickUpdateClick,
  onOpenSecondaryModal,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPasscodeConfigured, lockVault } = useSecurity();
  const { lastSyncedAt, isOffline, isSyncing } = useFinancialData();
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const prevSyncedRef = useRef<number | null>(lastSyncedAt ? new Date(lastSyncedAt).getTime() : null);

  useEffect(() => {
    if (isSyncing) {
      setIsSpinning(true);
    } else {
      const timer = setTimeout(() => setIsSpinning(false), 750);
      return () => clearTimeout(timer);
    }
  }, [isSyncing]);

  useEffect(() => {
    const cur = lastSyncedAt ? new Date(lastSyncedAt).getTime() : null;
    if (prevSyncedRef.current !== null && cur !== null && cur !== prevSyncedRef.current) {
      setIsSpinning(true);
      const timer = setTimeout(() => setIsSpinning(false), 900);
      prevSyncedRef.current = cur;
      return () => clearTimeout(timer);
    }
    prevSyncedRef.current = cur;
  }, [lastSyncedAt]);

  const isSyncActive = isSyncing || isSpinning;

  const mainNav = [
    { key: 'home', label: 'Home Dashboard', path: '/', icon: LayoutDashboard },
    { key: 'accounts', label: 'Accounts & Cash', path: '/accounts', icon: WalletCards },
    { key: 'investments', label: 'Investments & MFs', path: '/investments', icon: TrendingUp },
    { key: 'credit', label: 'Credit Cards', path: '/credit', icon: CreditCard },
    { key: 'analysis', label: 'Portfolio Analytics', path: '/analysis', icon: PieChart },
  ];

  const secondaryNav = [
    { key: 'sips', label: 'SIPs & Payment Safety', path: '/investments?tab=sips', icon: Calendar },
    { key: 'pdf_export', label: 'PDF Export Statement', icon: FileText },
    { key: 'cash', label: 'Cash Denominations', icon: Banknote },
    { key: 'khatabook', label: 'Dues & Receivables', icon: BookOpen },
    { key: 'ipo', label: 'IPO Tracker', icon: Sparkles },
    { key: 'widgets', label: 'Android Widgets', path: '/widgets', icon: Smartphone },
    { key: 'snapshots', label: 'Historical Snapshots', icon: History },
    { key: 'import_data', label: 'Import Financial Data', icon: UploadCloud },
    { key: 'backup', label: 'Data & Backup', icon: Database },
    { key: 'settings', label: 'Preferences & Security', icon: Settings },
  ];

  return (
    <aside
      id="afinity-desktop-sidebar"
      className="hidden md:flex flex-col w-64 lg:w-72 bg-[#090e1b] border-r border-slate-800/80 p-5 h-screen sticky top-0 flex-shrink-0 z-30 select-none"
    >
      {/* Brand Logo Header */}
      <div className="pb-6 border-b border-slate-800/80">
        <AfinityLogo
          size="md"
          showWordmark
          showTagline
          onClick={() => navigate('/')}
        />
      </div>

      {/* Quick Action Button */}
      <div className="my-5">
        <button
          type="button"
          id="sidebar-quick-update-btn"
          onClick={onQuickUpdateClick}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer font-heading"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Quick Update</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2 font-heading">
            Primary Vault
          </span>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.key}
                  type="button"
                  id={`sidebar-nav-${item.key}`}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left font-heading',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Tools & Modules */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2 font-heading">
            Tools & Ledgers
          </span>
          <div className="space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (item.key === 'sips') {
                      navigate('/investments?tab=sips');
                    } else if (item.key === 'cash') {
                      navigate('/cash-denominations');
                    } else if (item.key === 'khatabook') {
                      navigate('/dues-receivables');
                    } else if (item.key === 'ipo') {
                      navigate('/ipo-tracker');
                    } else if (item.key === 'snapshots') {
                      navigate('/analysis');
                    } else {
                      onOpenSecondaryModal?.(item.key);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors cursor-pointer text-left"
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / User Vault Indicator & Lock */}
      <div className="pt-4 border-t border-slate-800/80 mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenSecondaryModal?.('settings')}
          className="flex-1 flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:scale-105 transition-transform">
            AF
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate font-heading group-hover:text-cyan-300">
              Personal Vault
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium truncate">
              {isSyncActive ? (
                <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400 flex-shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              )}
              <span className="truncate">
                {isSyncActive ? 'Syncing...' : `Synced ${formatLastSyncedTime(lastSyncedAt)}`}
              </span>
            </div>
          </div>
        </button>

        {isPasscodeConfigured && (
          <button
            type="button"
            onClick={lockVault}
            title="Lock Financial Vault Now"
            className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 transition-all cursor-pointer flex-shrink-0"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
