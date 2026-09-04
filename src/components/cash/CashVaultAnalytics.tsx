import React from 'react';
import {
  PieChart as PieChartIcon,
  Banknote,
  Coins,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { FinancialCard } from '../ui/FinancialCard';
import { ProgressBar } from '../ui/ProgressBar';
import { formatRupee } from '../../utils/formatters';
import { CashDenomination } from '../../types';

interface CashVaultAnalyticsProps {
  denominations: CashDenomination[];
  totalCash: number;
}

export const CashVaultAnalytics: React.FC<CashVaultAnalyticsProps> = ({
  denominations,
  totalCash,
}) => {
  // Categorize
  let highValueNotes = 0; // ₹2000, ₹500, ₹200
  let midValueNotes = 0; // ₹100, ₹50
  let smallNotesAndCoins = 0; // ₹20, ₹10, ₹5, ₹2, ₹1

  let totalNotesCount = 0;
  let totalCoinsCount = 0;

  denominations.forEach((d) => {
    const val = Number(d.denomination) * Number(d.count || 0);
    if (d.denomination >= 200) {
      highValueNotes += val;
    } else if (d.denomination >= 50) {
      midValueNotes += val;
    } else {
      smallNotesAndCoins += val;
    }

    if (d.denomination <= 5) {
      totalCoinsCount += Number(d.count || 0);
    } else {
      totalNotesCount += Number(d.count || 0);
    }
  });

  const validTotal = totalCash > 0 ? totalCash : 1;
  const highPct = Math.round((highValueNotes / validTotal) * 1000) / 10;
  const midPct = Math.round((midValueNotes / validTotal) * 1000) / 10;
  const smallPct = Math.round((smallNotesAndCoins / validTotal) * 1000) / 10;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FinancialCard className="p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-300 font-heading">
              High Value (₹500 / ₹200)
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {highPct}%
            </span>
          </div>
          <span className="text-base font-bold text-slate-100 font-mono">
            {formatRupee(highValueNotes)}
          </span>
          <div className="mt-2">
            <ProgressBar value={highPct} max={100} variant="gold" size="sm" />
          </div>
        </FinancialCard>

        <FinancialCard className="p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-300 font-heading">
              Mid Currency (₹100 / ₹50)
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {midPct}%
            </span>
          </div>
          <span className="text-base font-bold text-slate-100 font-mono">
            {formatRupee(midValueNotes)}
          </span>
          <div className="mt-2">
            <ProgressBar value={midPct} max={100} variant="blue" size="sm" />
          </div>
        </FinancialCard>

        <FinancialCard className="p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-300 font-heading">
              Change & Coins (₹20 to ₹1)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {smallPct}%
            </span>
          </div>
          <span className="text-base font-bold text-slate-100 font-mono">
            {formatRupee(smallNotesAndCoins)}
          </span>
          <div className="mt-2">
            <ProgressBar value={smallPct} max={100} variant="emerald" size="sm" />
          </div>
        </FinancialCard>
      </div>
    </div>
  );
};
