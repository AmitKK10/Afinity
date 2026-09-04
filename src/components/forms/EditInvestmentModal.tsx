import React, { useState, useEffect } from 'react';
import { Edit2, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SelectField } from '../ui/SelectionSheet';
import { InvestmentHolding, InvestmentType } from '../../types';
import {
  calculateInvestmentValue,
  calculateInvestedAmount,
  calculateInvestmentProfitLoss,
  calculateInvestmentReturnPercentage,
} from '../../services/calculations';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface EditInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: InvestmentHolding | null;
  onSave: (id: string, updates: Partial<InvestmentHolding>) => Promise<any>;
  onSuccess?: (msg: string) => void;
}

export const EditInvestmentModal: React.FC<EditInvestmentModalProps> = ({
  isOpen,
  onClose,
  holding,
  onSave,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<InvestmentType>('stock');
  const [broker, setBroker] = useState<string>('Groww');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('UNIT');
  const [averageBuyPrice, setAverageBuyPrice] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<string>('');
  const [includeInNetWorth, setIncludeInNetWorth] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (holding) {
      setName(holding.displayName || holding.name || '');
      setSymbol(holding.symbol || '');
      const rawAssetType = (holding.assetType || holding.type || '').toUpperCase();
      const initialType: InvestmentType =
        rawAssetType === 'ETF' || holding.type === 'etf'
          ? 'etf'
          : rawAssetType === 'MUTUAL_FUND' || holding.type === 'mutual_fund'
          ? 'mutual_fund'
          : rawAssetType === 'GOLD' || rawAssetType === 'SGB' || holding.type === 'gold'
          ? 'gold'
          : rawAssetType === 'STOCK' || holding.type === 'stock'
          ? 'stock'
          : 'other';

      setType(initialType);
      setBroker(holding.broker || holding.platform || 'Groww');
      setQuantity(
        (holding.quantity !== undefined ? holding.quantity : holding.unitsHeld || '').toString()
      );
      setUnit(holding.unit || (holding.type === 'gold' ? 'GRAM' : 'UNIT'));
      setAverageBuyPrice((holding.averageBuyPrice || '').toString());
      setCurrentPrice((holding.currentPrice || '').toString());
      setIncludeInNetWorth(holding.includeInNetWorth !== false);
      setNotes(holding.notes || '');
      setError(null);
    }
  }, [holding]);

  if (!holding) return null;

  const parsedQty = parseFloat(quantity);
  const parsedAvgBuy = parseFloat(averageBuyPrice);
  const parsedCurrPrice = parseFloat(currentPrice);

  const isValidNumbers =
    !isNaN(parsedQty) &&
    parsedQty >= 0 &&
    !isNaN(parsedAvgBuy) &&
    parsedAvgBuy >= 0 &&
    !isNaN(parsedCurrPrice) &&
    parsedCurrPrice >= 0;

  const investedAmount = isValidNumbers ? calculateInvestedAmount(parsedQty, parsedAvgBuy) : 0;
  const currentValue = isValidNumbers ? calculateInvestmentValue(parsedQty, parsedCurrPrice) : 0;
  const pnl = isValidNumbers ? calculateInvestmentProfitLoss(investedAmount, currentValue) : 0;
  const pnlPct = isValidNumbers ? calculateInvestmentReturnPercentage(investedAmount, currentValue) : 0;

  const isStock = type === 'stock';
  const isETF = type === 'etf';
  const isMF = type === 'mutual_fund';
  const isGold = type === 'gold';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Holding name is required');
      return;
    }
    if (!isValidNumbers) {
      setError('Please enter valid numeric quantity and price values');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const normAssetType =
        type === 'stock'
          ? 'STOCK'
          : type === 'etf'
          ? 'ETF'
          : type === 'mutual_fund'
          ? 'MUTUAL_FUND'
          : type === 'gold'
          ? 'GOLD'
          : 'OTHER';

      await onSave(holding.id, {
        name: name.trim(),
        displayName: name.trim(),
        symbol: symbol.toUpperCase().trim() || undefined,
        ticker: symbol.toUpperCase().trim() || undefined,
        assetType: normAssetType as any,
        type,
        category: type,
        broker,
        platform: broker,
        quantity: parsedQty,
        unitsHeld: parsedQty,
        unit,
        averageBuyPrice: parsedAvgBuy,
        currentPrice: parsedCurrPrice,
        investedAmount,
        currentValue,
        unrealizedProfitLoss: pnl,
        unrealizedProfitLossPercentage: pnlPct,
        includeInNetWorth,
        notes: notes.trim() || undefined,
      });

      onSuccess?.(`✓ Updated holding: ${name}`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update holding');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Investment Holding"
      subtitle={`Modify parameters for ${holding.displayName || holding.name}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="text-slate-300 font-semibold block mb-1">
            {isStock ? 'Company Name *' : isETF ? 'ETF Name / Scheme *' : isMF ? 'Fund Scheme Name *' : 'Asset / Bond Name *'}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <SelectField
              label="Asset Category"
              value={type}
              onChange={(val) => setType(val as InvestmentType)}
              options={[
                { value: 'stock', label: 'Direct Stock', sublabel: 'Equity share', badge: 'Equity', badgeColor: 'blue' },
                { value: 'etf', label: 'Exchange Traded Fund', sublabel: 'Index & Sector ETF', badge: 'ETF', badgeColor: 'cyan' },
                { value: 'mutual_fund', label: 'Mutual Fund', sublabel: 'SIP & Lumpsum fund', badge: 'MF', badgeColor: 'emerald' },
                { value: 'gold', label: 'Gold & SGB', sublabel: 'Physical & Sovereign bonds', badge: 'Gold', badgeColor: 'amber' },
                { value: 'other', label: 'Other Asset', sublabel: 'Alternative investment', badge: 'Other', badgeColor: 'purple' },
              ]}
              triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-700 text-xs"
            />
          </div>

          <div>
            <SelectField
              label="Broker / Platform"
              value={broker}
              onChange={(val) => setBroker(val)}
              options={[
                { value: 'Groww', label: 'Groww', badge: 'Groww', badgeColor: 'emerald' },
                { value: 'Zerodha', label: 'Zerodha Kite', badge: 'Zerodha', badgeColor: 'blue' },
                { value: 'AngelOne', label: 'AngelOne', badge: 'AngelOne', badgeColor: 'amber' },
                { value: 'Upstox', label: 'Upstox', badge: 'Upstox', badgeColor: 'purple' },
                { value: 'Direct', label: 'Direct / AMC', badge: 'Direct', badgeColor: 'slate' },
                { value: 'Other', label: 'Other Broker' },
              ]}
              triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-700 text-xs"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Ticker / Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder={isETF ? 'e.g. NIFTYBEES' : 'e.g. INFY'}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              {isStock ? 'Shares Qty *' : isETF ? 'ETF Units *' : isMF ? 'Units Held *' : 'Quantity *'}
            </label>
            <input
              type="number"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              {isMF ? 'Avg NAV (₹) *' : 'Avg Buy Price (₹) *'}
            </label>
            <input
              type="number"
              step="any"
              required
              value={averageBuyPrice}
              onChange={(e) => setAverageBuyPrice(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              {isMF ? 'Current NAV (₹) *' : isETF ? 'Current Market Price (₹) *' : 'Current Price (₹) *'}
            </label>
            <input
              type="number"
              step="any"
              required
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Live Calculation Preview */}
        {isValidNumbers && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0c1e33] to-[#07111e] border border-cyan-500/30 space-y-2">
            <span className="text-[11px] font-semibold text-cyan-300 block">
              Recalculated Holding Valuation
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Total Invested</span>
                <span className="text-slate-200 font-bold font-mono">{formatRupee(investedAmount)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Current Portfolio Value</span>
                <span className="text-cyan-300 font-bold font-mono">{formatRupee(currentValue)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Unrealized P&L</span>
              <span
                className={cn(
                  'font-bold font-mono',
                  pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {pnl >= 0 ? '+' : ''}
                {formatRupee(pnl)} ({formatPercentage(pnlPct, true)})
              </span>
            </div>
          </div>
        )}

        {/* Net Worth Toggle */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-200 font-bold block">Include in Net Worth</span>
            <span className="text-[10px] text-slate-400">
              Contribution: {includeInNetWorth ? formatRupee(currentValue) : '₹0 (Excluded)'}
            </span>
          </div>
          <input
            type="checkbox"
            checked={includeInNetWorth}
            onChange={(e) => setIncludeInNetWorth(e.target.checked)}
            className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="text-slate-300 font-semibold block mb-1">Notes / Target Exit</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Long-term compounding core holding"
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading mt-2"
        >
          <Edit2 className="w-4 h-4" />
          <span>{isSubmitting ? 'Saving Changes...' : 'Save Holding Changes'}</span>
        </button>
      </form>
    </Modal>
  );
};
