import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote,
  Coins,
  Check,
  RotateCcw,
  Layers,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  X,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { CashDenomination, CashHoldingAccount } from '../../types';
import { formatRupee } from '../../utils/formatters';
import {
  STANDARD_DENOMINATIONS_LIST,
  DENOMINATION_CONFIGS_MAP,
  DenominationConfig,
  getDenominationKey,
} from './DenominationRow';
import { useFinancialData } from '../../context/FinancialDataContext';

interface CashDenominationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultId?: string;
  onSuccess?: (message: string) => void;
}

export const CashDenominationEditorModal: React.FC<CashDenominationEditorModalProps> = ({
  isOpen,
  onClose,
  vaultId,
  onSuccess,
}) => {
  const { cashHoldings, updateCashDenominations } = useFinancialData();
  const [selectedVaultId, setSelectedVaultId] = useState<string>(vaultId || '');
  const [isDetailedVariantMode, setIsDetailedVariantMode] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'coins'>('all');

  // Active vault
  const activeVaults = useMemo(
    () => cashHoldings.filter((c) => c.status === 'active'),
    [cashHoldings]
  );
  const targetVault = useMemo(
    () => activeVaults.find((v) => v.id === selectedVaultId) || activeVaults[0] || null,
    [activeVaults, selectedVaultId]
  );

  // Local state indexed by denomination key (e.g. '2000_note', '20_note', '20_coin')
  const [denomState, setDenomState] = useState<
    Record<string, { count: number; oldCount: number; newCount: number }>
  >({});

  // Initialize or reset denom state whenever modal opens or target vault changes
  useEffect(() => {
    if (!isOpen) return;
    setSaveError(null);
    if (vaultId) {
      setSelectedVaultId(vaultId);
    } else if (activeVaults.length > 0 && (!selectedVaultId || !activeVaults.some((v) => v.id === selectedVaultId))) {
      setSelectedVaultId(activeVaults[0].id);
    }
  }, [isOpen, vaultId, activeVaults.length, selectedVaultId]);

  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, { count: number; oldCount: number; newCount: number }> = {};

    STANDARD_DENOMINATIONS_LIST.forEach((config) => {
      const found = targetVault?.denominations?.find((x) => {
        if (x.variantKey) return x.variantKey === config.key;
        if (x.denomination === config.denomination) {
          if (config.key === '20_coin' || config.key === '10_coin') {
            return x.type === 'coin';
          }
          if (config.key === '20_note' || config.key === '10_note') {
            return x.type === 'note' || !x.type;
          }
          return true;
        }
        return false;
      });

      if (found) {
        const o = Number(found.oldCount || 0);
        const explicitSum = o + Number(found.newCount || 0);
        const total = Number(found.count !== undefined ? found.count : explicitSum);
        const n = Number(found.newCount !== undefined && found.newCount > 0 ? found.newCount : Math.max(0, total - o));
        initial[config.key] = {
          count: total,
          oldCount: o,
          newCount: n,
        };
      } else {
        initial[config.key] = { count: 0, oldCount: 0, newCount: 0 };
      }
    });

    setDenomState(initial);
  }, [isOpen, targetVault?.id, targetVault?.updatedAt, targetVault?.lastUpdated]);

  // Derived real-time calculations
  const { totalCash, totalNotes, totalCoins } = useMemo(() => {
    let cashSum = 0;
    let notesSum = 0;
    let coinsSum = 0;

    STANDARD_DENOMINATIONS_LIST.forEach((config) => {
      const item = denomState[config.key];
      if (!item) return;
      const count = item.count;
      cashSum += config.denomination * count;

      if (config.type === 'coin') {
        coinsSum += count;
      } else if (config.type === 'both') {
        notesSum += item.oldCount;
        coinsSum += item.newCount;
      } else {
        notesSum += count;
      }
    });

    return { totalCash: cashSum, totalNotes: notesSum, totalCoins: coinsSum };
  }, [denomState]);

  // Fast count updates
  const handleUpdateCount = (key: string, delta: number) => {
    const config = DENOMINATION_CONFIGS_MAP[key];
    if (!config) return;

    setDenomState((prev) => {
      const current = prev[key] || { count: 0, oldCount: 0, newCount: 0 };
      const nextTotal = Math.max(0, current.count + delta);

      if (config.hasOldNewVariants) {
        const nextNew = Math.max(0, current.newCount + delta);
        return {
          ...prev,
          [key]: {
            oldCount: current.oldCount,
            newCount: nextNew,
            count: current.oldCount + nextNew,
          },
        };
      }

      return {
        ...prev,
        [key]: {
          oldCount: 0,
          newCount: nextTotal,
          count: nextTotal,
        },
      };
    });
  };

  const handleSetExact = (key: string, val: number) => {
    const clean = Math.max(0, val);
    const config = DENOMINATION_CONFIGS_MAP[key];
    if (!config) return;

    setDenomState((prev) => {
      const current = prev[key] || { count: 0, oldCount: 0, newCount: 0 };
      if (config.hasOldNewVariants) {
        const remainingNew = clean - current.oldCount >= 0 ? clean - current.oldCount : clean;
        const finalOld = clean - current.oldCount >= 0 ? current.oldCount : 0;
        return {
          ...prev,
          [key]: {
            oldCount: finalOld,
            newCount: remainingNew,
            count: clean,
          },
        };
      }

      return {
        ...prev,
        [key]: {
          oldCount: 0,
          newCount: clean,
          count: clean,
        },
      };
    });
  };

  const handleUpdateVariant = (key: string, variant: 'old' | 'new', val: number) => {
    const clean = Math.max(0, val);
    setDenomState((prev) => {
      const current = prev[key] || { count: 0, oldCount: 0, newCount: 0 };
      const nextOld = variant === 'old' ? clean : current.oldCount;
      const nextNew = variant === 'new' ? clean : current.newCount;
      return {
        ...prev,
        [key]: {
          oldCount: nextOld,
          newCount: nextNew,
          count: nextOld + nextNew,
        },
      };
    });
  };

  const handleClearAll = () => {
    const cleared: Record<string, { count: number; oldCount: number; newCount: number }> = {};
    STANDARD_DENOMINATIONS_LIST.forEach((config) => {
      cleared[config.key] = { count: 0, oldCount: 0, newCount: 0 };
    });
    setDenomState(cleared);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload: CashDenomination[] = STANDARD_DENOMINATIONS_LIST.map((config) => {
        const item = denomState[config.key] || { count: 0, oldCount: 0, newCount: 0 };
        const count = Math.max(0, Number(item.count || 0));
        const oldCount = Math.max(0, Number(item.oldCount || 0));
        const newCount = Math.max(0, Number(item.newCount || 0));
        return {
          denomination: config.denomination,
          count,
          oldCount,
          newCount,
          type: config.type,
          variantKey: config.key,
        };
      });

      const vaultIdToUpdate = targetVault?.id || selectedVaultId || (activeVaults[0]?.id ?? '');
      await updateCashDenominations(vaultIdToUpdate, payload);

      const targetVaultName = targetVault?.name || 'Physical Cash Vault';
      onSuccess?.(`✓ Cash denominations saved for ${targetVaultName} (Total: ${formatRupee(totalCash)})`);
      onClose();
    } catch (err: any) {
      console.error('Failed to save cash denominations:', err);
      setSaveError(err?.message || 'Failed to save cash denominations to vault. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const visibleDenominations = useMemo(() => {
    if (activeTab === 'notes') {
      return STANDARD_DENOMINATIONS_LIST.filter((c) => c.type === 'note' || c.type === 'both');
    }
    if (activeTab === 'coins') {
      return STANDARD_DENOMINATIONS_LIST.filter((c) => c.type === 'coin' || c.type === 'both');
    }
    return STANDARD_DENOMINATIONS_LIST;
  }, [activeTab]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physical Cash Denominations"
      subtitle="Recount and reconcile in-hand banknotes and coins"
      maxWidth="max-w-xl w-full"
    >
      <div className="space-y-4 text-slate-100 pb-2 w-full max-w-full overflow-hidden">
        {/* Visible Error Banner if Save or Action Fails */}
        {saveError && (
          <div className="rounded-xl p-3 bg-rose-950/90 border border-rose-600/60 flex items-start gap-2.5 text-xs text-rose-200 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold font-heading">Failed to Save Cash Denominations</p>
              <p className="mt-0.5 text-rose-300">{saveError}</p>
            </div>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="text-rose-400 hover:text-rose-100 cursor-pointer p-0.5 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Vault Switcher */}
        {activeVaults.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto w-full scrollbar-none">
            {activeVaults.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVaultId(v.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex-shrink-0 ${
                  targetVault?.id === v.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {v.name} ({formatRupee(v.balance)})
              </button>
            ))}
          </div>
        )}

        {/* Sticky Real-Time Live Total Banner */}
        <div className="sticky top-0 z-20 rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-[#2c1d0c] via-[#1a1524] to-[#0d1222] border border-amber-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 font-heading tracking-wider block">
              Calculated Physical Cash Total
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tabular-nums leading-tight block">
              {formatRupee(totalCash)}
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-300 font-mono">
              <span className="flex items-center gap-1">
                <Banknote className="w-3 h-3 text-amber-400" />
                {totalNotes} banknotes
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-yellow-400" />
                {totalCoins} coins
              </span>
            </div>
          </div>

          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-500/20">
            <button
              type="button"
              onClick={() => setIsDetailedVariantMode(!isDetailedVariantMode)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                isDetailedVariantMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isDetailedVariantMode ? 'Old / New Split: ON' : 'Old / New Split: OFF'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs w-full">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer text-center truncate ${
              activeTab === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All (12)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer text-center truncate ${
              activeTab === 'notes'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Banknotes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coins')}
            className={`flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer text-center truncate ${
              activeTab === 'coins'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Coins
          </button>
        </div>

        {/* Denomination Rows List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto overflow-x-hidden pr-1 w-full max-w-full">
          {visibleDenominations.map((config) => {
            const item = denomState[config.key] || { count: 0, oldCount: 0, newCount: 0 };
            const subtotal = config.denomination * item.count;

            return (
              <div
                key={config.key}
                className={`rounded-2xl p-3 sm:p-3.5 border transition-all w-full max-w-full overflow-hidden ${config.colorClass.bg} ${config.colorClass.border}`}
              >
                {/* Main Denomination Header & Steppers */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-11 sm:w-12 h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center font-mono font-black text-xs border flex-shrink-0 ${config.colorClass.badge}`}
                    >
                      <span>₹{config.denomination}</span>
                      <span className="text-[8px] uppercase tracking-wider font-bold opacity-80">
                        {config.type === 'coin' ? 'Coin' : config.type === 'both' ? 'Note/Coin' : 'Note'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-100 font-heading block truncate">
                        {config.name}
                      </span>
                      <span className="text-[11px] text-amber-300/90 font-mono font-bold block">
                        {item.count} × ₹{config.denomination} = {formatRupee(subtotal)}
                      </span>
                      {config.description && (
                        <span className="text-[10px] text-slate-400 block truncate">
                          {config.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Touch Controls */}
                  <div className="flex items-center justify-end gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 flex-shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleUpdateCount(config.key, -1)}
                      disabled={item.count <= 0}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center font-bold disabled:opacity-30 cursor-pointer active:scale-90"
                      aria-label="Decrease count"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={item.count === 0 ? '' : item.count}
                      placeholder="0"
                      onChange={(e) => handleSetExact(config.key, parseInt(e.target.value, 10) || 0)}
                      className="w-12 sm:w-14 h-7 sm:h-8 text-center bg-transparent text-xs sm:text-sm font-black text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 rounded"
                    />

                    <button
                      type="button"
                      onClick={() => handleUpdateCount(config.key, 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold cursor-pointer active:scale-90"
                      aria-label="Increase count"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Fast Bundle Quick-Add Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 w-full">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mr-0.5">Quick:</span>
                  {[+5, +10, +20, +50, +100].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => handleUpdateCount(config.key, inc)}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-white cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      +{inc}
                    </button>
                  ))}
                  {item.count > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetExact(config.key, 0)}
                      className="px-2 py-0.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[10px] font-mono text-rose-300 cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      Zero
                    </button>
                  )}
                </div>

                {/* Old vs New Variant Inputs if Detailed Mode is ON */}
                {isDetailedVariantMode && config.hasOldNewVariants && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/70 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs w-full">
                    {/* Old Edition */}
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2 min-w-0 w-full">
                      <span className="text-[11px] text-slate-400 font-semibold truncate flex-1 min-w-0" title={config.oldLabel || 'Old Edition'}>
                        {config.oldLabel || 'Old Edition'}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={item.oldCount || ''}
                          placeholder="0"
                          onChange={(e) =>
                            handleUpdateVariant(config.key, 'old', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-12 h-6 bg-slate-900 border border-slate-700 rounded text-center text-xs font-mono text-white font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* New Edition */}
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2 min-w-0 w-full">
                      <span className="text-[11px] text-slate-400 font-semibold truncate flex-1 min-w-0" title={config.newLabel || 'New Edition'}>
                        {config.newLabel || 'New Edition'}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={item.newCount || ''}
                          placeholder="0"
                          onChange={(e) =>
                            handleUpdateVariant(config.key, 'new', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-12 h-6 bg-slate-900 border border-slate-700 rounded text-center text-xs font-mono text-white font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky Action Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center gap-2.5 sm:gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs cursor-pointer font-heading"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-[2] py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-95 disabled:opacity-50 px-2 min-w-0"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{isSaving ? 'Saving Vault...' : `Save ${formatRupee(totalCash)} to Vault`}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
