import React, { useState } from 'react';
import {
  History,
  Calendar,
  Layers,
  Trash2,
  Scale,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Camera,
  Filter,
  Plus,
} from 'lucide-react';
import { FinancialSnapshot, SnapshotType } from '../../types';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { FinancialCard } from '../ui/FinancialCard';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface SnapshotBrowserProps {
  snapshots: FinancialSnapshot[];
  onTakeSnapshot: () => void;
  onCompareTwoSnapshots: (snapA: FinancialSnapshot, snapB: FinancialSnapshot) => void;
  onDeleteSnapshot?: (id: string) => Promise<void>;
  className?: string;
}

export const SnapshotBrowser: React.FC<SnapshotBrowserProps> = ({
  snapshots,
  onTakeSnapshot,
  onCompareTwoSnapshots,
  onDeleteSnapshot,
  className,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | SnapshotType>('ALL');
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Chronologically descending snapshots
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filteredSnapshots = sortedSnapshots.filter((s) => {
    if (filterType === 'ALL') return true;
    const sType = s.snapshotType || (s.label === 'Monthly' ? 'monthly' : s.label === 'Daily' ? 'daily' : 'manual');
    return sType === filterType;
  });

  const toggleSelectForCompare = (snapId: string) => {
    if (selectedForComparison.includes(snapId)) {
      setSelectedForComparison(selectedForComparison.filter((id) => id !== snapId));
    } else {
      if (selectedForComparison.length >= 2) {
        // Replace second
        setSelectedForComparison([selectedForComparison[0], snapId]);
      } else {
        setSelectedForComparison([...selectedForComparison, snapId]);
      }
    }
  };

  const handleTriggerCompare = () => {
    if (selectedForComparison.length === 2) {
      const snapA = snapshots.find((s) => s.id === selectedForComparison[0]);
      const snapB = snapshots.find((s) => s.id === selectedForComparison[1]);
      if (snapA && snapB) {
        onCompareTwoSnapshots(snapA, snapB);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteSnapshot) return;
    if (window.confirm('Delete this valuation snapshot?')) {
      setIsDeletingId(id);
      try {
        await onDeleteSnapshot(id);
        setSelectedForComparison(selectedForComparison.filter((sId) => sId !== id));
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  return (
    <FinancialCard
      id="afinity-snapshot-browser-card"
      className={cn('p-4 sm:p-6 space-y-4', className)}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-heading">
              Valuation Snapshots Log
            </h3>
            <p className="text-xs text-slate-400">
              {snapshots.length} permanent historical checkpoints saved in local database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedForComparison.length === 2 && (
            <button
              type="button"
              id="btn-compare-selected-snapshots"
              onClick={handleTriggerCompare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition-all cursor-pointer font-heading min-h-[36px]"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare (2 Selected)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onTakeSnapshot}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer font-heading min-h-[36px]"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Record New</span>
          </button>
        </div>
      </div>

      {/* Snapshot Types Filter */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
        {(
          [
            { id: 'ALL', label: 'All' },
            { id: 'daily', label: 'Daily' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'milestone', label: 'Milestone' },
            { id: 'manual', label: 'Manual' },
          ] as const
        ).map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as any)}
              className={cn(
                'px-3 py-1 rounded-lg font-bold font-heading transition-all cursor-pointer min-h-[32px]',
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Instruction Tip */}
      <p className="text-[11px] text-slate-400 italic">
        💡 Tip: Select any 2 snapshots to view an instant granular side-by-side comparison.
      </p>

      {/* Snapshots List */}
      {filteredSnapshots.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center text-xs text-slate-400">
          No snapshots found matching the selected filter.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSnapshots.map((snap, idx) => {
            const nextOlderSnap = filteredSnapshots[idx + 1];
            const nw = snap.netWorth !== undefined ? snap.netWorth : Number(snap.totalNetWorth || 0);
            const prevNw = nextOlderSnap
              ? nextOlderSnap.netWorth !== undefined
                ? nextOlderSnap.netWorth
                : Number(nextOlderSnap.totalNetWorth || 0)
              : null;

            const delta = prevNw !== null ? nw - prevNw : null;
            const deltaPct = prevNw !== null && prevNw > 0 ? (delta! / prevNw) * 100 : null;
            const isSelected = selectedForComparison.includes(snap.id);

            const snapType = snap.snapshotType || (snap.label === 'Monthly' ? 'monthly' : snap.label === 'Daily' ? 'daily' : 'manual');

            return (
              <div
                key={snap.id}
                className={cn(
                  'p-3.5 rounded-2xl border transition-all text-xs flex flex-wrap items-center justify-between gap-3',
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700/80'
                )}
              >
                {/* Left Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    id={`select-snap-${snap.id}`}
                    checked={isSelected}
                    onChange={() => toggleSelectForCompare(snap.id)}
                    className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 bg-slate-900 cursor-pointer"
                    title="Select to compare"
                  />

                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white font-heading">
                        {snap.dateString || snap.date}
                      </span>
                      <Badge
                        variant={
                          snapType === 'monthly'
                            ? 'cyan'
                            : snapType === 'milestone'
                            ? 'gold'
                            : snapType === 'daily'
                            ? 'default'
                            : 'purple'
                        }
                        size="sm"
                      >
                        {snap.label || snapType}
                      </Badge>

                      {snap.note && (
                        <span className="text-[11px] text-slate-400 truncate max-w-xs">
                          "{snap.note}"
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>Assets: <strong className="text-emerald-400 font-sans">{formatRupee(snap.totalAssets)}</strong></span>
                      <span>•</span>
                      <span>Dues: <strong className="text-rose-400 font-sans">{formatRupee(snap.totalLiabilities)}</strong></span>
                      {delta !== null && (
                        <>
                          <span>•</span>
                          <span className={delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {delta >= 0 ? '+' : ''}{formatRupee(delta)} ({deltaPct !== null ? formatPercentage(deltaPct, true) : ''})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Value & Actions */}
                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-sans">Net Worth</span>
                    <span className="text-base font-bold text-cyan-300">
                      {formatRupee(nw)}
                    </span>
                  </div>

                  {onDeleteSnapshot && (
                    <button
                      type="button"
                      onClick={() => handleDelete(snap.id)}
                      disabled={isDeletingId === snap.id}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer min-h-[36px]"
                      title="Delete snapshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </FinancialCard>
  );
};
