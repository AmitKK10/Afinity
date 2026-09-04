import React from 'react';
import { Wallet, ArrowRight, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import { InvestmentHolding, DigitalWallet } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { Badge } from '../ui/Badge';
import { formatRupee } from '../../utils/formatters';

interface GrowwBalanceCardProps {
  growwWallet?: DigitalWallet;
  holdings: InvestmentHolding[];
  onAddFundsClick?: () => void;
}

export const GrowwBalanceCard: React.FC<GrowwBalanceCardProps> = ({
  growwWallet,
  holdings,
  onAddFundsClick,
}) => {
  const growwCashBalance = growwWallet ? Number(growwWallet.balance || 0) : 0;

  const growwHoldings = holdings.filter(
    (h) => (h.broker || h.platform || '').toLowerCase() === 'groww' && (h.status === 'active' || !h.status)
  );

  const growwStocks = growwHoldings.filter((h) => {
    const t = (h.assetType || h.type || '').toUpperCase();
    return t === 'STOCK' || t === 'STOCKS';
  });

  const growwETFs = growwHoldings.filter((h) => {
    const t = (h.assetType || h.type || '').toUpperCase();
    return t === 'ETF' || t === 'ETFS';
  });

  const growwMFs = growwHoldings.filter((h) => {
    const t = (h.assetType || h.type || '').toUpperCase();
    return t === 'MUTUAL_FUND' || t === 'MUTUAL_FUNDS';
  });

  const stocksValue = growwStocks.reduce((sum, h) => {
    const qty = Number(h.quantity !== undefined ? h.quantity : h.unitsHeld || 0);
    const currPrice = Number(h.currentPrice || 0);
    const val = h.currentValue !== undefined && h.currentValue > 0 ? Number(h.currentValue) : qty * currPrice;
    return sum + val;
  }, 0);

  const etfsValue = growwETFs.reduce((sum, h) => {
    const qty = Number(h.quantity !== undefined ? h.quantity : h.unitsHeld || 0);
    const currPrice = Number(h.currentPrice || 0);
    const val = h.currentValue !== undefined && h.currentValue > 0 ? Number(h.currentValue) : qty * currPrice;
    return sum + val;
  }, 0);

  const mfValue = growwMFs.reduce((sum, h) => {
    const qty = Number(h.quantity !== undefined ? h.quantity : h.unitsHeld || 0);
    const currPrice = Number(h.currentPrice || 0);
    const val = h.currentValue !== undefined && h.currentValue > 0 ? Number(h.currentValue) : qty * currPrice;
    return sum + val;
  }, 0);

  const totalGrowwAssetValue = stocksValue + etfsValue + mfValue;

  return (
    <div
      id="groww-account-summary-card"
      className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#062c24] via-[#091f24] to-[#08121e] border border-emerald-500/40 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-heading font-black text-sm shadow-md">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-heading">
                  Groww Trading Account
                </h3>
                <Badge variant="emerald" size="sm">
                  BROKER
                </Badge>
              </div>
              <span className="text-xs text-slate-400">
                Nextbillion Technology • Primary Investment Platform
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Separated from Net Worth double counting</span>
          </div>
        </div>

        {/* Balance Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Uninvested Cash */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/40 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-300">
                Groww Uninvested Cash
              </span>
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <MoneyDisplay amount={growwCashBalance} size="lg" />
            <span className="text-[10px] text-slate-400 block mt-1">
              Available in trading wallet for immediate buy orders
            </span>
          </div>

          {/* Direct Stocks */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-300">
                Direct Stocks on Groww
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {growwStocks.length} holdings
              </span>
            </div>
            <MoneyDisplay amount={stocksValue} size="md" />
            <span className="text-[10px] text-slate-400 block mt-1">
              Portfolio valuation in equities
            </span>
          </div>

          {/* Mutual Funds */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-300">
                Mutual Funds on Groww
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {growwMFs.length} schemes
              </span>
            </div>
            <MoneyDisplay amount={mfValue} size="md" />
            <span className="text-[10px] text-slate-400 block mt-1">
              SIP & lump sum MF units
            </span>
          </div>
        </div>

        {/* Note on Accounting Isolation */}
        <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Independent Accounting:</strong> Groww Cash (
            {formatRupee(growwCashBalance)}) is categorized under Wallets & Liquid Assets, while stocks (
            {formatRupee(stocksValue)}) and mutual funds ({formatRupee(mfValue)}) are calculated from market holdings.
            Combined Groww asset footprint: <strong className="text-white font-mono">{formatRupee(growwCashBalance + totalGrowwAssetValue)}</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
