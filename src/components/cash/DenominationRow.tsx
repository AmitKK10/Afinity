import React, { useState } from 'react';
import {
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Layers,
  Coins,
  Banknote,
  Sparkles,
} from 'lucide-react';
import { CashDenomination } from '../../types';
import { formatRupee } from '../../utils/formatters';

export interface DenominationConfig {
  key: string; // Unique key e.g. '20_note', '20_coin'
  denomination: number;
  name: string;
  type: 'note' | 'coin' | 'both';
  hasOldNewVariants: boolean;
  oldLabel?: string;
  newLabel?: string;
  description?: string;
  colorClass: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    badge: string;
    gradient: string;
  };
}

export const DENOMINATION_CONFIGS_MAP: Record<string, DenominationConfig> = {
  '2000_note': {
    key: '2000_note',
    denomination: 2000,
    name: '₹2000 Currency Note',
    type: 'note',
    hasOldNewVariants: false,
    description: 'Magenta Note (Discontinued)',
    colorClass: {
      bg: 'bg-fuchsia-950/40',
      border: 'border-fuchsia-600/40',
      text: 'text-fuchsia-300',
      accent: 'bg-fuchsia-600',
      badge: 'bg-fuchsia-900/50 text-fuchsia-200 border-fuchsia-600/50',
      gradient: 'from-fuchsia-900/60 to-purple-900/30',
    },
  },
  '500_note': {
    key: '500_note',
    denomination: 500,
    name: '₹500 Currency Note',
    type: 'note',
    hasOldNewVariants: false,
    newLabel: 'Stone Grey Note',
    description: 'Stone Grey Red Fort Note',
    colorClass: {
      bg: 'bg-stone-900/70',
      border: 'border-stone-600/40',
      text: 'text-stone-200',
      accent: 'bg-stone-500',
      badge: 'bg-stone-800 text-stone-300 border-stone-600/50',
      gradient: 'from-stone-800/80 to-slate-900/50',
    },
  },
  '200_note': {
    key: '200_note',
    denomination: 200,
    name: '₹200 Currency Note',
    type: 'note',
    hasOldNewVariants: false,
    newLabel: 'Bright Yellow Note',
    description: 'Bright Yellow Sanchi Stupa Note',
    colorClass: {
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-600/40',
      text: 'text-yellow-300',
      accent: 'bg-yellow-500',
      badge: 'bg-yellow-900/50 text-yellow-200 border-yellow-500/50',
      gradient: 'from-yellow-900/60 to-amber-950/40',
    },
  },
  '100_note': {
    key: '100_note',
    denomination: 100,
    name: '₹100 Currency Note',
    type: 'note',
    hasOldNewVariants: true,
    oldLabel: 'Old ₹100 Blue-Green Note',
    newLabel: 'New ₹100 Lavender Note',
    description: 'Old Blue-Green & New Lavender Rani ki Vav',
    colorClass: {
      bg: 'bg-indigo-950/40',
      border: 'border-indigo-500/40',
      text: 'text-indigo-300',
      accent: 'bg-indigo-500',
      badge: 'bg-indigo-900/50 text-indigo-200 border-indigo-500/50',
      gradient: 'from-indigo-900/60 to-purple-950/40',
    },
  },
  '50_note': {
    key: '50_note',
    denomination: 50,
    name: '₹50 Currency Note',
    type: 'note',
    hasOldNewVariants: true,
    oldLabel: 'Old ₹50 Violet Note',
    newLabel: 'New ₹50 Fluorescent Blue Note',
    description: 'Old Violet & New Fluorescent Blue Hampi',
    colorClass: {
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-500/40',
      text: 'text-cyan-300',
      accent: 'bg-cyan-500',
      badge: 'bg-cyan-900/50 text-cyan-200 border-cyan-500/50',
      gradient: 'from-cyan-900/60 to-blue-950/40',
    },
  },
  '20_note': {
    key: '20_note',
    denomination: 20,
    name: '₹20 Currency Note',
    type: 'note',
    hasOldNewVariants: true,
    oldLabel: 'Old ₹20 Reddish-Orange Note',
    newLabel: 'New ₹20 Greenish-Yellow Note',
    description: 'Old Reddish-Orange & New Greenish-Yellow Ellora',
    colorClass: {
      bg: 'bg-orange-950/40',
      border: 'border-orange-500/40',
      text: 'text-orange-300',
      accent: 'bg-orange-500',
      badge: 'bg-orange-900/50 text-orange-200 border-orange-500/50',
      gradient: 'from-orange-900/60 to-amber-950/40',
    },
  },
  '20_coin': {
    key: '20_coin',
    denomination: 20,
    name: '₹20 Coin',
    type: 'coin',
    hasOldNewVariants: false,
    newLabel: '12-Edged Bimetallic ₹20 Coin',
    description: '12-Edged Polygon Bimetallic Brass/Nickel Coin',
    colorClass: {
      bg: 'bg-amber-950/40',
      border: 'border-amber-500/40',
      text: 'text-amber-300',
      accent: 'bg-amber-500',
      badge: 'bg-amber-900/60 text-amber-100 border-amber-500/50',
      gradient: 'from-amber-900/60 to-yellow-950/40',
    },
  },
  '10_note': {
    key: '10_note',
    denomination: 10,
    name: '₹10 Currency Note',
    type: 'note',
    hasOldNewVariants: true,
    oldLabel: 'Old ₹10 Orange-Brown Note',
    newLabel: 'New ₹10 Chocolate Brown Note',
    description: 'Old Orange-Brown & New Chocolate Brown Sun Temple',
    colorClass: {
      bg: 'bg-amber-950/40',
      border: 'border-amber-600/40',
      text: 'text-amber-300',
      accent: 'bg-amber-600',
      badge: 'bg-amber-900/50 text-amber-200 border-amber-600/50',
      gradient: 'from-amber-900/60 to-orange-950/40',
    },
  },
  '10_coin': {
    key: '10_coin',
    denomination: 10,
    name: '₹10 Coin',
    type: 'coin',
    hasOldNewVariants: true,
    oldLabel: 'Old 10/15 Rays ₹10 Coin',
    newLabel: 'New Rupee Symbol / Grain ₹10 Coin',
    description: 'Old 10/15 Rays & New Rupee Symbol Bimetallic Coin',
    colorClass: {
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-600/40',
      text: 'text-yellow-300',
      accent: 'bg-yellow-600',
      badge: 'bg-yellow-900/50 text-yellow-200 border-yellow-600/50',
      gradient: 'from-yellow-900/60 to-amber-950/40',
    },
  },
  '5_currency': {
    key: '5_currency',
    denomination: 5,
    name: '₹5 Note & Coin',
    type: 'both',
    hasOldNewVariants: true,
    oldLabel: 'Old ₹5 Green Note',
    newLabel: '₹5 Golden Nickel-Brass Coin',
    description: 'Old Green Tractor Note & Gold Nickel-Brass Coin',
    colorClass: {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-600/40',
      text: 'text-emerald-300',
      accent: 'bg-emerald-600',
      badge: 'bg-emerald-900/50 text-emerald-200 border-emerald-600/50',
      gradient: 'from-emerald-900/60 to-teal-950/40',
    },
  },
  '2_currency': {
    key: '2_currency',
    denomination: 2,
    name: '₹2 Coin & Note',
    type: 'both',
    hasOldNewVariants: true,
    oldLabel: 'Old Large Cupro-Nickel Coin / Note',
    newLabel: 'New ₹2 Stainless Steel Coin',
    description: 'Old Large Cupro-Nickel & New Stainless Steel',
    colorClass: {
      bg: 'bg-slate-900/60',
      border: 'border-slate-700',
      text: 'text-slate-200',
      accent: 'bg-slate-500',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      gradient: 'from-slate-800 to-slate-900',
    },
  },
  '1_currency': {
    key: '1_currency',
    denomination: 1,
    name: '₹1 Coin & Note',
    type: 'both',
    hasOldNewVariants: true,
    oldLabel: 'Old Large Stainless Steel Coin / Note',
    newLabel: 'New Small Grain ₹1 Coin',
    description: 'Old Large Steel & New Small Grain Coin',
    colorClass: {
      bg: 'bg-slate-900/60',
      border: 'border-slate-700',
      text: 'text-slate-200',
      accent: 'bg-slate-500',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      gradient: 'from-slate-800 to-slate-900',
    },
  },
};

