import React, { useState } from 'react';
import { Plus, ArrowRight, ShieldCheck, Sparkles, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SelectField } from '../ui/SelectionSheet';
import { useFinancialData } from '../../context/FinancialDataContext';
import { InvestmentType } from '../../types';
import {
  calculateInvestmentValue,
  calculateInvestedAmount,
  calculateInvestmentProfitLoss,
  calculateInvestmentReturnPercentage,
} from '../../services/calculations';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

const INDIAN_PRESETS = [
  { name: 'SBI Small Cap Fund Direct-G', symbol: '125497', type: 'mutual_fund' as const, broker: 'Groww', price: 182.4, avg: 145.0, qty: 350 },
  { name: 'SBI Nifty 50 ETF', symbol: 'SETFNIF50', type: 'etf' as const, broker: 'Zerodha', price: 264.0, avg: 242.0, qty: 100 },
  { name: 'Nippon India ETF Nifty BeES', symbol: 'NIFTYBEES', type: 'etf' as const, broker: 'Groww', price: 268.5, avg: 245.0, qty: 100 },
  { name: 'Tata Motors Ltd', symbol: 'TATAMOTORS', type: 'stock' as const, broker: 'Groww', price: 1025, avg: 840, qty: 50 },
  { name: 'Infosys Limited', symbol: 'INFY', type: 'stock' as const, broker: 'Zerodha', price: 1820, avg: 1480, qty: 25 },
  { name: 'Parag Parikh Flexi Cap Fund', symbol: '122639', type: 'mutual_fund' as const, broker: 'Groww', price: 82.5, avg: 65.0, qty: 1000 },
  { name: 'Nippon India ETF Gold BeES', symbol: 'GOLDBEES', type: 'etf' as const, broker: 'Zerodha', price: 69.8, avg: 58.2, qty: 500 },
  { name: 'Reliance Industries', symbol: 'RELIANCE', type: 'stock' as const, broker: 'Groww', price: 3020, avg: 2650, qty: 20 },
  { name: 'Sovereign Gold Bond 2028', symbol: 'SGB2028', type: 'gold' as const, broker: 'Direct', price: 8650, avg: 6200, qty: 5 },
];

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addInvestment } = useFinancialData();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<InvestmentType>('stock');
  const [broker, setBroker] = useState<string>('Groww');
  const [unitsHeld, setUnitsHeld] = useState('10');
  const [unit, setUnit] = useState<string>('UNIT');
  const [averageBuyPrice, setAverageBuyPrice] = useState('1000');
  const [currentPrice, setCurrentPrice] = useState('1200');
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedUnits = parseFloat(unitsHeld);
  const parsedAvgPrice = parseFloat(averageBuyPrice);
  const parsedCurrPrice = parseFloat(currentPrice);

  const isValidNumbers =
    !isNaN(parsedUnits) &&
    parsedUnits >= 0 &&
    !isNaN(parsedAvgPrice) &&
    parsedAvgPrice >= 0 &&
    !isNaN(parsedCurrPrice) &&
    parsedCurrPrice >= 0;

  const investedAmount = isValidNumbers ? calculateInvestedAmount(parsedUnits, parsedAvgPrice) : 0;
  const currentValue = isValidNumbers ? calculateInvestmentValue(parsedUnits, parsedCurrPrice) : 0;
  const pnl = isValidNumbers ? calculateInvestmentProfitLoss(investedAmount, currentValue) : 0;
  const pnlPct = isValidNumbers ? calculateInvestmentReturnPercentage(investedAmount, currentValue) : 0;

  const isStock = type === 'stock';
  const isETF = type === 'etf';
  const isMF = type === 'mutual_fund';
  const isGold = type === 'gold';
  const isSGB = type === 'gold' && (name.toLowerCase().includes('sgb') || name.toLowerCase().includes('sovereign'));

  const applyPreset = (preset: typeof INDIAN_PRESETS[0]) => {
    setName(preset.name);
    setSymbol(preset.symbol);
    setType(preset.type);
    setBroker(preset.broker);
    setUnitsHeld(preset.qty.toString());
    setAverageBuyPrice(preset.avg.toString());
    setCurrentPrice(preset.price.toString());
    setUnit(preset.type === 'gold' ? 'GRAM' : 'UNIT');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Investment name is required');
      return;
    }

    if (!isValidNumbers) {
      setErrorMessage('Please enter valid numeric units and prices');
      return;
    }

    setIsSubmitting(true);
    try {
      const normAssetType =
        type === 'stock'
          ? 'STOCK'
          : type === 'etf'
          ? 'ETF'
          : type === 'mutual_fund'
          ? 'MUTUAL_FUND'
          : isSGB
          ? 'SGB'
          : type === 'gold'
          ? 'GOLD'
          : 'OTHER';

      await addInvestment({
        name: name.trim(),
        displayName: name.trim(),
        symbol: symbol.toUpperCase().trim() || undefined,
        ticker: symbol.toUpperCase().trim() || undefined,
        assetType: normAssetType as any,
        type,
        category: type,
        broker,
        platform: broker,
        quantity: parsedUnits,
        unitsHeld: parsedUnits,
        unit: normAssetType === 'GOLD' ? 'GRAM' : unit,
        averageBuyPrice: parsedAvgPrice,
        currentPrice: parsedCurrPrice,
        investedAmount,
        currentValue,
        unrealizedProfitLoss: pnl,
        unrealizedProfitLossPercentage: pnlPct,
        priceSource: 'MANUAL',
        priceUpdatedAt: new Date().toISOString(),
        includeInNetWorth,
        status: 'active',
        notes: notes.trim() || undefined,
      });

      onSuccess?.(`✓ Added Holding: ${name}`);
      setName('');
      setSymbol('');
      setNotes('');
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save investment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Investment Holding"
      subtitle="Track Indian equities, ETFs, mutual funds, gold bonds & portfolio assets"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Quick Autocomplete
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {INDIAN_PRESETS.map((p) => (
              <button
                key={p.symbol}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                + {p.name.split(' ')[0]} ({p.symbol})
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-semibold block mb-1">
            {isStock ? 'Company Name *' : isETF ? 'ETF Name / Scheme *' : isMF ? 'Fund Scheme Name *' : 'Asset / Bond Name *'}
          </label>
          <input
            type="text"
            required
            placeholder={
              isStock
                ? 'e.g. Tata Motors or Infosys'
                : isETF
                ? 'e.g. Nippon India ETF Nifty BeES or Gold BeES'
                : isMF
                ? 'e.g. Parag Parikh Flexi Cap Fund Direct-G'
                : 'e.g. Sovereign Gold Bond 2028'
            }
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
              placeholder={isETF ? 'e.g. NIFTYBEES' : 'e.g. TATAMOTORS'}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              {isStock ? 'Shares Qty *' : isETF ? 'ETF Units *' : isMF ? 'Units Held *' : isGold ? 'Quantity (g) *' : 'Quantity *'}
            </label>
            <input
              type="number"
              step="any"
              required
              value={unitsHeld}
              onChange={(e) => setUnitsHeld(e.target.value)}
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

        {/* Live Calculation Preview Box */}
        {isValidNumbers && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0c2236] to-[#07131e] border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Live Valuation Preview
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {parsedUnits} {isStock ? 'shares' : isETF ? 'units' : isMF ? 'units' : isGold ? 'grams' : 'units'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400 block">Invested Capital</span>
                <span className="text-slate-200 font-bold font-mono">{formatRupee(investedAmount)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Current Portfolio Value</span>
                <span className="text-cyan-300 font-bold font-mono text-sm">{formatRupee(currentValue)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Estimated Returns</span>
              <div className="flex items-center gap-1">
                {pnl >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                )}
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
          </div>
        )}

        {/* Include in Net Worth toggle */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-200 font-bold block">Include in Net Worth Calculation</span>
            <span className="text-[10px] text-slate-400">
              Contribution to total wealth: {includeInNetWorth ? formatRupee(currentValue) : '₹0'}
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
          <label className="text-slate-300 font-semibold block mb-1">Notes / Target Allocation</label>
          <input
            type="text"
            placeholder="e.g. Core long term holding, target allocation 10%"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading mt-2"
        >
          <span>{isSubmitting ? 'Saving Holding...' : '+ Add Investment to Portfolio'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </Modal>
  );
};
