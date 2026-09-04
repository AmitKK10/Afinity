import React from 'react';
import {
  X,
  History,
  TrendingUp,
  TrendingDown,
  Gift,
  ArrowLeftRight,
  Sparkles,
} from 'lucide-react';
import {
  DigitalWallet,
  BalanceHistoryRecord,
  AuditEvent,
  InternalTransferRecord,
  WalletTransaction,
} from '../../types';

interface WalletHistoryModalProps {
  isOpen: boolean;
  wallet: DigitalWallet | null;
  balanceHistory: BalanceHistoryRecord[];
  walletTransactions?: WalletTransaction[];
  auditEvents?: AuditEvent[];
  transfers?: InternalTransferRecord[];
  onClose: () => void;
}

export const WalletHistoryModal: React.FC<WalletHistoryModalProps> = ({
  isOpen,
  wallet,
  balanceHistory,
  walletTransactions = [],
  auditEvents = [],
  transfers = [],
  onClose,
}) => {
  if (!isOpen || !wallet) return null;

  // Filter records for this specific wallet
  const historyForWallet = balanceHistory.filter(
    (h) => h.entityType === 'wallet' && h.entityId === wallet.id
  );

  const transactionsForWallet = walletTransactions.filter(
    (tx) => tx.walletId === wallet.id
  );

  const transfersForWallet = transfers.filter(
    (t) =>
      (t.fromEntityType === 'wallet' && t.fromEntityId === wallet.id) ||
      (t.toEntityType === 'wallet' && t.toEntityId === wallet.id)
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: wallet.currency || 'INR',
      maximumFractionDigits: 2,
    }).format(Math.abs(val));
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Format transaction type badge
  const formatTxType = (type?: string, reason?: string) => {
    const t = (type || '').toUpperCase();
    const r = (reason || '').toLowerCase();
    if (t.includes('OPENING') || r.includes('opening')) return 'OPENING BALANCE';
    if (t.includes('CASHBACK') || r.includes('cashback')) return 'CASHBACK';
    if (t.includes('SPEND') || r.includes('spend')) return 'SPEND';
    if (t.includes('TRANSFER') || r.includes('transfer')) return 'TRANSFER';
    return 'BALANCE ADJUSTMENT';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id={`wallet-history-modal-${wallet.id}`}
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {wallet.displayName || wallet.name} History
              </h2>
              <p className="text-xs text-neutral-400">
                Audit trail, balance changes, and transactions
              </p>
            </div>
          </div>
          <button
            id="close-wallet-history-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="p-5 pb-0 shrink-0">
          <div className="p-4 rounded-2xl bg-neutral-800/40 border border-neutral-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                Current Stored Balance
              </span>
              <p
                className={`text-2xl font-bold font-mono mt-0.5 ${
                  Number(wallet.balance) < 0 ? 'text-rose-400' : 'text-white'
                }`}
              >
                {Number(wallet.balance) < 0 ? '-' : ''}
                {formatCurrency(Number(wallet.balance))}
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                wallet.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {wallet.status === 'active' ? 'Active' : 'Archived'}
            </span>
          </div>
        </div>

        {/* Scrollable Timeline */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between sticky top-0 bg-neutral-900 py-1 z-10">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Activity History
            </h3>
            <span className="text-[11px] text-neutral-500">
              {historyForWallet.length + transactionsForWallet.length + transfersForWallet.length} record(s)
            </span>
          </div>

          {historyForWallet.length === 0 &&
          transactionsForWallet.length === 0 &&
          transfersForWallet.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No historical balance events recorded yet for this wallet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Prioritize walletTransactions if present */}
              {transactionsForWallet.map((tx) => {
                const isCredit = tx.direction === 'in';
                const txBadge = formatTxType(tx.type, tx.reason);

                return (
                  <div
                    key={`tx-${tx.id}`}
                    className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-800/80 hover:border-neutral-700/80 transition-colors text-xs flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-2 rounded-xl border mt-0.5 shrink-0 ${
                            isCredit
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {isCredit ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">
                              {tx.reason || (isCredit ? 'Balance Credited' : 'Balance Debited')}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-indigo-300 border border-indigo-500/30">
                              {txBadge}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1">
                            {formatDate(tx.date || tx.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <span
                          className={`font-bold text-sm ${
                            isCredit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Previous & New Balance Breakdown */}
                    <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                      <span>Prev: ₹{tx.previousBalance?.toLocaleString('en-IN') ?? 0}</span>
                      <span>→</span>
                      <span className="text-neutral-200 font-semibold">
                        New: ₹{tx.newBalance?.toLocaleString('en-IN') ?? 0}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Balance history records if not already displayed */}
              {historyForWallet
                .filter(
                  (h) =>
                    !transactionsForWallet.some(
                      (t) => Math.abs(t.amount) === Math.abs(h.delta) && Math.abs(new Date(t.date || t.createdAt).getTime() - new Date(h.timestamp).getTime()) < 3000
                    )
                )
                .map((record) => {
                  const delta = record.delta;
                  const isCredit = delta > 0;
                  const txBadge = formatTxType(undefined, record.reason);

                  return (
                    <div
                      key={`h-${record.id}`}
                      className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-800/80 hover:border-neutral-700/80 transition-colors text-xs flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`p-2 rounded-xl border mt-0.5 shrink-0 ${
                              isCredit
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {isCredit ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white">
                                {record.reason || (isCredit ? 'Balance Credited' : 'Balance Debited')}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-indigo-300 border border-indigo-500/30">
                                {txBadge}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1">
                              {formatDate(record.timestamp)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0">
                          <span
                            className={`font-bold text-sm ${
                              isCredit ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isCredit ? '+' : '-'}
                            {formatCurrency(delta)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                        <span>Prev: ₹{record.previousBalance?.toLocaleString('en-IN') ?? 0}</span>
                        <span>→</span>
                        <span className="text-neutral-200 font-semibold">
                          New: ₹{record.newBalance?.toLocaleString('en-IN') ?? 0}
                        </span>
                      </div>
                    </div>
                  );
                })}

              {/* Transfers logs */}
              {transfersForWallet.map((trf) => {
                const isOutbound =
                  trf.fromEntityType === 'wallet' && trf.fromEntityId === wallet.id;

                return (
                  <div
                    key={`trf-${trf.id}`}
                    className="p-3.5 rounded-2xl bg-neutral-800/40 border border-neutral-800/80 hover:border-neutral-700/80 transition-colors text-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                        <ArrowLeftRight className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {isOutbound
                            ? `Transfer to ${trf.toEntityName}`
                            : `Transfer from ${trf.fromEntityName}`}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {formatDate(trf.timestamp)} {trf.notes ? `• ${trf.notes}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <span
                        className={`font-bold ${
                          isOutbound ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {isOutbound ? '-' : '+'}
                        {formatCurrency(trf.amount)}
                      </span>
                      <span className="block text-[10px] text-indigo-400/80 mt-0.5 font-sans font-medium">
                        Transfer
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 flex items-center justify-end shrink-0">
          <button
            id="close-wallet-history-footer-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