export const STANDARD_DENOMINATIONS_LIST: DenominationConfig[] = [
  DENOMINATION_CONFIGS_MAP['2000_note'],
  DENOMINATION_CONFIGS_MAP['500_note'],
  DENOMINATION_CONFIGS_MAP['200_note'],
  DENOMINATION_CONFIGS_MAP['100_note'],
  DENOMINATION_CONFIGS_MAP['50_note'],
  DENOMINATION_CONFIGS_MAP['20_note'],
  DENOMINATION_CONFIGS_MAP['20_coin'],
  DENOMINATION_CONFIGS_MAP['10_note'],
  DENOMINATION_CONFIGS_MAP['10_coin'],
  DENOMINATION_CONFIGS_MAP['5_currency'],
  DENOMINATION_CONFIGS_MAP['2_currency'],
  DENOMINATION_CONFIGS_MAP['1_currency'],
];

// Backwards compatibility map by denomination number
export const DENOMINATION_CONFIGS: Record<number, DenominationConfig> = {
  2000: DENOMINATION_CONFIGS_MAP['2000_note'],
  500: DENOMINATION_CONFIGS_MAP['500_note'],
  200: DENOMINATION_CONFIGS_MAP['200_note'],
  100: DENOMINATION_CONFIGS_MAP['100_note'],
  50: DENOMINATION_CONFIGS_MAP['50_note'],
  20: DENOMINATION_CONFIGS_MAP['20_note'],
  10: DENOMINATION_CONFIGS_MAP['10_note'],
  5: DENOMINATION_CONFIGS_MAP['5_currency'],
  2: DENOMINATION_CONFIGS_MAP['2_currency'],
  1: DENOMINATION_CONFIGS_MAP['1_currency'],
};

