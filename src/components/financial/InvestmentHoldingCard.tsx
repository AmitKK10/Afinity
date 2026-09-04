import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MoreVertical,
  Edit2,
  RefreshCw,
  Archive,
  RotateCcw,
  History,
  ShieldAlert,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Radio,
  Trash2,
  Lock,
} from 'lucide-react';
import { InvestmentHolding } from '../../types';
import { InvestmentBrandBadge } from '../brand/InvestmentBrandBadge';
import { Badge } from '../ui/Badge';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { formatRupee, formatPercentage, formatPriceUpdatedTime } from '../../utils/formatters';
import { calculateInvestmentProfitLoss, calculateInvestmentReturnPercentage } from '../../services/calculations';
import { cn } from '../../utils/cn';

interface InvestmentHoldingCardProps {
  holding: InvestmentHolding;
  onUpdatePrice: (holding: InvestmentHolding) => void;
  onEdit: (holding: InvestmentHolding) => void;
  onViewHistory: (holding: InvestmentHolding) => void;
  onArchive: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelect?: (holding: InvestmentHolding) => void;
  isArchived?: boolean;
}

export const InvestmentHoldingCard: React.FC<InvestmentHoldingCardProps> = ({
  holding,
  onUpdatePrice,
  onEdit,
  onViewHistory,
  onArchive,
  onRestore,
  onDelete,
  onSelect,
  isArchived = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const rawType = (holding.assetType || holding.type || 'other').toString().toUpperCase();
  const isStock = rawType === 'STOCK' || rawType === 'STOCKS';
  const isMF = rawType === 'MUTUAL_FUND' || rawType === 'MUTUAL_FUNDS';
  const isETF = rawType === 'ETF';
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

  const assetBadgeVariant = isStock
    ? 'cyan'
    : isETF
    ? 'blue'
    : isMF
    ? 'emerald'
    : isUnlisted
    ? 'purple'
    : isGold || isSGB
    ? 'gold'
    : 'default';

  const assetTypeLabel = isStock
    ? 'STOCK'
    : isETF
    ? 'ETF'
    : isMF
    ? 'MUTUAL FUND'
    : isUnlisted
    ? 'UNLISTED EQUITY'
    : isSGB
    ? 'SGB'
    : isGold
    ? 'GOLD'
    : 'ASSET';

  const priceTime = formatPriceUpdatedTime(holding.priceUpdatedAt || holding.updatedAt || holding.lastUpdated);
  const sourceName = (holding.priceSource || 'MANUAL').toUpperCase();
  const isMarket = sourceName === 'AMFI' || sourceName === 'NSE' || sourceName === 'BSE' || sourceName === 'MARKET';
  const hasFailed = holding.priceStatus === 'failed';
  const isStale = holding.priceStatus === 'stale';

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking menu button or dropdown, do not trigger card select
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.menu-container')) {
      return;
    }
    if (onSelect) {
      onSelect(holding);
    }
  };

  return (
    <div
      id={`holding-card-${holding.id}`}
      onClick={handleCardClick}
      className={cn(
        'relative rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#0c162c]/90 via-[#0a1122]/90 to-[#070b16]/95 border transition-all duration-200 shadow-xl overflow-hidden cursor-pointer group',
        isArchived
          ? 'border-slate-800 opacity-70'
          : isPositive
          ? 'border-slate-800/80 hover:border-emerald-500/40 hover:shadow-emerald-950/20'
          : 'border-slate-800/80 hover:border-rose-500/40 hover:shadow-rose-950/20'
      )}
    >
      {/* Background ambient glow */}
      <div
        className={cn(
          'absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20',
          isPositive ? 'bg-emerald-500' : 'bg-rose-500'
        )}
      />

      <div className="relative z-10 space-y-3.5">
        {/* Top Header: Logo + Name + Ticker + Broker Badge + Actions Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <InvestmentBrandBadge
              name={holding.name}
              symbol={holding.symbol}
              assetType={rawType}
              size="md"
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-white font-heading truncate">
                  {holding.displayName || holding.name}
                </h4>
                {holding.symbol && (
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {holding.symbol}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={assetBadgeVariant as any} size="sm">
                  {assetTypeLabel}
                </Badge>
                <span className="text-[11px] text-slate-400 font-medium">
                  {brokerName}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border',
                    isMarket
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50'
                      : isUnlisted
                      ? 'bg-purple-950/60 text-purple-300 border-purple-800/50'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700'
                  )}
                  title={`Price Source: ${sourceName}`}
                >
                  {isUnlisted ? 'PRIVATE MARKET' : sourceName === 'AMFI' ? 'AMFI LIVE NAV' : sourceName === 'NSE' ? 'NSE CMP' : sourceName === 'BSE' ? 'BSE CMP' : sourceName}
                </span>
                {holding.includeInNetWorth === false && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 font-medium">
                    <ShieldAlert className="w-3 h-3" />
                    Excluded from Net Worth
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions: Edit + Menu Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id={`holding-quick-edit-${holding.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(holding);
              }}
              aria-label="Edit holding"
              className="p-2 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 text-xs font-semibold"
              title="Edit holding details"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <div className="relative shrink-0">
              <button
                type="button"
                id={`holding-menu-btn-${holding.id}`}
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Holding actions"
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-12 z-30 w-48 rounded-2xl bg-[#0f1d35] border border-slate-700 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onUpdatePrice(holding);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-cyan-300 hover:bg-cyan-950/60 hover:text-cyan-200 transition-colors cursor-pointer text-left"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Update Price</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(holding);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Holding</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onViewHistory(holding);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Price History</span>
                  </button>

                  <div className="border-t border-slate-800 my-1" />

                  {isArchived ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onRestore?.(holding.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-400 hover:bg-emerald-950/60 transition-colors cursor-pointer text-left"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Holding</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onArchive(holding.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-amber-400 hover:bg-amber-950/60 transition-colors cursor-pointer text-left"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive Holding</span>
                    </button>
                  )}

                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(holding.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 transition-colors cursor-pointer text-left border-t border-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Holding</span>
                    </button>
                  )}
                </div>
              </>
            )}
            </div>
          </div>
        </div>

        {/* Value and Returns Row */}
        <div className="grid grid-cols-2 gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block mb-0.5">
              Current Market Value
            </span>
            <MoneyDisplay amount={currentValue} size="lg" />
            <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
              Invested: {formatRupee(investedAmount)}
            </span>
          </div>

          <div className="text-right flex flex-col justify-center items-end">
            <span className="text-[11px] text-slate-400 font-medium block mb-0.5">
              Unrealized Profit / Loss
            </span>
            <div
              className={cn(
                'inline-flex items-center gap-1 text-sm sm:text-base font-bold font-mono',
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {isPositive ? '+' : ''}
                {formatRupee(pnl)}
              </span>
            </div>
            <span
              className={cn(
                'text-[11px] font-bold font-mono px-1.5 py-0.5 rounded mt-0.5',
                isPositive
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
              )}
            >
              {isPositive ? '+' : ''}
              {formatPercentage(pnlPct, true)}
            </span>
          </div>
        </div>

        {/* Security Quantities & Price Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
          <div>
            <span className="text-slate-400 block">Holding Qty</span>
            <span className="text-slate-200 font-bold font-mono">
              {qty.toLocaleString('en-IN')} {unitLabel}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">
              {isStock || isETF ? 'Avg Buy' : isMF ? 'Avg NAV' : isUnlisted ? 'Buy Price' : 'Avg Cost'}
            </span>
            <span className="text-slate-200 font-bold font-mono">
              ₹{avgPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-400 block">
              {isStock ? 'CMP (NSE)' : isETF ? 'CMP (NSE)' : isMF ? 'Current NAV' : isUnlisted ? 'Valuation' : 'Market Price'}
            </span>
            <span className="text-cyan-300 font-bold font-mono">
              ₹{currPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Footer: Price Updated Relative Timestamp + Quick Update Link */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isUnlisted ? (
              <span className="inline-flex items-center gap-1 text-purple-300 font-medium" title="Unlisted equity traded in private/grey markets">
                <Lock className="w-3 h-3 text-purple-400" />
                <span>Unlisted • Manual Trade Price</span>
              </span>
            ) : hasFailed ? (
              <span className="inline-flex items-center gap-1 text-rose-400 font-medium" title={holding.priceFailureReason}>
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span className="truncate max-w-[200px]">{holding.priceFailureReason || 'Quote unavailable'}</span>
              </span>
            ) : holding.priceAsOfDate ? (
              <span className="inline-flex items-center gap-1.5" title={`Fetched: ${priceTime}`}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  holding.priceStatus === 'live' || holding.priceStatus === 'updated' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                )} />
                <span>
                  {isMF ? 'NAV as of: ' : 'Quote as of: '}
                  <strong className="text-slate-300 font-mono font-medium">
                    {holding.priceAsOfDate.length > 10 && holding.priceAsOfDate.includes('T')
                      ? new Date(holding.priceAsOfDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : holding.priceAsOfDate}
                  </strong>
                </span>
              </span>
            ) : isStale ? (
              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Price may be stale • {priceTime}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  holding.priceStatus === 'live' || holding.priceStatus === 'updated' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                )} />
                <span>Price updated: <strong className="text-slate-300 font-medium">{priceTime}</strong></span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(holding);
              }}
              className="text-slate-300 hover:text-white font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Edit2 className="w-2.5 h-2.5 text-slate-400" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePrice(holding);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Update</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
