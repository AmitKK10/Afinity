import React, { useState, useMemo } from 'react';
import {
  Scale,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Coins,
  Building2,
  Landmark,
  Wallet,
  CreditCard,
  Receipt,
  PiggyBank,
  AlertCircle,
} from 'lucide-react';
import { FinancialSnapshot } from '../../types';
import { calculateSnapshotChange } from '../../services/calculations';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { SelectField } from '../ui/SelectionSheet';
import { cn } from '../../utils/cn';

interface CompareSnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: FinancialSnapshot[];
  initialSnapA?: FinancialSnapshot | null;
  initialSnapB?: FinancialSnapshot | null;
}

export const CompareSnapshotsModal: React.FC<CompareSnapshotsModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  initialSnapA,
  initialSnapB,
}) => {
  const sorted = useMemo(() => {
    return [...snapshots].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [snapshots]);

  const [snapAId, setSnapAId] = useState<string>(initialSnapA?.id || sorted[0]?.id || '');
  const [snapBId, setSnapBId] = useState<string>(initialSnapB?.id || (sorted[1] ? sorted[1].id : sorted[0]?.id || ''));

  const snapshotA = snapshots.find((s) => s.id === snapAId) || sorted[0];
  const snapshotB = snapshots.find((s) => s.id === snapBId) || sorted[1] || sorted[0];

  // Compare Snapshot A (Now / Target) vs Snapshot B (Baseline / Earlier)
  const comparison = useMemo(() => {
    if (!snapshotA || !snapshotB) return null;
    return calculateSnapshotChange(snapshotA, snapshotB, 'custom' as any);
  }, [snapshotA, snapshotB]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compare Two Snapshots" maxWidth="max-w-2xl">
      <div className="space-y-5 text-xs">
        {/* Dropdown Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div>
            <SelectField
              label="Snapshot A (Target / Newer)"
              value={snapAId}
              onChange={(val) => setSnapAId(val)}
              options={sorted.map((s) => ({
                value: s.id,
                label: `${s.dateString || s.date} — ${s.label || s.snapshotType || 'Snapshot'}`,
                sublabel: `${s.notes ? s.notes + ' • ' : ''}Net Worth`,
                badge: formatRupee(s.netWorth || s.totalNetWorth || 0),
                badgeColor: 'cyan' as const,
              }))}
              showSearch={sorted.length > 5}
              triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-800 text-xs"
            />
          </div>

          <div>
            <SelectField
              label="Snapshot B (Baseline / Reference)"
              value={snapBId}
              onChange={(val) => setSnapBId(val)}
              options={sorted.map((s) => ({
                value: s.id,
                label: `${s.dateString || s.date} — ${s.label || s.snapshotType || 'Snapshot'}`,
                sublabel: `${s.notes ? s.notes + ' • ' : ''}Baseline Net Worth`,
                badge: formatRupee(s.netWorth || s.totalNetWorth || 0),
                badgeColor: 'slate' as const,
              }))}
              showSearch={sorted.length > 5}
              triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-800 text-xs"
            />
          </div>
        </div>

        {comparison && (
          <div className="space-y-4">
            {/* Top Net Worth Comparison Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101b33] via-slate-900 to-slate-950 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading">
                  Net Worth Progression
                </span>
                <Badge variant={comparison.isPositive ? 'emerald' : 'rose'} size="sm">
                  {comparison.isPositive ? '+' : ''}{formatRupee(comparison.netWorthChangeAmount)} ({formatPercentage(comparison.netWorthChangePercentage, true)})
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Snapshot B (Baseline)</span>
                  <span className="text-slate-300 font-bold text-sm sm:text-base">
                    {formatRupee(comparison.baselineNetWorth)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Snapshot A (Target)</span>
                  <span className="text-cyan-300 font-bold text-sm sm:text-base">
                    {formatRupee(comparison.currentNetWorth)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 font-mono">
                <span>Assets: {formatRupee(comparison.baselineAssets)} → <strong className="text-emerald-400 font-sans">{formatRupee(comparison.currentAssets)}</strong></span>
                <span>Dues: {formatRupee(comparison.baselineLiabilities)} → <strong className="text-rose-400 font-sans">{formatRupee(comparison.currentLiabilities)}</strong></span>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading">
                Category Movements (A vs B)
              </h4>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {comparison.contributionsList.map((item) => {
                  const isImpactPositive = item.impactOnNetWorth > 0;
                  const isImpactZero = item.impactOnNetWorth === 0;

                  return (
                    <div
                      key={item.categoryKey}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-200 block font-heading">
                          {item.categoryLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatRupee(item.baselineValue)} → {formatRupee(item.currentValue)}
                        </span>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-[10px] text-slate-500 block font-sans">Net Worth Impact</span>
                        <span
                          className={cn(
                            'font-bold',
                            isImpactZero
                              ? 'text-slate-500'
                              : isImpactPositive
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          )}
                        >
                          {isImpactZero ? '₹0' : isImpactPositive ? `+${formatRupee(item.impactOnNetWorth)}` : `-${formatRupee(Math.abs(item.impactOnNetWorth))}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-800 cursor-pointer min-h-[40px]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