export const getDenominationKey = (d: {
  denomination: number;
  type?: string;
  variantKey?: string;
}): string => {
  if (d.variantKey && DENOMINATION_CONFIGS_MAP[d.variantKey]) {
    return d.variantKey;
  }
  if (d.denomination === 20 && d.type === 'coin') return '20_coin';
  if (d.denomination === 20) return '20_note';
  if (d.denomination === 10 && d.type === 'coin') return '10_coin';
  if (d.denomination === 10) return '10_note';
  if (d.denomination === 5) return '5_currency';
  if (d.denomination === 2) return '2_currency';
  if (d.denomination === 1) return '1_currency';
  return `${d.denomination}_note`;
};

export const getDenominationConfig = (
  denom: number,
  type?: string,
  variantKey?: string
): DenominationConfig => {
  const key =
    variantKey ||
    (type === 'coin' && (denom === 20 || denom === 10)
      ? `${denom}_coin`
      : `${denom}_note`);
  const found =
    DENOMINATION_CONFIGS_MAP[key] ||
    DENOMINATION_CONFIGS_MAP[`${denom}_currency`] ||
    DENOMINATION_CONFIGS[denom];
  if (found) return found;

  return {
    key: key || String(denom),
    denomination: denom,
    name: `₹${denom}`,
    type: (type as 'note' | 'coin' | 'both') || 'note',
    hasOldNewVariants: false,
    colorClass: {
      bg: 'bg-slate-900/70',
      border: 'border-slate-700',
      text: 'text-slate-200',
      accent: 'bg-blue-500',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      gradient: 'from-slate-800 to-slate-900',
    },
  };
};

interface DenominationRowProps {
  denomination: CashDenomination;
  totalVaultCash: number;
  isEditable?: boolean;
  onChange?: (updated: CashDenomination) => void;
  configOverride?: DenominationConfig;
}

