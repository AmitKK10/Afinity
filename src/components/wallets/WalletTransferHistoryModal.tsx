import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { InternalTransferRecord } from '../../types';

interface WalletTransferHistoryModalProps {
  isOpen: boolean;
  transfers: InternalTransferRecord[];
  walletId?: string;
  walletName?: string;
  onClose: () => void;
}

export const WalletTransferHistoryModal: React.FC<WalletTransferHistoryModalProps> = ({
  isOpen,
  transfers,
  walletId,
  walletName,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'bank' | 'wallet' | 'cash'>('all');

  if (!isOpen) return null;

  // Filter transfers relevant to wallets or specific wallet
  const walletTransfers = transfers.filter((trf) => {
    const isWalletInvolved =
      trf.fromEntityType === 'wallet' ||
      trf.toEntityType === 'wallet' ||
      trf.transferType.includes('wallet');

    if (!isWalletInvolved) return false;

    if (walletId) {
      return trf.fromEntityId === walletId || trf.toEntityId === walletId;
    }
    return true;
  });

  const filteredTransfers = walletTransfers.filter((trf) => {
    if (typeFilter === 'bank' && trf.fromEntityType !== 'bank' && trf.toEntityType !== 'bank') {
      return false;
    }
    if (typeFilter === 'cash' && trf.fromEntityType !== 'cash' && trf.toEntityType !== 'cash') {
      return false;
    }
    if (
      typeFilter === 'wallet' &&
      trf.transferType !== 'wallet_to_wallet'
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSource = (trf.fromEntityName || '').toLowerCase().includes(q);
      const matchDest = (trf.toEntityName || '').toLowerCase().includes(q);
      const matchNotes = (trf.notes || '').toLowerCase().includes(q);
      const matchType = (trf.transferType || '').toLowerCase().includes(q);
      return matchSource || matchDest || matchNotes || matchType;
    }

    return true;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Math.abs(val));
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEntityBadge = (type: string, name: string) => {
    if (type === 'bank') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium">
          {name}
        </span>
      );
    }
    if (type === 'cash') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
          {name}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-medium">
        {name}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="wallet-transfer-history-modal"
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {walletName ? `${walletName} Transfer History` : 'Wallet Transfer History'}
              </h2>
              <p className="text-xs text-neutral-400">
                Audit log of all internal money movements involving digital wallets
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

        {/* Filters and Search Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by source, destination or note..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-neutral-800/80 border border-neutral-700/80 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                typeFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('bank')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                typeFilter === 'bank'
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Bank ↔ Wallet
            </button>
            <button
              onClick={() => setTypeFilter('cash')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                typeFilter === 'cash'
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Cash ↔ Wallet
            </button>
            <button
              onClick={() => setTypeFilter('wallet')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                typeFilter === 'wallet'
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Wallet ↔ Wallet
            </button>
          </div>
        </div>

        {/* Transfer History Table View */}
        <div className="mt-4 flex-1 overflow-y-auto border border-neutral-800 rounded-2xl bg-neutral-950/60">
          {filteredTransfers.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No wallet transfer records found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/80 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-normal">
                  {filteredTransfers.map((trf) => (
                    <tr
                      key={trf.id}
                      className="hover:bg-neutral-800/40 transition-colors text-neutral-300"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                        {formatDate(trf.timestamp)}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getEntityBadge(trf.fromEntityType, trf.fromEntityName)}
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getEntityBadge(trf.toEntityType, trf.toEntityName)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-white">
                        {formatCurrency(trf.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </span>
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4 text-neutral-400 max-w-[200px] truncate text-[11px]">
                        {trf.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>
              All movements are verified atomic transactions with invariant net-worth balance.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
