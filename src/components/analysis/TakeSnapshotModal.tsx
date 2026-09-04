import React, { useState } from 'react';
import { Camera, X, CheckCircle2, Sparkles, Tag, FileText } from 'lucide-react';
import { SnapshotLabel, SnapshotType } from '../../types';
import { Modal } from '../ui/Modal';
import { formatRupee } from '../../utils/formatters';

interface TakeSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { label: SnapshotLabel; note?: string; snapshotType: SnapshotType }) => Promise<void>;
  currentNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export const TakeSnapshotModal: React.FC<TakeSnapshotModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentNetWorth,
  totalAssets,
  totalLiabilities,
}) => {
  const [snapshotType, setSnapshotType] = useState<SnapshotType>('manual');
  const [label, setLabel] = useState<string>('Manual');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labelPresets: { label: string; type: SnapshotType }[] = [
    { label: 'Manual Checkpoint', type: 'manual' },
    { label: 'Milestone', type: 'milestone' },
    { label: 'Month-End Review', type: 'monthly' },
    { label: 'Salary Inflow Check', type: 'manual' },
    { label: 'Market High Peak', type: 'milestone' },
    { label: 'Year-End Review', type: 'milestone' },
  ];

  const handleSelectPreset = (presetLabel: string, presetType: SnapshotType) => {
    setLabel(presetLabel);
    setSnapshotType(presetType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm({
        label: label.trim() || 'Manual',
        note: note.trim() || undefined,
        snapshotType,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Valuation Snapshot" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Valuation Summary Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 font-mono">
          <span className="text-[11px] text-slate-400 font-sans block">Current Net Worth Valuation</span>
          <div className="text-xl font-bold text-cyan-300">{formatRupee(currentNetWorth)}</div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
            <span>Assets: {formatRupee(totalAssets)}</span>
            <span>•</span>
            <span>Liabilities: {formatRupee(totalLiabilities)}</span>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-heading block">
            Snapshot Label Preset
          </label>
          <div className="flex flex-wrap gap-1.5">
            {labelPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleSelectPreset(p.label, p.type)}
                className={`px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                  label === p.label
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Label Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-heading block">
            Custom Title / Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white text-xs"
            placeholder="e.g. Q3 Portfolio Rebalance"
          />
        </div>

        {/* Optional Note */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-heading block">
            Note / Financial Event Context (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white text-xs resize-none"
            placeholder="e.g. SGB redemption proceeds credited; paid off ICICI credit card"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 cursor-pointer min-h-[40px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 cursor-pointer min-h-[40px]"
          >
            {isSubmitting ? 'Saving Checkpoint...' : 'Save Snapshot'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
