import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Database,
  Search,
} from 'lucide-react';
import {
  ReconciliationReport,
  ReconciliationCheck,
  ReconciliationStatus,
} from '../../services/reconciliationService';
import { formatRupee } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface DataHealthIndicatorProps {
  report: ReconciliationReport;
  onRefresh?: () => void;
  className?: string;
}

export const DataHealthIndicator: React.FC<DataHealthIndicatorProps> = ({
  report,
  onRefresh,
  className,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'discrepancies' | 'warnings' | 'passed'>('all');
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  const { isReconciled, overallStatus, totalChecks, reconciledCount, warningCount, discrepancyCount, checks } = report;

  const filteredChecks = checks.filter((c) => {
    if (filter === 'discrepancies') return c.status === 'discrepancy';
    if (filter === 'warnings') return c.status === 'warning';
    if (filter === 'passed') return c.status === 'reconciled';
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedCheckId((prev) => (prev === id ? null : id));
  };

  return (
    <div id="data-health-indicator-wrapper" className={cn('relative', className)}>
      {/* Compact Status Trigger Bar */}
      <div
        id="data-health-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl border transition-all cursor-pointer select-none backdrop-blur-md shadow-sm group',
          overallStatus === 'reconciled' &&
            'bg-slate-900/80 hover:bg-slate-900 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400',
          overallStatus === 'warning' &&
            'bg-slate-900/80 hover:bg-slate-900 border-amber-500/40 hover:border-amber-500/60 text-amber-300',
          overallStatus === 'discrepancy' &&
            'bg-slate-900/80 hover:bg-slate-900 border-rose-500/50 hover:border-rose-500/70 text-rose-300'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold',
              overallStatus === 'reconciled' && 'bg-emerald-500/20 text-emerald-400',
              overallStatus === 'warning' && 'bg-amber-500/20 text-amber-400',
              overallStatus === 'discrepancy' && 'bg-rose-500/20 text-rose-400'
            )}
          >
            {overallStatus === 'reconciled' && <ShieldCheck className="w-3.5 h-3.5" />}
            {overallStatus === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
            {overallStatus === 'discrepancy' && <XCircle className="w-3.5 h-3.5" />}
          </div>

          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-black tracking-tight font-heading">
              {overallStatus === 'reconciled' && 'Data Reconciled'}
              {overallStatus === 'warning' && 'Data Integrity Notice'}
              {overallStatus === 'discrepancy' && 'Data Mismatch Detected'}
            </span>

            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              ({reconciledCount}/{totalChecks} checks verified)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {discrepancyCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold font-mono">
              {discrepancyCount} mismatch{discrepancyCount > 1 ? 'es' : ''}
            </span>
          )}
          {warningCount > 0 && discrepancyCount === 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold font-mono">
              {warningCount} notice{warningCount > 1 ? 's' : ''}
            </span>
          )}

          <div className="p-1 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white transition-colors">
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Expanded Modal / Dropdown Details */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-black/60 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            id="data-health-details-modal"
            className="fixed inset-x-3 bottom-3 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[580px] bg-slate-900/98 border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-5 z-50 flex flex-col max-h-[85vh] sm:max-h-[640px] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-heading">
                    Financial Data Reconciliation Report
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time cross-module audit across Home, Accounts, Investments, SIPs & Cards
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    title="Re-run integrity audit"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold px-2.5"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Overall Status Banner */}
            <div
              className={cn(
                'mt-3 p-3 rounded-2xl border flex items-start gap-2.5 flex-shrink-0',
                overallStatus === 'reconciled' && 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
                overallStatus === 'warning' && 'bg-amber-950/40 border-amber-500/30 text-amber-300',
                overallStatus === 'discrepancy' && 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {overallStatus === 'reconciled' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {overallStatus === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {overallStatus === 'discrepancy' && <XCircle className="w-4 h-4 text-rose-400" />}
              </div>
              <div className="text-xs">
                <span className="font-extrabold block">
                  {overallStatus === 'reconciled' && 'All Financial Values are 100% Reconciled'}
                  {overallStatus === 'warning' && 'Reconciliation Active — Observations Detected'}
                  {overallStatus === 'discrepancy' && 'Action Required: Mathematical Discrepancy Found'}
                </span>
                <span className="text-[11px] text-slate-300 block mt-0.5 opacity-90">
                  {overallStatus === 'reconciled' &&
                    'Every total matches the underlying persisted records without duplicate counting or hardcoded divergences.'}
                  {overallStatus === 'warning' &&
                    'Records are mathematically sound, but require user review for linked accounts or overdue dates.'}
                  {overallStatus === 'discrepancy' &&
                    'A disparity exists between module totals and underlying records. Inspect details below to resolve.'}
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mt-3 pb-1 overflow-x-auto flex-shrink-0">
              {[
                { key: 'all' as const, label: `All Checks (${totalChecks})` },
                { key: 'discrepancies' as const, label: `Discrepancies (${discrepancyCount})`, hide: discrepancyCount === 0 },
                { key: 'warnings' as const, label: `Notices (${warningCount})`, hide: warningCount === 0 },
                { key: 'passed' as const, label: `Reconciled (${reconciledCount})` },
              ]
                .filter((t) => !t.hide)
                .map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    className={cn(
                      'px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer',
                      filter === tab.key
                        ? 'bg-slate-200 text-slate-900 font-extrabold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>

            {/* Scrollable Audit Items List */}
            <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {filteredChecks.map((check) => {
                const isExpanded = expandedCheckId === check.id;
                return (
                  <div
                    key={check.id}
                    id={`check-item-${check.id}`}
                    className={cn(
                      'rounded-2xl border p-3 transition-all',
                      check.status === 'reconciled' && 'bg-slate-950/60 border-slate-800',
                      check.status === 'warning' && 'bg-amber-950/20 border-amber-500/30',
                      check.status === 'discrepancy' && 'bg-rose-950/30 border-rose-500/40'
                    )}
                  >
                    {/* Item Header */}
                    <div
                      onClick={() => toggleExpand(check.id)}
                      className="flex items-start justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">
                          {check.status === 'reconciled' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {check.status === 'warning' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          {check.status === 'discrepancy' && (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{check.title}</span>
                            <span
                              className={cn(
                                'text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase',
                                check.status === 'reconciled' && 'bg-emerald-500/20 text-emerald-300',
                                check.status === 'warning' && 'bg-amber-500/20 text-amber-300',
                                check.status === 'discrepancy' && 'bg-rose-500/20 text-rose-300'
                              )}
                            >
                              {check.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{check.message}</p>
                        </div>
                      </div>

                      <div className="text-slate-400 hover:text-white p-1">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* Expandable Details: Comparison & Guidance */}
                    {isExpanded && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2.5 text-[11px] animate-in fade-in duration-150">
                        {/* Expected vs Actual Pill */}
                        {(check.expectedValue !== undefined || check.actualValue !== undefined) && (
                          <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {check.expectedLabel || 'Expected Value'}
                              </span>
                              <span className="font-mono font-bold text-white">
                                {typeof check.expectedValue === 'number'
                                  ? formatRupee(check.expectedValue)
                                  : String(check.expectedValue)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {check.actualLabel || 'Actual Value'}
                              </span>
                              <span
                                className={cn(
                                  'font-mono font-bold',
                                  check.status === 'discrepancy' ? 'text-rose-400' : 'text-emerald-400'
                                )}
                              >
                                {typeof check.actualValue === 'number'
                                  ? formatRupee(check.actualValue)
                                  : String(check.actualValue)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Guidance */}
                        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                          <div className="text-slate-300">
                            <span className="font-bold text-white block">Audit Guidance</span>
                            <span>{check.guidance}</span>
                          </div>
                        </div>

                        {/* Affected Records if present */}
                        {check.affectedRecords && check.affectedRecords.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Affected Records ({check.affectedRecords.length})
                            </span>
                            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                              {check.affectedRecords.map((rec) => (
                                <div
                                  key={rec.id}
                                  className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-200 truncate block">
                                      {rec.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate">
                                      {rec.detail}
                                    </span>
                                  </div>
                                  {rec.type && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0 font-mono">
                                      {rec.type}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action link */}
                        {check.relatedRoute && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              navigate(check.relatedRoute!);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors pt-1 cursor-pointer"
                          >
                            <span>Open Related Module</span>
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
        </>
      )}
    </div>
  );
};