export const DenominationRow: React.FC<DenominationRowProps> = ({
  denomination,
  totalVaultCash,
  isEditable = false,
  onChange,
  configOverride,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config =
    configOverride ||
    getDenominationConfig(
      denomination.denomination,
      denomination.type,
      denomination.variantKey
    );

  const explicitVariantsSum = Number(denomination.oldCount || 0) + Number(denomination.newCount || 0);
  const totalCount =
    explicitVariantsSum > 0
      ? explicitVariantsSum
      : Number(denomination.count || 0);

  const oldCount = Number(denomination.oldCount || 0);
  const newCount =
    Number(denomination.newCount || 0) > 0
      ? Number(denomination.newCount)
      : Math.max(0, totalCount - oldCount);

  const value = denomination.denomination * totalCount;
  const percentage = totalVaultCash > 0 ? (value / totalVaultCash) * 100 : 0;

  const handleUpdateTotal = (delta: number) => {
    if (!onChange) return;
    const nextCount = Math.max(0, totalCount + delta);
    onChange({
      ...denomination,
      variantKey: config.key,
      type: config.type,
      count: nextCount,
      newCount: nextCount,
      oldCount: 0,
    });
  };

  const handleSetExactTotal = (count: number) => {
    if (!onChange) return;
    const clean = Math.max(0, count);
    onChange({
      ...denomination,
      variantKey: config.key,
      type: config.type,
      count: clean,
      newCount: clean,
      oldCount: 0,
    });
  };

  const handleUpdateVariant = (variant: 'old' | 'new', val: number) => {
    if (!onChange) return;
    const clean = Math.max(0, val);
    if (variant === 'old') {
      onChange({
        ...denomination,
        variantKey: config.key,
        type: config.type,
        oldCount: clean,
        newCount,
        count: clean + newCount,
      });
    } else {
      onChange({
        ...denomination,
        variantKey: config.key,
        type: config.type,
        newCount: clean,
        oldCount,
        count: oldCount + clean,
      });
    }
  };

  return (
    <div
      className={`rounded-2xl p-3 sm:p-4 border transition-all w-full max-w-full overflow-hidden ${config.colorClass.bg} ${config.colorClass.border} hover:border-amber-500/50`}
    >
      {/* Main Row View: Responsive 2-tier on mobile, 1-row on tablet/desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        {/* Tier 1: Badge + Name + Old/New Tag + Calculation string */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Denomination Visual Badge */}
          <div
            className={`w-13 sm:w-16 h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center font-mono border shadow-md flex-shrink-0 ${config.colorClass.badge}`}
          >
            <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
              ₹{denomination.denomination}
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider opacity-85 mt-0.5 font-bold">
              {config.type === 'coin'
                ? 'Coin'
                : config.type === 'both'
                ? 'Note/Coin'
                : 'Note'}
            </span>
          </div>

          {/* Name & Formula info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-slate-100 font-heading leading-tight">
                {config.name}
              </span>
              {config.hasOldNewVariants && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors active:scale-95 flex-shrink-0"
                >
                  <Layers className="w-3 h-3" />
                  <span>Old / New</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {/* Formula & Cash Percentage */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs text-slate-400 font-mono">
              <span className="text-slate-300 font-medium whitespace-nowrap">
                {totalCount} {config.type === 'coin' ? 'coins' : 'notes'}
              </span>
              <span className="text-slate-500">×</span>
              <span className="text-slate-300 whitespace-nowrap">₹{denomination.denomination}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-semibold whitespace-nowrap">
                {percentage.toFixed(1)}% of cash
              </span>
            </div>
          </div>
        </div>

        {/* Tier 2: Subtotal & +/- Controls (full width on mobile with divider, inline on desktop) */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 w-full sm:w-auto flex-shrink-0">
          {/* Subtotal Display */}
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-heading leading-none mb-0.5">
              Subtotal
            </span>
            <span className="text-base sm:text-lg font-black text-amber-300 font-mono tabular-nums leading-none">
              {formatRupee(value)}
            </span>
          </div>

          {/* Stepper Horizontal Quantity Control */}
          {isEditable && (
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 shadow-inner flex-shrink-0">
              <button
                type="button"
                onClick={() => handleUpdateTotal(-1)}
                disabled={totalCount <= 0}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-90"
                aria-label="Decrease count"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="number"
                min="0"
                value={totalCount === 0 ? '' : totalCount}
                placeholder="0"
                onChange={(e) =>
                  handleSetExactTotal(parseInt(e.target.value, 10) || 0)
                }
                className="w-11 sm:w-12 h-8 text-center bg-transparent text-sm font-black text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 rounded"
              />

              <button
                type="button"
                onClick={() => handleUpdateTotal(1)}
                className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold cursor-pointer transition-all active:scale-90 shadow-sm shadow-amber-500/20"
                aria-label="Increase count"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar for Share of Cash */}
      <div className="mt-3 w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden border border-slate-900">
        <div
          className={`h-full rounded-full transition-all duration-500 ${config.colorClass.accent}`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      {/* Expanded Old vs New Variant Breakdown */}
      {config.hasOldNewVariants && isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Old Variant */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-slate-300 block truncate">
                {config.oldLabel || 'Old Edition Variant'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block whitespace-nowrap">
                {oldCount} × ₹{denomination.denomination} ={' '}
                {formatRupee(oldCount * denomination.denomination)}
              </span>
            </div>

            {isEditable ? (
              <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpdateVariant('old', oldCount - 1)}
                  disabled={oldCount <= 0}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center cursor-pointer active:scale-90"
                  aria-label="Decrease old count"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={oldCount || ''}
                  placeholder="0"
                  onChange={(e) =>
                    handleUpdateVariant(
                      'old',
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  className="w-9 h-6 text-center bg-transparent rounded text-xs font-mono text-white font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateVariant('old', oldCount + 1)}
                  className="w-6 h-6 rounded bg-amber-500/80 hover:bg-amber-500 text-slate-950 flex items-center justify-center font-bold cursor-pointer active:scale-90"
                  aria-label="Increase old count"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="font-mono font-bold text-slate-200">
                {oldCount}
              </span>
            )}
          </div>

          {/* New Variant */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-slate-300 block truncate">
                {config.newLabel || 'New Edition Variant'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block whitespace-nowrap">
                {newCount} × ₹{denomination.denomination} ={' '}
                {formatRupee(newCount * denomination.denomination)}
              </span>
            </div>

            {isEditable ? (
              <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpdateVariant('new', newCount - 1)}
                  disabled={newCount <= 0}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center cursor-pointer active:scale-90"
                  aria-label="Decrease new count"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={newCount || ''}
                  placeholder="0"
                  onChange={(e) =>
                    handleUpdateVariant(
                      'new',
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  className="w-9 h-6 text-center bg-transparent rounded text-xs font-mono text-white font-bold focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateVariant('new', newCount + 1)}
                  className="w-6 h-6 rounded bg-amber-500/80 hover:bg-amber-500 text-slate-950 flex items-center justify-center font-bold cursor-pointer active:scale-90"
                  aria-label="Increase new count"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="font-mono font-bold text-slate-200">
                {newCount}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
