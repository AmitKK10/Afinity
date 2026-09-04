import React, { useState } from 'react';
import {
  Wallet,
  RefreshCw,
  MoreVertical,
  Edit2,
  Archive,
  History,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  User,
  Check,
  ArrowLeftRight,
  Trash2,
} from 'lucide-react';
import { DigitalWallet } from '../../types';

interface WalletCardProps {
  wallet: DigitalWallet;
  onTransfer?: (wallet: DigitalWallet) => void;
  onUpdateBalance: (wallet: DigitalWallet) => void;
  onViewHistory: (wallet: DigitalWallet) => void;
  onEdit: (wallet: DigitalWallet) => void;
  onArchive: (wallet: DigitalWallet) => void;
  onRestore?: (wallet: DigitalWallet) => void;
  onDelete?: (wallet: DigitalWallet) => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  onTransfer,
  onUpdateBalance,
  onViewHistory,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const balance = Number(wallet.balance || 0);
  const isNegative = balance < 0;
  const isArchived = wallet.status === 'archived' || wallet.status === 'closed';
  const isIncludedInNetWorth = wallet.includeInNetWorth !== false;

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: wallet.currency || 'INR',
      maximumFractionDigits: 2,
    }).format(Math.abs(val));
  };

  // Provider branding styling & premium initials
  const getProviderConfig = (provider?: string, walletType?: string, providerName?: string) => {
    const p = (provider || '').toLowerCase();
    const t = (walletType || '').toLowerCase();
    const pn = (providerName || '').toLowerCase();

    if (p.includes('amazon') || pn.includes('amazon')) {
      return {
        bgGradient: 'from-amber-950/40 via-neutral-900 to-neutral-950',
        borderColor: 'border-amber-500/30 hover:border-amber-500/50',
        accentColor: '#f59e0b',
        initialsBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20',
        initials: 'AP',
        brandName: 'Amazon Pay',
      };
    }
    if (p.includes('paytm') || pn.includes('paytm')) {
      return {
        bgGradient: 'from-sky-950/40 via-neutral-900 to-neutral-950',
        borderColor: 'border-sky-500/30 hover:border-sky-500/50',
        accentColor: '#0ea5e9',
        initialsBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-500/20',
        initials: 'PT',
        brandName: 'Paytm',
      };
    }
    if (p.includes('phonepe') || pn.includes('phonepe')) {
      return {
        bgGradient: 'from-purple-950/40 via-neutral-900 to-neutral-950',
        borderColor: 'border-purple-500/30 hover:border-purple-500/50',
        accentColor: '#8b5cf6',
        initialsBg: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20',
        initials: 'PP',
        brandName: 'PhonePe',
      };
    }
    if (p.includes('mobikwik') || pn.includes('mobikwik')) {
      return {
        bgGradient: 'from-blue-950/40 via-neutral-900 to-neutral-950',
        borderColor: 'border-blue-500/30 hover:border-blue-500/50',
        accentColor: '#3b82f6',
        initialsBg: 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-blue-500/20',
        initials: 'MK',
        brandName: 'MobiKwik',
      };
    }
    if (p.includes('bajaj') || pn.includes('bajaj')) {
      return {
        bgGradient: 'from-blue-950/40 via-neutral-900 to-neutral-950',
        borderColor: 'border-blue-500/30 hover:border-blue-500/50',
        accentColor: '#2563eb',
        initialsBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20',
        initials: 'BF',
        brandName: 'Bajaj Finserv',
      };
    }
    if (p.includes('sbi') || pn.includes('sbi')) {
      return {
        bgGradient: 'from-cyan-950/40 via-neutral-900 to-neutral-950',
        borderColor: 'border-cyan-500/30 hover:border-cyan-500/50',
        accentColor: '#06b6d4',
        initialsBg: 'bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-cyan-500/20',
        initials: 'SC',
        brandName: 'SBI Cashback',
      };
    }
    if (t.includes('cashback')) {
      return {
        bgGradient: 'from-emerald-950/40 via-neutral-900 to-neutral-950',
        borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
        accentColor: '#10b981',
        initialsBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20',
        initials: 'CB',
        brandName: wallet.providerName || 'Cashback Balance',
      };
    }

    // Default Custom Wallet
    const customInitials = (wallet.name || 'CW')
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return {
      bgGradient: 'from-neutral-900 via-neutral-900 to-neutral-950',
      borderColor: 'border-neutral-800 hover:border-neutral-700',
      accentColor: '#10b981',
      initialsBg: 'bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-teal-500/20',
      initials: customInitials || 'CW',
      brandName: wallet.providerName || wallet.institutionName || 'Digital Wallet',
    };
  };

  const config = getProviderConfig(wallet.provider, wallet.walletType, wallet.providerName);

  // Normalize wallet type label
  const getWalletTypeLabel = (type?: string) => {
    if (!type) return 'Digital Wallet';
    const norm = type.toUpperCase();
    if (norm === 'CASHBACK') return 'Cashback';
    if (norm === 'STORED_VALUE') return 'Stored Value';
    if (norm === 'SHOPPING') return 'Shopping';
    if (norm === 'PREPAID') return 'Prepaid';
    if (norm === 'CUSTOM') return 'Custom';
    return 'Digital Wallet';
  };

  // Format owner label
  const getOwnerLabel = (owner?: string) => {
    if (!owner) return 'Self';
    const o = owner.toUpperCase();
    if (o === 'SELF') return 'Self';
    if (o === 'PARENT') return 'Parent';
    if (o === 'OTHER') return 'Other';
    return owner;
  };

  return (
    <div
      id={`wallet-card-${wallet.id}`}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 bg-gradient-to-br ${config.bgGradient} ${
        isArchived ? 'border-neutral-800/80 opacity-70 grayscale-[30%]' : config.borderColor
      } p-4 sm:p-5 shadow-lg shadow-black/40`}
    >
      {/* Top Row: Provider Initials / Brand Logo + Name + Actions Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Premium Initials Badge */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-md tracking-wider shrink-0 ${config.initialsBg}`}
          >
            {config.initials}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {wallet.displayName || wallet.name}
              </h3>
              {isArchived && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                  Archived
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5 flex-wrap">
              <span className="font-medium text-neutral-300">
                {wallet.providerName || config.brandName}
              </span>
              <span>•</span>
              <span className="text-neutral-400">{getWalletTypeLabel(wallet.walletType)}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-neutral-300">
                <User className="w-3 h-3 text-neutral-500" />
                {getOwnerLabel(wallet.owner)}
              </span>
            </div>
          </div>
        </div>

        {/* More Menu Dropdown */}
        <div className="relative shrink-0">
          <button
            id={`wallet-menu-btn-${wallet.id}`}
            onClick={() => setShowMenu(!showMenu)}
            aria-label="More actions"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-30 w-48 rounded-2xl bg-neutral-900/95 backdrop-blur-md border border-neutral-800 shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100">
                {onTransfer && !isArchived && (
                  <button
                    id={`transfer-opt-${wallet.id}`}
                    onClick={() => {
                      setShowMenu(false);
                      onTransfer(wallet);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                    Transfer / Top-up
                  </button>
                )}
                <button
                  id={`edit-opt-${wallet.id}`}
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(wallet);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                  Edit Details
                </button>
                <button
                  id={`history-opt-${wallet.id}`}
                  onClick={() => {
                    setShowMenu(false);
                    onViewHistory(wallet);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5"
                >
                  <History className="w-3.5 h-3.5 text-neutral-400" />
                  View History
                </button>
                <div className="h-px bg-neutral-800 my-1" />
                {isArchived ? (
                  onRestore && (
                    <button
                      id={`restore-opt-${wallet.id}`}
                      onClick={() => {
                        setShowMenu(false);
                        onRestore(wallet);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-emerald-400 hover:bg-emerald-950/30 flex items-center gap-2.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Restore Wallet
                    </button>
                  )
                ) : (
                  <button
                    id={`archive-opt-${wallet.id}`}
                    onClick={() => {
                      setShowMenu(false);
                      onArchive(wallet);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-amber-400 hover:bg-amber-950/30 flex items-center gap-2.5"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive Wallet
                  </button>
                )}

                {onDelete && (
                  <button
                    id={`delete-opt-${wallet.id}`}
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(wallet);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2.5 border-t border-neutral-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Wallet
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Current Balance Display */}
      <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-baseline justify-between gap-2">
        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
            Current Balance
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
                isNegative ? 'text-rose-400' : 'text-white'
              }`}
            >
              {isNegative ? '-' : ''}
              {formatCurrency(balance)}
            </span>
          </div>
          {isNegative && (
            <p className="text-[11px] text-rose-400/90 flex items-center gap-1 mt-0.5 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" />
              Negative balance / Overdraft liability
            </p>
          )}
        </div>

        {/* Include in Net Worth Status Indicator */}
        <div className="text-right shrink-0">
          {isIncludedInNetWorth ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check className="w-3 h-3 text-emerald-400" />
              Included in Net Worth
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <EyeOff className="w-3 h-3 text-amber-400" />
              Excluded from Net Worth
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Actions (Transfer, Update, History, Edit) */}
      {!isArchived ? (
        <div className="mt-4 pt-3 border-t border-neutral-800/50 flex items-center gap-2">
          {/* Transfer Action */}
          {onTransfer && (
            <button
              id={`btn-transfer-wallet-${wallet.id}`}
              onClick={() => onTransfer(wallet)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:text-white transition-all active:scale-[0.98]"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>Transfer</span>
            </button>
          )}

          {/* Update Balance Action */}
          <button
            id={`btn-update-wallet-${wallet.id}`}
            onClick={() => onUpdateBalance(wallet)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 text-xs font-semibold hover:text-white transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Update</span>
          </button>

          {/* History Action */}
          <button
            id={`btn-history-wallet-${wallet.id}`}
            onClick={() => onViewHistory(wallet)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 text-xs font-semibold hover:text-white transition-all active:scale-[0.98]"
          >
            <History className="w-3.5 h-3.5 text-neutral-400" />
            <span>History</span>
          </button>

          {/* Quick Edit */}
          <button
            id={`btn-quick-edit-${wallet.id}`}
            onClick={() => onEdit(wallet)}
            aria-label="Edit wallet settings"
            className="p-2 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="mt-4 pt-3 border-t border-neutral-800/50 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-500">Archived record preserved</span>
          {onRestore && (
            <button
              id={`btn-restore-wallet-${wallet.id}`}
              onClick={() => onRestore(wallet)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Restore
            </button>
          )}
        </div>
      )}
    </div>
  );
};
