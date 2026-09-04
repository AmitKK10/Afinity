import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Search,
  Filter,
  CreditCard as CardIcon,
  ShoppingBag,
  Building2,
  Wallet as WalletIcon,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Gift,
} from 'lucide-react';
import { DigitalWallet, WalletTransaction, CashbackSource } from '../../types';
import { SelectField } from '../ui/SelectionSheet';

interface CashbackHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: DigitalWallet[];
  transactions: WalletTransaction[];
}

const getSourceIcon = (source?: string) => {
  const s = (source || '').toLowerCase();
  if (s.includes('card')) return <CardIcon className="w-3.5 h-3.5 text-sky-400" />;
  if (s.includes('shop') || s.includes('amazon') || s.includes('flipkart'))
    return <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />;
  if (s.includes('bank') || s.includes('sbi') || s.includes('hdfc'))
    return <Building2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (s.includes('wallet') || s.includes('paytm') || s.includes('phonepe') || s.includes('gpay'))
    return <WalletIcon className="w-3.5 h-3.5 text-purple-400" />;
  return <Tag className="w-3.5 h-3.5 text-indigo-400" />;
};

export const CashbackHistoryModal: React.FC<CashbackHistoryModalProps> = ({
  isOpen,
  onClose,
  wallets,
  transactions,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'earned' | 'used' | 'adjustment'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');

  const walletMap = useMemo(() => {
    const map = new Map<string, DigitalWallet>();
    wallets.forEach((w) => map.set(w.id, w));
    return map;
  }, [wallets]);

  // Filter all cashback-related transactions
  const cashbackTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const isCbType =
        t.type === 'CASHBACK_EARNED' ||
        t.type === 'CASHBACK_USED' ||
        t.type === 'CASHBACK_ADJUSTMENT' ||
        t.type === 'CASHBACK' ||
        t.type === 'cashback' ||
        t.type === 'cashback_earned' ||
        t.type === 'cashback_used' ||
        t.type === 'cashback_adjustment';

      if (isCbType) return true;

      // Or if the wallet itself is a dedicated cashback wallet
      const wallet = walletMap.get(t.walletId);
      if (wallet && (wallet.walletType === 'CASHBACK' || wallet.walletType === 'cashback')) {
        return true;
      }

      return false;
    });
  }, [transactions, walletMap]);

  // Filtered & searched results
  const filteredList = useMemo(() => {
    return cashbackTransactions.filter((tx) => {
      // Wallet filter
      if (selectedWalletId !== 'all' && tx.walletId !== selectedWalletId) {
        return false;
      }

      // Type filter
      if (typeFilter === 'earned') {
        const isEarned =
          tx.type === 'CASHBACK_EARNED' ||
          tx.type === 'cashback_earned' ||
          ((tx.type === 'CASHBACK' || tx.type === 'cashback') && tx.direction === 'in');
        if (!isEarned) return false;
      } else if (typeFilter === 'used') {
        const isUsed =
          tx.type === 'CASHBACK_USED' ||
          tx.type === 'cashback_used' ||
          ((tx.type === 'CASHBACK' || tx.type === 'cashback') && tx.direction === 'out');
        if (!isUsed) return false;
      } else if (typeFilter === 'adjustment') {
        const isAdj = tx.type === 'CASHBACK_ADJUSTMENT' || tx.type === 'cashback_adjustment';
        if (!isAdj) return false;
      }

      // Source filter
      if (sourceFilter !== 'all') {
        const s = (tx.source || '').toLowerCase();
        if (!s.includes(sourceFilter.toLowerCase())) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const reason = (tx.reason || '').toLowerCase();
        const source = (tx.source || '').toLowerCase();
        const wallet = (walletMap.get(tx.walletId)?.displayName || walletMap.get(tx.walletId)?.name || '').toLowerCase();
        return reason.includes(q) || source.includes(q) || wallet.includes(q);
      }

      return true;
    });
  }, [cashbackTransactions, selectedWalletId, typeFilter, sourceFilter, searchQuery, walletMap]);

  // Aggregates for current filtered view
  const { totalEarned, totalUsed } = useMemo(() => {
    let earned = 0;
    let used = 0;
    filteredList.forEach((tx) => {
      if (
        tx.type === 'CASHBACK_EARNED' ||
        tx.type === 'cashback_earned' ||
        ((tx.type === 'CASHBACK' || tx.type === 'cashback') && tx.direction === 'in')
      ) {
        earned += Number(tx.amount || 0);
      } else if (
        tx.type === 'CASHBACK_USED' ||
        tx.type === 'cashback_used' ||
        ((tx.type === 'CASHBACK' || tx.type === 'cashback') && tx.direction === 'out')
      ) {
        used += Number(tx.amount || 0);
      }
    });
    return { totalEarned: earned, totalUsed: used };
  }, [filteredList]);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="cashback-history-modal"
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cashback History & Audit Log</h2>
              <p className="text-xs text-neutral-400">
                Track all earned, redeemed, and adjusted cashback events
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Stats Summary Bar */}
        <div className="grid grid-cols-3 gap-3 my-4 shrink-0">
          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
              Filtered Earned
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
              +{formatCurrency(totalEarned)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-0.5">
              Filtered Used
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-rose-400">
              -{formatCurrency(totalUsed)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-0.5">
              Net Gain
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-indigo-300">
              {formatCurrency(totalEarned - totalUsed)}
            </span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="space-y-2.5 pb-3 border-b border-neutral-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, card, source..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Wallet Selector */}
            <div className="w-full sm:w-48">
              <SelectField
                value={selectedWalletId}
                onChange={(val) => setSelectedWalletId(val)}
                options={[
                  { value: 'all', label: `All Wallets (${wallets.length})` },
                  ...wallets.map((w) => ({
                    value: w.id,
                    label: w.displayName || w.name,
                    sublabel: w.providerName || w.provider || 'Digital Wallet',
                    badge: `₹${w.balance.toLocaleString('en-IN')}`,
                    badgeColor: 'purple' as const,
                  })),
                ]}
                triggerClassName="py-1.5 px-3 rounded-xl bg-neutral-950/80 border-neutral-800 text-xs"
              />
            </div>
          </div>

          {/* Type and Source Filter Chips */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {/* Type buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {[
                { key: 'all', label: 'All Types' },
                { key: 'earned', label: 'Earned (+)' },
                { key: 'used', label: 'Used (-)' },
                { key: 'adjustment', label: 'Adjustments' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTypeFilter(t.key as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    typeFilter === t.key
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Source dropdown */}
            <div className="w-36 shrink-0">
              <SelectField
                value={sourceFilter}
                onChange={(val) => setSourceFilter(val)}
                options={[
                  { value: 'all', label: 'All Sources' },
                  { value: 'credit card', label: 'Credit Card' },
                  { value: 'shopping', label: 'Shopping' },
                  { value: 'bank', label: 'Bank' },
                  { value: 'wallet', label: 'Wallet' },
                  { value: 'other', label: 'Other' },
                ]}
                triggerClassName="py-1 px-2.5 rounded-lg bg-neutral-800 border-neutral-700/60 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Transaction List */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-neutral-800/60 mt-2 pr-1 space-y-2">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-neutral-400">No cashback transactions found</p>
              <p className="text-xs text-neutral-500 mt-1">
                Log cashbacks from credit cards, shopping, or banks using "+ Add Cashback"
              </p>
            </div>
          ) : (
            filteredList.map((tx) => {
              const isEarned =
                tx.type === 'CASHBACK_EARNED' ||
                tx.type === 'cashback_earned' ||
                ((tx.type === 'CASHBACK' || tx.type === 'cashback') && tx.direction === 'in');
              const isUsed =
                tx.type === 'CASHBACK_USED' ||
                tx.type === 'cashback_used' ||
                ((tx.type === 'CASHBACK' || tx.type === 'cashback') && tx.direction === 'out');
              const isAdjustment =
                tx.type === 'CASHBACK_ADJUSTMENT' || tx.type === 'cashback_adjustment';

              const wallet = walletMap.get(tx.walletId);

              return (
                <div
                  key={tx.id}
                  className="pt-2 pb-2 flex items-center justify-between gap-3 hover:bg-neutral-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl border shrink-0 ${
                        isEarned
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isUsed
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}
                    >
                      {isEarned ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isUsed ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {tx.reason || (isEarned ? 'Cashback Earned' : isUsed ? 'Cashback Used' : 'Balance Adjusted')}
                        </span>
                        {tx.source && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {getSourceIcon(tx.source)}
                            {tx.source}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span>{tx.date || tx.createdAt?.split('T')[0]}</span>
                        <span>•</span>
                        <span className="text-neutral-300 font-medium">
                          {wallet?.displayName || wallet?.name || 'Wallet'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold font-mono block ${
                        isEarned
                          ? 'text-emerald-400'
                          : isUsed
                          ? 'text-rose-400'
                          : 'text-indigo-300'
                      }`}
                    >
                      {isEarned ? '+' : isUsed ? '-' : ''}
                      {formatCurrency(tx.amount)}
                    </span>
                    {tx.newBalance !== undefined && (
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Bal: ₹{tx.newBalance.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-500">
            Showing {filteredList.length} of {cashbackTransactions.length} records
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
