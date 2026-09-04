import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertTriangle,
  FileQuestion,
  TrendingUp,
} from 'lucide-react';
import { PortfolioPriceRefreshSummary, PriceRefreshFailureItem, PriceRefreshSuccessItem } from '../../types';
import { formatRupee, formatRelativeTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface PriceRefreshSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: PortfolioPriceRefreshSummary | null;
  onForceRefresh?: () => void;
  onInspectHolding?: (holdingId: string) => void;
}

type SummaryFilterTab = 'all' | 'failed' | 'updated' | 'unchanged';

export const PriceRefreshSummaryModal: React.FC<PriceRefreshSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  onForceRefresh,
  onInspectHolding,
}) => {
  const [activeFilter, setActiveFilter] = useState<SummaryFilterTab>('all');
  const [selectedFailure, setSelectedFailure] = useState<PriceRefreshFailureItem | null>(null);

  if (!isOpen || !summary) return null;

  const totalAttempted = summary.totalAttempted || 0;
  const totalUpdated = summary.totalUpdated || 0;
  const totalUnchanged = summary.totalUnchanged || 0;
  const totalSuccess = summary.totalSuccess !== undefined ? summary.totalSuccess : totalUpdated + totalUnchanged;
  const totalFailed = summary.totalFailed || 0;
  const totalSkipped = summary.totalSkippedDueToInterval || 0;

  const updatedList = summary.updatedHoldings || [];
  const unchangedList = summary.unchangedHoldings || [];
  const failedList = summary.failedHoldings || [];

  const isCompleteSuccess = summary.isCompleteSuccess;
  const hasPartialFailures = summary.hasPartialFailures || (totalSuccess > 0 && totalFailed > 0);
  const isAllFailed = totalSuccess === 0 && totalFailed > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0b1329] border border-slate-700/80 shadow-2xl p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0',
                isCompleteSuccess
                  ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400'
                  : hasPartialFailures
                  ? 'bg-amber-950/80 border-amber-800/60 text-amber-400'
                  : isAllFailed
                  ? 'bg-rose-950/80 border-rose-800/60 text-rose-400'
                  : 'bg-cyan-950/80 border-cyan-800/60 text-cyan-400'
              )}
            >
              {isCompleteSuccess ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : hasPartialFailures ? (
                <AlertTriangle className="w-5 h-5" />
              ) : isAllFailed ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                  Market Price Sync Report
                </h3>
                {isCompleteSuccess && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    100% Live
                  </span>
                )}
                {hasPartialFailures && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Partial Sync
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {formatRelativeTime(summary.timestamp)} •{' '}
                <span className="text-slate-300 font-medium">
                  {summary.statusHeadline || `${totalSuccess} verified, ${totalFailed} retained`}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Independent Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Queried</span>
            <span className="text-lg font-bold text-white font-mono">{totalAttempted}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Attempted</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Live Updated</span>
            <span className="text-lg font-bold text-emerald-300 font-mono">{totalUpdated}</span>
            <span className="text-[10px] text-emerald-400/70 block mt-0.5">Price changed</span>
          </div>

          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-center">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block">Live Verified</span>
            <span className="text-lg font-bold text-cyan-300 font-mono">{totalUnchanged}</span>
            <span className="text-[10px] text-cyan-400/70 block mt-0.5">Price unchanged</span>
          </div>

          <div
            className={cn(
              'p-3 rounded-2xl border text-center transition-colors',
              totalFailed > 0
                ? 'bg-amber-950/40 border-amber-700/60 shadow-sm shadow-amber-950'
                : 'bg-slate-900/80 border-slate-800'
            )}
          >
            <span
              className={cn(
                'text-[10px] uppercase font-bold block',
                totalFailed > 0 ? 'text-amber-300' : 'text-slate-400'
              )}
            >
              Retained / Failed
            </span>
            <span
              className={cn(
                'text-lg font-bold font-mono',
                totalFailed > 0 ? 'text-amber-200' : 'text-slate-400'
              )}
            >
              {totalFailed}
            </span>
            <span
              className={cn(
                'text-[10px] block mt-0.5',
                totalFailed > 0 ? 'text-amber-400' : 'text-slate-500'
              )}
            >
              Manual retained
            </span>
          </div>
        </div>

        {/* Status Callout Banner */}
        {hasPartialFailures && (
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2.5 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-100 block">
                Independent Failure Isolation Active
              </span>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                {totalSuccess} asset(s) were successfully updated with live market quotes. For the{' '}
                {totalFailed} asset(s) where quotes were unavailable, existing manual valuations
                were retained safely without corrupting your portfolio totals.
              </p>
            </div>
          </div>
        )}

        {totalSkipped > 0 && (
          <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-cyan-800/30 text-xs text-cyan-300 flex items-center gap-2 shrink-0">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-[11px]">
              {totalSkipped} holding(s) refreshed recently were skipped to preserve bandwidth.
            </span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center',
              activeFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            All ({totalAttempted})
          </button>

          {failedList.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('failed')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1',
                activeFilter === 'failed'
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-700/60'
                  : 'text-amber-400 hover:text-amber-300'
              )}
            >
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Failed / Retained ({failedList.length})</span>
            </button>
          )}

          {updatedList.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('updated')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center',
                activeFilter === 'updated'
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-700/60'
                  : 'text-emerald-400 hover:text-emerald-300'
              )}
            >
              Updated ({updatedList.length})
            </button>
          )}

          {unchangedList.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('unchanged')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center',
                activeFilter === 'unchanged'
                  ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-700/60'
                  : 'text-cyan-400 hover:text-cyan-300'
              )}
            >
              Verified ({unchangedList.length})
            </button>
          )}
        </div>

        {/* Scrollable Assets Inspection List */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar min-h-[160px] max-h-[300px]">
          {/* Failed Items Section */}
          {(activeFilter === 'all' || activeFilter === 'failed') && failedList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Inspect Failed Assets ({failedList.length})</span>
                </h4>
                <span className="text-[10px] text-slate-400">Click to inspect diagnostic details</span>
              </div>

              <div className="space-y-2">
                {failedList.map((item, index) => {
                  const isSelected = selectedFailure?.id === item.id;
                  return (
                    <div
                      key={item.id || index}
                      onClick={() => setSelectedFailure(isSelected ? null : item)}
                      className={cn(
                        'p-3 rounded-2xl border transition-all cursor-pointer text-xs space-y-1.5',
                        isSelected
                          ? 'bg-[#151c33] border-amber-500/80 shadow-md'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-amber-900/40 hover:border-amber-700/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs">{item.name}</span>
                            {item.assetType && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {item.assetType}
                              </span>
                            )}
                            {item.isUnlisted && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                                Unlisted
                              </span>
                            )}
                          </div>
                          {item.symbol && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Ticker / ID: {item.symbol}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/60 shrink-0">
                          Manual Retained
                        </span>
                      </div>

                      {/* Error Diagnostic Explanation */}
                      <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-900/30 text-[11px] text-amber-300 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item.reason}</span>
                      </div>

                      {isSelected && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">
                            Last known price:{' '}
                            <strong className="text-white font-mono">
                              {item.lastKnownPrice ? `₹${item.lastKnownPrice}` : 'Manual'}
                            </strong>
                          </span>

                          {onInspectHolding && item.id !== 'system' && item.id !== 'network' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                                onInspectHolding(item.id);
                              }}
                              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>Update Manually</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Updated Items Section */}
          {(activeFilter === 'all' || activeFilter === 'updated') && updatedList.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Updated Holdings ({updatedList.length})</span>
              </h4>

              <div className="space-y-1.5">
                {updatedList.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-200 block truncate">{h.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Source: {h.source} {h.asOfDate ? `• ${h.asOfDate}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono font-bold">
                      <span className="text-slate-400 line-through">₹{h.oldPrice}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-emerald-300">₹{h.newPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unchanged Items Section */}
          {(activeFilter === 'all' || activeFilter === 'unchanged') && unchangedList.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Live (Price Unchanged) ({unchangedList.length})</span>
              </h4>

              <div className="space-y-1.5">
                {unchangedList.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-200 block truncate">{h.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Source: {h.source}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-cyan-300 text-xs">
                      ₹{h.newPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If no items in active tab */}
          {activeFilter === 'failed' && failedList.length === 0 && (
            <div className="p-6 text-center text-xs text-emerald-400 bg-emerald-950/20 rounded-2xl border border-emerald-900/30">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-emerald-400" />
              <span>Zero errors. All attempted assets received verified market quotes.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          {onForceRefresh ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onForceRefresh();
              }}
              className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Force Re-query All Assets</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">Afinity Market Price Engine</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer font-heading"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

