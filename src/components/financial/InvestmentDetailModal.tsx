import React from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Edit2,
  History,
  Archive,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  Layers,
  AlertCircle,
  Coins,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { InvestmentHolding } from '../../types';
import { InvestmentBrandBadge } from '../brand/InvestmentBrandBadge';
import { Badge } from '../ui/Badge';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { formatRupee, formatPercentage, formatPriceUpdatedTime } from '../../utils/formatters';
import { calculateInvestmentProfitLoss, calculateInvestmentReturnPercentage } from '../../services/calculations';
import { cn } from '../../utils/cn';

interface InvestmentDetailModalProps {
  isOpen: boolean;
  holding: InvestmentHolding | null;
  onClose: () => void;
  onUpdatePrice: (holding: InvestmentHolding) => void;
  onEdit: (holding: InvestmentHolding) => void;
  onViewHistory: (holding: InvestmentHolding) => void;
  onArchive: (id: string) => void;
  onRestore?: (id: string) => void;
}

export const InvestmentDetailModal: React.FC<InvestmentDetailModalProps> = ({
  isOpen,
  holding,
  onClose,
  onUpdatePrice,
  onEdit,
  onViewHistory,
  onArchive,
  onRestore,
}) => {
  if (!isOpen || !holding) return null;

  const rawType = (holding.assetType || holding.type || 'other').toString().toUpperCase();
  const isStock = rawType === 'STOCK' || rawType === 'STOCKS';
  const isETF = rawType === 'ETF';
  const isMF = rawType === 'MUTUAL_FUND' || rawType === 'MUTUAL_FUNDS';
  const isUnlisted = rawType === 'UNLISTED_EQUITY' || holding.priceStatus === 'unlisted';
  const isGold = rawType === 'GOLD';
  const isSGB = rawType === 'SGB';

  const qty = Number(holding.quantity !== undefined ? holding.quantity : holding.unitsHeld || 0);
  const avgPrice = Number(holding.averageBuyPrice || 0);
  const currPrice = Number(holding.currentPrice || 0);

  const investedAmount =
    holding.investedAmount !== undefined && holding.investedAmount > 0
      ? Number(holding.investedAmount)
      : Math.round(qty * avgPrice * 100) / 100;

  const currentValue =
    holding.currentValue !== undefined && holding.currentValue > 0
      ? Number(holding.currentValue)
      : Math.round(qty * currPrice * 100) / 100;

  const pnl = calculateInvestmentProfitLoss(investedAmount, currentValue);
  const pnlPct = calculateInvestmentReturnPercentage(investedAmount, currentValue);
  const isPositive = pnl >= 0;

  const brokerName = holding.broker || holding.platform || 'Direct';
  const unitLabel =
    holding.unit || (isStock ? 'shares' : isETF ? 'units' : isMF ? 'units' : isGold ? 'grams' : isSGB ? 'units' : 'units');

  const sourceName = (holding.priceSource || 'MANUAL').toUpperCase();
  const isMarket = sourceName === 'AMFI' || sourceName === 'NSE' || sourceName === 'BSE' || sourceName === 'MARKET';
  const priceTime = formatPriceUpdatedTime(holding.priceUpdatedAt || holding.updatedAt || holding.lastUpdated);
  const isArchived = holding.status === 'archived';
  const isFailed = holding.priceStatus === 'failed';
  const isStale = holding.priceStatus === 'stale';

  return (
    <div
      id="investment-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#0d1629] border border-slate-700 shadow-2xl p-5 sm:p-6 space-y-5 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <InvestmentBrandBadge
              name={holding.name}
              symbol={holding.symbol}
              assetType={rawType}
              size="lg"
            />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white font-heading truncate">
                {holding.displayName || holding.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {holding.symbol && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                    {holding.symbol}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium">
                  {brokerName}
                </span>
                {isETF && (
                  <Badge variant="blue" size="sm">
                    ETF
                  </Badge>
                )}
                {isUnlisted && (
                  <Badge variant="purple" size="sm">
                    Unlisted Equity
                  </Badge>
                )}
                {isArchived && (
                  <Badge variant="gold" size="sm">
                    Archived
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail modal"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Valuation & Profit Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a1426] to-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Current Market Valuation</span>
            <span className={cn(
              'text-xs font-bold font-mono px-2 py-0.5 rounded-md border',
              isPositive ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' : 'bg-rose-950/60 text-rose-300 border-rose-800/50'
            )}>
              {isPositive ? '+' : ''}{formatPercentage(pnlPct, true)} Return
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <MoneyDisplay amount={currentValue} size="2xl" />
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Profit / Loss</span>
              <span className={cn(
                'text-sm sm:text-base font-bold font-mono',
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              )}>
                {isPositive ? '+' : ''}{formatRupee(pnl)}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          {/* Quantity */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Units / Quantity</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {qty.toLocaleString('en-IN')} {unitLabel}
            </span>
          </div>

          {/* Average Cost */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">
              {isStock || isETF ? 'Avg Buy Price' : isMF ? 'Avg NAV' : isUnlisted ? 'Buy Price' : 'Avg Cost'}
            </span>
            <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
              ₹{avgPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Total Invested */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Total Invested</span>
            <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
              {formatRupee(investedAmount)}
            </span>
          </div>

          {/* Current Market Price */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">
              {isStock ? 'CMP (NSE)' : isETF ? 'CMP (NSE)' : isMF ? 'Current NAV' : isUnlisted ? 'Valuation' : 'Market Price'}
            </span>
            <span className="text-sm font-bold text-cyan-300 font-mono mt-0.5 block">
              ₹{currPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Price Source */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Price Source</span>
            <span className="text-xs font-bold text-cyan-400 font-mono mt-0.5 block">
              {isUnlisted ? 'Private Market' : sourceName === 'AMFI' ? 'AMFI Live NAV' : sourceName === 'NSE' ? 'NSE Exchange CMP' : sourceName === 'BSE' ? 'BSE Exchange CMP' : sourceName}
            </span>
          </div>

          {/* Net Worth Inclusion */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Net Worth Status</span>
            <span className={cn(
              'text-xs font-bold mt-0.5 flex items-center gap-1',
              holding.includeInNetWorth !== false ? 'text-emerald-400' : 'text-amber-400'
            )}>
              {holding.includeInNetWorth !== false ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Included</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Excluded</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Security Identifiers & Sync Info */}
        <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Last Price Sync:</span>
            <span className="font-mono text-slate-200">{priceTime}</span>
          </div>

          {holding.isin && (
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">ISIN Code:</span>
              <span className="font-mono text-slate-200">{holding.isin}</span>
            </div>
          )}

          {holding.schemeCode && (
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">AMFI Scheme Code:</span>
              <span className="font-mono text-slate-200">{holding.schemeCode}</span>
            </div>
          )}

          {/* Unlisted note */}
          {isUnlisted && (
            <div className="flex items-center gap-2 text-purple-300 pt-1 border-t border-slate-800/80">
              <Lock className="w-4 h-4 shrink-0 text-purple-400" />
              <span>Unlisted Equity: Traded in private/grey markets. Current manual valuation is preserved.</span>
            </div>
          )}

          {/* Stale or failed warning */}
          {!isUnlisted && isFailed && (
            <div className="flex items-center gap-2 text-rose-400 pt-1 border-t border-slate-800/80">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Live quote query was unsuccessful. Retaining current price.</span>
            </div>
          )}

          {!isUnlisted && isStale && (
            <div className="flex items-center gap-2 text-amber-400 pt-1 border-t border-slate-800/80">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Price may be stale. Tap Update Price to fetch live market quote.</span>
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onUpdatePrice(holding);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/40 text-xs font-bold transition-all cursor-pointer min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Update Price</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(holding);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer min-h-[44px]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onViewHistory(holding);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer min-h-[44px]"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>

          {isArchived ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRestore?.(holding.id);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/40 text-xs font-bold transition-all cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onArchive(holding.id);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/40 text-xs font-bold transition-all cursor-pointer min-h-[44px]"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
