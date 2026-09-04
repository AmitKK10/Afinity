import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { InvestmentHolding, MarketPriceResult } from '../../types';
import { formatRupee, formatPercentage, formatPriceUpdatedTime } from '../../utils/formatters';
import {
  calculateInvestmentValue,
  calculateInvestmentProfitLoss,
  calculateInvestmentReturnPercentage,
} from '../../services/calculations';
import { marketPriceService } from '../../services/marketPrice/marketPriceService';
import { cn } from '../../utils/cn';

interface UpdateInvestmentPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: InvestmentHolding | null;
  onUpdatePrice: (id: string, newPrice: number, priceSource?: string, metadata?: any) => Promise<any>;
  onSuccess?: (msg: string) => void;
}

export const UpdateInvestmentPriceModal: React.FC<UpdateInvestmentPriceModalProps> = ({
  isOpen,
  onClose,
  holding,
  onUpdatePrice,
  onSuccess,
}) => {
  const [newPrice, setNewPrice] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('MANUAL');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);
  const [liveResult, setLiveResult] = useState<MarketPriceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (holding) {
      setNewPrice(holding.currentPrice?.toString() || '');
      setSelectedSource(holding.priceSource || 'MANUAL');
      setLiveResult(null);
      setError(null);
    }
  }, [holding]);

  if (!holding) return null;

  const currentPrice = Number(holding.currentPrice || 0);
  const parsedNewPrice = parseFloat(newPrice);
  const isValidPrice = !isNaN(parsedNewPrice) && parsedNewPrice >= 0;

  const priceDiff = isValidPrice ? parsedNewPrice - currentPrice : 0;
  const priceDiffPct = currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 0;

  const qty = Number(holding.quantity !== undefined ? holding.quantity : holding.unitsHeld || 0);
  const avgBuy = Number(holding.averageBuyPrice || 0);
  const investedAmount =
    holding.investedAmount && holding.investedAmount > 0
      ? Number(holding.investedAmount)
      : Math.round(qty * avgBuy * 100) / 100;

  const newCurrentValue = isValidPrice
    ? calculateInvestmentValue(qty, parsedNewPrice)
    : Number(holding.currentValue || 0);

  const newPnl = calculateInvestmentProfitLoss(investedAmount, newCurrentValue);
  const newPnlPct = calculateInvestmentReturnPercentage(investedAmount, newCurrentValue);

  const handleFetchLivePrice = async () => {
    setIsFetchingLive(true);
    setError(null);
    try {
      const provider = marketPriceService.getProvider();
      const rawType = (holding.assetType || holding.type || 'STOCK').toString().toUpperCase();
      let res: MarketPriceResult;

      if (rawType === 'MUTUAL_FUND' || rawType === 'MUTUAL_FUNDS') {
        const codeOrName = holding.schemeCode || holding.symbol || holding.name;
        res = await provider.getMutualFundNAV(codeOrName, holding.name);
      } else if (rawType === 'GOLD' || rawType === 'SGB') {
        res = await provider.getGoldPrice(holding.unit || 'GRAM');
      } else if (rawType === 'ETF' && provider.getEtfPrice) {
        res = await provider.getEtfPrice(holding.symbol || holding.name);
      } else {
        res = await provider.getStockPrice(holding.symbol || holding.name);
      }

      setLiveResult(res);

      if (res.isSuccess && res.price > 0) {
        setNewPrice(res.price.toString());
        setSelectedSource(res.source);
      } else {
        setError(res.errorMessage || 'Live quote not available from market provider');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch live quote');
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPrice) {
      setError('Please enter a valid non-negative market price');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const metadata = liveResult?.isSuccess
        ? {
            priceUpdatedAt: now,
            priceAsOfDate: liveResult.asOfDate || liveResult.dataAsOf || now,
            priceFetchedAt: liveResult.fetchedAt || now,
            priceStatus: 'updated' as const,
            dayChange: liveResult.changeAmount,
            dayChangePercentage: liveResult.changePercentage,
          }
        : {
            priceUpdatedAt: now,
            priceFetchedAt: now,
            priceStatus: 'updated' as const,
          };

      await onUpdatePrice(holding.id, parsedNewPrice, selectedSource, metadata);
      onSuccess?.(`✓ Updated price for ${holding.displayName || holding.name} to ₹${parsedNewPrice}`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update price');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Investment Valuation & Price Update"
      subtitle={`Update quote for ${holding.displayName || holding.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Current State Info */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">Current Recorded Price</span>
            <span className="text-base font-bold font-mono text-white">
              ₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Source: {holding.priceSource || 'MANUAL'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block mb-0.5">Holding Units</span>
            <span className="text-base font-bold font-mono text-cyan-300">
              {qty.toLocaleString('en-IN')} {holding.unit || 'units'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              Avg Buy: ₹{avgBuy.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Quick Live Market Query Trigger */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#09152b] border border-cyan-800/40">
          <div>
            <span className="text-slate-200 font-bold block text-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Market Quote</span>
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              AMFI (MFs) • NSE/BSE (Stocks & ETFs)
            </span>
          </div>

          <button
            type="button"
            onClick={handleFetchLivePrice}
            disabled={isFetchingLive}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3 h-3', isFetchingLive && 'animate-spin')} />
            <span>{isFetchingLive ? 'Querying...' : 'Fetch Live Price'}</span>
          </button>
        </div>

        {liveResult && liveResult.isSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 space-y-1">
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quote from {liveResult.providerName}</span>
              </span>
              <span className="font-mono text-white text-sm">₹{liveResult.price}</span>
            </div>
            {liveResult.asOfDate && (
              <span className="text-[10px] text-slate-400 block">
                As of: {liveResult.asOfDate}
              </span>
            )}
          </div>
        )}

        {/* New Price Input */}
        <div>
          <label className="text-slate-200 font-bold block mb-1.5">
            Market Price / NAV (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={newPrice}
              onChange={(e) => {
                setNewPrice(e.target.value);
                setSelectedSource('MANUAL');
              }}
              placeholder="e.g. 1045.50"
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Live Change Preview */}
        {isValidPrice && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0b1b2d] to-[#07111c] border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-cyan-300">Price Movement</span>
              <div
                className={cn(
                  'flex items-center gap-1 font-bold font-mono text-xs',
                  priceDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {priceDiff >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>
                  {priceDiff >= 0 ? '+' : ''}
                  ₹{priceDiff.toFixed(2)} ({formatPercentage(priceDiffPct, true)})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div>
                <span className="text-slate-400 block">New Portfolio Value</span>
                <span className="text-slate-200 font-bold font-mono">{formatRupee(newCurrentValue)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">New Unrealized P&L</span>
                <span
                  className={cn(
                    'font-bold font-mono',
                    newPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  )}
                >
                  {newPnl >= 0 ? '+' : ''}
                  {formatRupee(newPnl)} ({formatPercentage(newPnlPct, true)})
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !isValidPrice}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading mt-2"
        >
          <RefreshCw className={cn('w-4 h-4', isSubmitting && 'animate-spin')} />
          <span>{isSubmitting ? 'Updating Valuation...' : 'Confirm Price Update'}</span>
        </button>
      </form>
    </Modal>
  );
};
