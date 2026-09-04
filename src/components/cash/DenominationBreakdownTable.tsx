import React from 'react';
import {
  Banknote,
  Coins,
  Layers,
  Sparkles,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DenominationRow,
  STANDARD_DENOMINATIONS_LIST,
  getDenominationKey,
} from './DenominationRow';
import { CashDenomination } from '../../types';
import { Badge } from '../ui/Badge';
import { formatRupee } from '../../utils/formatters';

interface DenominationBreakdownTableProps {
  denominations: CashDenomination[];
  totalCash: number;
  isEditable?: boolean;
  onUpdateDenomination?: (updated: CashDenomination) => void;
  onOpenEditAll?: () => void;
}

export const DenominationBreakdownTable: React.FC<DenominationBreakdownTableProps> = ({
  denominations,
  totalCash,
  isEditable = false,
  onUpdateDenomination,
  onOpenEditAll,
}) => {
  // Merge provided denominations with full standard list so all denominations (including 20 note & 20 coin) are present
  const fullDenominationsList: CashDenomination[] = STANDARD_DENOMINATIONS_LIST.map((config) => {
    const existing = denominations.find((d) => {
      if (d.variantKey) return d.variantKey === config.key;
      if (d.denomination === config.denomination) {
        if (config.key === '20_coin' || config.key === '10_coin') {
          return d.type === 'coin';
        }
        if (config.key === '20_note' || config.key === '10_note') {
          return d.type === 'note' || !d.type;
        }
        return true;
      }
      return false;
    });

    if (existing) {
      return {
        ...existing,
        variantKey: config.key,
        type: config.type,
      };
    }

    return {
      denomination: config.denomination,
      count: 0,
      oldCount: 0,
      newCount: 0,
      type: config.type,
      variantKey: config.key,
    };
  });

  const totalItemsCount = fullDenominationsList.reduce((sum, d) => sum + Number(d.count || 0), 0);

  return (
    <div id="afinity-denomination-breakdown" className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100 font-heading">
              Denomination Inventory
            </h3>
            <Badge variant="gold" size="sm">
              {totalItemsCount} Total Units
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical banknotes & coins separated by face value, coin/currency type, and series
          </p>
        </div>

        {onOpenEditAll && (
          <button
            type="button"
            onClick={onOpenEditAll}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer font-heading transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Full Recount</span>
          </button>
        )}
      </div>

      {/* Denomination Rows */}
      <div className="space-y-2.5">
        {fullDenominationsList.map((denom) => (
          <DenominationRow
            key={denom.variantKey || `${denom.denomination}_${denom.type || 'note'}`}
            denomination={denom}
            totalVaultCash={totalCash}
            isEditable={isEditable}
            onChange={onUpdateDenomination}
          />
        ))}
      </div>
    </div>
  );
};
