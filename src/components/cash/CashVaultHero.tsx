import React from 'react';
import {
  Banknote,
  Plus,
  ArrowRightLeft,
  Landmark,
  Coins,
  Clock,
  Sparkles,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { Badge } from '../ui/Badge';
import { formatRupee } from '../../utils/formatters';
import { CashHoldingAccount } from '../../types';

interface CashVaultHeroProps {
  totalCash: number;
  totalNotes: number;
  totalCoins: number;
  vaults: CashHoldingAccount[];
  selectedVaultId: string | 'all';
  onSelectVault: (vaultId: string | 'all') => void;
  onOpenDenominationEditor: () => void;
  onOpenAddVault: () => void;
  onOpenTransfer: () => void;
  onOpenAtmWithdrawal: () => void;
  lastUpdatedDateString?: string;
}

export const CashVaultHero: React.FC<CashVaultHeroProps> = ({
  totalCash,
  totalNotes,
  totalCoins,
  vaults,
  selectedVaultId,
  onSelectVault,
  onOpenDenominationEditor,
  onOpenAddVault,
  onOpenTransfer,
  onOpenAtmWithdrawal,
  lastUpdatedDateString = '19 Aug 2026 • 11:42 PM',
}) => {
  const currentVault = selectedVaultId === 'all'
    ? null
    : vaults.find((v) => v.id === selectedVaultId);

  const displayBalance = currentVault ? Number(currentVault.balance || 0) : totalCash;

  return (
    <div
      id="afinity-cash-vault-hero"
      className="rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#241a0e] via-[#14121a] to-[#0a0d18] border border-amber-500/30 shadow-2xl relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-heading block">
                Physical Cash Vault
              </span>
              <span className="text-[11px] text-slate-400">
                {currentVault ? currentVault.location || currentVault.name : `Combined Across ${vaults.length} Vault Locations`}
              </span>
            </div>
          </div>

          {/* Timestamp Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/20 text-slate-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{lastUpdatedDateString}</span>
          </div>
        </div>

        {/* Big Balance Display */}
        <div className="flex flex-wrap items-baseline justify-between gap-3 py-1">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
              {currentVault ? currentVault.name : 'Total Physical In-Hand Cash'}
            </span>
            <MoneyDisplay amount={displayBalance} size="2xl" colorOverride="gold" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDenominationEditor}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-900/30 transition-all active:scale-95 cursor-pointer font-heading"
            >
              <Edit3 className="w-4 h-4" />
              <span>Count & Adjust Notes</span>
            </button>
          </div>
        </div>

        {/* Vault Stats Bar: Total Notes, Coins & Large Currency */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Paper Banknotes</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Banknote className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm sm:text-base font-bold text-slate-100 tabular-nums">
                {totalNotes} Notes
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Coins in Vault</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-sm sm:text-base font-bold text-slate-100 tabular-nums">
                {totalCoins} Coins
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Locations</span>
            <span className="text-sm sm:text-base font-bold text-slate-100 block mt-0.5">
              {vaults.length} Vaults
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40">
            <span className="text-[10px] text-amber-300 uppercase tracking-wider block">Denomination Types</span>
            <span className="text-sm sm:text-base font-bold text-amber-300 block mt-0.5">
              10 INR Series
            </span>
          </div>
        </div>

        {/* Vault Switcher & Quick Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => onSelectVault('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-heading ${
                selectedVaultId === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              All Vaults ({formatRupee(totalCash)})
            </button>

            {vaults.map((vault) => (
              <button
                key={vault.id}
                type="button"
                onClick={() => onSelectVault(vault.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-heading ${
                  selectedVaultId === vault.id
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {vault.name} ({formatRupee(vault.balance)})
              </button>
            ))}

            <button
              type="button"
              onClick={onOpenAddVault}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 flex items-center gap-1 cursor-pointer font-heading"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Vault</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenTransfer}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer font-heading transition-all"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Transfer</span>
            </button>

            <button
              type="button"
              onClick={onOpenAtmWithdrawal}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer font-heading transition-all"
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-400" />
              <span>ATM Withdrawal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
